import express from 'express';
import { supabase } from '../lib/supabase.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// GET /tenants/me — current tenant info
router.get('/me', authenticate, async (req, res) => {
  try {
    const { data: tenant, error } = await supabase
      .from('tenants')
      .select('id, name, email, phone, is_active, created_at')
      .eq('id', req.staff.tenant_id)
      .single();

    if (error || !tenant) return res.status(404).json({ error: 'Tenant not found' });

    const { data: subscription } = await supabase
      .from('tenant_subscriptions')
      .select('plan, status, starts_at, ends_at')
      .eq('tenant_id', req.staff.tenant_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    res.json({ tenant, subscription: subscription || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /tenants/me/settings — update tenant settings
router.put('/me/settings', authenticate, authorize('owner', 'admin'), async (req, res) => {
  try {
    const { name, phone, settings } = req.body;
    const update = {};
    if (name) update.name = name;
    if (phone) update.phone = phone;
    if (settings) update.settings = settings;

    const { data, error } = await supabase
      .from('tenants')
      .update(update)
      .eq('id', req.staff.tenant_id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: 'Settings updated', tenant: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /tenants/me/usage — usage stats for this tenant
router.get('/me/usage', authenticate, async (req, res) => {
  try {
    const tenant_id = req.staff.tenant_id;

    const [{ count: branches }, { count: staff }, { count: bookings }] = await Promise.all([
      supabase.from('branches').select('id', { count: 'exact', head: true }).eq('tenant_id', tenant_id),
      supabase.from('staff').select('id', { count: 'exact', head: true }).eq('tenant_id', tenant_id).eq('is_deleted', false),
      supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('tenant_id', tenant_id),
    ]);

    res.json({ branches: branches || 0, staff: staff || 0, bookings: bookings || 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;