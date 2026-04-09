import { supabase } from '../lib/supabase.js';

export async function getBalance(req, res) {
  const customer_id = req.staff?.id || req.body.customer_id;
  const tenant_id = req.staff.tenant_id;

  const { data, error } = await supabase
    .from('customers')
    .select('loyalty_points,total_spent,visit_count')
    .eq('id', customer_id)
    .eq('tenant_id', tenant_id)
    .single();

  if (error || !data) return res.status(404).json({ error: 'Customer not found' });
  res.json(data);
}

export async function getTransactions(req, res) {
  const customer_id = req.query.customer_id || req.staff.id;

  const { data, error } = await supabase
    .from('loyalty_transactions')
    .select('*')
    .eq('customer_id', customer_id)
    .eq('tenant_id', req.staff.tenant_id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}

export async function redeemPoints(req, res) {
  const { customer_id, points, description } = req.body;
  const tenant_id = req.staff.tenant_id;

  const { data: customer, error: fetchErr } = await supabase
    .from('customers')
    .select('loyalty_points')
    .eq('id', customer_id)
    .eq('tenant_id', tenant_id)
    .single();

  if (fetchErr || !customer) return res.status(404).json({ error: 'Customer not found' });
  if (customer.loyalty_points < points) return res.status(400).json({ error: 'Insufficient points' });

  const newBalance = customer.loyalty_points - points;

  const [updateRes, txnRes] = await Promise.all([
    supabase.from('customers').update({ loyalty_points: newBalance }).eq('id', customer_id),
    supabase.from('loyalty_transactions').insert({
      tenant_id, customer_id, points: -points, type: 'redeem',
      description: description || 'Points redeemed', balance: newBalance,
    }),
  ]);

  if (updateRes.error) return res.status(400).json({ error: updateRes.error.message });
  res.json({ message: 'Redeemed', new_balance: newBalance });
}
