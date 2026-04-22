import express from 'express';
import { supabase } from '../lib/supabase.js';

const router = express.Router();

// Format a local time string (HH:MM) + date string (YYYY-MM-DD) to iCal local datetime
// Dubai is UTC+4 — we use TZID=Asia/Dubai so Google Calendar shows the correct local time
function toICalLocalDate(dateStr, timeStr) {
  const [y, mo, d] = dateStr.split('-');
  const [h, m] = timeStr.split(':');
  return `${y}${mo}${d}T${h.padStart(2,'0')}${m.padStart(2,'0')}00`;
}

function toICalDate(date) {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

/**
 * GET /api/v1/calendar/feed.ics
 * 
 * Returns a live .ics calendar feed containing real upcoming appointments.
 * Salon staff can subscribe to this URL in Google Calendar for auto-sync.
 * 
 * Usage: Paste this URL into Google Calendar → "Other Calendars" → "From URL"
 * URL: http://localhost:3000/api/v1/calendar/feed.ics?tenant_id=YOUR_TENANT_ID
 */
router.get('/feed.ics', async (req, res) => {
  const { tenant_id } = req.query;

  if (!tenant_id) {
    return res.status(400).send('Missing required query param: tenant_id');
  }

  // Fetch the next 30 days of confirmed appointments
  const today = new Date();
  const in30Days = new Date(today);
  in30Days.setDate(today.getDate() + 30);

  const { data: appointments, error } = await supabase
    .from('appointments')
    .select('id, date, time_slot, end_time, status, customers(name, phone), staff(name), services(name_en, duration)')
    .eq('tenant_id', tenant_id)
    .in('status', ['confirmed', 'pending'])
    .gte('date', today.toISOString().split('T')[0])
    .lte('date', in30Days.toISOString().split('T')[0])
    .order('date', { ascending: true })
    .order('time_slot', { ascending: true });

  if (error) return res.status(500).send(`Error fetching appointments: ${error.message}`);

  // Build iCal events
  const now = toICalDate(new Date());
  const events = (appointments || []).map((apt) => {
    const timeSlot = apt.time_slot || '09:00';
    const endTime  = apt.end_time  || (() => {
      const [h, m] = timeSlot.split(':').map(Number);
      const dur = apt.services?.duration || 60;
      return `${String(Math.floor((h * 60 + m + dur) / 60)).padStart(2,'0')}:${String((m + dur) % 60).padStart(2,'0')}`;
    })();

    const clientName  = apt.customers?.name  || apt.guest?.name  || 'Guest';
    const clientPhone = apt.customers?.phone || apt.guest?.phone || '';
    const staffName   = apt.staff?.name      || 'Staff';
    const serviceName = apt.services?.name_en || 'Appointment';

    return [
      'BEGIN:VEVENT',
      `UID:apt-${apt.id}@lamaison.ae`,
      `DTSTAMP:${now}`,
      `DTSTART;TZID=Asia/Dubai:${toICalLocalDate(apt.date, timeSlot)}`,
      `DTEND;TZID=Asia/Dubai:${toICalLocalDate(apt.date, endTime)}`,
      `SUMMARY:${serviceName} – ${clientName}`,
      `DESCRIPTION:Client: ${clientName}\\nPhone: ${clientPhone}\\nStaff: ${staffName}\\nService: ${serviceName}\\nStatus: ${apt.status}`,
      'LOCATION:La Maison Salon\\, Downtown Dubai',
      `STATUS:${apt.status === 'confirmed' ? 'CONFIRMED' : 'TENTATIVE'}`,
      'END:VEVENT',
    ].join('\r\n');
  });

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//La Maison Salon//SaaS Booking System 1.0//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:La Maison – Salon Schedule',
    'X-WR-CALDESC:Live appointment feed for salon staff',
    'X-WR-TIMEZONE:Asia/Dubai',
    'X-PUBLISHED-TTL:PT15M',
    // Dubai timezone definition (UTC+4, no DST)
    'BEGIN:VTIMEZONE',
    'TZID:Asia/Dubai',
    'BEGIN:STANDARD',
    'TZOFFSETFROM:+0400',
    'TZOFFSETTO:+0400',
    'TZNAME:GST',
    'DTSTART:19700101T000000',
    'END:STANDARD',
    'END:VTIMEZONE',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n');

  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Content-Disposition', 'inline; filename="salon_schedule.ics"');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.send(icsContent);
});

export default router;
