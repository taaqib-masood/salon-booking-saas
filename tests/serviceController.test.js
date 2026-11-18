import test, { mock } from 'node:test';
import assert from 'node:assert/strict';

let writes;
const owned = { branches: ['branch-a'], service_categories: ['cat-a'] };
mock.module('../lib/supabase.js', { namedExports: { supabase: {
  from(table) {
    const filters = {};
    const result = () => {
      if (table === 'branches') return { data: filters.id.filter(id => filters.tenant_id === 'tenant-a' && owned.branches.includes(id)).map(id => ({ id })) };
      if (table === 'service_categories') return { data: filters.tenant_id === 'tenant-a' && owned.service_categories.includes(filters.id) ? { id: filters.id } : null };
      if (table === 'services') return { data: { id: 'svc-a' } };
      return { data: null };
    };
    const chain = {
      select() { return chain; },
      eq(key, value) { filters[key] = value; return chain; },
      in(key, value) { filters[key] = value; return chain; },
      insert(payload) { writes.push({ table, op: 'insert', payload }); return chain; },
      update(payload) { writes.push({ table, op: 'update', payload, filters }); return chain; },
      delete() { return chain; },
      single() { return Promise.resolve(result()); },
      then(resolve, reject) { return Promise.resolve(result()).then(resolve, reject); },
    };
    return chain;
  },
} } });
const { createService, updateService } = await import('../controllers/serviceController.js');

async function call(handler, body, params = { id: 'svc-a' }) {
  writes = [];
  const res = { code: 200, status(code) { this.code = code; return this; }, json(b) { this.body = b; return this; } };
  await handler({ body, params, staff: { tenant_id: 'tenant-a' } }, res);
  return res;
}
const serviceWrite = () => writes.find(w => w.table === 'services');

test('update ignores tenant_id and other non-editable columns', async () => {
  const res = await call(updateService, { tenant_id: 'tenant-b', id: 'x', is_deleted: true, price_with_vat: 1, name_en: 'Cut' });
  assert.equal(res.code, 200);
  assert.deepEqual(serviceWrite().payload, { name_en: 'Cut' });
  assert.equal(serviceWrite().filters.tenant_id, 'tenant-a');
});

test('create always uses the caller tenant', async () => {
  const res = await call(createService, { tenant_id: 'tenant-b', name_en: 'Cut', price: 50, duration: '45' });
  assert.equal(res.code, 201);
  assert.deepEqual(serviceWrite().payload, { name_en: 'Cut', price: 50, duration: 45, tenant_id: 'tenant-a' });
});

test('invalid durations are rejected before any write', async () => {
  for (const duration of [-1, 0, 1.5, 601, 'abc', null]) {
    assert.equal((await call(updateService, { duration })).code, 400);
    assert.equal((await call(createService, { name_en: 'Cut', price: 1, duration })).code, 400);
    assert.equal(writes.length, 0);
  }
  assert.equal((await call(createService, { name_en: 'Cut', price: 1 })).code, 400);
});

test('branches and categories from another tenant are rejected', async () => {
  for (const body of [{ branches: ['branch-a', 'branch-b'] }, { branches: 'branch-a' }, { category_id: 'cat-b' }]) {
    assert.equal((await call(updateService, body)).code, 400);
    assert.equal(writes.length, 0);
  }
  const res = await call(updateService, { branches: ['branch-a', 'branch-a'], category_id: 'cat-a' });
  assert.equal(res.code, 200);
  assert.deepEqual(writes.find(w => w.table === 'service_branches').payload, [{ service_id: 'svc-a', branch_id: 'branch-a' }]);
});
