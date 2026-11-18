import test, { mock, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';

process.env.JWT_SECRET = 'local-regression-fixture-only';
let writes = [];
mock.module('../lib/supabase.js', { namedExports: { supabase: {
  from(table) {
    const query = { table, filters: {}, payload: null };
    const result = () => {
      if (table === 'staff') return { data: { id: 'staff-a', tenant_id: 'tenant-a', role: 'admin' } };
      if (table === 'branches') return query.filters.id === 'branch-a' && query.filters.tenant_id === 'tenant-a'
        ? { data: { id: 'branch-a' } } : { data: null, error: { message: 'not found' } };
      if (table === 'pos_terminals') return { data: { id: 'term-a', ...query.payload } };
      throw new Error(`Unexpected table: ${table}`);
    };
    const write = payload => { query.payload = payload; writes.push(query); return chain; };
    const chain = {
      select() { return chain; },
      eq(key, value) { query.filters[key] = value; return chain; },
      insert: write,
      update: write,
      single() { return Promise.resolve(result()); },
    };
    return chain;
  },
} } });
const { default: pos } = await import('../routes/pos.js');
const app = express();
app.use(express.json());
app.use('/pos', pos);
const server = app.listen(0, '127.0.0.1');
await new Promise(resolve => server.once('listening', resolve));
after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }));
const base = `http://127.0.0.1:${server.address().port}/pos/terminals`;
const headers = { 'content-type': 'application/json', authorization: `Bearer ${jwt.sign({ id: 'staff-a' }, process.env.JWT_SECRET)}` };
const send = (method, path, body) => fetch(`${base}${path}`, { method, headers, body: JSON.stringify(body) });

test('terminal updates cannot change tenant_id or other non-editable fields', async () => {
  writes = [];
  const res = await send('PUT', '/term-a', { tenant_id: 'tenant-b', id: 'other', created_at: 'x', location_id: 'loc-2' });
  assert.equal(res.status, 200);
  assert.deepEqual(writes[0].payload, { location_id: 'loc-2' });
  assert.equal(writes[0].filters.tenant_id, 'tenant-a');
});

test('terminals cannot be created in or moved to another tenant branch', async () => {
  for (const [method, path] of [['POST', ''], ['PUT', '/term-a']]) {
    writes = [];
    const res = await send(method, path, { branch_id: 'branch-b', terminal_id: 't1', provider: 'stripe', location_id: 'l' });
    assert.equal(res.status, 400);
    assert.equal(writes.length, 0);
  }
});

test('terminals are created in the caller tenant with only allowlisted fields', async () => {
  writes = [];
  const res = await send('POST', '', { tenant_id: 'tenant-b', branch_id: 'branch-a', terminal_id: 't1', provider: 'stripe', location_id: 'l', last_seen_at: 'x' });
  assert.equal(res.status, 201);
  assert.deepEqual(writes[0].payload, { branch_id: 'branch-a', terminal_id: 't1', provider: 'stripe', location_id: 'l', tenant_id: 'tenant-a' });
});
