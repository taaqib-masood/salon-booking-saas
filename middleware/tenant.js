import { supabase } from '../lib/supabase.js';

export async function resolveTenant(req, res, next) {
  const tenantId = req.headers['x-tenant-id'] || req.subdomains[0];

  if (!tenantId) {
    return res.status(403).json({ error: 'Missing X-Tenant-ID header' });
  }

  try {
    const { data: tenant, error } = await supabase
      .from('tenants')
      .select('id, name, is_active, plan_expiry')
      .eq('id', tenantId)
      .single();

    if (error || !tenant) return res.status(403).json({ error: 'Tenant not found' });
    if (!tenant.is_active) return res.status(403).json({ error: 'Tenant account is inactive' });
    if (tenant.plan_expiry && new Date() > new Date(tenant.plan_expiry)) {
      return res.status(403).json({ error: 'Tenant plan has expired' });
    }

    req.tenant = tenant;
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export function requireTenant() {
  return (req, res, next) => {
    if (!req.tenant) return res.status(403).json({ error: 'Tenant context missing' });
    next();
  };
}