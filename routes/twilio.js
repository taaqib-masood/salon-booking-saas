import express from 'express';
import OpenAI from 'openai';
import twilio from 'twilio';
import { supabase } from '../lib/supabase.js';
import { DEFAULT_TENANT_ID, DEFAULT_BRANCH_ID } from '../lib/defaults.js';
import { createLogger } from '../utils/logger.js';
import {
  classifyLead,
  notifyHotLead,
  markLeadConverted,
  scheduleEnquiryFollowup,
  cancelEnquiryFollowup,
  scheduleNoShowFollowup,
  scheduleUpsell,
} from '../services/leadQualification.js';
import { getUpsell } from '../config/upsells.js';

const router = express.Router();
const log    = createLogger('Concierge');
const { MessagingResponse } = twilio.twiml;

const openai = process.env.GROQ_API_KEY
  ? new OpenAI({ apiKey: process.env.GROQ_API_KEY, baseURL: 'https://api.groq.com/openai/v1' })
  : null;

// In-memory conversation history — key: phone number
const conversationState = new Map();

// ── Tool: Check availability ──────────────────────────────────────────────────
async function checkStaffAvailability({ date, staff_name }) {
  let query = supabase
    .from('appointments')
    .select('time_slot, end_time, status, staff(name), services(name_en, duration)')
    .eq('tenant_id', DEFAULT_TENANT_ID)
    .eq('date', date)
    .in('status', ['confirmed', 'pending'])
    .order('time_slot', { ascending: true });

  if (staff_name) {
    const { data: staffRows } = await supabase
      .from('staff')
      .select('id')
      .eq('tenant_id', DEFAULT_TENANT_ID)
      .ilike('name', `%${staff_name}%`);

    if (staffRows?.length) {
      query = query.in('staff_id', staffRows.map((s) => s.id));
    }
  }

  const { data: appointments, error } = await query;
  if (error) return { error: error.message };

  if (!appointments?.length) {
    return { date, staff_name: staff_name || 'All staff', busy_slots: [], message: 'Fully available — no bookings found for this date.' };
  }

  return {
    date,
    staff_name: staff_name || 'All staff',
    busy_slots: appointments.map((apt) => ({
      time: apt.time_slot,
      until: apt.end_time || null,
      staff: apt.staff?.name || 'Unknown',
      service: apt.services?.name_en || 'Appointment',
    })),
  };
}

