import { supabase } from '../lib/supabase.js';

export async function getOffers(req, res) {
  const { data, error } = await supabase
    .from('offers')
    .select('*')
    .eq('tenant_id', req.staff.tenant_id)
    .order('created_at', { ascending: false });

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}

export async function createOffer(req, res) {
  const { applicable_services = [], ...fields } = req.body;

  const { data, error } = await supabase
    .from('offers')
    .insert({ ...fields, tenant_id: req.staff.tenant_id })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });

  if (applicable_services.length) {
    await supabase.from('offer_services').insert(
      applicable_services.map(service_id => ({ offer_id: data.id, service_id }))
    );
  }

  res.status(201).json(data);
}

export async function updateOffer(req, res) {
  const { applicable_services, ...fields } = req.body;

  const { data, error } = await supabase
    .from('offers')
    .update(fields)
    .eq('id', req.params.id)
    .eq('tenant_id', req.staff.tenant_id)
    .select()
    .single();

  if (error || !data) return res.status(404).json({ error: 'Offer not found' });

  if (applicable_services) {
    await supabase.from('offer_services').delete().eq('offer_id', data.id);
    if (applicable_services.length) {
      await supabase.from('offer_services').insert(
        applicable_services.map(service_id => ({ offer_id: data.id, service_id }))
      );
    }
  }

  res.json(data);
}

export async function deleteOffer(req, res) {
  const { error } = await supabase
    .from('offers')
    .update({ is_active: false })
    .eq('id', req.params.id)
    .eq('tenant_id', req.staff.tenant_id);

  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Deactivated' });
}

export async function validateOffer(req, res) {
  const { code, amount, service_id } = req.body;
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('offers')
    .select('*, offer_services(service_id)')
    .eq('tenant_id', req.staff.tenant_id)
    .eq('code', code.toUpperCase())
    .eq('is_active', true)
    .lte('valid_from', now)
    .gte('valid_to', now)
    .single();

  if (error || !data) return res.status(404).json({ error: 'Invalid or expired offer code' });
  if (data.used_count >= data.max_uses) return res.status(400).json({ error: 'Offer usage limit reached' });
  if (amount < data.min_order_amount) return res.status(400).json({ error: `Minimum order amount is ${data.min_order_amount} AED` });

  const applicableServices = data.offer_services.map(s => s.service_id);
  if (applicableServices.length && service_id && !applicableServices.includes(service_id)) {
    return res.status(400).json({ error: 'Offer not valid for this service' });
  }

  const discount = data.discount_type === 'percentage'
    ? (amount * data.discount_value) / 100
    : data.discount_value;

  res.json({ valid: true, discount: Math.min(discount, amount), offer: data });
}
