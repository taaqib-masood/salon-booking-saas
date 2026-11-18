import test, { mock, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';

process.env.JWT_SECRET = 'local-regression-fixture-only';
mock.module('../lib/supabase.js', { namedExports: { supabase: {
  from() {
    let id;
    const chain = {
      select() { return chain; },
      eq(key, value) { if (key === 'id') id = value; return chain; },
      single() { return Promise.resolve({ data: { id, tenant_id: 'tenant-a', role: id } }); },
    };
    return chain;
  },
} } });
mock.module('../controllers/analyticsController.js', { namedExports: Object.fromEntries([
  'getRevenueAnalytics', 'getAppointmentAnalytics', 'getStaffCommission', 'getTopServices',
  'getCustomerSummary', 'getStaffPerformance', 'getGuestConversion', 'getAIPerformance',
].map(name => [name, (req, res) => res.json({ ok: true })])) });
const { default: analytics } = await import('../routes/analytics.js');
const app = express();
app.use('/analytics', analytics);
const server = app.listen(0, '127.0.0.1');
await new Promise(resolve => server.once('listening', resolve));
after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }));
const base = `http://127.0.0.1:${server.address().port}/analytics`;
const paths = ['/revenue', '/appointments', '/staff/commission', '/top-services',
  '/customers/summary', '/staff/performance', '/guest-conversion', '/ai-performance'];
const get = (path, role) => fetch(base + path, { headers: { authorization: `Bearer ${jwt.sign({ id: role }, process.env.JWT_SECRET)}` } });

test('stylists and receptionists cannot read any analytics report', async () => {
  for (const role of ['stylist', 'receptionist']) {
    for (const path of paths) assert.equal((await get(path, role)).status, 403, `${role} ${path}`);
  }
});

test('owners, admins and managers can read analytics reports', async () => {
  for (const role of ['owner', 'admin', 'manager']) {
    for (const path of paths) assert.equal((await get(path, role)).status, 200, `${role} ${path}`);
  }
});
