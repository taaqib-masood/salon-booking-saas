import { supabase } from '../lib/supabase.js';

function toMinutes(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + (m || 0);
}

function toTimeStr(minutes) {
  return `${String(Math.floor(minutes / 60)).padStart(2,'0')}:${String(minutes % 60).padStart(2,'0')}`;
}

export async function getAvailableSlots(req, res) {
  const { service_id, date, staff_id } = req.query;
  if (!service_id || !date) return res.status(400).json({ error: 'service_id and date are required' });

  const dayOfWeek = new Date(date).getDay();

  // Fetch service + tenant_id for settings
  const { data: service, error: svcErr } = await supabase
    .from('services').select('duration, name_en, tenant_id').eq('id', service_id).single();
  if (svcErr || !service) return res.status(404).json({ error: 'Service not found' });

  // Fetch tenant working hours settings
  const { data: tenant } = await supabase
    .from('tenants').select('settings').eq('id', service.tenant_id).single();
  const workingHours = tenant?.settings?.workingHours;

  // Determine today's hours from settings, fallback to 9AM-9PM Sun-Thu
  let openMin, closeMin;
  if (workingHours && workingHours[dayOfWeek] !== undefined) {
    const dayConfig = workingHours[dayOfWeek];
    if (!dayConfig.open) {
      return res.json({ date, duration: 0, slots: [], message: 'Closed on this day' });
    }
    openMin  = toMinutes(dayConfig.start || '09:00');
    closeMin = toMinutes(dayConfig.end   || '21:00');
  } else {
    // Default: closed Fri (5) & Sat (6)
    if (dayOfWeek === 5 || dayOfWeek === 6) {
      return res.json({ date, duration: 0, slots: [], message: 'Closed on Fridays & Saturdays' });
    }
    openMin  = 9  * 60;
    closeMin = 21 * 60;
  }

  const duration = service.duration || 60;

  // Fetch booked appointments for this date
  let apptQuery = supabase
    .from('appointments')
    .select('time_slot, end_time')
    .eq('date', date)
    .in('status', ['confirmed', 'pending']);
  if (staff_id) apptQuery = apptQuery.eq('staff_id', staff_id);
  const { data: bookings } = await apptQuery;

  // Fetch staff breaks for this date (recurring + one-time)
  let breakRanges = [];
  if (staff_id) {
    const { data: breaks } = await supabase
      .from('staff_breaks')
      .select('start_time, end_time')
      .eq('staff_id', staff_id)
      .or(`and(break_type.eq.recurring,day_of_week.eq.${dayOfWeek}),and(break_type.eq.one_time,specific_date.eq.${date})`);
    breakRanges = (breaks || []).map(b => ({
      start: toMinutes(b.start_time),
      end:   toMinutes(b.end_time),
    }));
  }

  // Generate slots
  const slots = [];
  for (let start = openMin; start + duration <= closeMin; start += duration) {
    const end = start + duration;
    const bookedConflict = (bookings || []).some(b => {
      const bStart = toMinutes(b.time_slot);
      const bEnd   = b.end_time ? toMinutes(b.end_time) : bStart + 60;
      return start < bEnd && end > bStart;
    });
    const breakConflict = breakRanges.some(b => start < b.end && end > b.start);
    if (!bookedConflict && !breakConflict) slots.push(toTimeStr(start));
  }

  res.json({ date, duration, service: service.name_en, slots });
}
