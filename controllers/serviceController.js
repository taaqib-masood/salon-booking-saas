import { supabase } from '../lib/supabase.js';

function buildImageUrl(service) {
  if (service.image_slug && process.env.CLOUDINARY_CLOUD_NAME) {
    return `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/w_800,q_auto,f_auto/salon-services/${service.image_slug}`;
  }
  return service.image_url || null;
}

export async function getServices(req, res) {
  // Try staff tenant ID first, fallback to public header
  const tenant_id = req.staff?.tenant_id || req.headers['x-tenant-id'];
  const { branch_id, category_id, active } = req.query;

  let query = supabase
    .from('services')
    .select('*, service_categories(name_en,name_ar,icon)')
    .eq('is_deleted', false);

  if (tenant_id) query = query.eq('tenant_id', tenant_id);

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
  res.json(data.map(s => ({ ...s, image_url: buildImageUrl(s) })));
}

export async function getServiceById(req, res) {
  const tenant_id = req.staff?.tenant_id || req.headers['x-tenant-id'];
  
  let query = supabase
    .from('services')
    .select('*, service_categories(name_en,name_ar)')
    .eq('id', req.params.id)
    .eq('is_deleted', false);
    
  if (tenant_id) {
    query = query.eq('tenant_id', tenant_id);
  }

  const { data, error } = await query.single();

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
