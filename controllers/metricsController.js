import { supabase } from '../lib/supabase.js';

export async function getMetrics(req, res) {
  const tenant_id = req.staff.tenant_id;
  const today = new Date().toISOString().split('T')[0];

  const [appts, customers, staff] = await Promise.all([
    supabase
      .from('appointments')
      .select('status', { count: 'exact', head: false })
      .eq('tenant_id', tenant_id)
      .eq('date', today),
    supabase
      .from('customers')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenant_id)
      .eq('is_deleted', false),
    supabase
      .from('staff')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenant_id)
      .eq('is_deleted', false),
  ]);

  const apptData = appts.data || [];
  res.json({
    today_appointments: apptData.length,
    today_completed: apptData.filter(a => a.status === 'completed').length,
    today_cancelled: apptData.filter(a => a.status === 'cancelled').length,
    total_customers: customers.count ?? 0,
    total_staff: staff.count ?? 0,
  });
}

export async function getHealth(req, res) {
  const { error } = await supabase.from('tenants').select('id').limit(1);
  if (error) return res.status(503).json({ status: 'unhealthy', error: error.message });
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
}
