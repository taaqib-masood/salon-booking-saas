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

const BRANCH_FIELDS = ['name', 'phone', 'email', 'address', 'working_hours', 'holidays', 'is_active'];
const pickBranchFields = (body = {}) =>
  Object.fromEntries(BRANCH_FIELDS.filter(key => key in body).map(key => [key, body[key]]));
const LIMIT_ERROR = { error: 'Branch limit reached for your plan' };

export async function createBranch(req, res) {
  const tenant_id = req.staff.tenant_id;
  const [{ data: tenant, error: tenantError }, { count, error: countError }] = await Promise.all([
    supabase.from('tenants').select('branch_limit').eq('id', tenant_id).single(),
    supabase.from('branches').select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenant_id).eq('is_deleted', false),
  ]);
  if (tenantError || !tenant || countError) return res.status(400).json({ error: 'Could not verify branch limit' });
  if (count >= tenant.branch_limit) return res.status(403).json(LIMIT_ERROR);

  const { data, error } = await supabase
    .from('branches')
    .insert({ ...pickBranchFields(req.body), tenant_id })
    .select()
    .single();

  // The DB trigger (migration 004) closes the race between the count above and this insert.
  if (error?.message === 'branch_limit_reached') return res.status(403).json(LIMIT_ERROR);
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
}

export async function updateBranch(req, res) {
  const { data, error } = await supabase
    .from('branches')
    .update(pickBranchFields(req.body))
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
