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
      if (table === 'staff') return { data: { id: 'staff-a', tenant_id: 'tenant-a', role: 'admin' } };
      if (table === 'customers') return { data: { id: query.filters.id, tenant_id: 'tenant-a' } };
      if (table === 'appointments') return query.filters.id === 'own' && query.filters.tenant_id === 'tenant-a'
        ? { data: { id: 'own' } } : { data: null, error: { message: 'not found' } };
      if (table === 'appointment_notes') return { data: [] };
      if (table === 'webhook_deliveries') return { data: [] };
      throw new Error(`Unexpected table: ${table}`);
    };
    const chain = {
      select() { return chain; },
      eq(key, value) { query.filters[key] = value; return chain; },
      insert() { query.write = true; return chain; },
      delete() { query.write = true; return chain; },
      order() { return chain; },
      limit() { return chain; },
      single() { return Promise.resolve(result()); },
      then(resolve, reject) { return Promise.resolve(result()).then(resolve, reject); },
    };
    return chain;
  },
} } });
mock.module('../utils/queue.js', { namedExports: { whatsappQueue: { add: async () => {} } } });
mock.module('../utils/whatsapp.js', { namedExports: { sendStaffCancellation: async () => {} } });
const { default: appointments } = await import('../routes/appointments.js');
const { default: webhooks } = await import('../routes/webhooks.js');
const app = express();
app.use(express.json());
app.use('/appointments', appointments);
app.use('/webhooks', webhooks);
const server = app.listen(0, '127.0.0.1');
await new Promise(resolve => server.once('listening', resolve));
after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }));
const base = `http://127.0.0.1:${server.address().port}/appointments`;
const staffToken = jwt.sign({ id: 'staff-a' }, process.env.JWT_SECRET);
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

test('webhook deliveries are scoped to the staff tenant and requested webhook', async () => {
  queries = [];
  const res = await fetch(base.replace('/appointments', '/webhooks/wh-1/deliveries'),
    { headers: { authorization: `Bearer ${staffToken}` } });
  assert.equal(res.status, 200);
  const deliveries = queries.find(query => query.table === 'webhook_deliveries');
  assert.deepEqual(deliveries.filters, { tenant_id: 'tenant-a', webhook_id: 'wh-1' });
});
