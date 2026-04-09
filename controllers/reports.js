import { supabase } from '../lib/supabase.js';

export async function getReports(req, res) {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('tenant_id', req.staff.tenant_id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}

export async function createReport(req, res) {
  const { data, error } = await supabase
    .from('reports')
    .insert({
      ...req.body,
      tenant_id: req.staff.tenant_id,
      requested_by: req.staff.id,
      status: 'pending',
    })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
}

export async function getReportById(req, res) {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('id', req.params.id)
    .eq('tenant_id', req.staff.tenant_id)
    .single();

  if (error || !data) return res.status(404).json({ error: 'Report not found' });
  res.json(data);
}

export async function updateReportStatus(req, res) {
  const { status, file_url } = req.body;

  const { data, error } = await supabase
    .from('reports')
    .update({ status, ...(file_url && { file_url }), ...(status === 'completed' && { completed_at: new Date().toISOString() }) })
    .eq('id', req.params.id)
    .eq('tenant_id', req.staff.tenant_id)
    .select()
    .single();

  if (error || !data) return res.status(404).json({ error: 'Report not found' });
  res.json(data);
}
