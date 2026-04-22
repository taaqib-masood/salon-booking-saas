import { supabase } from '../lib/supabase.js';

const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

// GET /api/v1/staff-schedules/me — staff views own schedule
export async function getMySchedule(req, res) {
  const { data, error } = await supabase
    .from('staff_schedules')
    .select('*')
    .eq('staff_id', req.staff.id)
    .order('day_of_week');
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}

// PUT /api/v1/staff-schedules/me — staff updates own working hours
export async function updateMySchedule(req, res) {
  const staff_id = req.staff.id;
  const rows = req.body;
  if (!Array.isArray(rows)) return res.status(400).json({ error: 'Body must be array of schedule rows' });

  const { error: delErr } = await supabase.from('staff_schedules').delete().eq('staff_id', staff_id);
  if (delErr) return res.status(400).json({ error: delErr.message });
  if (rows.length === 0) return res.json([]);

  const { data, error } = await supabase
    .from('staff_schedules')
    .insert(rows.map(r => ({ ...r, staff_id })))
    .select();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}

export async function getStaffSchedule(req, res) {
  const staff_id = req.params.staff_id;
  const { data, error } = await supabase
    .from('staff_schedules')
    .select('*')
    .eq('staff_id', staff_id)
    .order('day_of_week');

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}

export async function upsertStaffSchedule(req, res) {
  const staff_id = req.params.staff_id;
  const rows = req.body; // array of schedule rows

  if (!Array.isArray(rows)) return res.status(400).json({ error: 'Body must be an array of schedule rows' });

  // Delete existing and reinsert (simple upsert pattern)
  const { error: delErr } = await supabase
    .from('staff_schedules')
    .delete()
    .eq('staff_id', staff_id);

  if (delErr) return res.status(400).json({ error: delErr.message });

  if (rows.length === 0) return res.json([]);

  const { data, error } = await supabase
    .from('staff_schedules')
    .insert(rows.map(r => ({ ...r, staff_id })))
    .select();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}

export async function getAllSchedules(req, res) {
  const tenant_id = req.staff.tenant_id;

  const { data, error } = await supabase
    .from('staff_schedules')
    .select('*, staff(name, role)')
    .eq('staff.tenant_id', tenant_id)
    .order('staff_id')
    .order('day_of_week');

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}
