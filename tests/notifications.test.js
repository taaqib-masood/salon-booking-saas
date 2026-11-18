import test, { mock, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';

process.env.JWT_SECRET = 'local-regression-fixture-only';
const OWN = '11111111-1111-4111-8111-111111111111';
const FOREIGN = '22222222-2222-4222-8222-222222222222';
let inserts = [];
mock.module('../lib/supabase.js', { namedExports: { supabase: {
  from(table) {
    const filters = {};
    let row;
    const result = () => {
      if (table === 'staff') return { data: { id: 'staff-a', tenant_id: 'tenant-a', role: 'admin' } };
      if (table === 'customers' || table === 'appointments') return filters.id === OWN && filters.tenant_id === 'tenant-a'
        ? { data: { id: OWN } } : { data: null, error: { message: 'not found' } };
      if (table === 'notifications') return { data: row };
      throw new Error(`Unexpected table: ${table}`);
    };
    const chain = {
      select() { return chain; },
      eq(key, value) { filters[key] = value; return chain; },
      insert(values) { row = values; inserts.push(values); return chain; },
      single() { return Promise.resolve(result()); },
    };
    return chain;
  },
} } });
const { default: notifications } = await import('../routes/notifications.js');
const app = express();
app.use(express.json());
app.use('/notifications', notifications);
const server = app.listen(0, '127.0.0.1');
await new Promise(resolve => server.once('listening', resolve));
after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }));
const base = `http://127.0.0.1:${server.address().port}/notifications`;
const post = body => fetch(base, { method: 'POST', body: JSON.stringify(body), headers: {
  'content-type': 'application/json', authorization: `Bearer ${jwt.sign({ id: 'staff-a' }, process.env.JWT_SECRET)}`,
} });

test('foreign customer or appointment IDs are rejected before insert', async () => {
  for (const body of [{ customer_id: FOREIGN }, { appointment_id: FOREIGN }, { customer_id: OWN, appointment_id: FOREIGN }]) {
    inserts = [];
    const res = await post({ type: 'reminder', channel: 'whatsapp', ...body });
    assert.equal(res.status, 400);
    assert.equal(inserts.length, 0);
  }
});

test('only allowlisted fields are inserted, scoped to the staff tenant', async () => {
  inserts = [];
  const res = await post({ type: 'reminder', channel: 'whatsapp', customer_id: OWN, appointment_id: OWN,
    tenant_id: 'tenant-b', status: 'sent', id: 'forged' });
  assert.equal(res.status, 201);
  assert.deepEqual(inserts[0], { type: 'reminder', channel: 'whatsapp', customer_id: OWN, appointment_id: OWN,
    scheduled_at: undefined, payload: undefined, tenant_id: 'tenant-a' });
});
