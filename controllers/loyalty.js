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

const MAX_REDEEM_POINTS = 1_000_000;

export async function redeemPoints(req, res) {
  const { customer_id, points, description } = req.body;
  const tenant_id = req.staff.tenant_id;

  if (!Number.isInteger(points) || points <= 0 || points > MAX_REDEEM_POINTS) {
    return res.status(400).json({ error: 'points must be a positive integer' });
  }

  const { data: newBalance, error } = await supabase.rpc('redeem_loyalty_points', {
    p_tenant_id: tenant_id, p_customer_id: customer_id, p_points: points,
    p_description: description || 'Points redeemed',
  });

  if (error) return res.status(400).json({ error: error.message });
  if (newBalance === null) return res.status(400).json({ error: 'Customer not found or insufficient points' });
  res.json({ message: 'Redeemed', new_balance: newBalance });
}
