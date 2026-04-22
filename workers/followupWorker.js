/**
 * Follow-up Worker
 * Handles: enquiry_24h | no_show | upsell:send
 *
 * Anti-spam: enquiry_24h re-checks guard before sending.
 * Upsell: fires as a separate delayed message (3–5s after booking confirmation).
 */
import { Worker } from 'bullmq';
import twilio from 'twilio';
import { bullConnection } from '../utils/redis.js';
import { supabase } from '../lib/supabase.js';
import { createLogger, maskPhone } from '../utils/logger.js';
import { canSendFollowup } from '../services/leadQualification.js';

const log = createLogger('FollowupWorker');

const twilioClient = (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN)
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;
const FROM = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';

async function sendWA(to, body) {
  if (!twilioClient) {
    log.warn('Twilio not configured — skipping follow-up send');
    return;
  }
  const toWa = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
  await twilioClient.messages.create({ from: FROM, to: toWa, body });
}

// ── Worker ────────────────────────────────────────────────────────────────────
const followupWorker = new Worker(
  'followup',
  async (job) => {
    const { type, phone, booking_id, service, staff, tenant_id, message } = job.data;
    log.info('Processing follow-up job', { type, phone: maskPhone(phone), attempt: job.attemptsMade + 1 });

    // ── Enquiry 24h nudge ─────────────────────────────────────────────────────
    if (type === 'enquiry_24h') {
      // Re-check spam guard at send time (conditions may have changed since scheduling)
      const allowed = await canSendFollowup(phone, tenant_id);
      if (!allowed) {
        log.info('Enquiry follow-up cancelled by guard at send time', { phone: maskPhone(phone) });
        return;
      }

      await sendWA(
        phone,
        `Hi! 👋 It's Leila from La Maison.\n\nYou were asking about our services earlier — did you get a chance to decide? 😊\n\nI can check availability and book you right now if you're ready. Just reply here!`
      );

      // Record that we sent a follow-up (for 48h cooldown tracking)
      await supabase
        .from('lead_interactions')
        .update({ last_followup_sent_at: new Date().toISOString() })
        .eq('tenant_id', tenant_id)
        .eq('phone', phone)
        .order('created_at', { ascending: false })
        .limit(1);

      log.info('Enquiry follow-up sent', { phone: maskPhone(phone) });
      return;
    }

    // ── No-show re-engagement ─────────────────────────────────────────────────
    if (type === 'no_show') {
      // Skip if appointment was completed or already cancelled
      const { data: appt } = await supabase
        .from('appointments')
        .select('status')
        .eq('id', booking_id)
        .single();

      if (appt?.status === 'completed' || appt?.status === 'cancelled') {
        log.info('No-show follow-up skipped — appointment already closed', { booking_id, status: appt.status });
        return;
      }

      await sendWA(
        phone,
        `Hi! 🌸 It's Leila from La Maison.\n\nWe missed you for your *${service}* with ${staff} today. Hope everything's okay!\n\nWould you like to reschedule? I'll find you the next available slot right away.`
      );

      // Mark no_show — guard against overwriting completed status
      await supabase
        .from('appointments')
        .update({ status: 'no_show' })
        .eq('id', booking_id)
        .in('status', ['confirmed', 'pending']);

      log.info('No-show follow-up sent', { phone: maskPhone(phone), booking_id });
      return;
    }

    // ── Delayed upsell send ───────────────────────────────────────────────────
    if (type === 'upsell:send') {
      await sendWA(phone, message);
      log.info('Upsell message sent', { phone: maskPhone(phone) });
      return;
    }

    log.warn('Unknown follow-up type', { type });
  },
  { connection: bullConnection, concurrency: 5 }
);

followupWorker.on('failed', (job, err) => {
  log.error('Follow-up job failed', {
    jobId: job?.id,
    type: job?.data?.type,
    phone: maskPhone(job?.data?.phone),
    error: err.message,
  });
});

export { followupWorker };
