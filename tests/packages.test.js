import test, { mock, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';

process.env.JWT_SECRET = 'local-regression-fixture-only';
let queries = [];
mock.module('../lib/supabase.js', { namedExports: { supabase: {
  from(table) {
    const query = { table, filters: {}, payload: null };
    queries.push(query);
    const result = () => {
      if (table === 'staff') return { data: { id: 'staff-a', tenant_id: 'tenant-a', role: 'admin' } };
      if (table === 'services') return { data: query.filters.id.filter(id => id.startsWith('own')).map(id => ({ id })) };
      if (table === 'packages') return { data: { id: 'pkg', ...query.payload } };
      if (table === 'package_services') return { data: null };
      throw new Error(`Unexpected table: ${table}`);
    };
    const chain = {
      select() { return chain; },
      eq(key, value) { query.filters[key] = value; return chain; },
      in(key, value) { query.filters[key] = value; return chain; },
      insert(payload) { query.payload = payload; return chain; },
      update(payload) { query.payload = payload; return chain; },
      single() { return Promise.resolve(result()); },
      then(resolve, reject) { return Promise.resolve(result()).then(resolve, reject); },
    };
    return chain;
  },
} } });
const { default: packages } = await import('../routes/packages.js');
const app = express();
app.use(express.json());
app.use('/packages', packages);
const server = app.listen(0, '127.0.0.1');
await new Promise(resolve => server.once('listening', resolve));
after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }));
const base = `http://127.0.0.1:${server.address().port}/packages`;
const send = (method, path, body) => fetch(`${base}${path}`, { method, headers: {
  'content-type': 'application/json', authorization: `Bearer ${jwt.sign({ id: 'staff-a' }, process.env.JWT_SECRET)}`,
}, body: JSON.stringify(body) });
const packageWrite = () => queries.find(query => query.table === 'packages');

test('package update cannot move a package to another tenant', async () => {
  queries = [];
  const res = await send('PUT', '/pkg', { tenant_id: 'tenant-b', id: 'other', created_at: 'x', price: 10 });
  assert.equal(res.status, 200);
  assert.deepEqual(packageWrite().payload, { price: 10 });
  assert.equal(packageWrite().filters.tenant_id, 'tenant-a');
});

test('package create ignores client tenant_id and accepts own-tenant services', async () => {
  queries = [];
  const res = await send('POST', '/', { name: 'P', price: 0, tenant_id: 'tenant-b', services: ['own-1', 'own-1'] });
  assert.equal(res.status, 201);
  assert.deepEqual(packageWrite().payload, { name: 'P', price: 0, tenant_id: 'tenant-a' });
  assert.equal(queries.find(query => query.table === 'services').filters.tenant_id, 'tenant-a');
  assert.deepEqual(queries.find(query => query.table === 'package_services').payload, [{ package_id: 'pkg', service_id: 'own-1' }]);
});

test('package create rejects services from another tenant', async () => {
  queries = [];
  const res = await send('POST', '/', { name: 'P', price: 0, services: ['own-1', 'foreign-1'] });
  assert.equal(res.status, 400);
  assert.equal(packageWrite(), undefined);
});
