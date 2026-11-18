import { supabase } from '../lib/supabase.js';

const isAdminRole = role => ['owner', 'admin', 'manager'].includes(role);

async function staffInTenant(staffId, tenantId) {
  const { data } = await supabase
    .from('staff')
    .select('id')
    .eq('id', staffId)
    .eq('tenant_id', tenantId)
    .single();
  return !!data;
}

// GET /api/v1/staff-breaks — returns breaks for the logged-in staff member
export async function getMyBreaks(req, res) {
  const { data, error } = await supabase
    .from('staff_breaks')
    .select('*')
    .eq('staff_id', req.staff.id)
    .order('created_at', { ascending: false });
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}

// GET /api/v1/staff-breaks/:staff_id — admin view of any staff member's breaks
export async function getBreaksByStaff(req, res) {
  if (!await staffInTenant(req.params.staff_id, req.staff.tenant_id)) {
    return res.status(404).json({ error: 'Staff not found' });
  }
  const { data, error } = await supabase
    .from('staff_breaks')
    .select('*')
    .eq('staff_id', req.params.staff_id)
    .order('created_at', { ascending: false });
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}

// POST /api/v1/staff-breaks
export async function createBreak(req, res) {
  const { break_type, day_of_week, specific_date, start_time, end_time, label, staff_id: bodyStaffId } = req.body;
  if (!break_type || !start_time || !end_time) {
    return res.status(400).json({ error: 'break_type, start_time, end_time are required' });
  }
  if (break_type === 'recurring' && day_of_week === undefined) {
    return res.status(400).json({ error: 'day_of_week required for recurring breaks' });
  }
  if (break_type === 'one_time' && !specific_date) {
    return res.status(400).json({ error: 'specific_date required for one-time breaks' });
  }

  // Admins/owners/managers can create breaks for other staff by passing staff_id in body
  const staff_id = (isAdminRole(req.staff.role) && bodyStaffId) ? bodyStaffId : req.staff.id;
  if (staff_id !== req.staff.id && !await staffInTenant(staff_id, req.staff.tenant_id)) {
    return res.status(404).json({ error: 'Staff not found' });
  }

  const { data, error } = await supabase
    .from('staff_breaks')
    .insert({ staff_id, break_type, day_of_week, specific_date, start_time, end_time, label: label || 'Break' })
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
}

// DELETE /api/v1/staff-breaks/:id
export async function deleteBreak(req, res) {
  // Staff can only delete own; admins can delete any within tenant
  let lookup = supabase
    .from('staff_breaks')
    .select('id, staff!inner(tenant_id)')
    .eq('id', req.params.id)
    .eq('staff.tenant_id', req.staff.tenant_id);
  if (!isAdminRole(req.staff.role)) lookup = lookup.eq('staff_id', req.staff.id);
  const { data: existing } = await lookup.single();
  if (!existing) return res.status(404).json({ error: 'Break not found' });

  const { error } = await supabase.from('staff_breaks').delete().eq('id', existing.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Deleted' });
}
