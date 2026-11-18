import test, { mock, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';

process.env.JWT_SECRET = 'local-regression-fixture-only';
const tenantAStaff = new Set(['staff-a', 'stylist-a']);
let queries = [];
mock.module('../lib/supabase.js', { namedExports: { supabase: {
  from(table) {
    const query = { table, filters: {}, write: false, rows: null };
    queries.push(query);
    const result = () => {
      if (table === 'staff') {
        if (!('tenant_id' in query.filters)) return { data: { id: 'staff-a', tenant_id: 'tenant-a', role: 'admin' } };
        return query.filters.tenant_id === 'tenant-a' && tenantAStaff.has(query.filters.id)
          ? { data: { id: query.filters.id } } : { data: null, error: { message: 'not found' } };
      }
      if (table === 'staff_schedules') return { data: query.rows ?? [] };
      throw new Error(`Unexpected table: ${table}`);
    };
    const chain = {
      select() { return chain; },
      eq(key, value) { query.filters[key] = value; return chain; },
      insert(rows) { query.write = true; query.rows = rows; return chain; },
      delete() { query.write = true; return chain; },
      order() { return chain; },
      single() { return Promise.resolve(result()); },
      then(resolve, reject) { return Promise.resolve(result()).then(resolve, reject); },
    };
    return chain;
  },
} } });
const { default: staffSchedules } = await import('../routes/staffSchedules.js');
const app = express();
app.use(express.json());
app.use('/staff-schedules', staffSchedules);
const server = app.listen(0, '127.0.0.1');
await new Promise(resolve => server.once('listening', resolve));
after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }));
const base = `http://127.0.0.1:${server.address().port}/staff-schedules`;
const headers = { authorization: `Bearer ${jwt.sign({ id: 'staff-a' }, process.env.JWT_SECRET)}`, 'content-type': 'application/json' };
const shift = { day_of_week: 1, is_day_off: false, start_time: '09:00', end_time: '17:00' };

test('staff of another tenant cannot be read or overwritten', async () => {
  for (const method of ['GET', 'PUT']) {
    queries = [];
    const res = await fetch(`${base}/foreign-staff`, { method, headers,
      ...(method === 'PUT' ? { body: JSON.stringify([shift]) } : {}) });
    assert.equal(res.status, 404);
    assert.equal(queries.some(q => q.table === 'staff_schedules'), false);
  }
});

test('schedule writes for own tenant drop client id and staff_id', async () => {
  queries = [];
  const res = await fetch(`${base}/stylist-a`, { method: 'PUT', headers,
    body: JSON.stringify([{ ...shift, id: 'other-row', staff_id: 'foreign-staff', tenant_id: 'tenant-b' }]) });
  assert.equal(res.status, 200);
  const del = queries.find(q => q.table === 'staff_schedules' && !q.rows);
  assert.equal(del.filters.staff_id, 'stylist-a');
  assert.deepEqual(queries.find(q => q.rows).rows, [{ ...shift, staff_id: 'stylist-a' }]);
});

test('own schedule writes also drop client id and staff_id', async () => {
  queries = [];
  const res = await fetch(`${base}/me`, { method: 'PUT', headers,
    body: JSON.stringify([{ ...shift, id: 'other-row', staff_id: 'foreign-staff' }]) });
  assert.equal(res.status, 200);
  assert.deepEqual(queries.find(q => q.rows).rows, [{ ...shift, staff_id: 'staff-a' }]);
});
