import { supabase } from '../lib/supabase.js';

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
  const isAdmin = ['owner', 'admin', 'manager'].includes(req.staff.role);
  const staff_id = (isAdmin && bodyStaffId) ? bodyStaffId : req.staff.id;

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
  const isAdmin = ['owner', 'admin', 'manager'].includes(req.staff.role);
  let query = supabase.from('staff_breaks').delete().eq('id', req.params.id);
  // Staff can only delete own; admins can delete any within tenant
  if (!isAdmin) query = query.eq('staff_id', req.staff.id);
  const { error } = await query;
  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Deleted' });
}
