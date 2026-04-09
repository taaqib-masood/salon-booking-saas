import { supabase } from '../lib/supabase.js';

export async function getWebhooks(req, res) {
  const { data, error } = await supabase
    .from('webhooks')
    .select('*')
    .eq('tenant_id', req.staff.tenant_id)
    .order('created_at', { ascending: false });

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}

export async function createWebhook(req, res) {
  const { data, error } = await supabase
    .from('webhooks')
    .insert({ ...req.body, tenant_id: req.staff.tenant_id })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
}

export async function updateWebhook(req, res) {
  const { data, error } = await supabase
    .from('webhooks')
    .update(req.body)
    .eq('id', req.params.id)
    .eq('tenant_id', req.staff.tenant_id)
    .select()
    .single();

  if (error || !data) return res.status(404).json({ error: 'Webhook not found' });
  res.json(data);
}

export async function deleteWebhook(req, res) {
  const { error } = await supabase
    .from('webhooks')
    .update({ is_active: false })
    .eq('id', req.params.id)
    .eq('tenant_id', req.staff.tenant_id);

  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Webhook deactivated' });
}

export async function getWebhookDeliveries(req, res) {
  const { data, error } = await supabase
    .from('webhook_deliveries')
    .select('*, webhooks(url,event)')
    .eq('webhooks.tenant_id', req.staff.tenant_id)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}
