import React, { useEffect, useState } from 'react';
import api from '../services/api';

const FALLBACK_AVATAR = 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&q=80&fit=crop&crop=face';

function StaffCard({ member }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-neutral/10 overflow-hidden flex flex-col">
      <div className="aspect-[4/3] overflow-hidden bg-cream/50">
        <img
          src={member.photo_url || FALLBACK_AVATAR}
          alt={member.name}
          className="w-full h-full object-cover"
          onError={e => { e.currentTarget.src = FALLBACK_AVATAR; }}
        />
      </div>
      <div className="p-5 flex flex-col gap-2 flex-1">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary">{member.role}</span>
          <h3 className="text-lg font-serif text-charcoal mt-0.5">{member.name}</h3>
        </div>
        {member.bio && (
          <p className="text-sm text-neutral/70 leading-relaxed">{member.bio}</p>
        )}
        {member.specialties && (
          <div className="flex flex-wrap gap-1.5 mt-auto pt-2">
            {String(member.specialties).split(',').map(s => s.trim()).filter(Boolean).map(s => (
              <span key={s} className="text-[10px] bg-cream text-neutral/60 px-2.5 py-1 rounded-full border border-neutral/10 font-medium">
                {s}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function StaffDirectory({ tenantId, lang = 'en' }) {
  const isEn = lang === 'en';
  const [staff, setStaff]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantId) return;
    api.get(`/staff/public?tenant_id=${tenantId}`)
      .then(r => setStaff(Array.isArray(r.data) ? r.data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [tenantId]);

  if (loading) return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1,2,3].map(i => (
        <div key={i} className="bg-white rounded-2xl border border-neutral/10 overflow-hidden animate-pulse">
          <div className="aspect-[4/3] bg-neutral/10" />
          <div className="p-5 space-y-2">
            <div className="h-3 bg-neutral/10 rounded w-1/3" />
            <div className="h-5 bg-neutral/10 rounded w-2/3" />
            <div className="h-3 bg-neutral/10 rounded w-full" />
          </div>
        </div>
      ))}
    </div>
  );

  if (!staff.length) return null;

  return (
    <section className="py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-[10px] uppercase tracking-[0.3em] text-primary font-bold mb-3">
            {isEn ? 'Our Team' : 'فريقنا'}
          </p>
          <h2 className="text-4xl font-serif text-charcoal">
            {isEn ? 'Meet Your Stylists' : 'تعرف على فريق المصممين'}
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {staff.map(m => <StaffCard key={m.id} member={m} />)}
        </div>
      </div>
    </section>
  );
}
