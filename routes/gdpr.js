import express from 'express';
import { supabase } from '../lib/supabase.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// GET /gdpr/export — export all customer data for this tenant
router.get('/export', authenticate, authorize('owner', 'admin'), async (req, res) => {
  try {
    const tenant_id = req.staff.tenant_id;

    const { data: customers, error } = await supabase
      .from('customers')
      .select('id, name, email, phone, created_at, loyalty_points, total_spent, visit_count')
      .eq('tenant_id', tenant_id)
      .eq('is_deleted', false);

    if (error) return res.status(400).json({ error: error.message });

    res.json({ customers, exported_at: new Date().toISOString() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
});

// DELETE /gdpr/delete — anonymize customer PII for compliance
router.delete('/delete', authenticate, authorize('owner', 'admin'), async (req, res) => {
  try {
    const { customer_id } = req.body;
    const tenant_id = req.staff.tenant_id;

    if (!customer_id) return res.status(400).json({ error: 'customer_id is required' });

    // Anonymize customer PII
    const { error: customerErr } = await supabase
      .from('customers')
      .update({ name: 'Anonymous', email: null, phone: 'REDACTED', is_deleted: true })
      .eq('id', customer_id)
      .eq('tenant_id', tenant_id);

    if (customerErr) return res.status(400).json({ error: customerErr.message });

    // Mark their appointments as deleted for audit trail
    await supabase
      .from('appointments')
      .update({ notes: 'GDPR deleted' })
      .eq('customer_id', customer_id)
      .eq('tenant_id', tenant_id);

    res.json({ message: 'Customer data anonymized and marked deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
});

export default router;