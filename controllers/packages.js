import { supabase } from '../lib/supabase.js';

export async function getPackages(req, res) {
  const { data, error } = await supabase
    .from('packages')
    .select('*, package_services(service_id, services(name_en,duration))')
    .eq('tenant_id', req.staff.tenant_id)
    .eq('is_active', true);

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}

export async function createPackage(req, res) {
  const { services = [], ...fields } = req.body;

  const { data, error } = await supabase
    .from('packages')
    .insert({ ...fields, tenant_id: req.staff.tenant_id })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });

  if (services.length) {
    await supabase.from('package_services').insert(
      services.map(service_id => ({ package_id: data.id, service_id }))
    );
  }

  res.status(201).json(data);
}

export async function updatePackage(req, res) {
  const { services, ...fields } = req.body;
  const { data, error } = await supabase
    .from('packages')
    .update(fields)
    .eq('id', req.params.id)
    .eq('tenant_id', req.staff.tenant_id)
    .select()
    .single();

  if (error || !data) return res.status(404).json({ error: 'Package not found' });
  res.json(data);
}

export async function purchasePackage(req, res) {
  const { customer_id, package_id } = req.body;
  const tenant_id = req.staff.tenant_id;

  const { data: pkg } = await supabase
    .from('packages')
    .select('total_sessions,validity_days,price')
    .eq('id', package_id)
    .eq('tenant_id', tenant_id)
    .single();

  if (!pkg) return res.status(404).json({ error: 'Package not found' });

  const expires_at = new Date(Date.now() + pkg.validity_days * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('customer_packages')
    .insert({
      tenant_id, customer_id, package_id,
      sessions_left: pkg.total_sessions,
      purchased_at: new Date().toISOString(),
      expires_at,
      is_active: true,
    })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
}

export async function getMyPackages(req, res) {
  const customer_id = req.query.customer_id;
  const { data, error } = await supabase
    .from('customer_packages')
    .select('*, packages(name,total_sessions,validity_days)')
    .eq('customer_id', customer_id)
    .eq('tenant_id', req.staff.tenant_id)
    .eq('is_active', true)
    .gt('sessions_left', 0);

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}

export async function useSession(req, res) {
  const { data: cp } = await supabase
    .from('customer_packages')
    .select('sessions_left')
    .eq('id', req.params.id)
    .eq('tenant_id', req.staff.tenant_id)
    .single();

  if (!cp || cp.sessions_left < 1) return res.status(400).json({ error: 'No sessions left' });

  const { data, error } = await supabase
    .from('customer_packages')
    .update({ sessions_left: cp.sessions_left - 1, ...(cp.sessions_left === 1 && { is_active: false }) })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}
