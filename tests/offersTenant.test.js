import test, { mock, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';

process.env.JWT_SECRET = 'local-regression-fixture-only';
let writes = [];
beforeEach(() => { writes = []; });
mock.module('../lib/supabase.js', { namedExports: { supabase: {
  from(table) {
    const query = { table, filters: {}, ins: {} };
    const result = () => {
      if (table === 'staff') return { data: { id: 'staff-a', tenant_id: 'tenant-a', role: 'admin' } };
      if (table === 'services') return { data: query.ins.id.filter(id => id.startsWith('own-')).map(id => ({ id })) };
      if (table === 'offers') return { data: { id: 'offer-1', ...query.payload } };
      return { data: null };
    };
    const chain = {
      select() { return chain; },
      eq(key, value) { query.filters[key] = value; return chain; },
      in(key, values) { query.ins[key] = values; return chain; },
      insert(payload) { query.payload = payload; writes.push({ table, op: 'insert', payload }); return chain; },
      update(payload) { query.payload = payload; writes.push({ table, op: 'update', payload }); return chain; },
      delete() { writes.push({ table, op: 'delete' }); return chain; },
      order() { return chain; },
      single() { return Promise.resolve(result()); },
      then(resolve, reject) { return Promise.resolve(result()).then(resolve, reject); },
    };
    return chain;
  },
} } });
const { default: offers } = await import('../routes/offers.js');
const app = express();
app.use(express.json());
app.use('/offers', offers);
const server = app.listen(0, '127.0.0.1');
await new Promise(resolve => server.once('listening', resolve));
after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }));
const base = `http://127.0.0.1:${server.address().port}/offers`;
const headers = { 'content-type': 'application/json', authorization: `Bearer ${jwt.sign({ id: 'staff-a' }, process.env.JWT_SECRET)}` };
const send = (method, path, body) => fetch(`${base}${path}`, { method, headers, body: JSON.stringify(body) });

test('updating an offer cannot move it to another tenant or reset protected columns', async () => {
  const res = await send('PUT', '/offer-1', { name: 'VIP', tenant_id: 'tenant-b', used_count: 0, id: 'x' });
  assert.equal(res.status, 200);
  assert.deepEqual(writes.find(w => w.table === 'offers').payload, { name: 'VIP' });
});

test('creating an offer always binds it to the caller tenant', async () => {
  const res = await send('POST', '', { name: 'VIP', code: 'VIP100', tenant_id: 'tenant-b', used_count: -5 });
  assert.equal(res.status, 201);
  assert.deepEqual(writes.find(w => w.table === 'offers').payload, { name: 'VIP', code: 'VIP100', tenant_id: 'tenant-a' });
});

test('offers cannot be linked to services from another tenant', async () => {
  for (const [method, path] of [['POST', ''], ['PUT', '/offer-1']]) {
    const res = await send(method, path, { name: 'VIP', applicable_services: ['own-1', 'foreign-1'] });
    assert.equal(res.status, 400);
    assert.equal(writes.length, 0);
  }
});

test('offers can be linked to services in the caller tenant', async () => {
  const res = await send('POST', '', { name: 'VIP', applicable_services: ['own-1'] });
  assert.equal(res.status, 201);
  assert.deepEqual(writes.find(w => w.table === 'offer_services').payload, [{ offer_id: 'offer-1', service_id: 'own-1' }]);
});
