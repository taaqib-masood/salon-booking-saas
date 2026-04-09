import bcrypt from 'bcryptjs';
import { supabase } from '../lib/supabase.js';

export async function getStaff(req, res) {
  const { branch_id, role, active } = req.query;
  let query = supabase
    .from('staff')
    .select('id,name,email,phone,role,specialties,commission_rate,working_days,is_active,branch_id,branches(name)')
    .eq('tenant_id', req.staff.tenant_id)
    .eq('is_deleted', false);

  if (branch_id) query = query.eq('branch_id', branch_id);
  if (role) query = query.eq('role', role);
  if (active !== 'false') query = query.eq('is_active', true);

  const { data, error } = await query.order('name');
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}

export async function getStaffById(req, res) {
  const { data, error } = await supabase
    .from('staff')
    .select('id,name,email,phone,role,specialties,commission_rate,working_days,is_active,branch_id')
    .eq('id', req.params.id)
    .eq('tenant_id', req.staff.tenant_id)
    .eq('is_deleted', false)
    .single();

  if (error || !data) return res.status(404).json({ error: 'Staff not found' });
  res.json(data);
}

export async function createStaff(req, res) {
  const { password, ...fields } = req.body;
  const password_hash = await bcrypt.hash(password, 10);

  const { data, error } = await supabase
    .from('staff')
    .insert({ ...fields, password_hash, tenant_id: req.staff.tenant_id })
    .select('id,name,email,role,is_active')
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
}

export async function updateStaff(req, res) {
  const { password, password_hash, tenant_id, ...fields } = req.body;
  if (password) fields.password_hash = await bcrypt.hash(password, 10);

  const { data, error } = await supabase
    .from('staff')
    .update(fields)
    .eq('id', req.params.id)
    .eq('tenant_id', req.staff.tenant_id)
    .select('id,name,email,role,is_active')
    .single();

  if (error || !data) return res.status(404).json({ error: 'Staff not found' });
  res.json(data);
}

export async function deleteStaff(req, res) {
  const { error } = await supabase
    .from('staff')
    .update({ is_deleted: true, is_active: false })
    .eq('id', req.params.id)
    .eq('tenant_id', req.staff.tenant_id);

  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Deleted' });
}

export async function getStaffSchedule(req, res) {
  const { date } = req.query;
  const { data, error } = await supabase
    .from('appointments')
    .select('time_slot,end_time,status,customers(name)')
    .eq('staff_id', req.params.id)
    .eq('tenant_id', req.staff.tenant_id)
    .eq('date', date || new Date().toISOString().split('T')[0]);

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}
