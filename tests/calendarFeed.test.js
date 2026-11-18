import test, { mock, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';

process.env.JWT_SECRET = 'local-regression-fixture-only';
const tenants = [{ id: 'tenant-a', calendar_feed_token_hash: null }];
let role = 'admin';
mock.module('../lib/supabase.js', { namedExports: { supabase: {
  from(table) {
    const filters = {};
    let update = null;
    const result = () => {
      if (table === 'staff') return { data: { id: 'staff-a', tenant_id: 'tenant-a', role } };
      if (table === 'tenants' && update) {
        tenants.filter(t => t.id === filters.id).forEach(t => Object.assign(t, update));
        return { error: null };
      }
      if (table === 'tenants') {
        const hash = filters.calendar_feed_token_hash;
        return { data: tenants.find(t => hash && t.calendar_feed_token_hash === hash) || null };
      }
      if (table === 'appointments') {
        return { data: filters.tenant_id === 'tenant-a' ? [{ id: 'apt-1', date: '2026-11-20', time_slot: '10:00', status: 'confirmed', customers: { name: 'Victim' } }] : [] };
      }
      throw new Error(`Unexpected table: ${table}`);
    };
    const chain = {
      select() { return chain; },
      update(values) { update = values; return chain; },
      eq(key, value) { filters[key] = value; return chain; },
      in() { return chain; }, gte() { return chain; }, lte() { return chain; }, order() { return chain; },
      single() { return Promise.resolve(result()); },
      maybeSingle() { return Promise.resolve(result()); },
      then(resolve, reject) { return Promise.resolve(result()).then(resolve, reject); },
    };
    return chain;
  },
} } });
const { default: calendar } = await import('../routes/calendar.js');
const app = express();
app.use('/calendar', calendar);
const server = app.listen(0, '127.0.0.1');
await new Promise(resolve => server.once('listening', resolve));
after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }));
const base = `http://127.0.0.1:${server.address().port}/calendar`;
const auth = { authorization: `Bearer ${jwt.sign({ id: 'staff-a' }, process.env.JWT_SECRET)}` };
const createToken = async () => (await (await fetch(`${base}/feed-token`, { method: 'POST', headers: auth })).json()).token;

test('tenant_id alone no longer returns the feed', async () => {
  const res = await fetch(`${base}/feed.ics?tenant_id=tenant-a`);
  assert.equal(res.status, 401);
  assert.doesNotMatch(await res.text(), /Victim/);
});

test('unknown tokens are rejected', async () => {
  await createToken();
  assert.equal((await fetch(`${base}/feed.ics?token=guess`)).status, 404);
});

test('only admins can create feed tokens, and only the hash is stored', async () => {
  role = 'stylist';
  assert.equal((await fetch(`${base}/feed-token`, { method: 'POST', headers: auth })).status, 403);
  role = 'admin';
  assert.equal((await fetch(`${base}/feed-token`, { method: 'POST' })).status, 401);
  const token = await createToken();
  assert.ok(token.length >= 43);
  assert.notEqual(tenants[0].calendar_feed_token_hash, token);
});

test('current token returns the feed and rotation revokes the old one', async () => {
  const oldToken = await createToken();
  const ok = await fetch(`${base}/feed.ics?token=${encodeURIComponent(oldToken)}`);
  assert.equal(ok.status, 200);
  assert.match(await ok.text(), /Victim/);
  const newToken = await createToken();
  assert.equal((await fetch(`${base}/feed.ics?token=${encodeURIComponent(oldToken)}`)).status, 404);
  assert.equal((await fetch(`${base}/feed.ics?token=${encodeURIComponent(newToken)}`)).status, 200);
});
