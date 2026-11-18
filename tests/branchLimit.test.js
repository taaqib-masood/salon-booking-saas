import test, { mock, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';

process.env.JWT_SECRET = 'local-regression-fixture-only';
let activeBranches = 1;
let inserted = [];
let updated = [];
mock.module('../lib/supabase.js', { namedExports: { supabase: {
  from(table) {
    let op = 'select';
    let payload;
    const result = () => {
      if (table === 'staff') return { data: { id: 'staff-a', tenant_id: 'tenant-a', role: 'admin' } };
      if (table === 'tenants') return { data: { branch_limit: 1 } };
      if (table === 'branches' && op === 'insert') { inserted.push(payload); return { data: { id: 'new', ...payload } }; }
      if (table === 'branches' && op === 'update') { updated.push(payload); return { data: { id: 'b1', ...payload } }; }
      if (table === 'branches') return { count: activeBranches };
      throw new Error(`Unexpected table: ${table}`);
    };
    const chain = {
      select() { return chain; },
      eq() { return chain; },
      insert(row) { op = 'insert'; payload = row; return chain; },
      update(row) { op = 'update'; payload = row; return chain; },
      single() { return Promise.resolve(result()); },
      then(resolve, reject) { return Promise.resolve(result()).then(resolve, reject); },
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
const base = `http://127.0.0.1:${server.address().port}/branches`;
const headers = { 'content-type': 'application/json', authorization: `Bearer ${jwt.sign({ id: 'staff-a' }, process.env.JWT_SECRET)}` };
const body = JSON.stringify({ name: 'B', phone: '1', email: 'b@x.ae', tenant_id: 'tenant-b', is_deleted: true });

test('a tenant at its branch limit cannot create another branch', async () => {
  activeBranches = 1; inserted = [];
  const res = await fetch(base, { method: 'POST', headers, body });
  assert.equal(res.status, 403);
  assert.equal(inserted.length, 0);
});

test('a tenant under its limit creates a branch with only whitelisted fields', async () => {
  activeBranches = 0; inserted = [];
  const res = await fetch(base, { method: 'POST', headers, body });
  assert.equal(res.status, 201);
  assert.deepEqual(inserted, [{ name: 'B', phone: '1', email: 'b@x.ae', tenant_id: 'tenant-a' }]);
});

test('updates cannot restore a deleted branch past the limit', async () => {
  updated = [];
  const res = await fetch(`${base}/b1`, { method: 'PUT', headers, body: JSON.stringify({ name: 'C', is_deleted: false, tenant_id: 'tenant-b' }) });
  assert.equal(res.status, 200);
  assert.deepEqual(updated, [{ name: 'C' }]);
});
