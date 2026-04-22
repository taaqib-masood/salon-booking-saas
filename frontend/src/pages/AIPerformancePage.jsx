import React, { useEffect, useState } from 'react';
import api from '../services/api';

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent }) {
  return (
    <div className={`bg-white rounded-2xl p-6 shadow-sm border ${accent ? 'border-primary' : 'border-neutral-100'}`}>
      <p className="text-xs uppercase tracking-widest text-neutral-400 mb-2">{label}</p>
      <p className={`text-4xl font-serif font-bold ${accent ? 'text-primary' : 'text-charcoal'}`}>{value}</p>
      {sub && <p className="text-xs text-neutral-400 mt-2">{sub}</p>}
    </div>
  );
}

// ── Intent row ────────────────────────────────────────────────────────────────
function IntentRow({ intent, total, converted }) {
  const rate = total ? Math.round((converted / total) * 100) : 0;
  return (
    <div className="mb-4">
      <div className="flex justify-between text-sm mb-1">
        <span className="capitalize font-medium text-charcoal">{intent}</span>
        <span className="text-neutral-400">{converted}/{total} · {rate}%</span>
      </div>
      <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: `${Math.min(rate, 100)}%` }}
        />
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AIPerformancePage() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [range, setRange]     = useState('30');

  useEffect(() => {
    setLoading(true);
    setError(null);
    const from = new Date(Date.now() - Number(range) * 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0];
    const to = new Date().toISOString().split('T')[0];

    api.get(`/analytics/ai-performance?from=${from}&to=${to}`)
      .then(r => setData(r.data))
      .catch(e => setError(e.response?.data?.error || e.message))
      .finally(() => setLoading(false));
  }, [range]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-red-500 text-sm">{error}</p>
      </div>
    );
  }

  const convRate         = data.conversion_rate ?? 0;
  const hotPending       = data.hot_leads_pending ?? 0;
  const followupsPending = data.followups_pending ?? 0;
  const hasActions       = hotPending > 0 || followupsPending > 0;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">

      {/* ── Page header + range toggle ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif text-charcoal tracking-wide">AI Performance</h1>
          <p className="text-sm text-neutral-400 mt-1">WhatsApp concierge impact — last {range} days</p>
        </div>
        <div className="flex gap-2">
          {['7', '30', '90'].map(d => (
            <button
              key={d}
              onClick={() => setRange(d)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors
                ${range === d
                  ? 'bg-charcoal text-primary'
                  : 'bg-white text-charcoal border border-neutral-200 hover:border-primary'}`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* ── Hero card ── */}
      <div className="bg-charcoal rounded-2xl p-8 shadow-lg">
        <p className="text-primary text-xs uppercase tracking-widest mb-4">AI Impact This Period</p>

        {/* Line 1 */}
        <p className="text-2xl sm:text-3xl text-cream leading-snug">
          AI <span className="font-bold text-primary">generated</span>{' '}
          <span className="font-bold text-primary">
            AED {(data.ai_generated_revenue ?? 0).toLocaleString()}
          </span>{' '}
          this month
        </p>

        {/* CHANGE 4: "customers you would have lost" → "bookings you would have likely lost" */}
        {data.recovered_bookings > 0 && (
          <p className="text-2xl sm:text-3xl text-cream leading-snug mt-2">
            +{' '}
            <span className="font-bold text-primary">recovered</span>{' '}
            <span className="font-bold text-primary">{data.recovered_bookings} bookings</span>{' '}
            you would have likely lost
          </p>
        )}

        {/* CHANGE 5: Trust booster line */}
        <p className="text-xs text-cream/40 mt-4">Based on real booking data</p>

        {/* Before/after framing */}
        <p className="text-sm text-cream/50 mt-1">
          Without AI follow-ups, these bookings likely wouldn't have happened.
        </p>
      </div>

      {/* ── CHANGE 1 + 2: "What to do today" — urgent copy + clickable action ── */}
      {hasActions && (
        <div className="bg-white rounded-2xl p-6 border border-primary/30 shadow-sm">
          <p className="text-xs uppercase tracking-widest text-neutral-400 mb-4">What to do today</p>
          <div className="space-y-3">

            {hotPending > 0 && (
              <div className="flex items-start gap-3">
                <span className="text-xl leading-none mt-0.5">🔥</span>
                <p className="text-charcoal text-sm">
                  <span className="font-semibold">{hotPending} hot lead{hotPending > 1 ? 's' : ''} waiting</span>
                  {' '}—{' '}
                  {/* CHANGE 2: Clickable "reply now" navigates to messages */}
                  <a
                    href="https://wa.me/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-primary underline underline-offset-2 hover:opacity-75 transition-opacity"
                  >
                    reply now
                  </a>
                  {' '}
                  {/* CHANGE 1: Added urgency label */}
                  <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full ml-1">
                    highest priority
                  </span>
                </p>
              </div>
            )}

            {followupsPending > 0 && (
              <div className="flex items-start gap-3">
                <span className="text-xl leading-none mt-0.5">⏰</span>
                <p className="text-charcoal text-sm">
                  <span className="font-semibold">
                    {followupsPending} follow-up{followupsPending > 1 ? 's' : ''} scheduled
                  </span>
                  {' '}—{' '}
                  {/* CHANGE 2: Clickable "check messages" */}
                  <a
                    href="/admin/messages"
                    className="font-bold text-primary underline underline-offset-2 hover:opacity-75 transition-opacity"
                  >
                    check messages
                  </a>
                </p>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ── Stat grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          label="Total Leads"
          value={data.total_leads}
          sub="WhatsApp enquiries"
        />
        <StatCard
          label="Hot Leads"
          value={data.hot_leads}
          sub="Ready to book now"
          accent
        />
        <StatCard
          label="Bookings generated by AI"
          value={data.converted_leads}
          sub={`${convRate}% conversion rate`}
        />
        <StatCard
          label="Recovered bookings"
          value={data.recovered_bookings}
          sub="Saved by follow-up"
        />
      </div>

      {/* Second stat row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* CHANGE 3: Updated speed stat wording */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100">
          <p className="text-xs uppercase tracking-widest text-neutral-400 mb-2">Avg Response Time</p>
          <p className="text-3xl font-serif font-bold text-charcoal">Instant</p>
          <p className="text-xs text-neutral-400 mt-2">replies avg &lt; 1 min, 24/7</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100 sm:col-span-2">
          <p className="text-xs uppercase tracking-widest text-neutral-400 mb-2">Follow-up conversions</p>
          <p className="text-4xl font-serif font-bold text-charcoal">{data.followup_conversions}</p>
          <p className="text-xs text-neutral-400 mt-2">
            Leads that converted only after an AI follow-up message
          </p>
        </div>
      </div>

      {/* ── Breakdown ── */}
      <div className="grid sm:grid-cols-2 gap-6">

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100">
          <p className="text-xs uppercase tracking-widest text-neutral-400 mb-5">Lead Temperature</p>
          <div className="space-y-4">
            {[
              { label: '🔥 Hot',  count: data.hot_leads,  bg: 'bg-amber-400' },
              { label: '🌡 Warm', count: data.warm_leads, bg: 'bg-orange-300' },
              { label: '🧊 Cold', count: data.cold_leads, bg: 'bg-sky-300' },
            ].map(({ label, count, bg }) => {
              const pct = data.total_leads ? Math.round((count / data.total_leads) * 100) : 0;
              return (
                <div key={label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-charcoal">{label}</span>
                    <span className="text-neutral-400">{count} · {pct}%</span>
                  </div>
                  <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${bg} rounded-full transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100">
          <p className="text-xs uppercase tracking-widest text-neutral-400 mb-5">Conversion by Intent</p>
          {Object.entries(data.by_intent || {}).length === 0 ? (
            <p className="text-sm text-neutral-400">No data yet</p>
          ) : (
            Object.entries(data.by_intent).map(([intent, { total, converted }]) => (
              <IntentRow key={intent} intent={intent} total={total} converted={converted} />
            ))
          )}
          {data.followup_conversions > 0 && (
            <p className="text-xs text-neutral-400 mt-4 pt-4 border-t border-neutral-100">
              ↩ {data.followup_conversions} conversions assisted by follow-up messages
            </p>
          )}
        </div>
      </div>

      {/* ── Empty state ── */}
      {data.total_leads === 0 && (
        <div className="bg-white rounded-2xl p-8 text-center border border-dashed border-neutral-200">
          <p className="text-neutral-400 text-sm">No WhatsApp leads recorded yet for this period.</p>
          <p className="text-neutral-300 text-xs mt-1">
            Leads are tracked automatically when customers message the AI concierge.
          </p>
        </div>
      )}

    </div>
  );
}
