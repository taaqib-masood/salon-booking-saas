import express from 'express';
import { supabase } from '../lib/supabase.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// GET /categories — public, list all for a tenant
router.get('/', async (req, res) => {
  try {
    // tenant_id from header for public endpoints
    const tenant_id = req.headers['x-tenant-id'];
    let query = supabase.from('service_categories').select('id, name_en, name_ar, icon');
    if (tenant_id) query = query.eq('tenant_id', tenant_id);

    const { data, error } = await query.order('name_en');
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /categories/:id
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('service_categories')
      .select('id, name_en, name_ar, icon')
      .eq('id', req.params.id)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Category not found' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /categories — admin only
router.post('/', authenticate, authorize('owner', 'admin'), async (req, res) => {
  try {
    const { name_en, name_ar, icon } = req.body;
    const { data, error } = await supabase
      .from('service_categories')
      .insert({ tenant_id: req.staff.tenant_id, name_en, name_ar, icon })
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /categories/:id — admin only
router.put('/:id', authenticate, authorize('owner', 'admin'), async (req, res) => {
  try {
    const { name_en, name_ar, icon } = req.body;
    const { data, error } = await supabase
      .from('service_categories')
      .update({ name_en, name_ar, icon })
      .eq('id', req.params.id)
      .eq('tenant_id', req.staff.tenant_id)
      .select()
      .single();

    if (error || !data) return res.status(404).json({ error: 'Category not found' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /categories/:id — admin only
router.delete('/:id', authenticate, authorize('owner', 'admin'), async (req, res) => {
  try {
    const { error } = await supabase
      .from('service_categories')
      .delete()
      .eq('id', req.params.id)
      .eq('tenant_id', req.staff.tenant_id);

    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;