import { supabase } from '../lib/supabase.js';

// Never accept tenant_id or last_seen_at from the client; branch_id must
// belong to the caller's tenant.
const CREATE_FIELDS = ['branch_id', 'terminal_id', 'provider', 'location_id', 'is_active'];
const UPDATE_FIELDS = ['branch_id', 'provider', 'location_id', 'is_active'];
const pick = (body, fields) =>
  Object.fromEntries(fields.filter((f) => body[f] !== undefined).map((f) => [f, body[f]]));

async function ownsBranch(tenantId, branchId) {
  const { data } = await supabase
    .from('branches')
    .select('id')
    .eq('id', branchId)
    .eq('tenant_id', tenantId)
    .maybeSingle();
  return !!data;
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
  const fields = pick(req.body, CREATE_FIELDS);
  if (fields.branch_id && !(await ownsBranch(req.staff.tenant_id, fields.branch_id))) {
    return res.status(400).json({ error: 'Invalid branch_id' });
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
  const updates = pick(req.body, UPDATE_FIELDS);
  if (!Object.keys(updates).length) {
    return res.status(400).json({ error: 'No updatable fields' });
  }
  if (updates.branch_id && !(await ownsBranch(req.staff.tenant_id, updates.branch_id))) {
    return res.status(400).json({ error: 'Invalid branch_id' });
  }

  const { data, error } = await supabase
    .from('pos_terminals')
    .update(updates)
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
