import cron from 'node-cron';
import { supabase } from '../lib/supabase.js';
import twilio from 'twilio';

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

async function sendDailySummary() {
  const today = new Date().toISOString().split('T')[0];

  // Fetch all tenants with an owner phone
  const { data: owners } = await supabase
    .from('staff')
    .select('id,name,phone,tenant_id')
    .eq('role', 'owner')
    .eq('is_active', true)
    .eq('is_deleted', false)
    .not('phone', 'is', null);

  if (!owners?.length) return;

  for (const owner of owners) {
    const { data: appts } = await supabase
      .from('appointments')
      .select('status,total_amount')
      .eq('tenant_id', owner.tenant_id)
      .eq('date', today);

    if (!appts?.length) continue;

    const total      = appts.length;
    const completed  = appts.filter(a => a.status === 'completed').length;
    const cancelled  = appts.filter(a => a.status === 'cancelled').length;
    const pending    = appts.filter(a => ['confirmed','pending'].includes(a.status)).length;
    const revenue    = appts
      .filter(a => a.status === 'completed')
      .reduce((s, a) => s + (a.total_amount || 0), 0);

    const message =
      `📊 *La Maison — Daily Summary (${today})*\n\n` +
      `📅 Total Appointments: ${total}\n` +
      `✅ Completed: ${completed}\n` +
      `⏳ Pending/Confirmed: ${pending}\n` +
      `❌ Cancelled: ${cancelled}\n` +
      `💰 Revenue: AED ${revenue.toFixed(0)}\n\n` +
      `— La Maison Admin`;

    try {
      await client.messages.create({
        from: 'whatsapp:+14155238886',
        to:   `whatsapp:${owner.phone}`,
        body: message,
      });
      console.log(`Daily summary sent to ${owner.name} (${owner.phone})`);
    } catch (err) {
      console.error(`Failed to send summary to ${owner.phone}:`, err.message);
    }
  }
}

// Runs at 9:00 PM Dubai time (UTC+4 → 17:00 UTC)
export function startDailySummaryJob() {
  cron.schedule('0 17 * * *', sendDailySummary, { timezone: 'UTC' });
  console.log('Daily summary cron scheduled (9 PM Dubai / 5 PM UTC).');
}
