import test, { mock } from 'node:test';
import assert from 'node:assert/strict';

const row = { id: 'c1', tenant_id: 'tenant-a', name: 'n', phone: 'p', email: 'e', password_hash: '$2b$10$secret' };
mock.module('../lib/supabase.js', { namedExports: { supabase: {
  from() {
    const chain = {
      select() { return chain; }, update() { return chain; }, eq() { return chain; },
      single() { return Promise.resolve({ data: { ...row } }); },
    };
    return chain;
  },
} } });
mock.module('../utils/encryption.js', { namedExports: { decrypt: v => v } });
const { getCustomerById, updateCustomerProfile } = await import('../controllers/customersController.js');

const call = async handler => {
  let body;
  await handler({ params: { id: 'c1' }, staff: { tenant_id: 'tenant-a' }, body: { name: 'x' } },
    { json: b => { body = b; }, status() { return this; } });
  return body;
};

test('customer responses never include password_hash', async () => {
  for (const handler of [getCustomerById, updateCustomerProfile]) {
    const body = await call(handler);
    assert.equal(body.id, 'c1');
    assert.ok(!('password_hash' in body));
  }
});
