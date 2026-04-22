import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts';
import * as htmlToImage from 'html-to-image';

const isUAEWeekend = (dateStr) => {
  if (!dateStr) return false;
  const day = new Date(dateStr).getDay();
  return day === 5 || day === 6;
};

const to12h = (t) => {
  const [h, m] = t.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${String(h12).padStart(2,'0')}:${String(m).padStart(2,'0')} ${period}`;
};

const Spinner = () => <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />;

const FALLBACK_AVATAR = 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&q=80&fit=crop&crop=face';

const TimeSelector = ({ slots, loading, selected, onSelect }) => {
  if (loading) return (
    <div className="grid grid-cols-3 gap-3">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="py-3 rounded-lg border border-neutral/10 bg-neutral/5 animate-pulse h-10" />
      ))}
    </div>
  );
  if (!slots.length) return (
    <p className="text-neutral/50 text-sm text-center py-4">No available slots for this date.</p>
  );
  return (
    <div className="grid grid-cols-3 gap-3">
      {slots.map(time => (
        <button key={time} type="button" onClick={() => onSelect(time)}
          className={`py-3 rounded-lg border transition-all duration-300 text-xs tracking-wider font-medium ${selected === time ? 'bg-primary border-primary text-charcoal shadow-glow' : 'border-neutral/20 text-neutral hover:border-primary/50 hover:text-charcoal'}`}>
          {to12h(time)}
        </button>
      ))}
    </div>
  );
};

// Step labels for progress bar
const STEP_LABELS = ['Service', 'Stylist', 'Time', 'Details'];

export default function BookingFlow() {
  const location = useLocation();
  const navigate  = useNavigate();
  const { token, user } = useAuth();

  if (!location.state?.serviceId) return <Navigate to="/" replace />;

  const [step, setStep]               = useState(1);
  const [loading, setLoading]         = useState(false);
  const [serviceDetails, setServiceDetails] = useState(null);
  const [staffList, setStaffList]     = useState([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [dateError, setDateError]     = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [bookingRef] = useState(`LM-${Math.random().toString(36).toUpperCase().slice(2, 8)}`);

  const [bookingData, setBookingData] = useState({
    serviceId: location.state.serviceId,
    staffId:   null,   // null = any available
    staffName: 'Any Available Stylist',
    date:      '',
    time:      '',
    firstName: '',
    lastName:  '',
    phone:     '',
    email:     '',
  });

  // Fetch service details
  useEffect(() => {
    axios.get(`/api/v1/services/${bookingData.serviceId}`)
      .then(r => setServiceDetails(r.data))
      .catch(() => setServiceDetails({
        name_en: 'Signature Spa Treatment', duration: 90, price: 550,
        description_en: 'A premium bespoke treatment.'
      }));
  }, []);

  // Fetch public staff list once service details loaded (need tenant_id)
  useEffect(() => {
    if (!serviceDetails?.tenant_id) return;
    setStaffLoading(true);
    axios.get(`/api/v1/staff/public?tenant_id=${serviceDetails.tenant_id}`)
      .then(r => setStaffList(Array.isArray(r.data) ? r.data : []))
      .catch(() => setStaffList([]))
      .finally(() => setStaffLoading(false));
  }, [serviceDetails?.tenant_id]);

  const update = (field, value) => setBookingData(prev => ({ ...prev, [field]: value }));

  const handleDateChange = async (val) => {
    if (isUAEWeekend(val)) {
      setDateError('We are closed on Fridays & Saturdays. Please choose another day.');
      update('date', ''); setAvailableSlots([]);
      return;
    }
    setDateError('');
    update('date', val);
    update('time', '');
    setAvailableSlots([]);
    setSlotsLoading(true);
    try {
      const params = { service_id: bookingData.serviceId, date: val };
      if (bookingData.staffId) params.staff_id = bookingData.staffId;
      const { data } = await axios.get('/api/v1/availability/slots', { params });
      setAvailableSlots(data.slots || []);
    } catch {
      setAvailableSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  };

  // When stylist changes, reset date+slots so availability is re-fetched
  const selectStylist = (id, name) => {
    update('staffId', id);
    update('staffName', name);
    update('date', '');
    update('time', '');
    setAvailableSlots([]);
    setDateError('');
  };

  const next = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    setLoading(false);
    setStep(s => s + 1);
  };

  const handleComplete = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('/api/v1/appointments/book', {
        service_id:  bookingData.serviceId,
        staff_id:    bookingData.staffId || undefined,
        date:        bookingData.date,
        time_slot:   bookingData.time,
        customer_id: user?.id || null,
        firstName:   bookingData.firstName,
        lastName:    bookingData.lastName,
        phone:       bookingData.phone,
        email:       bookingData.email,
      });
    } catch (err) {
      console.error('Booking failed:', err.response?.data || err.message);
    }
    setLoading(false);
    setStep(5); // success
  };

  const calUrl = serviceDetails
    ? `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(serviceDetails.name_en)}&dates=${bookingData.date?.replace(/-/g,'')}T100000/${bookingData.date?.replace(/-/g,'')}T120000`
    : '#';
  const waUrl = serviceDetails
    ? `https://wa.me/971501330057?text=Hi%2C+I+just+booked+${encodeURIComponent(serviceDetails.name_en)}+on+${bookingData.date}+at+${bookingData.time}.+Ref%3A+${bookingRef}`
    : '#';

  if (!serviceDetails) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto py-10 px-4 animate-fade-in">

      {/* Progress Bar */}
      {step < 5 && (
        <div className="mb-10">
          <div className="relative flex items-center justify-between mb-3">
            {STEP_LABELS.map((label, i) => (
              <div key={label} className="flex flex-col items-center z-10">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all duration-500 ${step > i ? 'bg-primary border-primary text-charcoal' : step === i + 1 ? 'bg-primary border-primary text-charcoal shadow-glow' : 'bg-transparent border-neutral/20 text-neutral/40'}`}>
                  {step > i ? '✓' : i + 1}
                </div>
                <span className={`text-[9px] mt-1.5 uppercase tracking-widest transition-colors ${step === i + 1 ? 'text-primary font-semibold' : step > i ? 'text-primary/60' : 'text-neutral/30'}`}>{label}</span>
              </div>
            ))}
            <div className="absolute top-3.5 left-0 right-0 h-[1.5px] bg-neutral/10 -z-0">
              <div className="h-full bg-primary transition-all duration-700" style={{ width: `${((step - 1) / (STEP_LABELS.length - 1)) * 100}%` }} />
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 1: Service Confirm ── */}
      {step === 1 && (
        <div className="animate-fade-in-up bg-white p-8 md:p-12 rounded-2xl shadow-luxury border border-primary/10">
          <p className="text-[10px] text-primary tracking-[0.3em] uppercase font-semibold mb-2">You have selected</p>
          <h2 className="text-3xl font-serif text-charcoal mb-3">{serviceDetails.name_en}</h2>
          <p className="text-neutral font-light leading-relaxed mb-8 text-sm">{serviceDetails.description_en}</p>
          <div className="flex items-center space-x-10 border-t border-neutral/10 pt-6 mb-10">
            <div>
              <p className="text-[9px] text-neutral/40 uppercase tracking-widest mb-1">Duration</p>
              <p className="text-lg text-charcoal font-medium">{serviceDetails.duration} Min</p>
            </div>
            <div>
              <p className="text-[9px] text-neutral/40 uppercase tracking-widest mb-1">Investment</p>
              <p className="text-2xl text-primary font-serif">AED {serviceDetails.price}</p>
            </div>
          </div>
          <button onClick={next}
            className="w-full bg-charcoal text-cream py-4 rounded-xl hover:bg-primary hover:text-charcoal transition-all duration-300 uppercase tracking-widest text-sm font-semibold flex justify-center items-center h-14">
            {loading ? <Spinner /> : 'Choose Your Stylist →'}
          </button>
        </div>
      )}

      {/* ── STEP 2: Stylist Selection ── */}
      {step === 2 && (
        <div className="animate-fade-in-up bg-white p-8 md:p-12 rounded-2xl shadow-luxury border border-primary/10">
          <h2 className="text-3xl font-serif text-charcoal mb-2">Choose Your Stylist</h2>
          <p className="text-neutral/50 text-sm font-light mb-8">Select a specific stylist or let us assign the first available.</p>

          {staffLoading ? (
            <div className="grid grid-cols-2 gap-4 mb-8">
              {[1,2,3,4].map(i => (
                <div key={i} className="rounded-2xl border border-neutral/10 p-4 animate-pulse">
                  <div className="w-16 h-16 rounded-full bg-neutral/10 mx-auto mb-3" />
                  <div className="h-3 bg-neutral/10 rounded w-2/3 mx-auto" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 mb-8">
              {/* Any Available card */}
              <button
                onClick={() => selectStylist(null, 'Any Available Stylist')}
                className={`rounded-2xl border-2 p-5 text-center transition-all duration-300 hover:-translate-y-1 ${bookingData.staffId === null ? 'border-primary bg-primary/5 shadow-glow' : 'border-neutral/15 hover:border-primary/40'}`}
              >
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3 text-2xl text-primary font-bold">✦</div>
                <p className="font-serif text-charcoal text-sm">Any Available</p>
                <p className="text-[10px] text-neutral/40 mt-1 uppercase tracking-wider">Best match</p>
              </button>

              {/* Staff cards */}
              {staffList.map(s => (
                <button key={s.id}
                  onClick={() => selectStylist(s.id, s.name)}
                  className={`rounded-2xl border-2 p-5 text-center transition-all duration-300 hover:-translate-y-1 ${bookingData.staffId === s.id ? 'border-primary bg-primary/5 shadow-glow' : 'border-neutral/15 hover:border-primary/40'}`}
                >
                  <img
                    src={s.photo_url || FALLBACK_AVATAR}
                    alt={s.name}
                    onError={e => { e.currentTarget.src = FALLBACK_AVATAR; }}
                    className="w-16 h-16 rounded-full object-cover mx-auto mb-3 border-2 border-neutral/10"
                  />
                  <p className="font-serif text-charcoal text-sm">{s.name}</p>
                  <p className="text-[10px] text-primary uppercase tracking-wider font-bold mt-0.5">{s.role}</p>
                  {s.specialties && (
                    <p className="text-[9px] text-neutral/40 mt-1 truncate">{s.specialties}</p>
                  )}
                </button>
              ))}
            </div>
          )}

          <div className="flex space-x-4">
            <button onClick={() => setStep(1)}
              className="px-7 py-4 rounded-xl border border-neutral/20 text-neutral hover:border-charcoal transition-colors uppercase tracking-widest text-xs font-semibold">
              Back
            </button>
            <button onClick={next}
              className="flex-1 bg-charcoal text-cream py-4 rounded-xl hover:bg-primary hover:text-charcoal transition-all duration-300 uppercase tracking-widest text-sm font-semibold flex justify-center items-center h-14">
              {loading ? <Spinner /> : `Continue with ${bookingData.staffId ? bookingData.staffName : 'Any Stylist'} →`}
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3: Date & Time ── */}
      {step === 3 && (
        <div className="animate-fade-in-up bg-white p-8 md:p-12 rounded-2xl shadow-luxury border border-primary/10">
          <h2 className="text-3xl font-serif text-charcoal mb-2">Select Your Moment</h2>
          {bookingData.staffId && (
            <p className="text-sm text-neutral/50 mb-6">
              Showing availability for <span className="font-semibold text-charcoal">{bookingData.staffName}</span>
            </p>
          )}

          <div className="space-y-8">
            <div>
              <label className="block text-[10px] text-neutral/50 uppercase tracking-widest font-semibold mb-3">Date</label>
              <input type="date" min={new Date().toISOString().split('T')[0]}
                className="w-full border-b border-neutral/20 pb-3 text-xl text-charcoal focus:outline-none focus:border-primary transition-colors bg-transparent"
                value={bookingData.date}
                onChange={e => handleDateChange(e.target.value)}
              />
              {dateError && <p className="text-rose text-xs mt-2 font-light">{dateError}</p>}
            </div>

            {bookingData.date && !dateError && (
              <div className="animate-fade-in">
                <label className="block text-[10px] text-neutral/50 uppercase tracking-widest font-semibold mb-4">
                  Available Times <span className="normal-case font-normal text-neutral/40">({serviceDetails.duration} min slots)</span>
                </label>
                <TimeSelector slots={availableSlots} loading={slotsLoading} selected={bookingData.time} onSelect={t => update('time', t)} />
              </div>
            )}
          </div>

          <div className="flex space-x-4 mt-12">
            <button onClick={() => setStep(2)}
              className="px-7 py-4 rounded-xl border border-neutral/20 text-neutral hover:border-charcoal transition-colors uppercase tracking-widest text-xs font-semibold">
              Back
            </button>
            <button onClick={next} disabled={!bookingData.date || !bookingData.time || !!dateError}
              className="flex-1 bg-charcoal text-cream py-4 rounded-xl hover:bg-primary hover:text-charcoal transition-all duration-300 uppercase tracking-widest text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed flex justify-center items-center h-14">
              {loading ? <Spinner /> : 'Continue →'}
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 4: Guest Details ── */}
      {step === 4 && (
        <form onSubmit={handleComplete} className="animate-fade-in-up bg-white p-8 md:p-12 rounded-2xl shadow-luxury border border-primary/10">
          <h2 className="text-3xl font-serif text-charcoal mb-2">Guest Details</h2>

          {/* Booking summary */}
          <div className="bg-cream/50 rounded-xl p-4 mb-8 text-xs text-neutral/60 space-y-1 border border-neutral/10">
            <p><span className="font-semibold text-charcoal">{serviceDetails.name_en}</span> · {serviceDetails.duration} min · AED {serviceDetails.price}</p>
            <p>Stylist: <span className="text-charcoal font-medium">{bookingData.staffName}</span></p>
            <p>Date: <span className="text-charcoal font-medium">{bookingData.date}</span> at <span className="text-charcoal font-medium">{bookingData.time ? to12h(bookingData.time) : ''}</span></p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
            {[
              { label: 'First Name', field: 'firstName', type: 'text' },
              { label: 'Last Name',  field: 'lastName',  type: 'text' },
              { label: 'Email Address', field: 'email', type: 'email' },
              { label: 'Phone Number',  field: 'phone', type: 'tel' },
            ].map(({ label, field, type }) => (
              <div key={field} className="relative">
                <label className="block text-[9px] text-neutral/40 uppercase tracking-widest mb-3">{label}</label>
                <input type={type} required value={bookingData[field]} onChange={e => update(field, e.target.value)}
                  className="w-full border-b border-neutral/20 pb-2 text-lg text-charcoal focus:outline-none focus:border-primary transition-colors bg-transparent" />
              </div>
            ))}
          </div>

          <div className="flex space-x-4">
            <button type="button" onClick={() => setStep(3)}
              className="px-7 py-4 rounded-xl border border-neutral/20 text-neutral hover:border-charcoal transition-colors uppercase tracking-widest text-xs font-semibold">
              Back
            </button>
            <button type="submit"
              className="flex-1 bg-charcoal text-cream py-4 rounded-xl hover:bg-primary hover:text-charcoal transition-all duration-300 uppercase tracking-widest text-sm font-semibold flex justify-center items-center h-14 shadow-glow">
              {loading ? <Spinner /> : 'Finalize Reservation ✦'}
            </button>
          </div>
        </form>
      )}

      {/* ── STEP 5: Success ── */}
      {step === 5 && (
        <div className="relative">
          <div className="absolute -top-24 -left-20 w-64 h-64 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute -bottom-24 -right-20 w-64 h-64 bg-primary/20 rounded-full blur-[120px] pointer-events-none" />

          <div id="success-card"
            className="animate-fade-in-up bg-white p-10 md:p-14 rounded-[32px] shadow-luxury border border-primary/15 text-center relative overflow-hidden backdrop-blur-sm"
            style={{ backgroundColor: 'rgba(255,255,255,0.95)' }}
          >
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] select-none pointer-events-none">
              <svg width="120" height="120" viewBox="0 0 100 100" fill="currentColor" className="text-charcoal">
                <path d="M50 0 L100 50 L50 100 L0 50 Z" />
              </svg>
            </div>

            <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full flex items-center justify-center mx-auto mb-10 shadow-glow border border-primary/20 relative">
              <span className="text-4xl text-primary drop-shadow-sm">✦</span>
              <div className="absolute inset-0 rounded-full animate-ping bg-primary/5 opacity-40" />
            </div>

            <h2 className="text-4xl md:text-5xl font-serif text-charcoal mb-2 tracking-tight">Reservation Confirmed.</h2>
            <p className="text-2xl font-serif text-primary/40 mb-8" dir="rtl">تم تأكيد حجزك الملكي</p>

            <div className="inline-block px-5 py-2 bg-charcoal text-primary text-[10px] uppercase tracking-[0.3em] font-bold rounded-full mb-10 shadow-lg">
              Ref: {bookingRef}
            </div>

            <div className="max-w-md mx-auto mb-12 space-y-4">
              <p className="text-neutral font-light leading-relaxed text-base">
                Dear <span className="font-semibold text-charcoal">{bookingData.firstName}</span>, your bespoke appointment for{' '}
                <span className="font-semibold text-charcoal italic">{serviceDetails.name_en}</span> has been secured.
              </p>
              <div className="grid grid-cols-3 gap-3 py-6 border-y border-neutral/10 text-center">
                <div>
                  <p className="text-[9px] text-neutral/40 uppercase tracking-widest mb-1">Date</p>
                  <p className="text-sm font-semibold text-charcoal">{bookingData.date}</p>
                </div>
                <div className="border-x border-neutral/10">
                  <p className="text-[9px] text-neutral/40 uppercase tracking-widest mb-1">Time</p>
                  <p className="text-sm font-semibold text-charcoal">{bookingData.time ? to12h(bookingData.time) : ''}</p>
                </div>
                <div>
                  <p className="text-[9px] text-neutral/40 uppercase tracking-widest mb-1">Stylist</p>
                  <p className="text-sm font-semibold text-charcoal">{bookingData.staffId ? bookingData.staffName : 'Assigned'}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4 max-w-sm mx-auto">
              <button
                onClick={async () => {
                  try {
                    const el = document.getElementById('success-card');
                    el.style.backgroundColor = '#FAF9F6';
                    const blob = await htmlToImage.toBlob(el, { quality: 1, pixelRatio: 2, backgroundColor: '#FAF9F6' });
                    el.style.backgroundColor = '';
                    if (!blob) throw new Error('Could not generate image.');
                    const file = new File([blob], `la-maison-${bookingRef}.png`, { type: 'image/png' });
                    if (navigator.canShare?.({ files: [file] })) {
                      await navigator.share({ files: [file], title: 'La Maison Dubai', text: 'Just booked at @LaMaisonDubai ✨' });
                    } else {
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a'); a.href = url; a.download = `la-maison-vip-pass-${bookingRef}.png`;
                      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
                    }
                  } catch { alert('Sharing not available. Image downloaded instead!'); }
                }}
                className="group relative w-full bg-gradient-to-r from-charcoal to-[#2a2a2a] text-cream py-5 px-8 rounded-2xl transition-all duration-300 overflow-hidden hover:scale-[1.02] active:scale-[0.98] shadow-2xl"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-transparent to-primary/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative flex items-center justify-between">
                  <span className="flex items-center space-x-3">
                    <span className="text-xl">📸</span>
                    <span className="uppercase tracking-[0.2em] text-xs font-bold">Share My Experience</span>
                  </span>
                  <span className="text-primary font-light text-xs opacity-60">✦</span>
                </div>
              </button>

              <a href={waUrl} target="_blank" rel="noreferrer"
                className="flex items-center justify-between bg-white border border-neutral/10 text-charcoal py-5 px-8 rounded-2xl hover:bg-neutral/5 transition-all w-full group shadow-md">
                <span className="flex items-center space-x-3">
                  <span className="text-xl text-[#25D366]">💬</span>
                  <span className="uppercase tracking-[0.2em] text-xs font-bold">Chat Concierge</span>
                </span>
                <span className="text-neutral/30 group-hover:translate-x-1 transition-transform">→</span>
              </a>

              <div className="flex items-center justify-between px-2 pt-4">
                <a href={calUrl} target="_blank" rel="noreferrer"
                  className="text-[10px] text-neutral/50 uppercase tracking-widest hover:text-primary transition-colors">
                  + Google Calendar
                </a>
                <button onClick={() => navigate('/')}
                  className="text-[10px] text-primary/70 uppercase tracking-widest font-bold hover:text-charcoal transition-colors border-b border-primary/20 pb-0.5">
                  Close Window
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
