import test, { mock, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';

process.env.JWT_SECRET = 'local-regression-fixture-only';
process.env.STRIPE_PRICE_GROWTH = 'price_growth';
process.env.STRIPE_PRICE_ENTERPRISE = 'price_enterprise';
process.env.APP_URL = 'https://app.example.test/';

let sessions = [];
let updates = [];
mock.module('stripe', { defaultExport: class {
  checkout = { sessions: { create: async (params) => { sessions.push(params); return { url: 'https://checkout.test' }; } } };
  webhooks = { constructEvent: (body) => {
    assert.ok(Buffer.isBuffer(body), 'webhook body must stay raw for signature verification');
    return JSON.parse(body);
  } };
} });
mock.module('../lib/supabase.js', { namedExports: { supabase: {
  from(table) {
    const chain = {
      select() { return chain; },
      update(values) { updates.push({ table, values }); return chain; },
      eq() { return chain; },
      order() { return chain; },
      limit() { return Promise.resolve({ data: null }); },
      single() { return Promise.resolve({ data: { id: 'staff-a', tenant_id: 'tenant-a', role: 'owner' } }); },
    };
    return chain;
  },
} } });
const { default: subscriptions } = await import('../routes/subscriptions.js');
const app = express();
app.use('/subscriptions/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());
app.use('/subscriptions', subscriptions);
const server = app.listen(0, '127.0.0.1');
await new Promise(resolve => server.once('listening', resolve));
after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }));
const base = `http://127.0.0.1:${server.address().port}/subscriptions`;
const token = jwt.sign({ id: 'staff-a' }, process.env.JWT_SECRET);
beforeEach(() => { sessions = []; updates = []; });

const upgrade = (body) => fetch(`${base}/upgrade`, { method: 'POST', headers: {
  'content-type': 'application/json', authorization: `Bearer ${token}`, origin: 'https://evil.test',
}, body: JSON.stringify(body) });
const webhook = (event) => fetch(`${base}/webhook`, { method: 'POST',
  headers: { 'content-type': 'application/json', 'stripe-signature': 'sig' }, body: JSON.stringify(event) });
const subscriptionEvent = (priceId, status = 'active') => ({ type: 'customer.subscription.updated',
  data: { object: { status, metadata: { tenant_id: 'tenant-a' }, items: { data: [{ price: { id: priceId } }] } } } });

test('upgrade checkout ignores client price/name and uses the configured price and APP_URL', async () => {
  const res = await upgrade({ planId: 'enterprise', planName: 'Enterprise', price: 0.01 });
  assert.equal(res.status, 200);
  assert.equal(sessions.length, 1);
  const [session] = sessions;
  assert.deepEqual(session.line_items, [{ price: 'price_enterprise', quantity: 1 }]);
  assert.equal(session.success_url, 'https://app.example.test/success?session_id={CHECKOUT_SESSION_ID}');
  assert.equal(session.cancel_url, 'https://app.example.test/canceled');
  assert.deepEqual(session.subscription_data.metadata, { tenant_id: 'tenant-a', plan_id: 'enterprise' });
});

test('upgrade rejects unknown and free plans', async () => {
  for (const planId of [undefined, 'free', 'Enterprise', 'toString']) {
    assert.equal((await upgrade({ planId, price: 0.01 })).status, 400);
  }
  assert.equal(sessions.length, 0);
});

test('webhook derives the plan from the subscribed Stripe price', async () => {
  assert.equal((await webhook(subscriptionEvent('price_growth'))).status, 200);
  assert.deepEqual(updates, [{ table: 'tenant_subscriptions', values: { plan: 'growth', status: 'active' } }]);
});

test('webhook ignores subscriptions on unknown prices or unpaid statuses', async () => {
  await webhook(subscriptionEvent('price_attacker'));
  await webhook(subscriptionEvent('price_enterprise', 'incomplete'));
  assert.deepEqual(updates, []);
});
