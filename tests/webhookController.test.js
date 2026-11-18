import test, { mock } from 'node:test';
import assert from 'node:assert/strict';

let writes = [];
mock.module('../lib/supabase.js', { namedExports: { supabase: {
  from() {
    const chain = {
      insert(row) { writes.push(row); return chain; },
      update(row) { writes.push(row); return chain; },
      eq() { return chain; },
      select() { return chain; },
      single() { return Promise.resolve({ data: writes.at(-1) }); },
    };
    return chain;
  },
} } });
const { createWebhook, updateWebhook } = await import('../controllers/webhookController.js');

const res = () => ({ status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } });
const staff = { tenant_id: 'tenant-a', id: 'staff-a' };
const hostile = { tenant_id: 'tenant-b', secret: 'attacker', created_by: 'x', stats: {} };

test('create ignores tenant_id, secret, created_by and stats from the body', async () => {
  writes = [];
  await createWebhook({ staff, body: { url: 'https://a.example', events: ['booking'], ...hostile } }, res());
  assert.deepEqual(writes[0], { url: 'https://a.example', events: ['booking'], tenant_id: 'tenant-a' });
});

test('update cannot move a webhook to another tenant', async () => {
  writes = [];
  await updateWebhook({ staff, params: { id: 'w1' }, body: { is_active: false, ...hostile } }, res());
  assert.deepEqual(writes[0], { is_active: false });
});

test('update with no allowed fields returns 400 without writing', async () => {
  writes = [];
  const r = await updateWebhook({ staff, params: { id: 'w1' }, body: hostile }, res());
  assert.equal(r.code, 400);
  assert.equal(writes.length, 0);
});
