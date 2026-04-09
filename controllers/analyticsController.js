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
