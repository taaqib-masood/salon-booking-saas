import test, { mock, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';

process.env.JWT_SECRET = 'local-regression-fixture-only';
let queries = [];
mock.module('../lib/supabase.js', { namedExports: { supabase: {
  from(table) {
    const query = { table, filters: {}, write: false };
    queries.push(query);
    const result = () => {
      if (table === 'staff') {
        if (!('tenant_id' in query.filters)) return { data: { id: 'admin-a', tenant_id: 'tenant-a', role: 'admin' } };
        return query.filters.id === 'staff-a' && query.filters.tenant_id === 'tenant-a'
          ? { data: { id: 'staff-a' } } : { data: null, error: { message: 'not found' } };
      }
      if (table === 'staff_breaks') {
        if (query.write) return { data: { id: 'new' } };
        if ('id' in query.filters) return query.filters.id === 'own-break' && query.filters['staff.tenant_id'] === 'tenant-a'
          ? { data: { id: 'own-break' } } : { data: null, error: { message: 'not found' } };
        return { data: [] };
      }
      throw new Error(`Unexpected table: ${table}`);
    };
    const chain = {
      select() { return chain; },
      eq(key, value) { query.filters[key] = value; return chain; },
      insert() { query.write = true; return chain; },
      delete() { query.write = true; return chain; },
      order() { return chain; },
      single() { return Promise.resolve(result()); },
      then(resolve, reject) { return Promise.resolve(result()).then(resolve, reject); },
    };
    return chain;
  },
} } });
const { default: staffBreaks } = await import('../routes/staffBreaks.js');
const app = express();
app.use(express.json());
app.use('/staff-breaks', staffBreaks);
const server = app.listen(0, '127.0.0.1');
await new Promise(resolve => server.once('listening', resolve));
after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }));
const base = `http://127.0.0.1:${server.address().port}/staff-breaks`;
const headers = { authorization: `Bearer ${jwt.sign({ id: 'admin-a' }, process.env.JWT_SECRET)}`, 'content-type': 'application/json' };
const breakBody = staff_id => JSON.stringify({ staff_id, break_type: 'one_time', specific_date: '2026-11-20', start_time: '00:00', end_time: '23:59' });
const wrote = () => queries.some(q => q.table === 'staff_breaks' && q.write);

test('admins manage breaks for staff in their own tenant', async () => {
  assert.equal((await fetch(`${base}/staff-a`, { headers })).status, 200);
  queries = [];
  assert.equal((await fetch(base, { method: 'POST', headers, body: breakBody('staff-a') })).status, 201);
  assert.equal(wrote(), true);
  queries = [];
  assert.equal((await fetch(`${base}/own-break`, { method: 'DELETE', headers })).status, 200);
  assert.equal(wrote(), true);
});

test('admins cannot read, create, or delete breaks for another tenant', async () => {
  queries = [];
  assert.equal((await fetch(`${base}/staff-b`, { headers })).status, 404);
  assert.equal(queries.some(q => q.table === 'staff_breaks'), false);
  queries = [];
  assert.equal((await fetch(base, { method: 'POST', headers, body: breakBody('staff-b') })).status, 404);
  assert.equal(wrote(), false);
  queries = [];
  assert.equal((await fetch(`${base}/foreign-break`, { method: 'DELETE', headers })).status, 404);
  assert.equal(wrote(), false);
});
