import { supabase } from '../lib/supabase.js';

export async function createAppointment(req, res) {
  const tenant_id = req.staff.tenant_id;
  const { branch_id, staff_id, service_id, customer_id, date, time_slot, end_time,
    subtotal, vat_amount, total_amount, discount_amount, discount_ref,
    payment_method, notes, is_guest, guest } = req.body;

  const { data, error } = await supabase
    .from('appointments')
    .insert({ tenant_id, branch_id, staff_id, service_id, customer_id, date,
      time_slot, end_time, subtotal, vat_amount, total_amount, discount_amount,
      discount_ref, payment_method, notes, is_guest, guest })
    .select('*, customers(name,phone), staff(name), services(name_en,price,duration), branches(name)')
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
}

export async function getAllAppointments(req, res) {
  const tenant_id = req.staff.tenant_id;
  const { date, branch_id, status, staff_id, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('appointments')
    .select('*, customers(name,phone), staff(name), services(name_en,price), branches(name)', { count: 'exact' })
    .eq('tenant_id', tenant_id)
    .order('date', { ascending: false })
    .order('time_slot', { ascending: false })
    .range(offset, offset + limit - 1);

  if (date) query = query.eq('date', date);
  if (branch_id) query = query.eq('branch_id', branch_id);
  if (status) query = query.eq('status', status);
  if (staff_id) query = query.eq('staff_id', staff_id);

  const { data, error, count } = await query;
  if (error) return res.status(400).json({ error: error.message });
  res.json({ data, total: count, page: +page, limit: +limit });
}

export async function getOneAppointment(req, res) {
  const { data, error } = await supabase
    .from('appointments')
    .select('*, customers(name,phone,email), staff(name,role), services(name_en,price,duration), branches(name,address)')
    .eq('id', req.params.id)
    .eq('tenant_id', req.staff.tenant_id)
    .single();

  if (error || !data) return res.status(404).json({ error: 'Appointment not found' });
  res.json(data);
}

export async function updateStatus(req, res) {
  const { status, cancellation_reason } = req.body;
  const update = { status };
  if (status === 'cancelled' && cancellation_reason) update.cancellation_reason = cancellation_reason;

  const { data, error } = await supabase
    .from('appointments')
    .update(update)
    .eq('id', req.params.id)
    .eq('tenant_id', req.staff.tenant_id)
    .select()
    .single();

  if (error || !data) return res.status(404).json({ error: 'Appointment not found' });
  res.json(data);
}

export async function rescheduleAppointment(req, res) {
  const { date, time_slot, end_time, staff_id } = req.body;

  const { data, error } = await supabase
    .from('appointments')
    .update({ date, time_slot, end_time, ...(staff_id && { staff_id }), status: 'confirmed' })
    .eq('id', req.params.id)
    .eq('tenant_id', req.staff.tenant_id)
    .select()
    .single();

  if (error || !data) return res.status(404).json({ error: 'Appointment not found' });
  res.json(data);
}

export async function cancelAppointment(req, res) {
  const { data, error } = await supabase
    .from('appointments')
    .update({ status: 'cancelled' })
    .eq('id', req.params.id)
    .eq('tenant_id', req.staff.tenant_id)
    .select()
    .single();

  if (error || !data) return res.status(404).json({ error: 'Appointment not found' });
  res.json({ message: 'Cancelled', data });
}
