import test, { mock } from 'node:test';
import assert from 'node:assert/strict';

let responses;
let queries;
let inserted;
mock.module('../lib/supabase.js', {
  namedExports: {
    supabase: {
      from(table) {
        const query = { table, filters: [] };
        queries.push(query);
        const result = responses[table].shift();
        const chain = {
          select() { return chain; },
          eq(...args) { query.filters.push(args); return chain; },
          in() { return chain; },
          lt() { return chain; },
          gt() { return chain; },
          order() { return chain; },
          insert(data) { inserted = data; return chain; },
          single() { return Promise.resolve(result); },
          then(resolve, reject) { return Promise.resolve(result).then(resolve, reject); }
        };
        return chain;
      }
    }
  }
});
mock.module('../utils/queue.js', { namedExports: { whatsappQueue: { add: async () => {} } } });
mock.module('../utils/whatsapp.js', { namedExports: { sendStaffCancellation: async () => {} } });
const { publicCreateAppointment } = await import('../controllers/appointmentsController.js');
const { DEFAULT_TENANT_ID, DEFAULT_BRANCH_ID } = await import('../lib/defaults.js');

async function book({ staffId, staff = [{ id: 'stylist-a' }], bookings = [], staffError = null,
  customerId, customer = { id: customerId }, customerError = null } = {}) {
  queries = [];
  inserted = undefined;
  responses = {
    services: [{ data: { price: 100, duration: 60, name_en: 'Cut' } }],
    customers: [{ data: customer, error: customerError }],
    staff: [{ data: staff, error: staffError }],
    appointments: [{ data: bookings.map(booking => ({ time_slot: '10:00:00', end_time: '11:00:00', ...booking })) },
      { data: { id: 'appointment' } }]
  };
  const res = {
    code: 200,
    status(code) { this.code = code; return this; },
    json(body) { this.body = body; return this; }
  };
  await publicCreateAppointment({ body: {
    service_id: 'service', staff_id: staffId, date: '2026-11-08', time_slot: '10:00',
    customer_id: customerId, firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.test'
  } }, res);
  return res;
}

test('chosen stylist is scoped to active tenant/branch staff and inserted', async () => {
  const res = await book({ staffId: 'stylist-a' });
  assert.equal(res.code, 201);
  assert.equal(inserted.staff_id, 'stylist-a');
  const filters = queries.find(query => query.table === 'staff').filters;
  for (const pair of [['id', 'stylist-a'], ['tenant_id', DEFAULT_TENANT_ID],
    ['branch_id', DEFAULT_BRANCH_ID], ['is_active', true], ['is_deleted', false], ['role', 'stylist']]) {
    assert.ok(filters.some(filter => JSON.stringify(filter) === JSON.stringify(pair)));
  }
  assert.equal(inserted.tenant_id, DEFAULT_TENANT_ID);
  assert.equal(inserted.branch_id, DEFAULT_BRANCH_ID);
});

test('any stylist assigns a free eligible member rather than an occupied one', async () => {
  const res = await book({ staff: [{ id: 'busy' }, { id: 'free' }], bookings: [{ staff_id: 'busy' }] });
  assert.equal(res.code, 201);
  assert.equal(inserted.staff_id, 'free');
});

test('missing or occupied staff does not create an appointment', async () => {
  assert.equal((await book({ staff: [] })).code, 409);
  assert.equal(inserted, undefined);
  assert.equal((await book({ staffId: 'stylist-a', bookings: [{ staff_id: 'stylist-a' }] })).code, 409);
  assert.equal(inserted, undefined);
});

test('staff lookup failure does not create an appointment', async () => {
  assert.equal((await book({ staffError: { message: 'lookup failed' } })).code, 400);
  assert.equal(inserted, undefined);
});

test('adjacent bookings do not occupy the requested interval', async () => {
  const res = await book({ staffId: 'stylist-a', bookings: [
    { staff_id: 'stylist-a', time_slot: '09:00:00', end_time: '10:00:00' },
    { staff_id: 'stylist-a', time_slot: '11:00:00', end_time: '12:00:00' }
  ] });
  assert.equal(res.code, 201);
  assert.equal(inserted.staff_id, 'stylist-a');
});

test('booking without a customer id preserves the guest flow for staff and anonymous users', async () => {
  assert.equal((await book()).code, 201);
  assert.equal(inserted.customer_id, null);
  assert.equal(inserted.is_guest, true);
  assert.equal(inserted.guest.name, 'Ada Lovelace');
  assert.equal(queries.some(query => query.table === 'customers'), false);
});

test('a customer id is verified in the booking tenant before linking the appointment', async () => {
  assert.equal((await book({ customerId: 'customer-a' })).code, 201);
  assert.equal(inserted.customer_id, 'customer-a');
  assert.equal(inserted.is_guest, false);
  assert.equal(inserted.guest, null);
  const filters = queries.find(query => query.table === 'customers').filters;
  for (const pair of [['id', 'customer-a'], ['tenant_id', DEFAULT_TENANT_ID]]) {
    assert.ok(filters.some(filter => JSON.stringify(filter) === JSON.stringify(pair)));
  }
});

test('staff ids and customers outside the tenant are rejected before inserting', async () => {
  for (const customerId of ['staff-admin', 'other-tenant-customer']) {
    const res = await book({ customerId, customer: null });
    assert.equal(res.code, 400);
    assert.equal(res.body.error, 'Customer not found for this tenant');
    assert.equal(inserted, undefined);
  }
});

test('customer lookup errors do not create an appointment', async () => {
  assert.equal((await book({ customerId: 'customer-a', customerError: { message: 'lookup failed' } })).code, 400);
  assert.equal(inserted, undefined);
});
