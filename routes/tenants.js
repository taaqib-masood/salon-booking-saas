import express from 'express';
import { supabase } from '../lib/supabase.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// GET /tenants/:id/public — public-facing info (no auth required)
router.get('/:id/public', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('tenants')
      .select('name, settings')
      .eq('id', req.params.id)
      .single();
    if (error || !data) return res.status(404).json({ error: 'Not found' });
    const s = data.settings || {};
    res.json({
      salonName:          data.name,
      salonAddress:       s.salonAddress       || '',
      salonPhone:         s.salonPhone         || '',
      logoUrl:            s.logoUrl            || '',
      cancellationPolicy: s.cancellationPolicy || '',
      workingHours:       s.workingHours       || null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /tenants/me — current tenant info
router.get('/me', authenticate, async (req, res) => {
  try {
    const { data: tenant, error } = await supabase
      .from('tenants')
      .select('id, name, owner_email, owner_phone, is_active, plan, plan_expires_at, created_at, settings')
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
    if (settings) {
      // Merge into existing settings instead of overwriting — preserves vatRate, currency, etc.
      const { data: current } = await supabase
        .from('tenants')
        .select('settings')
        .eq('id', req.staff.tenant_id)
        .single();
      update.settings = { ...(current?.settings || {}), ...settings };
    }

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