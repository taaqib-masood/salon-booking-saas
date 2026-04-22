/**
 * Lead Qualification Service
 * - Classifies intent + lead_score via Groq
 * - Real-time hot-lead Twilio alert to owner
 * - Conversion tracking
 * - Anti-spam follow-up guards (48h window)
 * - Follow-up + no-show BullMQ scheduling
 */
import OpenAI from 'openai';
import twilio from 'twilio';
import { supabase } from '../lib/supabase.js';
import { followupQueue } from '../utils/queue.js';
import { createLogger, maskPhone } from '../utils/logger.js';

const log = createLogger('LeadQual');

const groq = process.env.GROQ_API_KEY
  ? new OpenAI({ apiKey: process.env.GROQ_API_KEY, baseURL: 'https://api.groq.com/openai/v1' })
  : null;

const twilioClient = (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN)
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;
const TWILIO_FROM = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';

// ── Classification ────────────────────────────────────────────────────────────
const CLASSIFICATION_PROMPT = `Classify this WhatsApp message sent to a beauty salon.
Return JSON only — no explanation, no markdown.
Schema: {"intent":"booking"|"enquiry"|"other","lead_score":"hot"|"warm"|"cold"}

Definitions:
- booking   = explicitly asking to book, schedule, or confirm an appointment
- enquiry   = asking about services, prices, availability, hours, or staff
- other     = greeting only, complaint, spam, unrelated

- hot  = ready NOW, mentions specific service/date/time
- warm = interested, asking questions, likely to book soon
- cold = vague, just browsing, unlikely to convert soon

Message: `;

/**
 * Classify a message and persist to lead_interactions.
 * Returns { intent, lead_score, id } or null on failure.
 */
export async function classifyLead(phone, message, tenantId) {
  if (!groq) return null;

  try {
    const completion = await groq.chat.completions.create({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages: [{ role: 'user', content: CLASSIFICATION_PROMPT + JSON.stringify(message) }],
      max_tokens: 60,
      temperature: 0.1,
      response_format: { type: 'json_object' },
    });

    const raw    = completion.choices[0].message.content;
    const parsed = JSON.parse(raw);
    const { intent, lead_score } = parsed;

    if (!['booking', 'enquiry', 'other'].includes(intent)) return null;
    if (!['hot', 'warm', 'cold'].includes(lead_score))     return null;

    const { data: row, error } = await supabase
      .from('lead_interactions')
      .insert({ tenant_id: tenantId, phone, intent, lead_score, message: message.slice(0, 500) })
      .select('id')
      .single();

    if (error) log.warn('Failed to store lead', { error: error.message });

    log.info('Lead classified', { phone: maskPhone(phone), intent, lead_score });
    return { intent, lead_score, id: row?.id ?? null };
  } catch (err) {
    log.error('Lead classification error', { error: err.message });
    return null;
  }
}

// ── Hot Lead Alert (real-time Twilio, not queued) ─────────────────────────────
/**
 * Sends a WhatsApp message to the salon owner immediately when lead_score = "hot".
 * Fetches ownerPhone from tenants.settings — silently skips if not configured.
 */
export async function notifyHotLead(phone, message, intent, tenantId) {
  if (!twilioClient) return;

  try {
    const { data: tenant } = await supabase
      .from('tenants')
      .select('name, settings')
      .eq('id', tenantId)
      .single();

    const ownerPhone = tenant?.settings?.ownerPhone;
    if (!ownerPhone) return;

    const toWa   = ownerPhone.startsWith('whatsapp:') ? ownerPhone : `whatsapp:${ownerPhone}`;
    const body   = `🔥 *HOT LEAD — Likely to book today*\n\nCustomer: ${phone}\nMessage: "${message.slice(0, 120)}"\nIntent: ${intent}\n\nReply within 5 minutes for best chance to convert.`;

    await twilioClient.messages.create({ from: TWILIO_FROM, to: toWa, body });
    log.info('Hot lead alert sent to owner', { ownerPhone: maskPhone(ownerPhone) });
  } catch (err) {
    log.error('Hot lead alert failed', { error: err.message });
  }
}

// ── Conversion Tracking ───────────────────────────────────────────────────────
/**
 * Call this after a booking is confirmed.
 * Finds the most recent unconverted lead_interaction for the phone + tenant
 * and marks it as converted, attaching the booking_id.
 */
export async function markLeadConverted(phone, bookingId, tenantId) {
  try {
    // Find the latest unconverted interaction for this phone
    const { data: rows } = await supabase
      .from('lead_interactions')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('phone', phone)
      .eq('converted_to_booking', false)
      .order('created_at', { ascending: false })
      .limit(1);

    if (!rows?.length) return;

    await supabase
      .from('lead_interactions')
      .update({ converted_to_booking: true, booking_id: bookingId })
      .eq('id', rows[0].id);

    log.info('Lead marked converted', { phone: maskPhone(phone), bookingId });
  } catch (err) {
    log.error('markLeadConverted failed', { error: err.message });
  }
}

