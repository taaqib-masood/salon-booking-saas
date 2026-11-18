import { supabase } from '../lib/supabase.js';
import { DEFAULT_TENANT_ID, DEFAULT_BRANCH_ID } from '../lib/defaults.js';
import { whatsappQueue } from '../utils/queue.js';
import { sendStaffCancellation } from '../utils/whatsapp.js';
import { getEligibleStylists, getStylistBookings, findAvailableStylist } from '../utils/bookingAvailability.js';

const NAME_RE = /^[\p{L}\p{M}' .-]{1,50}$/u;
const PHONE_RE = /^\+?\d{8,15}$/;
export const MAX_OPEN_GUEST_BOOKINGS = 3;

// Public endpoint — used by the frontend booking flow for both guests and logged-in customers
export async function publicCreateAppointment(req, res) {
  const { service_id, staff_id, date, time_slot, customer_id, email } = req.body;

  if (!service_id || !date || !time_slot) {
    return res.status(400).json({ error: 'service_id, date, and time_slot are required' });
  }
  if (customer_id && req.customer?.id !== customer_id) {
    return res.status(403).json({ error: 'Cannot book for another customer' });
  }

  const isGuest = !customer_id;
  const firstName = String(req.body.firstName ?? '').trim();
  const lastName = String(req.body.lastName ?? '').trim();
  const phone = String(req.body.phone ?? '').replace(/[\s().-]/g, '');
  if (isGuest) {
    if (!NAME_RE.test(firstName) || !NAME_RE.test(lastName)) {
      return res.status(400).json({ error: 'First and last name must be 1-50 letters' });
    }
    if (!PHONE_RE.test(phone)) return res.status(400).json({ error: 'A valid phone number is required' });
    if (email != null && (typeof email !== 'string' || email.length > 254)) {
      return res.status(400).json({ error: 'Invalid email' });
    }

    const { count, error: openError } = await supabase
      .from('appointments')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', DEFAULT_TENANT_ID)
      .eq('is_guest', true)
      .eq('guest->>phone', phone)
      .in('status', ['pending', 'confirmed'])
      .gte('date', new Date().toISOString().slice(0, 10));
    if (openError) return res.status(400).json({ error: openError.message });
    if (count >= MAX_OPEN_GUEST_BOOKINGS) {
      return res.status(429).json({ error: 'Too many open bookings for this phone number' });
    }
  }

  // Fetch service for pricing
  const { data: service, error: svcErr } = await supabase
    .from('services')
    .select('price, duration, name_en')
    .eq('id', service_id)
    .eq('tenant_id', DEFAULT_TENANT_ID)
    .single();

  if (svcErr || !service) return res.status(400).json({ error: 'Service not found' });

  let customer;
  if (customer_id) {
    const { data, error: customerError } = await supabase.from('customers')
      .select('id, name, phone')
      .eq('id', customer_id)
      .eq('tenant_id', DEFAULT_TENANT_ID)
      .single();
    customer = data;
    if (customerError || !customer) return res.status(400).json({ error: 'Customer not found for this tenant' });
  }

  const price = service.price || 0;
  const vat = +(price * 0.05).toFixed(2);
  const total = +(price + vat).toFixed(2);

  // Calculate end time from time_slot + duration
  const [h, m] = time_slot.split(':').map(Number);
  const endDate = new Date(2000, 0, 1, h, m + (service.duration || 60));
  const end_time = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`;

  const { data: staff, error: staffError } = await getEligibleStylists(staff_id);
  if (staffError) return res.status(400).json({ error: staffError.message });
  if (!staff?.length) return res.status(409).json({ error: 'No eligible stylist is available' });

  const { data: bookings, error: bookingsError } = await getStylistBookings(date, staff, time_slot, end_time);
  if (bookingsError) return res.status(400).json({ error: bookingsError.message });
  const assignedStaff = findAvailableStylist(staff, bookings, time_slot, end_time);
  if (!assignedStaff) return res.status(409).json({ error: 'No eligible stylist is available at this time' });

  const { data, error } = await supabase
    .from('appointments')
    .insert({
      tenant_id: DEFAULT_TENANT_ID,
      branch_id: DEFAULT_BRANCH_ID,
      staff_id: assignedStaff.id,
      service_id,
      date,
      time_slot,
      end_time,
      customer_id: customer_id || null,
      is_guest: isGuest,
      guest: isGuest ? { name: `${firstName} ${lastName}`, phone, email } : null,
      subtotal: price,
      vat_amount: vat,
      total_amount: total,
      // Guest bookings are unverified, so they wait for staff confirmation before any message is sent.
      status: isGuest ? 'pending' : 'confirmed',
    })
    .select('id, date, time_slot, status, services(name_en, price)')
    .single();

  if (error) return res.status(400).json({ error: error.message });

  if (customer?.phone) {
    queueConfirmation(customer.phone, customer.name, service.name_en, date, time_slot, total);
  }

  res.status(201).json(data);
}

function queueConfirmation(phoneNumber, customerName, serviceName, date, timeSlot, totalAmount) {
  whatsappQueue.add('send_confirmation', {
    phoneNumber,
    message: {
      customerName: customerName || 'Valued Guest',
      serviceName,
      staffName: 'our team',
      date,
      timeSlot,
      totalAmount,
      branch: 'La Maison Dubai',
    },
  }).catch((err) => console.error('[WhatsApp Queue] Failed to enqueue confirmation:', err.message));
}

export async function createAppointment(req, res) {
  const tenant_id = req.staff.tenant_id;
  const { branch_id, staff_id, service_id, customer_id, date, time_slot, end_time,
    subtotal, vat_amount, total_amount, discount_amount, discount_ref,
    payment_method, notes, is_guest, guest } = req.body;

  const { data, error } = await supabase
    .from('appointments')
    .insert({ tenant_id, branch_id, staff_id, service_id, customer_id, date,
      time_slot, end_time, subtotal, vat_amount, total_amount, discount_amount,
      discount_ref, payment_method, notes, is_guest, guest })
    .select('*, customers(name,phone), staff(name), services(name_en,price,duration), branches(name)')
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
}

export async function getAllAppointments(req, res) {
  const tenant_id = req.staff.tenant_id;
  const { date, branch_id, status, staff_id, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('appointments')
    .select('*, customers(name,phone), staff(name,role), services(name_en,price), branches(name)', { count: 'exact' })
    .eq('tenant_id', tenant_id)
    .order('date', { ascending: false })
    .order('time_slot', { ascending: false })
    .range(offset, offset + limit - 1);

  if (date) query = query.eq('date', date);
  if (branch_id) query = query.eq('branch_id', branch_id);
  if (status) query = query.eq('status', status);
  if (staff_id) query = query.eq('staff_id', staff_id);

  const { data, error, count } = await query;
  if (error) return res.status(400).json({ error: error.message });
  res.json({ data, total: count, page: +page, limit: +limit });
}

export async function getOneAppointment(req, res) {
  const { data, error } = await supabase
    .from('appointments')
    .select('*, customers(name,phone,email), staff(name,role), services(name_en,price,duration), branches(name,address)')
    .eq('id', req.params.id)
    .eq('tenant_id', req.staff.tenant_id)
    .single();

  if (error || !data) return res.status(404).json({ error: 'Appointment not found' });
  res.json(data);
}

export async function getMyAppointments(req, res) {
  const { id: customer_id, tenant_id } = req.customer;

  const { data, error } = await supabase
    .from('appointments')
    .select('id, date, time_slot, status, services(id, name_en, price, duration), staff(name)')
    .eq('customer_id', customer_id)
    .eq('tenant_id', tenant_id)
    .order('date', { ascending: false })
    .limit(20);

  if (error) return res.status(400).json({ error: error.message });
  res.json({ data });
}

export async function updateStatus(req, res) {
  const { status, cancellation_reason } = req.body;
  const update = { status };
  if (status === 'cancelled' && cancellation_reason) update.cancellation_reason = cancellation_reason;

  const { data, error } = await supabase
    .from('appointments')
    .update(update)
    .eq('id', req.params.id)
    .eq('tenant_id', req.staff.tenant_id)
    .select('*, customers(name,phone), services(name_en), staff(name)')
    .single();

  if (error || !data) return res.status(404).json({ error: 'Appointment not found' });

  const phone = data.customers?.phone || data.guest?.phone;
  if (status === 'confirmed' && phone) {
    queueConfirmation(phone, data.customers?.name || data.guest?.name, data.services?.name_en,
      data.date, data.time_slot, data.total_amount);
  }

  // Send WhatsApp notification when staff cancels
  if (status === 'cancelled') {
    const customerName = data.customers?.name || data.guest?.name || 'Valued Guest';
    if (phone) {
      sendStaffCancellation(phone, {
        customerName,
        serviceName: data.services?.name_en || 'your appointment',
        date: data.date,
        timeSlot: data.time_slot,
      }).catch(err => console.error('[WhatsApp] cancellation notify failed:', err.message));
    }
  }

  res.json(data);
}

export async function rescheduleAppointment(req, res) {
  const { date, time_slot, end_time, staff_id } = req.body;

  const { data, error } = await supabase
    .from('appointments')
    .update({ date, time_slot, end_time, ...(staff_id && { staff_id }), status: 'confirmed' })
    .eq('id', req.params.id)
    .eq('tenant_id', req.staff.tenant_id)
    .select()
    .single();

  if (error || !data) return res.status(404).json({ error: 'Appointment not found' });
  res.json(data);
}

export async function cancelAppointment(req, res) {
  const { data, error } = await supabase
    .from('appointments')
    .update({ status: 'cancelled' })
    .eq('id', req.params.id)
    .eq('tenant_id', req.staff.tenant_id)
    .select('*, customers(name,phone), services(name_en)')
    .single();

  if (error || !data) return res.status(404).json({ error: 'Appointment not found' });

  const phone = data.customers?.phone || data.guest?.phone;
  const customerName = data.customers?.name || data.guest?.name || 'Valued Guest';
  if (phone) {
    sendStaffCancellation(phone, {
      customerName,
      serviceName: data.services?.name_en || 'your appointment',
      date: data.date,
      timeSlot: data.time_slot,
    }).catch(err => console.error('[WhatsApp] cancellation notify failed:', err.message));
  }

  res.json({ message: 'Cancelled', data });
}
