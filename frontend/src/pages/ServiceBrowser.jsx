import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../components/GlassCard';
import GoldButton from '../components/GoldButton';
import { useLang } from '../contexts/LangContext';

const categoryIcons = { Hair: '💇', Nails: '💅', 'Skin Care': '✨', Makeup: '💄', Massage: '🧘', Eyebrows: '🪮' };

const SkeletonCard = () => (
  <div className="rounded-2xl border border-gold/10 bg-white/[0.03] p-5 animate-pulse">
    <div className="h-28 rounded-xl bg-white/5 mb-4" />
    <div className="h-4 w-3/4 bg-white/5 rounded mb-2" />
    <div className="h-3 w-1/2 bg-white/5 rounded mb-4" />
    <div className="h-9 bg-white/5 rounded-xl" />
  </div>
);

export default function ServiceBrowser() {
  const { lang } = useLang();
  const navigate = useNavigate();
  const isAr = lang === 'ar';

  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      axios.get('/api/v1/categories'),
      axios.get('/api/v1/services'),
    ]).then(([catRes, svcRes]) => {
      setCategories(catRes.data);
      setServices(svcRes.data);
    }).finally(() => setLoading(false));
  }, []);

  const filtered = services.filter((s) => {
    const name = isAr ? s.name_ar : s.name_en;
    const matchSearch = name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = !selectedCategory || s.category_id === selectedCategory;
    return matchSearch && matchCat;
  });

  return (
    <div className="min-h-screen bg-midnight" dir={isAr ? 'rtl' : 'ltr'}>

      {/* Hero */}
      <section className="relative overflow-hidden px-6 pt-16 pb-12 text-center">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gold/5 rounded-full blur-3xl" />
        </div>
        <motion.p
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="text-gold text-xs tracking-[0.4em] uppercase mb-3 font-inter"
        >
          {isAr ? 'تجربة فاخرة' : 'Luxury Experience · Dubai'}
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className={`text-4xl md:text-5xl font-bold text-pearl mb-4 ${isAr ? 'font-cairo' : 'font-inter'}`}
        >
          {isAr ? 'احجز تجربتك الفاخرة' : 'Reserve Your Experience'}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="text-beige/60 text-base max-w-md mx-auto"
        >
          {isAr ? 'خدمات صالون راقية في قلب دبي' : 'Premium salon services in the heart of Dubai'}
        </motion.p>
      </section>

      <div className="max-w-7xl mx-auto px-6 pb-20">

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="relative mb-8 max-w-lg mx-auto"
        >
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gold/60 text-lg">🔍</span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={isAr ? 'ابحث عن خدمة...' : 'Search services...'}
            className="w-full bg-white/[0.05] border border-gold/20 rounded-xl pl-11 pr-4 py-3 text-pearl placeholder-pearl/30 focus:outline-none focus:border-gold/60 backdrop-blur-md transition-colors text-sm"
          />
        </motion.div>

        {/* Category pills */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          className="flex gap-2 overflow-x-auto pb-2 mb-10 scrollbar-hide justify-center flex-wrap"
        >
          {[{ id: '', name_en: 'All', name_ar: 'الكل', icon: '✦' }, ...categories].map((cat) => {
            const active = selectedCategory === cat.id;
            return (
              <motion.button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`relative flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${
                  active
                    ? 'border-gold text-midnight'
                    : 'border-gold/20 text-pearl/60 hover:border-gold/50 hover:text-pearl bg-white/[0.03]'
                }`}
                whileTap={{ scale: 0.95 }}
              >
                {active && (
                  <motion.div
                    layoutId="cat-pill"
                    className="absolute inset-0 rounded-full bg-gold-gradient"
                    style={{ zIndex: -1 }}
                  />
                )}
                <span>{cat.icon || categoryIcons[cat.name_en] || '✦'}</span>
                <span>{isAr ? cat.name_ar : cat.name_en}</span>
              </motion.button>
            );
          })}
        </motion.div>

        {/* Services grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((service, i) => (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <GlassCard hover className="p-5 h-full flex flex-col">
                    {/* Category badge + icon */}
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-3xl">
                        {service.service_categories?.icon || categoryIcons[service.service_categories?.name_en] || '💆'}
                      </span>
                      <span className="text-[10px] tracking-widest text-gold/60 uppercase border border-gold/20 px-2 py-0.5 rounded-full">
                        {isAr ? service.service_categories?.name_ar : service.service_categories?.name_en}
                      </span>
                    </div>

                    {/* Name */}
                    <h3 className={`text-pearl font-semibold text-lg mb-1 flex-1 ${isAr ? 'font-cairo' : 'font-inter'}`}>
                      {isAr ? service.name_ar : service.name_en}
                    </h3>

                    {/* Duration */}
                    <p className="text-beige/50 text-xs mb-4">
                      ⏱ {service.duration} {isAr ? 'دقيقة' : 'min'}
                    </p>

                    {/* Price + CTA */}
                    <div className="flex items-center justify-between mt-auto">
                      <div>
                        <span className="text-gold font-bold text-xl">{service.price}</span>
                        <span className="text-gold/60 text-xs ml-1">AED</span>
                      </div>
                      <GoldButton onClick={() => navigate('/book', { state: { service } })} className="text-xs px-4 py-2">
                        {isAr ? 'احجز الآن' : 'Reserve'}
                      </GoldButton>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-20 text-pearl/30 text-sm">
            {isAr ? 'لا توجد خدمات' : 'No services found'}
          </div>
        )}
      </div>
    </div>
  );
}
