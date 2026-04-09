import { supabase } from '../lib/supabase.js';

export async function getServices(req, res) {
  const tenant_id = req.staff.tenant_id;
  const { branch_id, category_id, active } = req.query;

  let query = supabase
    .from('services')
    .select('*, service_categories(name_en,name_ar,icon)')
    .eq('tenant_id', tenant_id)
    .eq('is_deleted', false);

  if (active !== 'false') query = query.eq('is_active', true);
  if (category_id) query = query.eq('category_id', category_id);

  if (branch_id) {
    const { data: svcIds } = await supabase
      .from('service_branches')
      .select('service_id')
      .eq('branch_id', branch_id);
    const ids = (svcIds || []).map(r => r.service_id);
    if (!ids.length) return res.json([]);
    query = query.in('id', ids);
  }

  const { data, error } = await query.order('name_en');
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}

export async function getServiceById(req, res) {
  const { data, error } = await supabase
    .from('services')
    .select('*, service_categories(name_en,name_ar)')
    .eq('id', req.params.id)
    .eq('tenant_id', req.staff.tenant_id)
    .eq('is_deleted', false)
    .single();

  if (error || !data) return res.status(404).json({ error: 'Service not found' });
  res.json(data);
}

export async function createService(req, res) {
  const tenant_id = req.staff.tenant_id;
  const { branches = [], ...fields } = req.body;

  const { data, error } = await supabase
    .from('services')
    .insert({ ...fields, tenant_id })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });

  if (branches.length) {
    await supabase.from('service_branches').insert(
      branches.map(branch_id => ({ service_id: data.id, branch_id }))
    );
  }

  res.status(201).json(data);
}

export async function updateService(req, res) {
  const { branches, ...fields } = req.body;

  const { data, error } = await supabase
    .from('services')
    .update(fields)
    .eq('id', req.params.id)
    .eq('tenant_id', req.staff.tenant_id)
    .select()
    .single();

  if (error || !data) return res.status(404).json({ error: 'Service not found' });

  if (branches) {
    await supabase.from('service_branches').delete().eq('service_id', data.id);
    if (branches.length) {
      await supabase.from('service_branches').insert(
        branches.map(branch_id => ({ service_id: data.id, branch_id }))
      );
    }
  }

  res.json(data);
}

export async function deleteService(req, res) {
  const { error } = await supabase
    .from('services')
    .update({ is_deleted: true, is_active: false })
    .eq('id', req.params.id)
    .eq('tenant_id', req.staff.tenant_id);

  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Deleted' });
}
