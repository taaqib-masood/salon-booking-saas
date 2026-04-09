import { supabase } from '../lib/supabase.js';

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
  const { data, error } = await supabase
    .from('pos_terminals')
    .insert({ ...req.body, tenant_id: req.staff.tenant_id })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
}

export async function updateTerminal(req, res) {
  const { data, error } = await supabase
    .from('pos_terminals')
    .update(req.body)
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
