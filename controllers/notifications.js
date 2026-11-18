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
  const tenantId = req.staff.tenant_id;
  const { type, channel, customer_id: customerId, appointment_id: appointmentId,
    scheduled_at: scheduledAt, payload } = req.body;

  for (const [table, id] of [['customers', customerId], ['appointments', appointmentId]]) {
    if (!id) continue;
    const { data: owned } = await supabase.from(table).select('id').eq('id', id).eq('tenant_id', tenantId).single();
    if (!owned) return res.status(400).json({ error: `${table === 'customers' ? 'Customer' : 'Appointment'} not found for this tenant` });
  }

  const { data, error } = await supabase
    .from('notifications')
    .insert({ type, channel, customer_id: customerId, appointment_id: appointmentId,
      scheduled_at: scheduledAt, payload, tenant_id: tenantId })
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
