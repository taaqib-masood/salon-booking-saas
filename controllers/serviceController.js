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
  if (!tenant_id) return res.status(400).json({ error: 'Tenant context required' });
  const { branch_id, category_id, active } = req.query;

  let query = supabase
    .from('services')
    .select('*, service_categories(name_en,name_ar,icon)')
    .eq('is_deleted', false);

  query = query.eq('tenant_id', tenant_id);

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
  if (!tenant_id) return res.status(400).json({ error: 'Tenant context required' });
  
  let query = supabase
    .from('services')
    .select('*, service_categories(name_en,name_ar)')
    .eq('id', req.params.id)
    .eq('is_deleted', false);
    
  query = query.eq('tenant_id', tenant_id);

  const { data, error } = await query.single();

  if (error || !data) return res.status(404).json({ error: 'Service not found' });
  res.json(data);
}

const SERVICE_FIELDS = ['category_id', 'name_en', 'name_ar', 'description_en', 'description_ar',
  'duration', 'price', 'vat_inclusive', 'is_active'];
const MAX_DURATION_MINUTES = 600;

async function parseServiceInput(body, tenant_id, creating) {
  const fields = Object.fromEntries(SERVICE_FIELDS.filter(key => body[key] !== undefined).map(key => [key, body[key]]));
  if (creating || fields.duration !== undefined) {
    const duration = Number(fields.duration);
    if (!Number.isInteger(duration) || duration < 1 || duration > MAX_DURATION_MINUTES) {
      return { error: `duration must be a whole number of minutes from 1 to ${MAX_DURATION_MINUTES}` };
    }
    fields.duration = duration;
  }

  let { branches } = body;
  if (branches !== undefined) {
    if (!Array.isArray(branches) || branches.some(id => typeof id !== 'string')) {
      return { error: 'branches must be an array of branch IDs' };
    }
    branches = [...new Set(branches)];
  }

  if (fields.category_id) {
    const { data } = await supabase.from('service_categories').select('id')
      .eq('id', fields.category_id).eq('tenant_id', tenant_id).single();
    if (!data) return { error: 'Category not found' };
  }
  if (branches?.length) {
    const { data, error } = await supabase.from('branches').select('id')
      .in('id', branches).eq('tenant_id', tenant_id);
    if (error || (data || []).length !== branches.length) return { error: 'Branch not found' };
  }
  return { fields, branches };
}

export async function createService(req, res) {
  const tenant_id = req.staff.tenant_id;
  const { fields, branches = [], error: inputError } = await parseServiceInput(req.body, tenant_id, true);
  if (inputError) return res.status(400).json({ error: inputError });

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
  const { fields, branches, error: inputError } = await parseServiceInput(req.body, req.staff.tenant_id, false);
  if (inputError) return res.status(400).json({ error: inputError });

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
