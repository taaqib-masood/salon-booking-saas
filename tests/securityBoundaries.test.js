import test, { mock, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';

process.env.JWT_SECRET = 'local-regression-fixture-only';
let queries = [];
const staffRoles = { 'staff-a': 'admin', 'stylist-a': 'stylist' };
mock.module('../lib/supabase.js', { namedExports: { supabase: {
  from(table) {
    const query = { table, filters: {}, write: false };
    queries.push(query);
    const result = () => {
      const foreign = String(query.filters.id).startsWith('foreign');
      if (table === 'staff') return staffRoles[query.filters.id] && !foreign
        ? { data: { id: query.filters.id, tenant_id: 'tenant-a', role: staffRoles[query.filters.id] } }
        : { data: null, error: { message: 'not found' } };
      if (['customers', 'branches', 'services'].includes(table)) return foreign
        ? { data: null, error: { message: 'not found' } }
        : { data: { id: query.filters.id, tenant_id: 'tenant-a', price: 100 } };
      if (table === 'offers') return query.filters.code === 'SAVE10'
        ? { data: { discount_type: 'percentage', discount_value: 10, used_count: 0, max_uses: 5, min_order_amount: 0, offer_services: [] } }
        : { data: null, error: { message: 'not found' } };
      if (table === 'appointments' && query.payload) return { data: query.payload };
      if (table === 'appointments') return query.filters.id === 'own' && query.filters.tenant_id === 'tenant-a'
        ? { data: { id: 'own' } } : { data: null, error: { message: 'not found' } };
      if (table === 'appointment_notes') return { data: [] };
      throw new Error(`Unexpected table: ${table}`);
    };
    const chain = {
      select() { return chain; },
      eq(key, value) { query.filters[key] = value; return chain; },
      lte() { return chain; },
      gte() { return chain; },
      insert(payload) { query.write = true; if (table === 'appointments') query.payload = payload; return chain; },
      update() { query.write = true; return chain; },
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
const app = express();
app.use(express.json());
app.use('/appointments', appointments);
const server = app.listen(0, '127.0.0.1');
await new Promise(resolve => server.once('listening', resolve));
after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }));
const base = `http://127.0.0.1:${server.address().port}/appointments`;
const staffToken = jwt.sign({ id: 'staff-a' }, process.env.JWT_SECRET);
const stylistToken = jwt.sign({ id: 'stylist-a' }, process.env.JWT_SECRET);
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

const booking = { branch_id: 'branch', staff_id: 'stylist-a', service_id: 'service', customer_id: 'customer',
  date: '2026-11-20', time_slot: '10:00' };
const createAs = (token, body) => fetch(base, { method: 'POST',
  headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify(body) });
const inserted = () => queries.find(query => query.table === 'appointments' && query.payload)?.payload;

test('staff cannot create appointments referencing another tenant\'s records', async () => {
  for (const field of ['branch_id', 'staff_id', 'service_id', 'customer_id']) {
    queries = [];
    const res = await createAs(staffToken, { ...booking, [field]: 'foreign-id' });
    assert.equal(res.status, 400, field);
    assert.equal(inserted(), undefined, field);
  }
});

test('appointment pricing is computed server-side from the tenant service', async () => {
  queries = [];
  const res = await createAs(stylistToken, { ...booking, subtotal: 0, vat_amount: 0, total_amount: 0 });
  assert.equal(res.status, 201);
  assert.deepEqual([inserted().subtotal, inserted().vat_amount, inserted().total_amount, inserted().discount_amount], [100, 5, 105, 0]);
});

test('only managers and admins can apply manual discounts', async () => {
  queries = [];
  assert.equal((await createAs(stylistToken, { ...booking, discount_amount: 100 })).status, 403);
  assert.equal(inserted(), undefined);
  const res = await createAs(staffToken, { ...booking, discount_amount: 20 });
  assert.equal(res.status, 201);
  assert.deepEqual([inserted().discount_amount, inserted().vat_amount, inserted().total_amount], [20, 4, 84]);
});

test('offer discounts require a valid tenant offer code', async () => {
  queries = [];
  assert.equal((await createAs(stylistToken, { ...booking, discount_ref: 'BOGUS' })).status, 400);
  assert.equal(inserted(), undefined);
  const res = await createAs(stylistToken, { ...booking, discount_ref: 'save10' });
  assert.equal(res.status, 201);
  assert.deepEqual([inserted().discount_amount, inserted().total_amount], [10, 94.5]);
});

test('reschedule rejects a staff member from another tenant', async () => {
  queries = [];
  const res = await fetch(`${base}/own/reschedule`, { method: 'POST',
    headers: { authorization: `Bearer ${staffToken}`, 'content-type': 'application/json' },
    body: JSON.stringify({ date: '2026-11-21', time_slot: '11:00', staff_id: 'foreign-staff' }) });
  assert.equal(res.status, 400);
  assert.equal(queries.some(query => query.table === 'appointments'), false);
});
