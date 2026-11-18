import { supabase } from '../lib/supabase.js';

const TERMINAL_FIELDS = ['terminal_id', 'provider', 'location_id', 'is_active', 'branch_id'];

function pickTerminalFields(body = {}) {
  return Object.fromEntries(TERMINAL_FIELDS.filter(key => key in body).map(key => [key, body[key]]));
}

async function branchInTenant(branchId, tenantId) {
  const { data } = await supabase
    .from('branches')
    .select('id')
    .eq('id', branchId)
    .eq('tenant_id', tenantId)
    .eq('is_deleted', false)
    .single();
  return Boolean(data);
}

export async function getTerminals(req, res) {
  const { data, error } = await supabase
    .from('pos_terminals')
    .select('*')
    .eq('tenant_id', req.staff.tenant_id)
    .order('created_at', { ascending: false });

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}

export async function createTerminal(req, res) {
  const fields = pickTerminalFields(req.body);
  if (!(await branchInTenant(fields.branch_id, req.staff.tenant_id))) {
    return res.status(400).json({ error: 'Invalid branch' });
  }

  const { data, error } = await supabase
    .from('pos_terminals')
    .insert({ ...fields, tenant_id: req.staff.tenant_id })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
}

export async function updateTerminal(req, res) {
  const fields = pickTerminalFields(req.body);
  if ('branch_id' in fields && !(await branchInTenant(fields.branch_id, req.staff.tenant_id))) {
    return res.status(400).json({ error: 'Invalid branch' });
  }

  const { data, error } = await supabase
    .from('pos_terminals')
    .update(fields)
    .eq('id', req.params.id)
    .eq('tenant_id', req.staff.tenant_id)
    .select()
    .single();

  if (error || !data) return res.status(404).json({ error: 'Terminal not found' });
  res.json(data);
}

export async function deleteTerminal(req, res) {
  const { error } = await supabase
    .from('pos_terminals')
    .delete()
    .eq('id', req.params.id)
    .eq('tenant_id', req.staff.tenant_id);

  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Terminal deleted' });
}
