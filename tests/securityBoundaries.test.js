import test, { mock, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';

process.env.JWT_SECRET = 'local-regression-fixture-only';
let queries = [];
const activeStaff = new Set(['staff-a']);
mock.module('../lib/supabase.js', { namedExports: { supabase: {
  from(table) {
    const query = { table, filters: {}, write: false, values: null };
    queries.push(query);
    const result = () => {
      if (table === 'staff') return activeStaff.has(query.filters.id) && query.filters.is_active === true
        ? { data: { id: query.filters.id, tenant_id: 'tenant-a', role: 'admin' } } : { data: null, error: { message: 'not found' } };
      if (table === 'customers') return { data: { id: query.filters.id, tenant_id: 'tenant-a', ...query.values } };
      if (table === 'appointments') return query.filters.id === 'own' && query.filters.tenant_id === 'tenant-a'
        ? { data: { id: 'own' } } : { data: null, error: { message: 'not found' } };
      if (table === 'appointment_notes') return { data: [] };
      throw new Error(`Unexpected table: ${table}`);
    };
    const chain = {
      select() { return chain; },
      eq(key, value) { query.filters[key] = value; return chain; },
      insert() { query.write = true; return chain; },
      update(values) { query.write = true; query.values = values; return chain; },
      delete() { query.write = true; return chain; },
      order() { return chain; },
      single() { return Promise.resolve(result()); },
      then(resolve, reject) { return Promise.resolve(result()).then(resolve, reject); },
    };
    return chain;
  },
} } });
mock.module('../utils/queue.js', { namedExports: { whatsappQueue: { add: async () => {} } } });
mock.module('../utils/whatsapp.js', { namedExports: { sendStaffCancellation: async () => {} } });
const { default: appointments } = await import('../routes/appointments.js');
const { default: customers } = await import('../routes/customers.js');
const app = express();
app.use(express.json());
app.use('/appointments', appointments);
app.use('/customers', customers);
const server = app.listen(0, '127.0.0.1');
await new Promise(resolve => server.once('listening', resolve));
after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }));
const origin = `http://127.0.0.1:${server.address().port}`;
const base = `${origin}/appointments`;
const sign = claims => jwt.sign(claims, process.env.JWT_SECRET);
const staffToken = sign({ id: 'staff-a', tenant_id: 'tenant-a', type: 'staff' });
const customerToken = jwt.sign({ id: 'other-customer', type: 'customer' }, process.env.JWT_SECRET);

test('anonymous bookings cannot attach an arbitrary customer ID', async () => {
  const res = await fetch(`${base}/book`, { method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ customer_id: 'victim' }) });
  assert.equal(res.status, 401);
});

test('authenticated customers cannot impersonate another customer when booking', async () => {
  const res = await fetch(`${base}/book`, { method: 'POST', headers: {
    'content-type': 'application/json', authorization: `Bearer ${customerToken}`,
  }, body: JSON.stringify({ customer_id: 'victim', service_id: 'service', date: '2026-11-08', time_slot: '10:00' }) });
  assert.equal(res.status, 403);
});

test('notes are available for an appointment in the authenticated staff tenant', async () => {
  const res = await fetch(`${base}/own/notes`, { headers: { authorization: `Bearer ${staffToken}` } });
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), []);
});

test('foreign or missing appointments cannot expose, create, or delete notes', async () => {
  for (const method of ['GET', 'POST', 'DELETE']) {
    queries = [];
    const suffix = method === 'DELETE' ? '/note-id' : '';
    const res = await fetch(`${base}/foreign/notes${suffix}`, { method,
      headers: { authorization: `Bearer ${staffToken}`, 'content-type': 'application/json' },
      ...(method === 'POST' ? { body: JSON.stringify({ note: 'injected' }) } : {}),
    });
    assert.equal(res.status, 404);
    assert.equal(queries.some(query => query.table === 'appointment_notes'), false);
  }
});

test('staff routes reject customer, untyped, inactive, and cross-tenant tokens', async () => {
  for (const claims of [
    { id: 'staff-a', tenant_id: 'tenant-a', type: 'customer' },
    { id: 'staff-a', tenant_id: 'tenant-a' },
    { id: 'staff-inactive', tenant_id: 'tenant-a', type: 'staff' },
    { id: 'staff-a', tenant_id: 'tenant-b', type: 'staff' },
  ]) {
    const res = await fetch(`${origin}/customers`, { headers: { authorization: `Bearer ${sign(claims)}` } });
    assert.equal(res.status, 401, JSON.stringify(claims));
  }
});

test('customer profile updates only write allowlisted fields', async () => {
  queries = [];
  const res = await fetch(`${origin}/customers/cust-1`, { method: 'PUT', headers: {
    authorization: `Bearer ${staffToken}`, 'content-type': 'application/json',
  }, body: JSON.stringify({ id: 'staff-b', loyalty_points: 100000, total_spent: 0, is_deleted: true,
    tenant_id: 'tenant-b', password_hash: 'x', notes: 'VIP' }) });
  assert.equal(res.status, 200);
  assert.deepEqual(queries.find(query => query.table === 'customers').values, { notes: 'VIP' });
});

test('customer profile updates with no editable fields are rejected', async () => {
  const res = await fetch(`${origin}/customers/cust-1`, { method: 'PUT', headers: {
    authorization: `Bearer ${staffToken}`, 'content-type': 'application/json',
  }, body: JSON.stringify({ id: 'staff-b', is_deleted: false }) });
  assert.equal(res.status, 400);
});
