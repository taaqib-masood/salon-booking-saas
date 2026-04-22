import cron from 'node-cron';
import { supabase } from '../lib/supabase.js';
import { sendReminder } from '../utils/whatsapp.js';

export const startReminderJob = () => {
  // Runs every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    console.log('[Reminders] Running reminder job...');

    const now = new Date();

    // Fetch all active tenants with their reminder settings
    const { data: tenants, error: tenantErr } = await supabase
      .from('tenants')
      .select('id, settings')
      .eq('is_active', true);

    if (tenantErr) { console.error('[Reminders] Failed to fetch tenants:', tenantErr.message); return; }

    for (const tenant of (tenants || [])) {
      const reminderHours = tenant.settings?.reminderHours ?? 2;
      const cutoff = new Date(now.getTime() + reminderHours * 60 * 60 * 1000);

      const nowDate    = now.toISOString().split('T')[0];
      const cutoffDate = cutoff.toISOString().split('T')[0];

      const { data: appointments, error } = await supabase
        .from('appointments')
        .select('id, date, time_slot, guest, customers(name, phone), services(name_en)')
        .eq('tenant_id', tenant.id)
        .eq('status', 'confirmed')
        .eq('reminder_sent', false)
        .gte('date', nowDate)
        .lte('date', cutoffDate);

      if (error) { console.error(`[Reminders] Tenant ${tenant.id}:`, error.message); continue; }

      for (const apt of (appointments || [])) {
        // Verify appointment falls within the exact window
        const apptDt = new Date(`${apt.date}T${apt.time_slot}:00`);
        if (apptDt < now || apptDt > cutoff) continue;

        try {
          const customerName = apt.customers?.name || apt.guest?.name || 'Valued Customer';
          const phone = apt.customers?.phone || apt.guest?.phone;

          if (!phone) { console.warn(`[Reminders] No phone for ${apt.id}, skipping.`); continue; }

          await sendReminder(phone, {
            customerName,
            serviceName: apt.services?.name_en || 'your appointment',
            date: apt.date,
            timeSlot: apt.time_slot,
          });

          await supabase.from('appointments').update({ reminder_sent: true }).eq('id', apt.id);
          console.log(`[Reminders] Sent to ${customerName} for ${apt.date} at ${apt.time_slot}`);
        } catch (err) {
          console.error(`[Reminders] Failed for ${apt.id}:`, err.message);
        }
      }
    }
  });
};
