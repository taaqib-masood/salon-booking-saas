import { supabase } from '../lib/supabase.js';
import { DEFAULT_TENANT_ID, DEFAULT_BRANCH_ID } from '../lib/defaults.js';

function toMinutes(timeStr) {
  if (!timeStr) return 0;
  const [h, m, s = 0] = timeStr.split(':').map(Number);
  return h * 60 + (m || 0) + s / 60;
}

export function getEligibleStylists(staffId) {
  let query = supabase.from('staff').select('id')
    .eq('tenant_id', DEFAULT_TENANT_ID)
    .eq('branch_id', DEFAULT_BRANCH_ID)
    .eq('is_active', true)
    .eq('is_deleted', false)
    .eq('role', 'stylist');
  if (staffId) query = query.eq('id', staffId);
  return query.order('id');
}

export function getStylistBookings(date, staff, start, end) {
  return supabase.from('appointments')
    .select('staff_id, time_slot, end_time')
    .eq('tenant_id', DEFAULT_TENANT_ID)
    .eq('branch_id', DEFAULT_BRANCH_ID)
    .eq('date', date)
    .in('status', ['pending', 'confirmed', 'in_progress'])
    .in('staff_id', staff.map(member => member.id))
    .lt('time_slot', end)
    .gt('end_time', start);
}

export function findAvailableStylist(staff, bookings, start, end) {
  const startMin = toMinutes(start);
  const endMin = toMinutes(end);
  return staff.find(member => !bookings.some(booking =>
    booking.staff_id === member.id &&
    startMin < toMinutes(booking.end_time) && endMin > toMinutes(booking.time_slot)
  ));
}
