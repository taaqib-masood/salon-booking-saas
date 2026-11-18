import test, { mock, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import '../lib/asyncErrors.js';

mock.module('../lib/supabase.js', { namedExports: { supabase: {} } });
const { default: auth } = await import('../routes/auth.js');
const app = express();
app.use(express.json());
app.use('/auth', auth);
app.get('/boom', async () => { throw new Error('boom'); });
app.get('/health', (req, res) => res.json({ ok: true }));
app.use((err, req, res, next) => res.status(500).json({ error: err.message }));
const server = app.listen(0, '127.0.0.1');
await new Promise(resolve => server.once('listening', resolve));
after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }));
const base = `http://127.0.0.1:${server.address().port}`;
const post = (path, body) => fetch(`${base}${path}`, { method: 'POST',
  headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });

test('non-string login and register fields are rejected with 400', async () => {
  for (const [path, body] of [
    ['/auth/staff/login', { email: 1, password: 'x' }],
    ['/auth/customer/login', { phone: ['x'], password: 'x' }],
    ['/auth/register', { business_name: 1, email: 'a@b.c', password: 'x', name: 'n' }],
    ['/auth/customer/register', { name: 'n', phone: 'p', email: 'a@b.c', password: 1 }],
  ]) assert.equal((await post(path, body)).status, 400, path);
});

test('async handler rejections reach the error handler and the server keeps serving', async () => {
  assert.equal((await fetch(`${base}/boom`)).status, 500);
  assert.equal((await fetch(`${base}/health`)).status, 200);
});
