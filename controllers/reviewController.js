import { supabase } from '../lib/supabase.js';

const ReviewController = {
  async createReview(req, res) {
    const { appointment_id, rating, comment } = req.body;
    const tenant_id = req.staff?.tenant_id || req.customer?.tenant_id;

    const { data: appt } = await supabase
      .from('appointments')
      .select('id,customer_id,staff_id,service_id,branch_id,status')
      .eq('id', appointment_id)
      .eq('tenant_id', tenant_id)
      .single();

    if (!appt) return res.status(404).json({ error: 'Appointment not found' });
    if (appt.status !== 'completed') return res.status(400).json({ error: 'Can only review completed appointments' });

    const { data, error } = await supabase
      .from('reviews')
      .insert({
        tenant_id,
        appointment_id,
        customer_id: appt.customer_id,
        staff_id: appt.staff_id,
        service_id: appt.service_id,
        branch_id: appt.branch_id,
        rating,
        comment,
      })
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data);
  },

  async getReviews(req, res) {
    const tenant_id = req.staff?.tenant_id;
    const { staff_id, service_id, branch_id } = req.query;

    let query = supabase
      .from('reviews')
      .select('*, customers(name), staff(name), services(name_en)')
      .eq('tenant_id', tenant_id)
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    if (staff_id) query = query.eq('staff_id', staff_id);
    if (service_id) query = query.eq('service_id', service_id);
    if (branch_id) query = query.eq('branch_id', branch_id);

    const { data, error } = await query;
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  },

  async getReviewById(req, res) {
    const { data, error } = await supabase
      .from('reviews')
      .select('*, customers(name), staff(name), services(name_en)')
      .eq('id', req.params.id)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Review not found' });
    res.json(data);
  },

  async unpublishReview(req, res) {
    const { error } = await supabase
      .from('reviews')
      .update({ is_published: false })
      .eq('id', req.params.id)
      .eq('tenant_id', req.staff.tenant_id);

    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: 'Unpublished' });
  },
};

export default ReviewController;
