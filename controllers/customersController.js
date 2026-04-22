import { supabase } from '../lib/supabase.js';
import { decrypt } from '../utils/encryption.js';

// ── Decrypt helpers ───────────────────────────────────────────────────────────
function dec(row) {
  if (!row) return row;
  return {
    ...row,
    name:  decrypt(row.name),
    phone: decrypt(row.phone),
    email: decrypt(row.email),
  };
}
const decAll = rows => (rows || []).map(dec);

// ── Controllers ───────────────────────────────────────────────────────────────

export async function getCustomers(req, res) {
  const { data, error } = await supabase
    .from('customers')
    .select('id,name,phone,email,loyalty_points,total_spent,visit_count,preferred_language,created_at')
    .eq('tenant_id', req.staff.tenant_id)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });

  if (error) return res.status(400).json({ error: error.message });
  res.json(decAll(data));
}

export async function getCustomerById(req, res) {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', req.params.id)
    .eq('tenant_id', req.staff.tenant_id)
    .eq('is_deleted', false)
    .single();

  if (error || !data) return res.status(404).json({ error: 'Customer not found' });
  res.json(dec(data));
}

export async function getAppointmentsByCustomerId(req, res) {
  const { data, error } = await supabase
    .from('appointments')
    .select('*, services(name_en), staff(name), branches(name)')
    .eq('customer_id', req.params.id)
    .eq('tenant_id', req.staff.tenant_id)
    .order('date', { ascending: false });

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}

export async function updateCustomerProfile(req, res) {
  const { password_hash, tenant_id, ...fields } = req.body;

  const { data, error } = await supabase
    .from('customers')
    .update(fields)
    .eq('id', req.params.id)
    .eq('tenant_id', req.staff.tenant_id)
    .select()
    .single();

  if (error || !data) return res.status(404).json({ error: 'Customer not found' });
  res.json(dec(data));
}

export async function deleteCustomer(req, res) {
  const { error } = await supabase
    .from('customers')
    .update({ is_deleted: true })
    .eq('id', req.params.id)
    .eq('tenant_id', req.staff.tenant_id);

  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Deleted' });
}

export async function getLoyaltyBalance(req, res) {
  const { data: customer, error } = await supabase
    .from('customers')
    .select('loyalty_points,total_spent,visit_count,name,phone,email')
    .eq('id', req.params.id)
    .eq('tenant_id', req.staff.tenant_id)
    .single();

  if (error || !customer) return res.status(404).json({ error: 'Customer not found' });

  const { data: txns } = await supabase
    .from('loyalty_transactions')
    .select('points,type,description,balance,created_at')
    .eq('customer_id', req.params.id)
    .order('created_at', { ascending: false })
    .limit(20);

  res.json({ ...dec(customer), recent_transactions: txns || [] });
}
