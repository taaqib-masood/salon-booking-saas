import test, { mock, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';

process.env.JWT_SECRET = 'local-regression-fixture-only';
const row = { id: 'wh-1', url: 'https://example.com/hook', secret: 'fixture-secret', events: [], is_active: true,
  stats: {}, created_by: 'staff-a', created_at: 'now', updated_at: 'now' };
const pick = cols => cols === '*' || !cols ? row
  : Object.fromEntries(cols.split(',').map(c => c.trim()).map(c => [c, row[c]]));
mock.module('../lib/supabase.js', { namedExports: { supabase: {
  from(table) {
    let cols;
    const result = () => table === 'staff'
      ? { data: { id: 'staff-a', tenant_id: 'tenant-a', role: 'stylist' } }
      : { data: [pick(cols)] };
    const chain = {
      select(c) { cols = c; return chain; },
      eq() { return chain; },
      order() { return chain; },
      single() { return Promise.resolve(result()); },
      then(resolve, reject) { return Promise.resolve(result()).then(resolve, reject); },
    };
    return chain;
  },
} } });
const { default: webhooks } = await import('../routes/webhooks.js');
const app = express();
app.use(express.json());
app.use('/webhooks', webhooks);
const server = app.listen(0, '127.0.0.1');
await new Promise(resolve => server.once('listening', resolve));
after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }));
const base = `http://127.0.0.1:${server.address().port}/webhooks`;
const stylistToken = jwt.sign({ id: 'staff-a' }, process.env.JWT_SECRET);

test('listing webhooks never returns signing secrets', async () => {
  const res = await fetch(base, { headers: { authorization: `Bearer ${stylistToken}` } });
  assert.equal(res.status, 200);
  const [hook] = await res.json();
  assert.equal(hook.id, 'wh-1');
  assert.equal('secret' in hook, false);
});