// ── Anti-Spam Follow-Up Guard ─────────────────────────────────────────────────
const FOLLOWUP_COOLDOWN_MS = 48 * 60 * 60 * 1000; // 48 hours

/**
 * Returns true if it's safe to send a follow-up to this phone.
 * Blocks if:
 *   (a) A follow-up was sent in the last 48 hours
 *   (b) The user sent a new message after the last follow-up was sent
 *   (c) A booking already exists for this phone in the last 7 days
 */
export async function canSendFollowup(phone, tenantId) {
  try {
    // (a) + (b): fetch most recent interaction that had a followup
    const { data: recentFollowups } = await supabase
      .from('lead_interactions')
      .select('last_followup_sent_at, created_at')
      .eq('tenant_id', tenantId)
      .eq('phone', phone)
      .not('last_followup_sent_at', 'is', null)
      .order('last_followup_sent_at', { ascending: false })
      .limit(1);

    if (recentFollowups?.length) {
      const lastSent = new Date(recentFollowups[0].last_followup_sent_at).getTime();
      // (a) cooldown check
      if (Date.now() - lastSent < FOLLOWUP_COOLDOWN_MS) {
        log.info('Followup blocked — cooldown active', { phone: maskPhone(phone) });
        return false;
      }
      // (b) did user reply after the last followup?
      const { data: recentMsg } = await supabase
        .from('lead_interactions')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('phone', phone)
        .gt('created_at', recentFollowups[0].last_followup_sent_at)
        .limit(1);

      if (recentMsg?.length) {
        log.info('Followup blocked — user replied after last followup', { phone: maskPhone(phone) });
        return false;
      }
    }

    // (c) existing booking check (guest.phone field in JSONB)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const { data: bookings } = await supabase
      .from('appointments')
      .select('id')
      .eq('tenant_id', tenantId)
      .gte('date', sevenDaysAgo)
      .contains('guest', { phone })
      .in('status', ['confirmed', 'pending', 'completed'])
      .limit(1);

    if (bookings?.length) {
      log.info('Followup blocked — active booking exists', { phone: maskPhone(phone) });
      return false;
    }

    return true;
  } catch (err) {
    log.error('canSendFollowup check failed', { error: err.message });
    return false; // fail safe — don't spam on error
  }
}

// ── Follow-Up Scheduling ──────────────────────────────────────────────────────
/**
 * Schedule 24h enquiry follow-up (deduplicated by jobId).
 * Skips if spam guard blocks it.
 */
export async function scheduleEnquiryFollowup(phone, tenantId) {
  const allowed = await canSendFollowup(phone, tenantId);
  if (!allowed) return;

  const jobId = `enquiry:${tenantId}:${phone.replace(/\D/g, '')}`;
  await followupQueue.add(
    'enquiry_24h',
    { phone, tenant_id: tenantId, type: 'enquiry_24h' },
    { delay: 24 * 60 * 60 * 1000, jobId, removeOnComplete: true, removeOnFail: { count: 10 } }
  );
  log.info('Enquiry follow-up scheduled', { phone: maskPhone(phone) });
}

/**
 * Cancel pending enquiry follow-up (called when booking is confirmed).
 */
export async function cancelEnquiryFollowup(phone, tenantId) {
  const jobId = `enquiry:${tenantId}:${phone.replace(/\D/g, '')}`;
  try {
    const job = await followupQueue.getJob(jobId);
    if (job) {
      await job.remove();
      log.info('Cancelled enquiry follow-up', { phone: maskPhone(phone) });
    }
  } catch (_) { /* already processed or gone */ }
}

/**
 * Schedule no-show follow-up 30 min after appointment start time.
 */
export async function scheduleNoShowFollowup(phone, bookingId, appointmentDatetimeISO, serviceInfo) {
  const apptMs = new Date(appointmentDatetimeISO).getTime();
  const delay  = Math.max(60_000, apptMs + 30 * 60_000 - Date.now());
  const jobId  = `noshow:${bookingId}`;

  await followupQueue.add(
    'no_show',
    { phone, booking_id: bookingId, service: serviceInfo.service, staff: serviceInfo.staff, type: 'no_show' },
    { delay, jobId, removeOnComplete: true, removeOnFail: { count: 5 } }
  );
  log.info('No-show follow-up scheduled', { bookingId, delayMin: Math.round(delay / 60000) });
}

/**
 * Schedule a delayed upsell WhatsApp (sent separately from booking confirmation).
 */
export async function scheduleUpsell(phone, upsellMessage) {
  const delay = 3000 + Math.floor(Math.random() * 2000); // 3–5 seconds
  await followupQueue.add(
    'upsell:send',
    { phone, message: upsellMessage, type: 'upsell:send' },
    { delay, removeOnComplete: true, removeOnFail: { count: 3 } }
  );
  log.info('Upsell job scheduled', { phone: maskPhone(phone), delayMs: delay });
}
