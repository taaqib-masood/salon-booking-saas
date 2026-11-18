import test, { mock, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';

process.env.JWT_SECRET = 'local-regression-fixture-only';
let rpcCalls = [];
let balance = 100;
mock.module('../lib/supabase.js', { namedExports: { supabase: {
  from() {
    const chain = {
      select() { return chain; },
      eq() { return chain; },
      single() { return Promise.resolve({ data: { id: 'staff-a', tenant_id: 'tenant-a', role: 'receptionist' } }); },
    };
    return chain;
  },
  async rpc(name, args) {
    rpcCalls.push({ name, args });
    if (balance < args.p_points) return { data: null, error: null };
    balance -= args.p_points;
    return { data: balance, error: null };
  },
} } });
const { default: loyalty } = await import('../routes/loyalty.js');
const app = express();
app.use(express.json());
app.use('/loyalty', loyalty);
const server = app.listen(0, '127.0.0.1');
await new Promise(resolve => server.once('listening', resolve));
after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }));
const token = jwt.sign({ id: 'staff-a' }, process.env.JWT_SECRET);
const redeem = points => fetch(`http://127.0.0.1:${server.address().port}/loyalty/redeem`, {
  method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
  body: JSON.stringify({ customer_id: 'cust-a', points }),
});

test('rejects negative, fractional, non-numeric and oversized points before touching the database', async () => {
  for (const points of [-100, 0, 1.5, '50', null, 1_000_001]) {
    rpcCalls = [];
    const res = await redeem(points);
    assert.equal(res.status, 400, `points=${points}`);
    assert.equal(rpcCalls.length, 0);
  }
});

test('deducts through the atomic RPC scoped to the staff tenant', async () => {
  rpcCalls = [];
  balance = 100;
  const res = await redeem(40);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { message: 'Redeemed', new_balance: 60 });
  assert.equal(rpcCalls[0].name, 'redeem_loyalty_points');
  assert.equal(rpcCalls[0].args.p_tenant_id, 'tenant-a');
});

test('reports insufficient balance when the conditional update matches no row', async () => {
  balance = 10;
  const res = await redeem(40);
  assert.equal(res.status, 400);
});
