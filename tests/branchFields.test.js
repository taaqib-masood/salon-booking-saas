import test, { mock, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';

process.env.JWT_SECRET = 'local-regression-fixture-only';
const writes = [];
mock.module('../lib/supabase.js', { namedExports: { supabase: {
  from(table) {
    let payload;
    const result = () => table === 'staff'
      ? { data: { id: 'staff-a', tenant_id: 'tenant-a', role: 'manager' } }
      : { data: { id: 'branch-a', ...payload } };
    const chain = {
      select() { return chain; },
      eq() { return chain; },
      insert(p) { payload = p; writes.push(p); return chain; },
      update(p) { payload = p; writes.push(p); return chain; },
      single() { return Promise.resolve(result()); },
    };
    return chain;
  },
} } });
const { default: branches } = await import('../routes/branches.js');
const app = express();
app.use(express.json());
app.use('/branches', branches);
const server = app.listen(0, '127.0.0.1');
await new Promise(resolve => server.once('listening', resolve));
after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }));
const url = `http://127.0.0.1:${server.address().port}/branches/branch-a`;
const headers = { 'content-type': 'application/json', authorization: `Bearer ${jwt.sign({ id: 'staff-a' }, process.env.JWT_SECRET)}` };

test('managers cannot soft-delete or reassign a branch through update', async () => {
  const res = await fetch(url, { method: 'PUT', headers, body: JSON.stringify({
    name: 'Marina', is_deleted: true, is_active: false, tenant_id: 'tenant-b', id: 'other', created_at: 'x',
  }) });
  assert.equal(res.status, 200);
  assert.deepEqual(writes.at(-1), { name: 'Marina' });
});

test('updates with only protected fields are rejected without writing', async () => {
  const count = writes.length;
  const res = await fetch(url, { method: 'PUT', headers, body: JSON.stringify({ is_deleted: true }) });
  assert.equal(res.status, 400);
  assert.equal(writes.length, count);
});
