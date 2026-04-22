import express from 'express';
import { DEFAULT_TENANT_ID } from '../lib/defaults.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../lib/supabase.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

// Staff login
router.post('/staff/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const { data: staff, error } = await supabase
    .from('staff')
    .select('id, name, email, role, tenant_id, branch_id, password_hash, is_deleted')
    .eq('email', email.toLowerCase())
    .eq('is_deleted', false)
    .single();

  if (error || !staff) return res.status(401).json({ error: 'Invalid credentials' });

  const valid = await bcrypt.compare(password, staff.password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign(
    { id: staff.id, tenant_id: staff.tenant_id, role: staff.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    token,
    staff: { id: staff.id, name: staff.name, email: staff.email, role: staff.role, tenant_id: staff.tenant_id },
  });
});

// Tenant register (creates tenant + owner staff account)
router.post('/register', async (req, res) => {
  const { business_name, email, password, name, phone } = req.body;
  if (!business_name || !email || !password || !name) {
    return res.status(400).json({ error: 'business_name, email, password, name required' });
  }

  const slug = business_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36);

  const { data: tenant, error: tenantErr } = await supabase
    .from('tenants')
    .insert({
      name: business_name,
      slug,
      owner_email: email,
      owner_name: name,
      owner_phone: phone || null,
      is_active: true
    })
    .select()
    .single();

  if (tenantErr) return res.status(400).json({ error: tenantErr.message });

  const password_hash = await bcrypt.hash(password, 10);

  const { data: staff, error: staffErr } = await supabase
    .from('staff')
    .insert({ tenant_id: tenant.id, name, email: email.toLowerCase(), password_hash, role: 'admin' })
    .select('id, name, email, role, tenant_id')
    .single();

  if (staffErr) return res.status(400).json({ error: staffErr.message });

  const token = jwt.sign(
    { id: staff.id, tenant_id: staff.tenant_id, role: staff.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.status(201).json({ token, tenant, staff });
});

// Customer register (self-service)
router.post('/customer/register', async (req, res) => {
  const { name, phone, email, password } = req.body;
  if (!name || !phone || !email || !password) {
    return res.status(400).json({ error: 'name, phone, email, and password are required' });
  }

  // Use the La Maison tenant by default for public sign-ups
  const TENANT_ID = DEFAULT_TENANT_ID;

  const password_hash = await bcrypt.hash(password, 10);

  const { data: customer, error } = await supabase
    .from('customers')
    .insert({ tenant_id: TENANT_ID, name, phone, email: email.toLowerCase(), password_hash })
    .select('id, name, phone, email, tenant_id')
    .single();

  if (error) return res.status(400).json({ error: error.message });

  const token = jwt.sign(
    { id: customer.id, tenant_id: customer.tenant_id, type: 'customer' },
    JWT_SECRET,
    { expiresIn: '30d' }
  );

  res.status(201).json({ token, customer });
});

// Customer login by phone
router.post('/customer/login', async (req, res) => {
  const { phone, password } = req.body;
  if (!phone || !password) return res.status(400).json({ error: 'Phone and password required' });

  const { data: customer, error } = await supabase
    .from('customers')
    .select('id, name, phone, email, tenant_id, password_hash, is_deleted')
    .eq('phone', phone)
    .eq('is_deleted', false)
    .single();

  if (error || !customer) return res.status(401).json({ error: 'Invalid credentials' });

  const valid = await bcrypt.compare(password, customer.password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ id: customer.id, tenant_id: customer.tenant_id, type: 'customer' }, JWT_SECRET, { expiresIn: '30d' });
  res.json({ token, customer: { id: customer.id, name: customer.name, phone: customer.phone } });
});

export default router;
