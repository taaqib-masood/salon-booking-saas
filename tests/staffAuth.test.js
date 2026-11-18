import test, { mock, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';

process.env.JWT_SECRET = 'local-regression-fixture-only';
let queries = [];
let staffRows = [];
mock.module('../lib/supabase.js', { namedExports: { supabase: {
  from(table) {
    const query = { table, filters: {}, op: 'select', payload: null };
    queries.push(query);
    const result = () => {
      if (table === 'tenants') return { data: { id: 'tenant-new' } };
      const rows = staffRows.filter(r => r.email === query.filters.email);
      if (query.op === 'insert') return { data: { id: 'staff-new', ...query.payload } };
      return rows.length === 1 ? { data: rows[0] } : { data: null, error: rows.length ? { message: 'multiple rows' } : null };
    };
    const chain = {
      select() { return chain; },
      eq(key, value) { query.filters[key] = value; return chain; },
      insert(payload) { query.op = 'insert'; query.payload = payload; return chain; },
      delete() { query.op = 'delete'; return chain; },
      single() { return Promise.resolve(result()); },
      maybeSingle() { return Promise.resolve(result()); },
      then(resolve, reject) { return Promise.resolve(result()).then(resolve, reject); },
    };
    return chain;
  },
} } });
const { default: auth } = await import('../routes/auth.js');
const { createStaff } = await import('../controllers/staffController.js');
const app = express();
app.use(express.json());
app.use('/auth', auth);
const server = app.listen(0, '127.0.0.1');
await new Promise(resolve => server.once('listening', resolve));
after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }));
const base = `http://127.0.0.1:${server.address().port}/auth`;
const post = (path, body) => fetch(`${base}${path}`, { method: 'POST',
  headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });

test('registering a tenant with an existing staff email is rejected before any tenant is created', async () => {
  staffRows = [{ id: 'alice', email: 'alice@acme.example' }];
  queries = [];
  const res = await post('/register', { business_name: 'Evil', email: ' Alice@ACME.example ', password: 'x', name: 'M' });
  assert.equal(res.status, 409);
  assert.equal(queries.some(q => q.table === 'tenants'), false);
});

test('registration normalizes the owner email', async () => {
  staffRows = [];
  queries = [];
  const res = await post('/register', { business_name: 'New', email: ' Bob@Example.COM ', password: 'x', name: 'B' });
  assert.equal(res.status, 201);
  assert.equal(queries.find(q => q.table === 'staff' && q.op === 'insert').payload.email, 'bob@example.com');
});

test('unknown staff emails get the same 401 as wrong passwords', async () => {
  staffRows = [];
  const res = await post('/staff/login', { email: 'nobody@example.com', password: 'x' });
  assert.equal(res.status, 401);
  assert.deepEqual(await res.json(), { error: 'Invalid credentials' });
});

test('createStaff stores the email normalized', async () => {
  queries = [];
  let status;
  await createStaff({ body: { name: 'C', email: ' Carol@X.io', password: 'x' }, staff: { tenant_id: 't' } },
    { status(code) { status = code; return this; }, json() {} });
  assert.equal(status, 201);
  assert.equal(queries.find(q => q.op === 'insert').payload.email, 'carol@x.io');
});