// ── Tool: Create appointment ──────────────────────────────────────────────────
async function createAppointment({ service_name, staff_name, date, time_slot, customer_name, customer_phone }) {
  // Look up service
  const { data: services, error: svcErr } = await supabase
    .from('services')
    .select('id, name_en, price, duration')
    .eq('tenant_id', DEFAULT_TENANT_ID)
    .ilike('name_en', `%${service_name}%`)
    .limit(1);

  if (svcErr || !services?.length) return { error: `Service "${service_name}" not found. Available: Royal Caviar Facial, Balayage & Color Correction, 24K Gold Manicure, Signature Silk Blowout.` };
  const service = services[0];

  // Look up staff
  const { data: staffRows, error: staffErr } = await supabase
    .from('staff')
    .select('id, name')
    .eq('tenant_id', DEFAULT_TENANT_ID)
    .ilike('name', `%${staff_name}%`)
    .limit(1);

  if (staffErr || !staffRows?.length) return { error: `Staff member "${staff_name}" not found.` };
  const staff = staffRows[0];

  // Check slot isn't already taken
  const { data: conflict } = await supabase
    .from('appointments')
    .select('id')
    .eq('tenant_id', DEFAULT_TENANT_ID)
    .eq('staff_id', staff.id)
    .eq('date', date)
    .eq('time_slot', time_slot)
    .in('status', ['confirmed', 'pending'])
    .limit(1);

  if (conflict?.length) return { error: `${staff.name} is already booked at ${time_slot} on ${date}. Please choose a different time.` };

  // Calculate end time
  const [h, m] = time_slot.split(':').map(Number);
  const endDate = new Date(2000, 0, 1, h, m + (service.duration || 60));
  const end_time = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`;

  const price = service.price || 0;
  const vat   = +(price * 0.05).toFixed(2);
  const total = +(price + vat).toFixed(2);

  // Insert appointment
  const { data, error } = await supabase
    .from('appointments')
    .insert({
      tenant_id: DEFAULT_TENANT_ID,
      branch_id: DEFAULT_BRANCH_ID,
      service_id: service.id,
      staff_id: staff.id,
      date,
      time_slot,
      end_time,
      is_guest: true,
      guest: { name: customer_name, phone: customer_phone },
      subtotal: price,
      vat_amount: vat,
      total_amount: total,
      status: 'confirmed',
    })
    .select('id')
    .single();

  if (error) return { error: error.message };

  return {
    success: true,
    booking_id: data.id,
    service: service.name_en,
    staff: staff.name,
    date,
    time: time_slot,
    total: `AED ${total}`,
  };
}

// ── Tool definitions ──────────────────────────────────────────────────────────
const tools = [
  {
    type: 'function',
    function: {
      name: 'check_staff_availability',
      description: 'Check which time slots are already booked for a given date (and optionally a specific staff member). Use this when the customer asks about availability.',
      parameters: {
        type: 'object',
        properties: {
          date: { type: 'string', description: 'Date in YYYY-MM-DD format.' },
          staff_name: { type: 'string', description: 'Optional staff first name. Omit to check all staff.' },
        },
        required: ['date'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_appointment',
      description: 'Book an appointment for the customer. Call this only after you have confirmed: service name, staff name, date, and time with the customer.',
      parameters: {
        type: 'object',
        properties: {
          service_name: { type: 'string', description: 'Name of the service (e.g. "Royal Caviar Facial").' },
          staff_name:   { type: 'string', description: 'Name of the staff member.' },
          date:         { type: 'string', description: 'Date in YYYY-MM-DD format.' },
          time_slot:    { type: 'string', description: 'Time in HH:MM format (24h).' },
          customer_name:{ type: 'string', description: 'Full name of the customer.' },
        },
        required: ['service_name', 'staff_name', 'date', 'time_slot', 'customer_name'],
      },
    },
  },
];

// ── Webhook ───────────────────────────────────────────────────────────────────
router.post('/whatsapp', async (req, res) => {
  const incomingMsg  = req.body.Body || '';
  const fromNumber   = req.body.From || '';
  const customerPhone = fromNumber.replace('whatsapp:', '');

  const twiml = new MessagingResponse();

  if (!openai) {
    twiml.message("I'm sorry, my concierge system is currently offline. Please contact the salon directly.");
    return res.type('text/xml').send(twiml.toString());
  }

  if (!conversationState.has(fromNumber)) {
    conversationState.set(fromNumber, [
      {
        role: 'system',
        content: `You are Leila, La Maison beauty concierge in Dubai. Warm, human, WhatsApp-style replies.
Date: ${new Date().toISOString().split('T')[0]}. Hours: 10AM-10PM Sun-Thu.
Services: Royal Caviar Facial, Balayage & Color Correction, 24K Gold Manicure, Signature Silk Blowout.
Customer phone: ${customerPhone}
Rules: short messages, one question at a time, light emoji, never "Certainly/Absolutely".
Booking: ask service→staff→check_staff_availability→get name→confirm details→create_appointment→share booking ID. Never promise email/SMS.`,
      },
    ]);
  }

  const history = conversationState.get(fromNumber);
  history.push({ role: 'user', content: incomingMsg });

  // ── Lead classification (async, non-blocking) ─────────────────────────────
  classifyLead(customerPhone, incomingMsg, DEFAULT_TENANT_ID)
    .then(async (result) => {
      if (!result) return;
      if (result.lead_score === 'hot') {
        await notifyHotLead(customerPhone, incomingMsg, result.intent, DEFAULT_TENANT_ID);
      }
      if (result.intent === 'enquiry') {
        await scheduleEnquiryFollowup(customerPhone, DEFAULT_TENANT_ID);
      }
    })
    .catch(() => { /* classification is best-effort */ });

  try {
    let completion = await openai.chat.completions.create({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages: history,
      tools,
      tool_choice: 'auto',
      max_tokens: 200,
      temperature: 0.7,
    });

    let responseMessage = completion.choices[0].message;

    // ── Handle tool calls (may chain) ─────────────────────────────────────────
    let bookingResult = null;

    while (responseMessage.tool_calls?.length) {
      history.push(responseMessage);

      for (const toolCall of responseMessage.tool_calls) {
        const args = JSON.parse(toolCall.function.arguments);
        let result;

        if (toolCall.function.name === 'check_staff_availability') {
          result = await checkStaffAvailability(args);
        } else if (toolCall.function.name === 'create_appointment') {
          result = await createAppointment({ ...args, customer_phone: customerPhone });
          if (result.success) bookingResult = result;
        } else {
          result = { error: 'Unknown tool' };
        }

        history.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(result),
        });
      }

      completion = await openai.chat.completions.create({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: history,
        tools,
        tool_choice: 'auto',
        max_tokens: 150,
        temperature: 0.7,
      });

      responseMessage = completion.choices[0].message;
    }

    let aiResponse = responseMessage.content || "Sorry, I didn't catch that — could you say it again?";
    history.push({ role: 'assistant', content: aiResponse });

    // Keep history lean (system prompt + last 12 messages)
    if (history.length > 14) history.splice(1, 2);

    // ── Post-booking: convert lead + cancel follow-up + no-show + upsell ─────
    if (bookingResult) {
      const apptDatetime = `${bookingResult.date}T${bookingResult.time}:00`;

      // Mark lead as converted (attaches booking_id to latest interaction row)
      markLeadConverted(customerPhone, bookingResult.booking_id, DEFAULT_TENANT_ID).catch(() => {});

      // Cancel any pending 24h enquiry follow-up for this customer
      cancelEnquiryFollowup(customerPhone, DEFAULT_TENANT_ID).catch(() => {});

      // Schedule no-show follow-up 30 min after appointment start
      scheduleNoShowFollowup(
        customerPhone,
        bookingResult.booking_id,
        apptDatetime,
        { service: bookingResult.service, staff: bookingResult.staff }
      ).catch(() => {});

      // Upsell: send as a SEPARATE delayed message (3–5s) — feels natural, not pushy
      const upsellMsg = getUpsell(bookingResult.service);
      if (upsellMsg) {
        scheduleUpsell(customerPhone, upsellMsg).catch(() => {});
      }
    }

    twiml.message(aiResponse);
  } catch (error) {
    log.error('Concierge error', { error: error.message });
    twiml.message('I apologize, but I am having trouble connecting right now. Please try again in a moment.');
  }

  res.type('text/xml').send(twiml.toString());
});

export default router;
