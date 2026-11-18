import test, { mock, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import express from 'express';
import twilio from 'twilio';

process.env.TWILIO_AUTH_TOKEN = 'local-regression-fixture-only';
delete process.env.GROQ_API_KEY;
mock.module('../lib/supabase.js', { namedExports: { supabase: {} } });
mock.module('../services/leadQualification.js', { namedExports: Object.fromEntries(
  ['classifyLead', 'notifyHotLead', 'markLeadConverted', 'scheduleEnquiryFollowup',
    'cancelEnquiryFollowup', 'scheduleNoShowFollowup', 'scheduleUpsell'].map(n => [n, async () => {}]),
) });
const { default: twilioRouter } = await import('../routes/twilio.js');
const app = express();
app.set('trust proxy', 1);
app.use(express.urlencoded({ extended: true }));
app.use('/api/v1/twilio', twilioRouter);
const server = app.listen(0, '127.0.0.1');
await new Promise(resolve => server.once('listening', resolve));
after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }));

const { port } = server.address();
const params = { From: 'whatsapp:+971500000000', Body: 'hello' };
// node:http instead of fetch, which drops a custom Host header
const post = headers => new Promise((resolve, reject) => {
  const body = new URLSearchParams(params).toString();
  const req = http.request({ port, path: '/api/v1/twilio/whatsapp', method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', ...headers } }, res => {
    let text = '';
    res.on('data', chunk => { text += chunk; }).on('end', () => resolve({ status: res.statusCode, text }));
  });
  req.on('error', reject).end(body);
});
const sign = (url, token = process.env.TWILIO_AUTH_TOKEN) => twilio.getExpectedTwilioSignature(token, url, params);

test('rejects unsigned webhook', async () => {
  assert.equal((await post({})).status, 403);
});

test('rejects wrong signature', async () => {
  const res = await post({ 'X-Twilio-Signature': sign(`http://localhost:${port}/api/v1/twilio/whatsapp`, 'wrong') });
  assert.equal(res.status, 403);
});

test('accepts valid signature for the public proxied URL', async () => {
  const res = await post({
    Host: 'api.example.com',
    'X-Forwarded-Proto': 'https',
    'X-Twilio-Signature': sign('https://api.example.com/api/v1/twilio/whatsapp'),
  });
  assert.equal(res.status, 200);
  assert.match(res.text, /<Response>/);
});
