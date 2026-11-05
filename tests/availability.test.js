import test, { mock } from 'node:test';
import assert from 'node:assert/strict';

let responses;
let queries;
mock.module('../lib/supabase.js', {
  namedExports: {
    supabase: {
      from(table) {
        const query = { table, filters: [] };
        queries.push(query);
        const chain = {
          select() { return chain; },
          eq(...args) { query.filters.push(['eq', ...args]); return chain; },
          in(...args) { query.filters.push(['in', ...args]); return chain; },
          lt(...args) { query.filters.push(['lt', ...args]); return chain; },
          gt(...args) { query.filters.push(['gt', ...args]); return chain; },
          or() { return chain; },
          order() { return chain; },
          single() { return Promise.resolve(responses[table]); },
          then(resolve, reject) { return Promise.resolve(responses[table]).then(resolve, reject); }
        };
        return chain;
      }
    }
  }
});
const { getAvailableSlots } = await import('../controllers/availabilityController.js');
const { DEFAULT_TENANT_ID, DEFAULT_BRANCH_ID } = await import('../lib/defaults.js');

async function slots({ staffId, staff = [{ id: 'a' }, { id: 'b' }], bookings = [],
  staffError = null, bookingsError = null, breaks = [], serviceError = null } = {}) {
  queries = [];
  responses = {
    services: { data: { duration: 60, name_en: 'Cut', tenant_id: DEFAULT_TENANT_ID }, error: serviceError },
    tenants: { data: { settings: { workingHours: { 0: { open: true, start: '09:00', end: '12:00' } } } } },
    staff: { data: staff, error: staffError },
    appointments: { data: bookings, error: bookingsError },
    staff_breaks: { data: breaks }
  };
  const res = {
    code: 200,
    status(code) { this.code = code; return this; },
    json(body) { this.body = body; return this; }
  };
  await getAvailableSlots({ query: { service_id: 'service', date: '2026-11-08', staff_id: staffId } }, res);
  return res;
}

test('any available keeps slots when one eligible stylist is busy and another is free', async () => {
  const res = await slots({ bookings: [{ staff_id: 'a', time_slot: '09:00:00', end_time: '11:00:00' }] });
  assert.equal(res.code, 200);
  assert.deepEqual(res.body.slots, ['09:00', '10:00', '11:00']);
  assert.equal(queries.filter(query => query.table === 'appointments').length, 1);
  for (const table of ['services', 'staff', 'appointments']) {
    assert.ok(queries.find(query => query.table === table).filters.some(filter =>
      JSON.stringify(filter) === JSON.stringify(['eq', 'tenant_id', DEFAULT_TENANT_ID])));
  }
  const staffFilters = queries.find(query => query.table === 'staff').filters;
  for (const pair of [['branch_id', DEFAULT_BRANCH_ID], ['is_active', true], ['is_deleted', false], ['role', 'stylist']]) {
    assert.ok(staffFilters.some(filter => JSON.stringify(filter) === JSON.stringify(['eq', ...pair])));
  }
  const bookingFilters = queries.find(query => query.table === 'appointments').filters;
  for (const filter of [['eq', 'branch_id', DEFAULT_BRANCH_ID], ['eq', 'date', '2026-11-08'],
    ['in', 'status', ['pending', 'confirmed', 'in_progress']], ['in', 'staff_id', ['a', 'b']],
    ['lt', 'time_slot', '12:00'], ['gt', 'end_time', '09:00']]) {
    assert.ok(bookingFilters.some(actual => JSON.stringify(actual) === JSON.stringify(filter)));
  }
});

test('any available hides only intervals where every eligible stylist overlaps', async () => {
  const res = await slots({ bookings: [
    { staff_id: 'a', time_slot: '09:00:00', end_time: '11:00:00' },
    { staff_id: 'b', time_slot: '09:00:00', end_time: '10:00:00' }
  ] });
  assert.deepEqual(res.body.slots, ['10:00', '11:00']);
});

test('a chosen stylist ignores other stylists bookings and allows adjacent intervals', async () => {
  const res = await slots({ staffId: 'a', staff: [{ id: 'a' }], bookings: [
    { staff_id: 'a', time_slot: '09:00:00', end_time: '10:00:00' },
    { staff_id: 'b', time_slot: '10:00:00', end_time: '12:00:00' }
  ] });
  assert.deepEqual(res.body.slots, ['10:00', '11:00']);
  assert.ok(queries.find(query => query.table === 'staff').filters.some(filter =>
    JSON.stringify(filter) === JSON.stringify(['eq', 'id', 'a'])));
});

test('a partial overlap blocks both affected slots, including TIME seconds', async () => {
  const res = await slots({ staffId: 'a', staff: [{ id: 'a' }], bookings: [
    { staff_id: 'a', time_slot: '09:30:00', end_time: '10:00:30' }
  ] });
  assert.deepEqual(res.body.slots, ['11:00']);
});

test('empty bookings offer all slots, but no eligible staff offers none', async () => {
  assert.deepEqual((await slots()).body.slots, ['09:00', '10:00', '11:00']);
  assert.deepEqual((await slots({ staff: [] })).body.slots, []);
  assert.equal(queries.some(query => query.table === 'appointments'), false);
  assert.deepEqual((await slots({ staffId: 'outside-branch', staff: [] })).body.slots, []);
});

test('staff and booking query errors do not offer slots', async () => {
  for (const error of [{ staffError: { message: 'staff lookup failed' } },
    { bookingsError: { message: 'booking lookup failed' } }]) {
    const res = await slots(error);
    assert.equal(res.code, 400);
    assert.equal(res.body.slots, undefined);
  }
  assert.equal((await slots({ serviceError: { message: 'not found' } })).code, 404);
});

test('chosen stylist breaks still block overlapping slots', async () => {
  const res = await slots({ staffId: 'a', staff: [{ id: 'a' }],
    breaks: [{ start_time: '10:00:00', end_time: '11:00:00' }] });
  assert.deepEqual(res.body.slots, ['09:00', '11:00']);
});
