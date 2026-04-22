import { supabase } from '../lib/supabase.js';

export async function getRevenueAnalytics(req, res) {
  const { from, to, branch_id } = req.query;
  const tenant_id = req.staff.tenant_id;

  let query = supabase
    .from('appointments')
    .select('total_amount,vat_amount,discount_amount,status,date,branch_id')
    .eq('tenant_id', tenant_id)
    .gte('date', from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
    .lte('date', to || new Date().toISOString().split('T')[0]);

  if (branch_id) query = query.eq('branch_id', branch_id);

  const { data, error } = await query;
  if (error) return res.status(400).json({ error: error.message });

  const completed = data.filter(a => a.status === 'completed');
  const grossRevenue = completed.reduce((s, a) => s + (a.total_amount || 0), 0);
  const totalVat = completed.reduce((s, a) => s + (a.vat_amount || 0), 0);
  const totalDiscount = completed.reduce((s, a) => s + (a.discount_amount || 0), 0);

  res.json({
    total_appointments: data.length,
    completed: completed.length,
    cancelled: data.filter(a => a.status === 'cancelled').length,
    no_shows: data.filter(a => a.status === 'no_show').length,
    gross_revenue: grossRevenue,
    total_vat: totalVat,
    total_discount: totalDiscount,
    net_revenue: grossRevenue - totalVat,
    avg_ticket: completed.length ? grossRevenue / completed.length : 0,
  });
}

export async function getAppointmentAnalytics(req, res) {
  const { from, to } = req.query;
  const tenant_id = req.staff.tenant_id;

  const { data, error } = await supabase
    .from('appointments')
    .select('status,date,branch_id,branches(name)')
    .eq('tenant_id', tenant_id)
    .gte('date', from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
    .lte('date', to || new Date().toISOString().split('T')[0]);

  if (error) return res.status(400).json({ error: error.message });

  const byStatus = data.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {});

  res.json({ total: data.length, by_status: byStatus });
}

export async function getStaffCommission(req, res) {
  const { from, to } = req.query;
  const tenant_id = req.staff.tenant_id;

  const { data, error } = await supabase
    .from('appointments')
    .select('total_amount,staff_id,staff(name,commission_rate)')
    .eq('tenant_id', tenant_id)
    .eq('status', 'completed')
    .gte('date', from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
    .lte('date', to || new Date().toISOString().split('T')[0]);

  if (error) return res.status(400).json({ error: error.message });

  const byStaff = {};
  for (const a of data) {
    const id = a.staff_id;
    if (!byStaff[id]) byStaff[id] = { name: a.staff?.name, revenue: 0, commission: 0 };
    byStaff[id].revenue += a.total_amount || 0;
    byStaff[id].commission += (a.total_amount || 0) * (a.staff?.commission_rate || 0) / 100;
  }

  res.json(Object.values(byStaff));
}

export async function getTopServices(req, res) {
  const { from, to, limit = 10 } = req.query;
  const tenant_id = req.staff.tenant_id;

  const { data, error } = await supabase
    .from('appointments')
    .select('service_id,total_amount,services(name_en)')
    .eq('tenant_id', tenant_id)
    .eq('status', 'completed')
    .gte('date', from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
    .lte('date', to || new Date().toISOString().split('T')[0]);

  if (error) return res.status(400).json({ error: error.message });

  const byService = {};
  for (const a of data) {
    const id = a.service_id;
    if (!byService[id]) byService[id] = { name: a.services?.name_en, count: 0, revenue: 0 };
    byService[id].count += 1;
    byService[id].revenue += a.total_amount || 0;
  }

  res.json(Object.values(byService).sort((a, b) => b.count - a.count).slice(0, +limit));
}

export async function getCustomerSummary(req, res) {
  const { data, error } = await supabase
    .from('customers')
    .select('id,name,total_spent,visit_count,loyalty_points')
    .eq('tenant_id', req.staff.tenant_id)
    .eq('is_deleted', false)
    .order('total_spent', { ascending: false })
    .limit(20);

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}

// GET /api/v1/analytics/staff/performance
export async function getStaffPerformance(req, res) {
  const { from, to } = req.query;
  const tenant_id = req.staff.tenant_id;
  const fromDate = from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const toDate   = to   || new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('appointments')
    .select('staff_id,status,total_amount,staff(name,role,photo_url)')
    .eq('tenant_id', tenant_id)
    .gte('date', fromDate)
    .lte('date', toDate);

  if (error) return res.status(400).json({ error: error.message });

  const byStaff = {};
  for (const a of data) {
    const id = a.staff_id || '__unassigned__';
    if (!byStaff[id]) byStaff[id] = {
      staff_id:   id,
      name:       a.staff?.name || 'Unassigned',
      role:       a.staff?.role || '—',
      photo_url:  a.staff?.photo_url || null,
      total:      0,
      completed:  0,
      cancelled:  0,
      no_show:    0,
      revenue:    0,
    };
    byStaff[id].total++;
    if (a.status === 'completed') { byStaff[id].completed++; byStaff[id].revenue += a.total_amount || 0; }
    if (a.status === 'cancelled') byStaff[id].cancelled++;
    if (a.status === 'no_show')   byStaff[id].no_show++;
  }

  const result = Object.values(byStaff).map(s => ({
    ...s,
    completion_rate: s.total ? Math.round((s.completed / s.total) * 100) : 0,
  })).sort((a, b) => b.revenue - a.revenue);

  res.json(result);
}

// GET /api/v1/analytics/guest-conversion
export async function getGuestConversion(req, res) {
  const { from, to } = req.query;
  const tenant_id = req.staff.tenant_id;
  const fromDate = from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const toDate   = to   || new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('appointments')
    .select('is_guest,customer_id,status,total_amount,date,source')
    .eq('tenant_id', tenant_id)
    .gte('date', fromDate)
    .lte('date', toDate);

  if (error) return res.status(400).json({ error: error.message });

  const guests     = data.filter(a => a.is_guest);
  const registered = data.filter(a => !a.is_guest);

  // Unique guest customer IDs that later appear as registered (rough conversion signal)
  const registeredIds = new Set(registered.map(a => a.customer_id).filter(Boolean));
  const convertedGuests = guests.filter(a => a.customer_id && registeredIds.has(a.customer_id));

  const guestRevenue = guests.filter(a => a.status === 'completed').reduce((s, a) => s + (a.total_amount || 0), 0);
  const regRevenue   = registered.filter(a => a.status === 'completed').reduce((s, a) => s + (a.total_amount || 0), 0);

  // Source breakdown (website, whatsapp, walkin, etc.)
  const bySource = data.reduce((acc, a) => {
    const src = a.source || 'direct';
    if (!acc[src]) acc[src] = { total: 0, revenue: 0 };
    acc[src].total++;
    if (a.status === 'completed') acc[src].revenue += a.total_amount || 0;
    return acc;
  }, {});

  res.json({
    period: { from: fromDate, to: toDate },
    total_appointments:   data.length,
    guest_bookings:       guests.length,
    registered_bookings:  registered.length,
    converted_guests:     convertedGuests.length,
    conversion_rate:      guests.length ? Math.round((convertedGuests.length / guests.length) * 100) : 0,
    guest_revenue:        guestRevenue,
    registered_revenue:   regRevenue,
    by_source:            bySource,
  });
}

// GET /api/v1/analytics/ai-performance
export async function getAIPerformance(req, res) {
  const tenant_id = req.staff.tenant_id;
  const { from, to } = req.query;
  const fromDate = from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const toDate   = to   || new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('lead_interactions')
    .select('intent, lead_score, converted_to_booking, last_followup_sent_at, booking_id')
    .eq('tenant_id', tenant_id)
    .gte('created_at', fromDate)
    .lte('created_at', toDate + 'T23:59:59Z');

  if (error) return res.status(400).json({ error: error.message });

  const total           = data.length;
  const hot_leads       = data.filter(r => r.lead_score === 'hot').length;
  const warm_leads      = data.filter(r => r.lead_score === 'warm').length;
  const cold_leads      = data.filter(r => r.lead_score === 'cold').length;
  const converted       = data.filter(r => r.converted_to_booking).length;
  const conversion_rate = total ? +((converted / total) * 100).toFixed(1) : 0;

  // Recovered = enquiry leads that got a follow-up AND later converted
  const recovered_bookings = data.filter(
    r => r.intent === 'enquiry' && r.last_followup_sent_at && r.converted_to_booking
  ).length;

  // Follow-up conversions: any lead that had a followup sent AND converted
  const followup_conversions = data.filter(
    r => r.last_followup_sent_at && r.converted_to_booking
  ).length;

  // AI-generated revenue: sum total_amount from appointments linked to converted leads
  const convertedBookingIds = data
    .filter(r => r.converted_to_booking && r.booking_id)
    .map(r => r.booking_id);

  let ai_generated_revenue = 0;
  if (convertedBookingIds.length) {
    const { data: appts } = await supabase
      .from('appointments')
      .select('total_amount')
      .in('id', convertedBookingIds);
    ai_generated_revenue = +(appts || []).reduce((s, a) => s + (a.total_amount || 0), 0).toFixed(2);
  }

  // Actionable: current-state counts (no date filter — "right now")
  const [{ count: hot_leads_pending }, { count: followups_pending }] = await Promise.all([
    supabase
      .from('lead_interactions')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenant_id)
      .eq('lead_score', 'hot')
      .eq('converted_to_booking', false)
      .then(r => ({ count: r.count ?? 0 })),
    supabase
      .from('lead_interactions')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenant_id)
      .eq('intent', 'enquiry')
      .eq('converted_to_booking', false)
      .is('last_followup_sent_at', null)
      .then(r => ({ count: r.count ?? 0 })),
  ]);

  const by_intent = data.reduce((acc, r) => {
    if (!acc[r.intent]) acc[r.intent] = { total: 0, converted: 0 };
    acc[r.intent].total++;
    if (r.converted_to_booking) acc[r.intent].converted++;
    return acc;
  }, {});

  res.json({
    period: { from: fromDate, to: toDate },
    total_leads: total,
    hot_leads,
    warm_leads,
    cold_leads,
    converted_leads: converted,
    conversion_rate,
    followup_conversions,
    recovered_bookings,
    ai_generated_revenue,
    hot_leads_pending,
    followups_pending,
    by_intent,
  });
}
