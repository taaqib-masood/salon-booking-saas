import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useAuth } from '../contexts';
import { useLang } from '../contexts';
import api from '../services/api';

const localizer = momentLocalizer(moment);
const COLORS = ['#D4AF37', '#2a2a2a', '#888', '#c0392b'];

// ── Reusable modal shell ──────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-luxury w-full max-w-lg p-8 relative">
        <button onClick={onClose} className="absolute top-5 right-5 text-neutral/40 hover:text-charcoal text-xl leading-none">✕</button>
        <h3 className="text-xl font-serif text-charcoal mb-6">{title}</h3>
        {children}
      </div>
    </div>
  );
}

// ── Small badge ───────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const colors = {
    confirmed: 'bg-emerald-50 text-emerald-700',
    completed: 'bg-blue-50 text-blue-700',
    cancelled: 'bg-red-50 text-red-600',
    pending: 'bg-amber-50 text-amber-700',
    no_show: 'bg-neutral/10 text-neutral',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${colors[status] || 'bg-neutral/10 text-neutral'}`}>
      {status?.replace('_', ' ')}
    </span>
  );
}

// ── KPI card ──────────────────────────────────────────────────────────────────
function KPICard({ label, value, sub }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral/5">
      <p className="text-[10px] uppercase tracking-widest text-neutral/50 mb-2 font-bold">{label}</p>
      <p className="text-3xl font-serif text-charcoal">{value ?? '—'}</p>
      {sub && <p className="text-[10px] text-neutral/40 mt-1">{sub}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { token, user } = useAuth();
  const { t } = useLang();

  const [activeTab, setActiveTab] = useState('overview');

  // ── Overview state ────────────────────────────────────────────────────────
  const [revenue, setRevenue]         = useState({});
  const [apptStats, setApptStats]     = useState({});
  const [calEvents, setCalEvents]     = useState([]);
  const [icalCopied, setIcalCopied]   = useState(false);
  const [brandColor, setBrandColor]   = useState(() => localStorage.getItem('tenant_primary_color') || '#D4AF37');
  const saveTimeout = useRef(null);

  // ── Appointments state ────────────────────────────────────────────────────
  const [appts, setAppts]             = useState([]);
  const [apptFilter, setApptFilter]   = useState({ status: '', date: '' });
  const [apptRefreshing, setApptRefreshing] = useState(false);

  // ── My Schedule state ─────────────────────────────────────────────────────
  const [myBreaks, setMyBreaks]       = useState([]);
  const [myShifts, setMyShifts]       = useState([]);
  const [myBookings, setMyBookings]   = useState([]);
  const [breakModal, setBreakModal]   = useState(false);
  const [breakTargetStaffId, setBreakTargetStaffId] = useState(null); // snapshot viewStaffId at modal-open
  const [scheduleWeek, setScheduleWeek] = useState(() => new Date().toISOString().split('T')[0]);
  // Admin: view any staff's schedule (null = own)
  const [viewStaffId, setViewStaffId] = useState(null);
  const [viewBreaks,  setViewBreaks]  = useState([]);
  const [viewShifts,  setViewShifts]  = useState([]);
  const [viewBookings,setViewBookings]= useState([]);

  // ── Performance state ─────────────────────────────────────────────────────
  const [staffPerf, setStaffPerf]     = useState([]);
  const [guestConv, setGuestConv]     = useState(null);

  // ── Notes state ───────────────────────────────────────────────────────────
  const [notesAppt, setNotesAppt]     = useState(null); // appointment object
  const [notesData, setNotesData]     = useState([]);
  const [noteInput, setNoteInput]     = useState('');

  // ── Staff state ───────────────────────────────────────────────────────────
  const [staffList, setStaffList]     = useState([]);
  const [staffModal, setStaffModal]   = useState(null); // null | 'add' | {row}
  const [branches, setBranches]       = useState([]);

  // ── Services state ────────────────────────────────────────────────────────
  const [services, setServices]       = useState([]);
  const [svcModal, setSvcModal]       = useState(null);

  // ── Customers state ───────────────────────────────────────────────────────
  const [customers, setCustomers]     = useState([]);

  // ── Offers state ─────────────────────────────────────────────────────────
  const [offers, setOffers]           = useState([]);
  const [offerModal, setOfferModal]   = useState(false);

  // ── Notifications state ───────────────────────────────────────────────────
  const [notifs, setNotifs]           = useState([]);

  // ── Tenant settings state ─────────────────────────────────────────────────
  const [tenantInfo, setTenantInfo]   = useState({ name: '', phone: '' });
  const [workingHours, setWorkingHours] = useState(() => {
    const def = { open: true, start: '09:00', end: '21:00' };
    return { 0: { open: false, start: '09:00', end: '21:00' }, 1: def, 2: def, 3: def, 4: def, 5: { open: false, start: '09:00', end: '21:00' }, 6: { open: false, start: '09:00', end: '21:00' } };
  });
  const [salonAddress, setSalonAddress]     = useState('');
  const [salonPhone, setSalonPhone]         = useState('');
  const [logoUrl, setLogoUrl]               = useState('');
  const [cancelPolicy, setCancelPolicy]     = useState('');
  const [reminderHours, setReminderHours]   = useState(2);
  const [settingsSaving, setSettingsSaving] = useState('');

  const icalUrl = user?.tenant_id
    ? `${window.location.origin}/api/v1/calendar/feed.ics?tenant_id=${user.tenant_id}`
    : '';

  // Cleanup debounce timer on unmount
  useEffect(() => () => clearTimeout(saveTimeout.current), []);
  const gcalImportUrl = `https://calendar.google.com/calendar/r/settings/addbyurl?cid=${encodeURIComponent(icalUrl)}`;

  // ── Data fetchers ─────────────────────────────────────────────────────────
  const fetchOverview = useCallback(() => {
    if (!token) return;
    api.get('/analytics/revenue').then(r => setRevenue(r.data)).catch(console.error);
    api.get('/analytics/appointments').then(r => setApptStats(r.data)).catch(console.error);
    api.get('/tenants/me').then(({ data }) => {
      const color = data.tenant?.settings?.primary_color;
      if (color) { setBrandColor(color); localStorage.setItem('tenant_primary_color', color); document.documentElement.style.setProperty('--color-primary', color); }
    }).catch(() => {
      const saved = localStorage.getItem('tenant_primary_color');
      if (saved) document.documentElement.style.setProperty('--color-primary', saved);
    });
    // Load appointments for calendar view
    api.get('/appointments?limit=100').then(r => {
      const events = (r.data.data || []).map(a => {
        const [sh, sm] = (a.time_slot || '09:00').split(':').map(Number);
        const [eh, em] = (a.end_time || a.time_slot || '10:00').split(':').map(Number);
        const base = new Date(a.date);
        return {
          title: `${a.services?.name_en || 'Appointment'} — ${a.customers?.name || a.guest?.name || 'Guest'}`,
          start: new Date(base.getFullYear(), base.getMonth(), base.getDate(), sh, sm),
          end:   new Date(base.getFullYear(), base.getMonth(), base.getDate(), eh, em),
        };
      });
      setCalEvents(events);
    }).catch(console.error);
  }, [token]);

  const fetchAppointments = useCallback(async (silent = false) => {
    if (!silent) setApptRefreshing(true);
    const params = new URLSearchParams({ limit: 50 });
    if (apptFilter.status) params.set('status', apptFilter.status);
    if (apptFilter.date) params.set('date', apptFilter.date);
    try {
      const r = await api.get(`/appointments?${params}`);
      setAppts(r.data.data || []);
    } catch(e) { console.error(e); }
    finally { setApptRefreshing(false); }
  }, [token, apptFilter]);

  const fetchMySchedule = useCallback(() => {
    if (!token) return;
    api.get('/staff-breaks').then(r => setMyBreaks(Array.isArray(r.data) ? r.data : [])).catch(console.error);
    api.get('/staff-schedules/me').then(r => setMyShifts(Array.isArray(r.data) ? r.data : [])).catch(console.error);
    const today = new Date().toISOString().split('T')[0];
    api.get(`/appointments?date=${today}&limit=50`).then(r => setMyBookings(r.data.data || [])).catch(console.error);
  }, [token]);

  const fetchPerformance = useCallback(async () => {
    if (!token) return;
    // Fetch analytics + full staff list in parallel, then merge
    const [perfRes, staffRes, convRes] = await Promise.allSettled([
      api.get('/analytics/staff/performance'),
      api.get('/staff'),
      api.get('/analytics/guest-conversion'),
    ]);
    const perfData  = perfRes.status  === 'fulfilled' ? (perfRes.value.data  || []) : [];
    const allStaff  = staffRes.status === 'fulfilled' ? (staffRes.value.data?.data || staffRes.value.data || []) : [];
    const convData  = convRes.status  === 'fulfilled' ? convRes.value.data : null;

    // Build a merged list: every staff member appears, even with 0 appointments
    const perfMap = Object.fromEntries(perfData.map(p => [p.staff_id, p]));
    const merged  = allStaff.map(s => perfMap[s.id] || {
      staff_id:        s.id,
      name:            s.name,
      role:            s.role,
      photo_url:       s.photo_url || null,
      total:           0,
      completed:       0,
      cancelled:       0,
      no_show:         0,
      revenue:         0,
      completion_rate: 0,
    });
    // Sort by revenue desc, then name
    merged.sort((a, b) => b.revenue - a.revenue || a.name?.localeCompare(b.name));

    setStaffPerf(merged);
    if (convData) setGuestConv(convData);
  }, [token]);

  // Fetch another staff member's schedule (admin view — read-only)
  const fetchScheduleFor = useCallback(async (staffId) => {
    if (!staffId || !token) return;
    const today = new Date().toISOString().split('T')[0];
    const [bRes, sRes, aRes] = await Promise.allSettled([
      api.get(`/staff-breaks/${staffId}`),
      api.get(`/staff-schedules/${staffId}`),
      api.get(`/appointments?staff_id=${staffId}&date=${today}&limit=50`),
    ]);
    setViewBreaks(bRes.status  === 'fulfilled' ? (bRes.value.data  || []) : []);
    setViewShifts(sRes.status  === 'fulfilled' ? (sRes.value.data  || []) : []);
    setViewBookings(aRes.status === 'fulfilled' ? (aRes.value.data?.data || []) : []);
  }, [token]);

  const fetchStaff     = useCallback(() => { api.get('/staff').then(r => setStaffList(r.data.data || r.data)).catch(console.error); }, [token]);
  const fetchBranches  = useCallback(() => { api.get('/branches').then(r => setBranches(r.data.data || r.data)).catch(console.error); }, [token]);
  const fetchServices  = useCallback(() => { api.get('/services').then(r => setServices(r.data.data || r.data)).catch(console.error); }, [token]);
  const fetchCustomers = useCallback(() => { api.get('/customers').then(r => setCustomers(r.data.data || r.data)).catch(console.error); }, [token]);
  const fetchOffers    = useCallback(() => { api.get('/offers').then(r => setOffers(r.data.data || r.data)).catch(console.error); }, [token]);
  const fetchNotifs    = useCallback(() => { api.get('/notifications').then(r => setNotifs(r.data.data || r.data)).catch(console.error); }, [token]);

  const fetchTenantSettings = useCallback(async () => {
    if (!token) return;
    try {
      const { data } = await api.get('/tenants/me');
      const t = data.tenant || {};
      const s = t.settings || {};
      setTenantInfo({ name: t.name || '', phone: t.owner_phone || '' });
      setSalonAddress(s.salonAddress || '');
      setSalonPhone(s.salonPhone || '');
      setLogoUrl(s.logoUrl || '');
      setCancelPolicy(s.cancellationPolicy || '');
      setReminderHours(s.reminderHours ?? 2);
      if (s.workingHours) setWorkingHours(s.workingHours);
    } catch (e) { console.error(e); }
  }, [token]);

  const saveTenantSection = async (section, payload) => {
    setSettingsSaving(section);
    try {
      await api.put('/tenants/me/settings', payload);
    } catch (e) {
      alert('Save failed: ' + (e.response?.data?.error || e.message));
    } finally {
      setSettingsSaving('');
    }
  };

  // Single effect — handles both tab changes and filter changes without double-firing
  useEffect(() => {
    if (activeTab === 'overview')       fetchOverview();
    if (activeTab === 'appointments')   fetchAppointments();
    if (activeTab === 'staff')          { fetchStaff(); fetchBranches(); }
    if (activeTab === 'services')       fetchServices();
    if (activeTab === 'customers')      fetchCustomers();
    if (activeTab === 'offers')         fetchOffers();
    if (activeTab === 'notifications')  fetchNotifs();
    if (activeTab === 'schedule')       { fetchMySchedule(); fetchStaff(); }
    if (activeTab === 'performance')    fetchPerformance();
    if (activeTab === 'settings')       fetchTenantSettings();
  }, [activeTab, apptFilter]);

  // When admin picks a different staff to view
  useEffect(() => {
    if (viewStaffId) fetchScheduleFor(viewStaffId);
    else { setViewBreaks([]); setViewShifts([]); setViewBookings([]); }
  }, [viewStaffId]);

  // Auto-poll appointments every 30s when on that tab
  useEffect(() => {
    if (activeTab !== 'appointments') return;
    const interval = setInterval(() => fetchAppointments(true), 30000);
    return () => clearInterval(interval);
  }, [activeTab, fetchAppointments]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleColorChange = (color) => {
    setBrandColor(color);
    document.documentElement.style.setProperty('--color-primary', color);
    localStorage.setItem('tenant_primary_color', color);
    clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      api.put('/tenants/me/settings', { settings: { primary_color: color } }).catch(console.error);
    }, 600);
  };

  const cancelAppointment = async (id) => {
    if (!window.confirm(t('deleteConfirm'))) return;
    await api.patch(`/appointments/${id}/status`, { status: 'cancelled' });
    fetchAppointments();
  };

  const saveStaff = async (form) => {
    try {
      const payload = { ...form, is_active: true };
      if (!payload.branch_id) delete payload.branch_id;
      const res = form.id
        ? await api.put(`/staff/${form.id}`, payload)
        : await api.post('/staff', payload);
      setStaffModal(null); fetchStaff();
    } catch (err) {
      alert('Failed to save staff: ' + (err.response?.data?.error || err.message));
    }
  };
  const deleteStaff = async (id) => {
    if (!window.confirm(t('deleteConfirm'))) return;
    await api.delete(`/staff/${id}`); fetchStaff();
  };

  const saveService = async (form) => {
    form.id ? await api.put(`/services/${form.id}`, form) : await api.post('/services', form);
    setSvcModal(null); fetchServices();
  };
  const deleteService = async (id) => {
    if (!window.confirm(t('deleteConfirm'))) return;
    await api.delete(`/services/${id}`); fetchServices();
  };

  const saveOffer = async (form) => {
    await api.post('/offers', form);
    setOfferModal(false); fetchOffers();
  };
  const deleteOffer = async (id) => {
    if (!window.confirm(t('deleteConfirm'))) return;
    await api.delete(`/offers/${id}`); fetchOffers();
  };

  const markNotifSent = async (id) => {
    await api.patch(`/notifications/${id}/sent`, {});
    fetchNotifs();
  };

  const saveMyShifts = async (rows) => {
    try {
      await api.put('/staff-schedules/me', rows);
      fetchMySchedule();
    } catch (err) {
      alert('Failed to save shifts: ' + (err.response?.data?.error || err.message));
    }
  };

  const openNotes = async (appt) => {
    setNotesAppt(appt);
    setNoteInput('');
    try {
      const r = await api.get(`/appointments/${appt.id}/notes`);
      setNotesData(Array.isArray(r.data) ? r.data : []);
    } catch { setNotesData([]); }
  };

  const submitNote = async () => {
    if (!noteInput.trim() || !notesAppt) return;
    try {
      const r = await api.post(`/appointments/${notesAppt.id}/notes`, { note: noteInput.trim() });
      setNotesData(p => [r.data, ...p]);
      setNoteInput('');
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  };

  const removeNote = async (noteId) => {
    await api.delete(`/appointments/${notesAppt.id}/notes/${noteId}`);
    setNotesData(p => p.filter(n => n.id !== noteId));
  };

  const addBreak = async (form) => {
    try {
      const targetId = breakTargetStaffId; // use snapshot, not closure
      const payload = targetId ? { ...form, staff_id: targetId } : form;
      await api.post('/staff-breaks', payload);
      setBreakModal(false);
      setBreakTargetStaffId(null);
      if (targetId) fetchScheduleFor(targetId);
      else fetchMySchedule();
    } catch (err) {
      alert('Failed to save break: ' + (err.response?.data?.error || err.message));
    }
  };

  const deleteBreak = async (id) => {
    if (!window.confirm('Delete this break?')) return;
    await api.delete(`/staff-breaks/${id}`);
    if (viewStaffId) fetchScheduleFor(viewStaffId);
    else fetchMySchedule();
  };

  // Memoized — only rebuilds when language changes
  const tabs = useMemo(() => [
    { key: 'overview',      label: t('overview') },
    { key: 'appointments',  label: t('appointments') },
    { key: 'staff',         label: t('staff') },
    { key: 'services',      label: t('services') },
    { key: 'customers',     label: t('customers') },
    { key: 'offers',        label: t('offers') },
    { key: 'notifications', label: t('notifications') },
    { key: 'performance',   label: 'Performance' },
    { key: 'schedule',      label: 'My Schedule' },
    { key: 'settings',      label: t('settings') },
  ], [t]);

  const pieData = apptStats.by_status
    ? Object.entries(apptStats.by_status).map(([name, value]) => ({ name, value }))
    : [];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-serif text-charcoal mb-1">{t('adminDashboard')}</h1>
        <p className="text-neutral font-light text-sm">{t('welcomeBack')}</p>
      </div>

      {/* Tab nav */}
      <div className="flex flex-wrap gap-2 border-b border-neutral/10 pb-0">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-2.5 text-xs uppercase tracking-widest font-bold rounded-t-lg transition-all border-b-2 -mb-px ${
              activeTab === tab.key
                ? 'border-primary text-primary bg-white'
                : 'border-transparent text-neutral/50 hover:text-charcoal'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard label={t('grossRevenue')} value={`AED ${(revenue.gross_revenue || 0).toFixed(0)}`} />
            <KPICard label={t('netRevenue')} value={`AED ${(revenue.net_revenue || 0).toFixed(0)}`} />
            <KPICard label={t('totalAppointments')} value={revenue.total_appointments ?? 0} />
            <KPICard label={t('avgTicket')} value={`AED ${(revenue.avg_ticket || 0).toFixed(0)}`} />
            <KPICard label={t('completed')} value={revenue.completed ?? 0} />
            <KPICard label={t('cancelled')} value={revenue.cancelled ?? 0} />
            <KPICard label={t('noShows')} value={revenue.no_shows ?? 0} />
            <KPICard label={t('totalVAT')} value={`AED ${(revenue.total_vat || 0).toFixed(0)}`} />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-neutral/10">
              <h2 className="text-lg font-serif text-charcoal mb-6">{t('appointmentsByStatus')}</h2>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={90} stroke="none" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-neutral/40 text-sm text-center py-20">{t('noAppointments')}</p>
              )}
            </section>

            <section className="bg-white p-6 rounded-2xl shadow-sm border border-neutral/10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-serif text-charcoal">{t('schedule')}</h2>
                <div className="flex items-center gap-3">
                  <button onClick={() => { navigator.clipboard.writeText(icalUrl); setIcalCopied(true); setTimeout(() => setIcalCopied(false), 2500); }}
                    className="text-[10px] text-primary uppercase tracking-widest font-bold hover:text-charcoal transition-colors border-b border-primary/30 pb-0.5">
                    {icalCopied ? t('copied') : t('copyIcalFeed')}
                  </button>
                  <a href={gcalImportUrl} target="_blank" rel="noreferrer"
                    className="text-[10px] text-neutral/50 uppercase tracking-widest hover:text-primary transition-colors">
                    {t('openInGoogleCal')}
                  </a>
                </div>
              </div>
              <div className="h-64">
                <Calendar localizer={localizer} events={calEvents} startAccessor="start" endAccessor="end" className="font-sans text-xs" />
              </div>
            </section>
          </div>
        </div>
      )}

      {/* ── APPOINTMENTS ── */}
      {activeTab === 'appointments' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="flex flex-wrap gap-4 bg-white p-4 rounded-xl border border-neutral/10">
            <select
              value={apptFilter.status}
              onChange={e => setApptFilter(p => ({ ...p, status: e.target.value }))}
              className="border border-neutral/20 rounded-lg px-3 py-2 text-sm text-charcoal focus:outline-none focus:border-primary"
            >
              <option value="">{t('all')}</option>
              {['confirmed','pending','completed','cancelled','no_show'].map(s => (
                <option key={s} value={s}>{s.replace('_',' ')}</option>
              ))}
            </select>
            <input type="date" value={apptFilter.date}
              onChange={e => setApptFilter(p => ({ ...p, date: e.target.value }))}
              className="border border-neutral/20 rounded-lg px-3 py-2 text-sm text-charcoal focus:outline-none focus:border-primary"
            />
            <button onClick={() => setApptFilter({ status: '', date: '' })}
              className="text-xs text-neutral/50 hover:text-primary uppercase tracking-widest">{t('all')}</button>
            <button onClick={() => fetchAppointments()}
              className="ml-auto flex items-center gap-1.5 text-xs text-primary uppercase tracking-widest font-bold hover:text-charcoal transition-colors">
              <span className={apptRefreshing ? 'animate-spin' : ''}>↻</span> Refresh
            </button>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-neutral/10 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral/10">
                  {[t('date'), t('time'), t('customer'), t('stylist'), t('services'), t('total'), t('status'), t('actions')].map(h => (
                    <th key={h} className="text-left px-5 py-4 text-[10px] uppercase tracking-widest text-neutral/40 font-bold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {appts.length === 0 && (
                  <tr><td colSpan={8} className="text-center py-16 text-neutral/40">{t('noAppointments')}</td></tr>
                )}
                {appts.map(a => (
                  <tr key={a.id} className="border-b border-neutral/5 hover:bg-cream/30 transition-colors">
                    <td className="px-5 py-4 font-medium text-charcoal">{a.date}</td>
                    <td className="px-5 py-4 text-neutral">{a.time_slot}</td>
                    <td className="px-5 py-4">
                      {a.customers?.name || a.guest?.name || 'Guest'}
                      <div className="text-[10px] text-neutral/40">{a.customers?.phone || a.guest?.phone}</div>
                    </td>
                    <td className="px-5 py-4">
                      {a.staff?.name
                        ? <><p className="text-charcoal font-medium text-sm">{a.staff.name}</p><p className="text-[10px] text-neutral/40 capitalize">{a.staff.role || ''}</p></>
                        : <span className="text-neutral/30">—</span>}
                    </td>
                    <td className="px-5 py-4 text-neutral">{a.services?.name_en || '—'}</td>
                    <td className="px-5 py-4 font-serif text-charcoal">{a.total_amount ? `AED ${a.total_amount}` : '—'}</td>
                    <td className="px-5 py-4"><StatusBadge status={a.status} /></td>
                    <td className="px-5 py-4">
                      <div className="flex gap-3">
                        <button onClick={() => openNotes(a)}
                          className="text-[10px] text-primary uppercase tracking-widest hover:text-charcoal font-bold">
                          Notes
                        </button>
                        {a.status !== 'cancelled' && a.status !== 'completed' && (
                          <button onClick={() => cancelAppointment(a.id)}
                            className="text-[10px] text-red-500 uppercase tracking-widest hover:text-red-700 font-bold">
                            {t('cancel')}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── STAFF ── */}
      {activeTab === 'staff' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button onClick={() => setStaffModal('add')}
              className="bg-primary text-charcoal px-6 py-3 rounded-xl uppercase tracking-widest text-xs font-bold hover:opacity-90 transition-opacity">
              + {t('addStaff')}
            </button>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-neutral/10 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral/10">
                  {[t('name'), t('email'), t('phone'), t('role'), t('actions')].map(h => (
                    <th key={h} className="text-left px-5 py-4 text-[10px] uppercase tracking-widest text-neutral/40 font-bold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {staffList.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-16 text-neutral/40">{t('noStaff')}</td></tr>
                )}
                {staffList.map(s => (
                  <tr key={s.id} className="border-b border-neutral/5 hover:bg-cream/30 transition-colors">
                    <td className="px-5 py-4 font-medium text-charcoal">{s.name}</td>
                    <td className="px-5 py-4 text-neutral">{s.email}</td>
                    <td className="px-5 py-4 text-neutral">{s.phone || '—'}</td>
                    <td className="px-5 py-4"><span className="text-[10px] uppercase tracking-widest font-bold text-primary">{s.role}</span></td>
                    <td className="px-5 py-4 flex gap-3">
                      <button onClick={() => setStaffModal(s)} className="text-[10px] uppercase tracking-widest text-charcoal hover:text-primary font-bold">{t('edit')}</button>
                      <button onClick={() => deleteStaff(s.id)} className="text-[10px] uppercase tracking-widest text-red-500 hover:text-red-700 font-bold">{t('delete')}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── SERVICES ── */}
      {activeTab === 'services' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button onClick={() => setSvcModal('add')}
              className="bg-primary text-charcoal px-6 py-3 rounded-xl uppercase tracking-widest text-xs font-bold hover:opacity-90 transition-opacity">
              + {t('addService')}
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.length === 0 && <p className="text-neutral/40 col-span-3 text-center py-16">{t('noServices')}</p>}
            {services.map(s => (
              <div key={s.id} className="bg-white p-6 rounded-2xl shadow-sm border border-neutral/10 flex flex-col justify-between gap-4">
                <div>
                  <p className="text-[10px] text-primary uppercase tracking-widest font-bold mb-1">{s.categories?.name_en || t('category')}</p>
                  <h3 className="text-lg font-serif text-charcoal">{s.name_en}</h3>
                  {s.name_ar && <p className="text-sm text-neutral/60 mt-0.5" dir="rtl">{s.name_ar}</p>}
                  <p className="text-sm text-neutral/60 mt-2">{s.description_en}</p>
                </div>
                <div className="flex items-center justify-between border-t border-neutral/10 pt-4">
                  <div>
                    <span className="font-serif text-charcoal text-lg">AED {s.price}</span>
                    <span className="text-neutral/40 text-xs ml-2">{s.duration} min</span>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setSvcModal(s)} className="text-[10px] uppercase tracking-widest text-charcoal hover:text-primary font-bold">{t('edit')}</button>
                    <button onClick={() => deleteService(s.id)} className="text-[10px] uppercase tracking-widest text-red-500 hover:text-red-700 font-bold">{t('delete')}</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── CUSTOMERS ── */}
      {activeTab === 'customers' && (
        <div className="bg-white rounded-2xl shadow-sm border border-neutral/10 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral/10">
                {[t('name'), t('email'), t('phone'), t('joined')].map(h => (
                  <th key={h} className="text-left px-5 py-4 text-[10px] uppercase tracking-widest text-neutral/40 font-bold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 && (
                <tr><td colSpan={4} className="text-center py-16 text-neutral/40">{t('noCustomers')}</td></tr>
              )}
              {customers.map(c => (
                <tr key={c.id} className="border-b border-neutral/5 hover:bg-cream/30 transition-colors">
                  <td className="px-5 py-4 font-medium text-charcoal">{c.name}</td>
                  <td className="px-5 py-4 text-neutral">{c.email || '—'}</td>
                  <td className="px-5 py-4 text-neutral">{c.phone}</td>
                  <td className="px-5 py-4 text-neutral/60 text-xs">{new Date(c.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── OFFERS ── */}
      {activeTab === 'offers' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button onClick={() => setOfferModal(true)}
              className="bg-primary text-charcoal px-6 py-3 rounded-xl uppercase tracking-widest text-xs font-bold hover:opacity-90 transition-opacity">
              + {t('createOffer')}
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {offers.length === 0 && <p className="text-neutral/40 col-span-3 text-center py-16">{t('noOffers')}</p>}
            {offers.map(o => (
              <div key={o.id} className="bg-white p-6 rounded-2xl shadow-sm border border-neutral/10">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-lg font-bold text-primary tracking-widest">{o.code}</span>
                  <StatusBadge status={o.is_active ? 'confirmed' : 'cancelled'} />
                </div>
                <p className="text-2xl font-serif text-charcoal mb-1">{o.discount_value}{o.discount_type === 'percentage' ? '%' : ' AED'} off</p>
                {o.expires_at && <p className="text-xs text-neutral/50">Expires: {new Date(o.expires_at).toLocaleDateString()}</p>}
                <button onClick={() => deleteOffer(o.id)}
                  className="mt-4 text-[10px] text-red-500 uppercase tracking-widest hover:text-red-700 font-bold">{t('delete')}</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── NOTIFICATIONS ── */}
      {activeTab === 'notifications' && (
        <div className="space-y-4">
          {notifs.length === 0 && <p className="text-neutral/40 text-center py-20">{t('noNotifications')}</p>}
          {notifs.map(n => (
            <div key={n.id} className={`bg-white p-5 rounded-xl border flex items-center justify-between gap-4 ${n.sent_at ? 'border-neutral/5 opacity-60' : 'border-primary/20'}`}>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-primary font-bold mb-1">{n.type}</p>
                <p className="text-sm text-charcoal">{n.message}</p>
                <p className="text-xs text-neutral/40 mt-1">{new Date(n.scheduled_at || n.created_at).toLocaleString()}</p>
              </div>
              {!n.sent_at && (
                <button onClick={() => markNotifSent(n.id)}
                  className="text-[10px] text-charcoal uppercase tracking-widest hover:text-primary font-bold whitespace-nowrap border border-neutral/20 px-3 py-2 rounded-lg">
                  {t('markSent')}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── PERFORMANCE ── */}
      {activeTab === 'performance' && (
        <div className="space-y-8">
          {/* Guest Conversion */}
          {guestConv && (
            <section className="bg-white rounded-2xl shadow-sm border border-neutral/10 p-6">
              <h2 className="text-lg font-serif text-charcoal mb-5">Guest Conversion & Booking Sources</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <KPICard label="Total Bookings"      value={guestConv.total_appointments} />
                <KPICard label="Guest Bookings"      value={guestConv.guest_bookings}     sub="WhatsApp / walk-in" />
                <KPICard label="Registered Customers" value={guestConv.registered_bookings} />
                <KPICard label="Conversion Rate"     value={`${guestConv.conversion_rate}%`} sub="guests → members" />
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard label="Guest Revenue"      value={`AED ${(guestConv.guest_revenue || 0).toFixed(0)}`} />
                <KPICard label="Member Revenue"     value={`AED ${(guestConv.registered_revenue || 0).toFixed(0)}`} />
              </div>
              {guestConv.by_source && Object.keys(guestConv.by_source).length > 0 && (
                <div className="mt-6 border-t border-neutral/10 pt-5">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-neutral/40 mb-3">By Source</h3>
                  <div className="flex flex-wrap gap-3">
                    {Object.entries(guestConv.by_source).map(([src, d]) => (
                      <div key={src} className="bg-cream/60 rounded-xl px-4 py-3 min-w-[120px]">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">{src}</p>
                        <p className="text-lg font-serif text-charcoal">{d.total}</p>
                        <p className="text-[10px] text-neutral/50">AED {(d.revenue || 0).toFixed(0)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Staff Performance Table */}
          <section className="bg-white rounded-2xl shadow-sm border border-neutral/10 overflow-hidden">
            <div className="p-6 border-b border-neutral/10">
              <h2 className="text-lg font-serif text-charcoal">Staff Performance</h2>
              <p className="text-xs text-neutral/40 mt-1">Last 30 days · sorted by revenue</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral/10">
                    {['Staff','Role','Appointments','Completed','Cancelled','No-Show','Completion %','Revenue'].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-[10px] uppercase tracking-widest text-neutral/40 font-bold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {staffPerf.length === 0 && (
                    <tr><td colSpan={8} className="text-center py-16 text-neutral/40">No data yet</td></tr>
                  )}
                  {staffPerf.map((s, i) => (
                    <tr key={s.staff_id} className="border-b border-neutral/5 hover:bg-cream/30 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {s.photo_url
                            ? <img src={s.photo_url} alt={s.name} className="w-8 h-8 rounded-full object-cover" />
                            : <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">{s.name?.[0]}</div>
                          }
                          <span className="font-medium text-charcoal">{s.name}</span>
                          {i === 0 && <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Top</span>}
                        </div>
                      </td>
                      <td className="px-5 py-4"><span className="text-[10px] font-bold uppercase tracking-widest text-primary">{s.role}</span></td>
                      <td className="px-5 py-4 text-charcoal font-medium">{s.total}</td>
                      <td className="px-5 py-4 text-emerald-600 font-medium">{s.completed}</td>
                      <td className="px-5 py-4 text-red-500">{s.cancelled}</td>
                      <td className="px-5 py-4 text-neutral/50">{s.no_show}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-neutral/10 rounded-full h-1.5 min-w-[60px]">
                            <div className="bg-emerald-400 h-1.5 rounded-full" style={{ width: `${s.completion_rate}%` }} />
                          </div>
                          <span className="text-xs text-neutral/60">{s.completion_rate}%</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-serif text-charcoal">AED {(s.revenue || 0).toFixed(0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {/* ── MY SCHEDULE ── */}
      {activeTab === 'schedule' && (() => {
        const isAdmin = ['owner','admin','manager'].includes(user?.role);
        const viewing = viewStaffId
          ? staffList.find(s => s.id === viewStaffId)
          : null;
        // Data to display — own or selected staff
        const displayBreaks   = viewStaffId ? viewBreaks   : myBreaks;
        const displayShifts   = viewStaffId ? viewShifts   : myShifts;
        const displayBookings = viewStaffId ? viewBookings : myBookings;

        return (
          <div className="space-y-6">
            {/* Header row */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-serif text-charcoal">
                  {viewing ? `Schedule: ${viewing.name}` : 'My Schedule & Breaks'}
                </h2>
                {viewing && (
                  <p className="text-[10px] uppercase tracking-widest text-neutral/40 mt-0.5 capitalize">
                    {viewing.role} · Shifts read-only — breaks editable
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                {/* Admin staff selector */}
                {isAdmin && staffList.length > 0 && (
                  <select
                    value={viewStaffId || ''}
                    onChange={e => setViewStaffId(e.target.value || null)}
                    className="border border-neutral/20 rounded-lg px-3 py-2 text-sm text-charcoal focus:outline-none focus:border-primary"
                  >
                    <option value="">My Schedule</option>
                    {staffList.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                    ))}
                  </select>
                )}
                {/* Add Break — always visible (admin creates for selected staff, staff for self) */}
                <button onClick={() => { setBreakTargetStaffId(viewStaffId); setBreakModal(true); }}
                  className="bg-primary text-charcoal px-5 py-2.5 rounded-xl uppercase tracking-widest text-xs font-bold hover:opacity-90 transition-opacity">
                  + Add Break{viewStaffId && viewing ? ` for ${viewing.name}` : ''}
                </button>
              </div>
            </div>

            {/* Staff summary card when viewing another */}
            {viewing && (
              <div className="bg-white rounded-2xl border border-neutral/10 p-5 flex items-center gap-5">
                {viewing.photo_url
                  ? <img src={viewing.photo_url} className="w-14 h-14 rounded-full object-cover" alt={viewing.name} />
                  : <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xl">{viewing.name?.[0]}</div>
                }
                <div>
                  <p className="font-serif text-lg text-charcoal">{viewing.name}</p>
                  <p className="text-xs text-primary uppercase tracking-widest font-bold">{viewing.role}</p>
                  {viewing.specialties && <p className="text-xs text-neutral/50 mt-1">{viewing.specialties}</p>}
                </div>
              </div>
            )}

            {/* Week navigation */}
            <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-neutral/10">
              <button onClick={() => { const d = new Date(scheduleWeek); d.setDate(d.getDate() - 7); setScheduleWeek(d.toISOString().split('T')[0]); }}
                className="text-xs text-neutral/60 hover:text-primary uppercase tracking-widest font-bold px-3 py-1.5 border border-neutral/20 rounded-lg">← Prev</button>
              <span className="flex-1 text-center text-sm font-medium text-charcoal">Week of {scheduleWeek}</span>
              <button onClick={() => { const d = new Date(scheduleWeek); d.setDate(d.getDate() + 7); setScheduleWeek(d.toISOString().split('T')[0]); }}
                className="text-xs text-neutral/60 hover:text-primary uppercase tracking-widest font-bold px-3 py-1.5 border border-neutral/20 rounded-lg">Next →</button>
            </div>

            {/* Shift editor — own schedule only */}
            {!viewStaffId
              ? <ShiftEditor shifts={displayShifts} onSave={saveMyShifts} />
              : <ShiftEditor shifts={displayShifts} readOnly />
            }

            {/* Weekly grid */}
            <WeeklyGrid weekStart={scheduleWeek} breaks={displayBreaks} bookings={displayBookings} />

            {/* Breaks list */}
            <section className="bg-white rounded-2xl shadow-sm border border-neutral/10 p-6">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-neutral/40 mb-4">
                {viewing ? `${viewing.name}'s Breaks` : 'Your Breaks'}
              </h3>
              {displayBreaks.length === 0 && (
                <p className="text-neutral/40 text-sm text-center py-8">
                  {viewStaffId ? 'No breaks set for this staff member.' : 'No breaks set. Click "+ Add Break" to block time off.'}
                </p>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {displayBreaks.map(b => (
                  <div key={b.id} className="border border-neutral/10 rounded-xl p-4 flex items-start justify-between gap-3">
                    <div>
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${b.break_type === 'recurring' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'}`}>
                        {b.break_type === 'recurring' ? 'Weekly' : 'One-time'}
                      </span>
                      <p className="text-sm font-medium text-charcoal mt-2">{b.label || 'Break'}</p>
                      <p className="text-xs text-neutral/60 mt-0.5">{b.start_time} – {b.end_time}</p>
                      <p className="text-xs text-neutral/40 mt-0.5">
                        {b.break_type === 'recurring'
                          ? ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][b.day_of_week]
                          : b.specific_date}
                      </p>
                    </div>
                    <button onClick={() => deleteBreak(b.id)}
                      className="text-[10px] text-red-400 hover:text-red-600 uppercase tracking-widest font-bold mt-1 flex-shrink-0">
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </div>
        );
      })()}

      {/* ── SETTINGS ── */}
      {activeTab === 'settings' && (
        <div className="space-y-8 max-w-2xl">

          {/* Brand Color */}
          <section className="bg-white p-8 rounded-2xl shadow-sm border border-neutral/10">
            <h2 className="text-xl font-serif text-charcoal mb-6 flex items-center gap-2">
              <span className="text-primary">✦</span> {t('brandCustomizer')}
            </h2>
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="space-y-4 flex-1">
                <label className="block text-xs uppercase tracking-widest text-neutral font-medium">{t('primaryBrandColor')}</label>
                <div className="flex gap-4 items-center">
                  <input type="color" value={brandColor}
                    onChange={e => handleColorChange(e.target.value)}
                    className="w-14 h-14 rounded cursor-pointer border-none bg-transparent p-0"
                  />
                  <p className="text-sm text-neutral/70 max-w-xs">{t('brandColorDesc')}</p>
                </div>
              </div>
              <div className="bg-cream/50 p-6 rounded-xl flex-1 border border-neutral/5">
                <p className="text-[10px] uppercase tracking-widest text-neutral/40 mb-4 font-bold">{t('livePreview')}</p>
                <button className="bg-primary text-charcoal px-6 py-3 uppercase tracking-widest text-xs font-bold rounded-lg shadow-glow hover:opacity-90 transition-opacity w-full">
                  {t('reserveNow')}
                </button>
              </div>
            </div>
          </section>

          {/* Salon Info */}
          <section className="bg-white p-8 rounded-2xl shadow-sm border border-neutral/10">
            <h2 className="text-xl font-serif text-charcoal mb-6 flex items-center gap-2">
              <span className="text-primary">✦</span> Salon Information
            </h2>
            <div className="space-y-4">
              {[
                { label: 'Salon Name', value: tenantInfo.name, set: v => setTenantInfo(p => ({ ...p, name: v })) },
                { label: 'Address', value: salonAddress, set: setSalonAddress },
                { label: 'Contact Phone', value: salonPhone, set: setSalonPhone },
                { label: 'Logo URL', value: logoUrl, set: setLogoUrl, placeholder: 'https://...' },
              ].map(({ label, value, set, placeholder }) => (
                <div key={label}>
                  <label className="block text-xs uppercase tracking-widest text-neutral/50 mb-1">{label}</label>
                  <input type="text" value={value} onChange={e => set(e.target.value)}
                    placeholder={placeholder || ''}
                    className="w-full border border-neutral/20 rounded-lg px-3 py-2 text-sm text-charcoal focus:outline-none focus:border-primary" />
                </div>
              ))}
              <button
                onClick={() => saveTenantSection('info', {
                  name: tenantInfo.name,
                  phone: tenantInfo.phone,
                  settings: { salonAddress, salonPhone, logoUrl },
                })}
                disabled={settingsSaving === 'info'}
                className="bg-primary text-charcoal px-6 py-2.5 rounded-xl text-xs uppercase tracking-widest font-bold hover:opacity-90 disabled:opacity-50">
                {settingsSaving === 'info' ? 'Saving…' : 'Save Info'}
              </button>
            </div>
          </section>

          {/* Working Hours */}
          <section className="bg-white p-8 rounded-2xl shadow-sm border border-neutral/10">
            <h2 className="text-xl font-serif text-charcoal mb-6 flex items-center gap-2">
              <span className="text-primary">✦</span> Working Hours
            </h2>
            <div className="space-y-3">
              {['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map((day, i) => {
                const cfg = workingHours[i] || { open: false, start: '09:00', end: '21:00' };
                return (
                  <div key={i} className="flex items-center gap-4">
                    <button
                      onClick={() => setWorkingHours(p => ({ ...p, [i]: { ...cfg, open: !cfg.open } }))}
                      className={`w-12 h-6 rounded-full transition-colors flex-shrink-0 ${cfg.open ? 'bg-primary' : 'bg-neutral/20'}`}>
                      <span className={`block w-5 h-5 rounded-full bg-white shadow transition-transform mx-0.5 ${cfg.open ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                    <span className="text-sm text-charcoal w-24 flex-shrink-0">{day}</span>
                    {cfg.open ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input type="time" value={cfg.start}
                          onChange={e => setWorkingHours(p => ({ ...p, [i]: { ...cfg, start: e.target.value } }))}
                          className="border border-neutral/20 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-primary" />
                        <span className="text-neutral/40 text-xs">to</span>
                        <input type="time" value={cfg.end}
                          onChange={e => setWorkingHours(p => ({ ...p, [i]: { ...cfg, end: e.target.value } }))}
                          className="border border-neutral/20 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-primary" />
                      </div>
                    ) : (
                      <span className="text-xs text-neutral/40 uppercase tracking-widest">Closed</span>
                    )}
                  </div>
                );
              })}
            </div>
            <button
              onClick={() => saveTenantSection('hours', { settings: { workingHours } })}
              disabled={settingsSaving === 'hours'}
              className="mt-6 bg-primary text-charcoal px-6 py-2.5 rounded-xl text-xs uppercase tracking-widest font-bold hover:opacity-90 disabled:opacity-50">
              {settingsSaving === 'hours' ? 'Saving…' : 'Save Hours'}
            </button>
          </section>

          {/* Cancellation Policy */}
          <section className="bg-white p-8 rounded-2xl shadow-sm border border-neutral/10">
            <h2 className="text-xl font-serif text-charcoal mb-2 flex items-center gap-2">
              <span className="text-primary">✦</span> Cancellation Policy
            </h2>
            <p className="text-xs text-neutral/50 mb-4">Shown to customers on their booking confirmation page.</p>
            <textarea
              value={cancelPolicy}
              onChange={e => setCancelPolicy(e.target.value)}
              rows={4}
              placeholder="e.g. Please cancel at least 24 hours before your appointment to avoid a cancellation fee."
              className="w-full border border-neutral/20 rounded-xl px-4 py-3 text-sm text-charcoal focus:outline-none focus:border-primary resize-none"
            />
            <button
              onClick={() => saveTenantSection('policy', { settings: { cancellationPolicy: cancelPolicy } })}
              disabled={settingsSaving === 'policy'}
              className="mt-4 bg-primary text-charcoal px-6 py-2.5 rounded-xl text-xs uppercase tracking-widest font-bold hover:opacity-90 disabled:opacity-50">
              {settingsSaving === 'policy' ? 'Saving…' : 'Save Policy'}
            </button>
          </section>

          {/* Reminder Timing */}
          <section className="bg-white p-8 rounded-2xl shadow-sm border border-neutral/10">
            <h2 className="text-xl font-serif text-charcoal mb-2 flex items-center gap-2">
              <span className="text-primary">✦</span> Appointment Reminder Timing
            </h2>
            <p className="text-xs text-neutral/50 mb-4">WhatsApp reminders are sent this many hours before each appointment.</p>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 4, 12, 24].map(h => (
                <button key={h}
                  onClick={() => setReminderHours(h)}
                  className={`px-5 py-2.5 rounded-xl text-xs uppercase tracking-widest font-bold border transition-colors ${
                    reminderHours === h
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-neutral/20 text-neutral/50 hover:border-neutral/40'
                  }`}>
                  {h}h before
                </button>
              ))}
            </div>
            <button
              onClick={() => saveTenantSection('reminder', { settings: { reminderHours } })}
              disabled={settingsSaving === 'reminder'}
              className="mt-6 bg-primary text-charcoal px-6 py-2.5 rounded-xl text-xs uppercase tracking-widest font-bold hover:opacity-90 disabled:opacity-50">
              {settingsSaving === 'reminder' ? 'Saving…' : 'Save Reminder'}
            </button>
          </section>

        </div>
      )}

      {/* ── STAFF MODAL ── */}
      {staffModal && (
        <StaffModal
          initial={staffModal === 'add' ? null : staffModal}
          onSave={saveStaff}
          onClose={() => setStaffModal(null)}
          branches={branches}
          t={t}
        />
      )}

      {/* ── SERVICE MODAL ── */}
      {svcModal && (
        <ServiceModal
          initial={svcModal === 'add' ? null : svcModal}
          onSave={saveService}
          onClose={() => setSvcModal(null)}
          t={t}
        />
      )}

      {/* ── OFFER MODAL ── */}
      {offerModal && (
        <OfferModal onSave={saveOffer} onClose={() => setOfferModal(false)} t={t} />
      )}

      {/* ── BREAK MODAL ── */}
      {breakModal && (
        <BreakModal onSave={addBreak} onClose={() => setBreakModal(false)} />
      )}

      {/* ── NOTES MODAL ── */}
      {notesAppt && (
        <Modal title={`Notes — ${notesAppt.services?.name_en || 'Appointment'}`} onClose={() => setNotesAppt(null)}>
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                value={noteInput}
                onChange={e => setNoteInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submitNote()}
                placeholder="Add a note (e.g. allergic to keratin)…"
                className="flex-1 border border-neutral/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
              />
              <button onClick={submitNote}
                className="bg-primary text-charcoal px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest hover:opacity-90">
                Add
              </button>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {notesData.length === 0 && <p className="text-neutral/40 text-sm text-center py-6">No notes yet</p>}
              {notesData.map(n => (
                <div key={n.id} className="bg-cream/60 rounded-xl p-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-charcoal">{n.note}</p>
                    <p className="text-[10px] text-neutral/40 mt-1">{n.staff?.name} · {new Date(n.created_at).toLocaleString()}</p>
                  </div>
                  <button onClick={() => removeNote(n.id)} className="text-[10px] text-red-400 hover:text-red-600 font-bold uppercase flex-shrink-0">✕</button>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Staff form modal ───────────────────────────────────────────────────────────
const CLOUDINARY_CLOUD = 'dkecjt3ma';
const CLOUDINARY_PRESET = 'salon_staff_photos';

async function uploadPhotoToCloudinary(file) {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', CLOUDINARY_PRESET);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, { method: 'POST', body: fd });
  if (!res.ok) throw new Error('Upload failed');
  const data = await res.json();
  return data.secure_url;
}

function StaffModal({ initial, onSave, onClose, branches, t }) {
  const [form, setForm] = useState({
    name:       initial?.name       || '',
    email:      initial?.email      || '',
    phone:      initial?.phone      || '',
    role:       initial?.role       || 'stylist',
    branch_id:  initial?.branch_id  || (branches?.[0]?.id || ''),
    photo_url:  initial?.photo_url  || '',
    bio:        initial?.bio        || '',
    specialties: initial?.specialties || '',
    password: '',
    ...(initial?.id ? { id: initial.id } : {}),
  });
  const [uploading, setUploading] = useState(false);
  const u = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadPhotoToCloudinary(file);
      u('photo_url', url);
    } catch (err) {
      alert('Photo upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  // Auto-select first branch once branches load (handles timing gap)
  useEffect(() => {
    if (branches?.length && !form.branch_id) {
      u('branch_id', branches[0].id);
    }
  }, [branches]);
  return (
    <Modal title={initial ? t('editStaff') : t('addStaff')} onClose={onClose}>
      <div className="space-y-4">
        {[['name', t('name'), 'text'], ['email', t('email'), 'email'], ['phone', t('phone'), 'tel']].map(([k, label, type]) => (
          <div key={k}>
            <label className="block text-xs uppercase tracking-widest text-neutral/50 mb-1">{label}</label>
            <input type={type} value={form[k]} onChange={e => u(k, e.target.value)}
              className="w-full border border-neutral/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
          </div>
        ))}
        {!initial && (
          <div>
            <label className="block text-xs uppercase tracking-widest text-neutral/50 mb-1">{t('password')}</label>
            <input type="password" value={form.password} onChange={e => u('password', e.target.value)}
              className="w-full border border-neutral/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
          </div>
        )}
        <div>
          <label className="block text-xs uppercase tracking-widest text-neutral/50 mb-1">{t('role')}</label>
          <select value={form.role} onChange={e => u('role', e.target.value)}
            className="w-full border border-neutral/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary">
            {['owner','admin','manager','stylist','receptionist'].map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        {branches?.length > 0 && (
          <div>
            <label className="block text-xs uppercase tracking-widest text-neutral/50 mb-1">Branch</label>
            <select value={form.branch_id} onChange={e => u('branch_id', e.target.value)}
              className="w-full border border-neutral/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary">
              <option value="">— Select branch —</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
        )}
        <div>
          <label className="block text-xs uppercase tracking-widest text-neutral/50 mb-2">Profile Photo</label>
          <div className="flex items-center gap-4">
            {form.photo_url
              ? <img src={form.photo_url} alt="preview" className="w-14 h-14 rounded-full object-cover border border-neutral/20" />
              : <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl font-bold border border-neutral/20">
                  {form.name?.[0] || '?'}
                </div>
            }
            <div className="flex-1 space-y-2">
              <label className={`flex items-center justify-center gap-2 border border-dashed border-neutral/30 rounded-lg px-3 py-2 text-xs text-neutral/60 cursor-pointer hover:border-primary hover:text-primary transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="sr-only" disabled={uploading} />
                {uploading ? 'Uploading…' : '↑ Upload Photo'}
              </label>
              <input type="url" value={form.photo_url} onChange={e => u('photo_url', e.target.value)}
                placeholder="or paste URL…"
                className="w-full border border-neutral/20 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-primary" />
            </div>
          </div>
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-neutral/50 mb-1">Specialties</label>
          <input type="text" value={form.specialties} onChange={e => u('specialties', e.target.value)}
            placeholder="Balayage, Keratin, Bridal…"
            className="w-full border border-neutral/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-neutral/50 mb-1">Bio</label>
          <textarea value={form.bio} onChange={e => u('bio', e.target.value)} rows={2}
            placeholder="Short bio shown on the public booking page…"
            className="w-full border border-neutral/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary resize-none" />
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 border border-neutral/20 text-neutral py-2.5 rounded-lg text-sm uppercase tracking-widest">{t('cancel')}</button>
          <button onClick={() => onSave(form)} className="flex-1 bg-primary text-charcoal py-2.5 rounded-lg text-sm uppercase tracking-widest font-bold">{t('save')}</button>
        </div>
      </div>
    </Modal>
  );
}

// ── Service form modal ────────────────────────────────────────────────────────
function ServiceModal({ initial, onSave, onClose, t }) {
  const [form, setForm] = useState({
    name_en: initial?.name_en || '',
    name_ar: initial?.name_ar || '',
    description_en: initial?.description_en || '',
    price: initial?.price || '',
    duration: initial?.duration || 60,
    is_active: initial?.is_active ?? true,
    ...(initial?.id ? { id: initial.id } : {}),
  });
  const u = (k, v) => setForm(p => ({ ...p, [k]: v }));
  return (
    <Modal title={initial ? t('editService') : t('addService')} onClose={onClose}>
      <div className="space-y-4">
        {[['name_en', t('serviceName'), 'text'], ['name_ar', t('serviceNameAr'), 'text'], ['description_en', t('description'), 'text']].map(([k, label]) => (
          <div key={k}>
            <label className="block text-xs uppercase tracking-widest text-neutral/50 mb-1">{label}</label>
            <input type="text" value={form[k]} onChange={e => u(k, e.target.value)} dir={k === 'name_ar' ? 'rtl' : 'ltr'}
              className="w-full border border-neutral/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
          </div>
        ))}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs uppercase tracking-widest text-neutral/50 mb-1">{t('price')}</label>
            <input type="number" value={form.price} onChange={e => u('price', e.target.value)}
              className="w-full border border-neutral/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-neutral/50 mb-1">{t('duration')}</label>
            <input type="number" value={form.duration} onChange={e => u('duration', e.target.value)}
              className="w-full border border-neutral/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-neutral cursor-pointer">
          <input type="checkbox" checked={form.is_active} onChange={e => u('is_active', e.target.checked)} className="accent-primary" />
          {t('active')}
        </label>
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 border border-neutral/20 text-neutral py-2.5 rounded-lg text-sm uppercase tracking-widest">{t('cancel')}</button>
          <button onClick={() => onSave(form)} className="flex-1 bg-primary text-charcoal py-2.5 rounded-lg text-sm uppercase tracking-widest font-bold">{t('save')}</button>
        </div>
      </div>
    </Modal>
  );
}

// ── Shift editor ─────────────────────────────────────────────────────────────
function ShiftEditor({ shifts, onSave, readOnly = false }) {
  const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const DEFAULT_SHIFTS = DAY_NAMES.map((_, i) => ({
    day_of_week: i,
    is_day_off:  i === 5 || i === 6, // Fri/Sat off by default
    start_time:  '09:00',
    end_time:    '21:00',
  }));

  const [rows, setRows] = useState(() => {
    if (!shifts?.length) return DEFAULT_SHIFTS;
    return DAY_NAMES.map((_, i) => {
      const existing = shifts.find(s => s.day_of_week === i);
      return existing || { day_of_week: i, is_day_off: true, start_time: '09:00', end_time: '21:00' };
    });
  });

  // Sync if parent shifts change
  useEffect(() => {
    if (shifts?.length) {
      setRows(DAY_NAMES.map((_, i) => {
        const existing = shifts.find(s => s.day_of_week === i);
        return existing || { day_of_week: i, is_day_off: true, start_time: '09:00', end_time: '21:00' };
      }));
    }
  }, [shifts]);

  const update = (i, key, val) => setRows(p => p.map((r, idx) => idx === i ? { ...r, [key]: val } : r));

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-neutral/10 p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-neutral/40">Working Hours{readOnly ? ' (view only)' : ''}</h3>
        {!readOnly && (
          <button onClick={() => onSave(rows.filter(r => !r.is_day_off))}
            className="bg-primary text-charcoal px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-widest hover:opacity-90">
            Save Shifts
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 gap-2">
        {rows.map((r, i) => (
          <div key={i} className={`flex items-center gap-4 p-3 rounded-xl border transition-colors ${r.is_day_off ? 'border-neutral/5 bg-neutral/2 opacity-50' : 'border-neutral/10'}`}>
            <span className="w-10 text-xs font-bold text-charcoal">{DAY_NAMES[i].slice(0,3)}</span>
            <label className="flex items-center gap-2 text-xs text-neutral cursor-pointer select-none">
              <input type="checkbox" checked={!r.is_day_off} disabled={readOnly}
                onChange={e => !readOnly && update(i, 'is_day_off', !e.target.checked)} className="accent-primary" />
              Working
            </label>
            {!r.is_day_off && (
              <>
                <input type="time" value={r.start_time} disabled={readOnly}
                  onChange={e => !readOnly && update(i, 'start_time', e.target.value)}
                  className="border border-neutral/20 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-primary disabled:opacity-60" />
                <span className="text-neutral/30 text-xs">to</span>
                <input type="time" value={r.end_time} disabled={readOnly}
                  onChange={e => !readOnly && update(i, 'end_time', e.target.value)}
                  className="border border-neutral/20 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-primary disabled:opacity-60" />
              </>
            )}
            {r.is_day_off && <span className="text-[10px] text-neutral/30 italic">Day off</span>}
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Weekly schedule grid ──────────────────────────────────────────────────────
function WeeklyGrid({ weekStart, breaks, bookings }) {
  const startDate = new Date(weekStart);
  const dow = startDate.getDay();
  const diff = dow === 0 ? -6 : 1 - dow; // shift to Monday
  startDate.setDate(startDate.getDate() + diff);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    return d;
  });

  const HOURS = Array.from({ length: 12 }, (_, i) => 9 + i); // 9–20

  const toMin = (t) => {
    if (!t) return 0;
    const [h, m] = t.split(':').map(Number);
    return h * 60 + (m || 0);
  };

  const getCellStatus = (date, hour) => {
    const dateStr = date.toISOString().split('T')[0];
    const dOW = date.getDay();
    const cStart = hour * 60, cEnd = cStart + 60;

    const hasBreak = (breaks || []).some(b => {
      const bs = toMin(b.start_time), be = toMin(b.end_time);
      if (b.break_type === 'recurring' && b.day_of_week === dOW) return cStart < be && cEnd > bs;
      if (b.break_type === 'one_time' && b.specific_date === dateStr) return cStart < be && cEnd > bs;
      return false;
    });
    if (hasBreak) return 'break';

    const hasBooking = (bookings || []).some(a => {
      if (a.date !== dateStr) return false;
      const bs = toMin(a.time_slot);
      const be = a.end_time ? toMin(a.end_time) : bs + 60;
      return cStart < be && cEnd > bs;
    });
    if (hasBooking) return 'booked';
    return 'available';
  };

  const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const today = new Date().toDateString();

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-neutral/10 overflow-x-auto">
      <div className="min-w-[640px]">
        {/* Header */}
        <div className="grid border-b border-neutral/10" style={{ gridTemplateColumns: '56px repeat(7, 1fr)' }}>
          <div className="p-3" />
          {days.map((d, i) => (
            <div key={i} className={`p-3 text-center ${d.toDateString() === today ? 'text-primary' : 'text-neutral/50'}`}>
              <div className="text-[10px] uppercase tracking-widest font-bold">{DAY_NAMES[d.getDay()]}</div>
              <div className="text-base font-serif mt-0.5">{d.getDate()}</div>
            </div>
          ))}
        </div>
        {/* Hour rows */}
        {HOURS.map(h => (
          <div key={h} className="grid border-b border-neutral/5" style={{ gridTemplateColumns: '56px repeat(7, 1fr)' }}>
            <div className="px-2 py-1.5 text-[10px] text-neutral/30 font-mono self-center">{h}:00</div>
            {days.map((d, i) => {
              const status = getCellStatus(d, h);
              return (
                <div key={i} className={`m-0.5 rounded min-h-[26px] flex items-center justify-center text-[9px] font-bold uppercase tracking-wider ${
                  status === 'break'   ? 'bg-red-100 text-red-500' :
                  status === 'booked' ? 'bg-neutral/10 text-neutral/40' :
                  'bg-emerald-50 text-emerald-500'
                }`}>
                  {status === 'break' ? 'Break' : status === 'booked' ? 'Booked' : ''}
                </div>
              );
            })}
          </div>
        ))}
        {/* Legend */}
        <div className="p-4 flex gap-5 text-[10px] uppercase tracking-widest text-neutral/50">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-100 inline-block" />Available</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-neutral/20 inline-block" />Booked</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-100 inline-block" />Break</span>
        </div>
      </div>
    </div>
  );
}

// ── Break form modal ──────────────────────────────────────────────────────────
function BreakModal({ onSave, onClose }) {
  const [form, setForm] = useState({
    break_type: 'recurring',
    day_of_week: 1,
    specific_date: '',
    start_time: '12:00',
    end_time: '13:00',
    label: 'Lunch Break',
  });
  const u = (k, v) => setForm(p => ({ ...p, [k]: v }));
  return (
    <Modal title="Add Break" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="block text-xs uppercase tracking-widest text-neutral/50 mb-2">Break Type</label>
          <div className="flex gap-2">
            {[['recurring', 'Recurring (Weekly)'], ['one_time', 'One-Time']].map(([val, label]) => (
              <button key={val} onClick={() => u('break_type', val)}
                className={`flex-1 py-2 text-xs uppercase tracking-widest font-bold rounded-lg border transition-colors ${
                  form.break_type === val
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-neutral/20 text-neutral/50 hover:border-neutral/40'
                }`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {form.break_type === 'recurring' ? (
          <div>
            <label className="block text-xs uppercase tracking-widest text-neutral/50 mb-1">Day of Week</label>
            <select value={form.day_of_week} onChange={e => u('day_of_week', Number(e.target.value))}
              className="w-full border border-neutral/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary">
              {['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map((d, i) => (
                <option key={i} value={i}>{d}</option>
              ))}
            </select>
          </div>
        ) : (
          <div>
            <label className="block text-xs uppercase tracking-widest text-neutral/50 mb-1">Date</label>
            <input type="date" value={form.specific_date} onChange={e => u('specific_date', e.target.value)}
              className="w-full border border-neutral/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs uppercase tracking-widest text-neutral/50 mb-1">Start Time</label>
            <input type="time" value={form.start_time} onChange={e => u('start_time', e.target.value)}
              className="w-full border border-neutral/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-neutral/50 mb-1">End Time</label>
            <input type="time" value={form.end_time} onChange={e => u('end_time', e.target.value)}
              className="w-full border border-neutral/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
          </div>
        </div>

        <div>
          <label className="block text-xs uppercase tracking-widest text-neutral/50 mb-1">Label</label>
          <input type="text" value={form.label} onChange={e => u('label', e.target.value)}
            placeholder="e.g. Lunch Break, Prayer"
            className="w-full border border-neutral/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 border border-neutral/20 text-neutral py-2.5 rounded-lg text-sm uppercase tracking-widest">Cancel</button>
          <button onClick={() => onSave(form)} className="flex-1 bg-primary text-charcoal py-2.5 rounded-lg text-sm uppercase tracking-widest font-bold">Save Break</button>
        </div>
      </div>
    </Modal>
  );
}

// ── Offer form modal ──────────────────────────────────────────────────────────
function OfferModal({ onSave, onClose, t }) {
  const [form, setForm] = useState({ code: '', discount_type: 'percentage', discount_value: '', expires_at: '' });
  const u = (k, v) => setForm(p => ({ ...p, [k]: v }));
  return (
    <Modal title={t('createOffer')} onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="block text-xs uppercase tracking-widest text-neutral/50 mb-1">{t('offerCode')}</label>
          <input type="text" value={form.code} onChange={e => u('code', e.target.value.toUpperCase())}
            className="w-full border border-neutral/20 rounded-lg px-3 py-2 text-sm font-mono uppercase focus:outline-none focus:border-primary" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs uppercase tracking-widest text-neutral/50 mb-1">{t('offerType')}</label>
            <select value={form.discount_type} onChange={e => u('discount_type', e.target.value)}
              className="w-full border border-neutral/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary">
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed (AED)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-neutral/50 mb-1">{t('discountPercent')}</label>
            <input type="number" value={form.discount_value} onChange={e => u('discount_value', e.target.value)}
              className="w-full border border-neutral/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
          </div>
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-neutral/50 mb-1">{t('expiresAt')}</label>
          <input type="date" value={form.expires_at} onChange={e => u('expires_at', e.target.value)}
            className="w-full border border-neutral/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 border border-neutral/20 text-neutral py-2.5 rounded-lg text-sm uppercase tracking-widest">{t('cancel')}</button>
          <button onClick={() => onSave(form)} className="flex-1 bg-primary text-charcoal py-2.5 rounded-lg text-sm uppercase tracking-widest font-bold">{t('save')}</button>
        </div>
      </div>
    </Modal>
  );
}
