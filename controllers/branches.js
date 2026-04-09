import { supabase } from '../lib/supabase.js';

export async function getBranches(req, res) {
  const { data, error } = await supabase
    .from('branches')
    .select('*')
    .eq('tenant_id', req.staff.tenant_id)
    .eq('is_deleted', false)
    .order('name');

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}

export async function getBranchById(req, res) {
  const { data, error } = await supabase
    .from('branches')
    .select('*')
    .eq('id', req.params.id)
    .eq('tenant_id', req.staff.tenant_id)
    .eq('is_deleted', false)
    .single();

  if (error || !data) return res.status(404).json({ error: 'Branch not found' });
  res.json(data);
}

export async function createBranch(req, res) {
  const { data, error } = await supabase
    .from('branches')
    .insert({ ...req.body, tenant_id: req.staff.tenant_id })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
}

export async function updateBranch(req, res) {
  const { tenant_id, ...fields } = req.body;
  const { data, error } = await supabase
    .from('branches')
    .update(fields)
    .eq('id', req.params.id)
    .eq('tenant_id', req.staff.tenant_id)
    .select()
    .single();

  if (error || !data) return res.status(404).json({ error: 'Branch not found' });
  res.json(data);
}

export async function deleteBranch(req, res) {
  const { error } = await supabase
    .from('branches')
    .update({ is_deleted: true, is_active: false })
    .eq('id', req.params.id)
    .eq('tenant_id', req.staff.tenant_id);

  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Deleted' });
}

export async function checkAvailability(req, res) {
  const { staff_id, date, service_id } = req.query;

  const { data: booked } = await supabase
    .from('appointments')
    .select('time_slot,end_time')
    .eq('staff_id', staff_id)
    .eq('date', date)
    .eq('tenant_id', req.staff.tenant_id)
    .not('status', 'in', '("cancelled","no_show")');

  res.json({ booked_slots: booked || [] });
}
