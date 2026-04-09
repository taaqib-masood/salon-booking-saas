import { supabase } from '../lib/supabase.js';

export async function getNotifications(req, res) {
  const { status, channel, customer_id } = req.query;
  let query = supabase
    .from('notifications')
    .select('*, customers(name,phone)')
    .eq('tenant_id', req.staff.tenant_id)
    .order('created_at', { ascending: false })
    .limit(100);

  if (status) query = query.eq('status', status);
  if (channel) query = query.eq('channel', channel);
  if (customer_id) query = query.eq('customer_id', customer_id);

  const { data, error } = await query;
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}

export async function createNotification(req, res) {
  const { data, error } = await supabase
    .from('notifications')
    .insert({ ...req.body, tenant_id: req.staff.tenant_id })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
}

export async function markSent(req, res) {
  const { data, error } = await supabase
    .from('notifications')
    .update({ status: 'sent', sent_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .eq('tenant_id', req.staff.tenant_id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}
