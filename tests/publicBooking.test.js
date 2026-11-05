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

async function book({ staffId, staff = [{ id: 'stylist-a' }], bookings = [], staffError = null } = {}) {
  queries = [];
  inserted = undefined;
  responses = {
    services: [{ data: { price: 100, duration: 60, name_en: 'Cut' } }],
    staff: [{ data: staff, error: staffError }],
    appointments: [{ data: bookings }, { data: { id: 'appointment' } }]
  };
  const res = {
    code: 200,
    status(code) { this.code = code; return this; },
    json(body) { this.body = body; return this; }
  };
  await publicCreateAppointment({ body: {
    service_id: 'service', staff_id: staffId, date: '2026-11-08', time_slot: '10:00'
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
