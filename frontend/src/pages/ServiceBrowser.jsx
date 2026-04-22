import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useScrollReveal, useStaggerReveal } from '../hooks/useScrollReveal';
import { useLang } from '../contexts/LangContext';
import StaffDirectory from './StaffDirectory';


const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=800&auto=format&fit=crop';

const SkeletonCard = () => (
  <div className="flex flex-col bg-[#1a1410] rounded-2xl overflow-hidden shadow-luxury">
    <div className="h-48 bg-gradient-to-r from-charcoal via-gold/5 to-charcoal bg-[length:400%_100%] animate-shimmer" />
    <div className="p-6 space-y-3">
      <div className="h-3 bg-gradient-to-r from-charcoal via-gold/10 to-charcoal bg-[length:400%_100%] animate-shimmer rounded w-3/4" />
      <div className="h-2 bg-gradient-to-r from-charcoal via-gold/10 to-charcoal bg-[length:400%_100%] animate-shimmer rounded w-full" />
    </div>
  </div>
);

const REVIEWS = [
  { name: "Fatima Al M.", nameAr: "فاطمة م.", rating: 5, text: "The most luxurious salon experience in all of Dubai. Every detail is perfection.", textAr: "أفخم تجربة صالون في دبي. كل التفاصيل مثالية.", service: "Royal Caviar Facial", serviceAr: "عناية الكافيار الملكي" },
  { name: "Sara K.", nameAr: "سارة ك.", rating: 5, text: "The Balayage is absolutely breathtaking. Worth every single dirham.", textAr: "البالياج يخطف الأنفاس حقاً. يستحق كل درهم.", service: "Balayage & Color Correction", serviceAr: "بالياج وتصحيح اللون" },
  { name: "Layla H.", nameAr: "ليلى ح.", rating: 5, text: "I felt like royalty. The 24K Gold Manicure is an experience unlike any other.", textAr: "شعرت وكأنني من العائلة المالكة. مانيكير الذهب عيار 24 تجربة لا مثيل لها.", service: "24K Gold Manicure", serviceAr: "مانيكير الذهب عيار ٢٤" },
  { name: "Nour Al R.", nameAr: "نور ر.", rating: 5, text: "Impeccable service, stunning results. La Maison is in a class of its own.", textAr: "خدمة لا تشوبها شائبة ، نتائج مذهلة. الفخامة في فئة خاصة بها.", service: "Signature Silk Blowout", serviceAr: "العناية الحريرية المميزة" },
];

function ServiceCard({ service, index, navigate, lang }) {
  const cardRef = useScrollReveal('revealed');
  const isEn = lang === 'en';
  const basePrice = service.price || 0;
  const vatAmount = +(basePrice * 0.05).toFixed(2);
  const totalPrice = +(basePrice + vatAmount).toFixed(2);
  const imageUrl = service.image_url || FALLBACK_IMAGE;
  const categoryName = isEn
    ? service.service_categories?.name_en
    : service.service_categories?.name_ar;

  return (
    <div
      ref={cardRef}
      className="stagger-child group flex flex-col bg-[#1a1410] rounded-2xl overflow-hidden hover:-translate-y-2 hover:shadow-glow transition-all duration-500 reveal-up cursor-pointer border border-white/5"
      style={{ transitionDelay: `${index * 80}ms` }}
      onClick={() => navigate('/book', { state: { serviceId: service.id } })}
    >
      {/* Image */}
      <div className="h-48 relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-60 transition-transform duration-1000 group-hover:scale-110"
          style={{ backgroundImage: `url('${imageUrl}')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a1410] via-[#1a1410]/30 to-transparent" />
        {categoryName && (
          <span className="absolute top-3 left-3 z-10 bg-primary/90 text-charcoal text-[8px] uppercase tracking-[0.15em] font-bold px-2.5 py-1 rounded-sm">
            {categoryName}
          </span>
        )}
      </div>

      <div className="p-6 flex-1 flex flex-col">
        {/* Name */}
        <h3 className="text-cream font-serif text-lg leading-snug mb-1">
          {isEn ? service.name_en : service.name_ar}
        </h3>

        {/* Duration */}
        <p className="text-neutral/50 text-[10px] uppercase tracking-widest mb-4">
          {service.duration} {isEn ? 'mins' : 'دقيقة'}
        </p>

        {/* Price */}
        <div className="mt-auto pt-4 border-t border-white/8">
          <p className="text-primary font-serif text-xl mb-0.5">
            {isEn ? 'AED' : 'درهم'} {basePrice.toLocaleString()}
          </p>
          <p className="text-neutral/40 text-[10px]">
            +5% VAT = {isEn ? 'AED' : 'درهم'} {totalPrice.toFixed(2)}
          </p>
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); navigate('/book', { state: { serviceId: service.id } }); }}
          className="w-full flex items-center justify-between bg-charcoal/60 hover:bg-primary border border-white/10 hover:border-primary text-cream hover:text-charcoal py-3.5 px-5 rounded-lg mt-4 transition-all duration-300 uppercase tracking-widest text-[10px] font-semibold group/btn"
        >
          <span>{isEn ? 'Reserve Appointment' : 'احجز موعداً'}</span>
          <span className={`transition-transform duration-300 ${isEn ? 'group-hover/btn:translate-x-1' : 'group-hover/btn:-translate-x-1'}`}>{isEn ? '→' : '←'}</span>
        </button>
      </div>
    </div>
  );
}

function ServiceBrowser() {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tenantId, setTenantId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { lang } = useLang();
  const isEn = lang === 'en';

  const heroTaglineRef = useScrollReveal('revealed');
  const reviewsTitleRef = useScrollReveal('revealed');
  const reviewsRef = useScrollReveal('revealed');
  const filtersRef = useScrollReveal('revealed');
  const gridRef = useStaggerReveal('.stagger-child');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catsRes, servsRes] = await Promise.all([
          axios.get('/api/v1/categories'),
          axios.get('/api/v1/services')
        ]);
        setCategories(catsRes.data);
        setServices(servsRes.data);
        if (servsRes.data?.[0]?.tenant_id) setTenantId(servsRes.data[0].tenant_id);
      } catch (err) {
        console.error('Failed to fetch — check backend is running on port 3000.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredServices = services.filter((s) =>
    ((isEn ? s.name_en : s.name_ar)?.toLowerCase() || '').includes(searchTerm.toLowerCase()) &&
    (!selectedCategory || s.category_id === selectedCategory)
  );

  return (
    <div className="pb-20">

      {/* ═══ HERO ═══ */}
      <div
        className={`-mx-6 md:-mx-8 -mt-6 md:-mt-8 mb-24 h-[70vh] min-h-[480px] relative bg-cover bg-center flex items-end justify-center text-center overflow-hidden`}
        style={{ backgroundImage: `url('/hero-bg.png')` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-charcoal/30 via-charcoal/55 to-charcoal/90" />
        <div ref={heroTaglineRef} className={`relative z-10 px-6 pb-14 reveal-up w-full max-w-3xl ${!isEn && 'font-sans'}`}>
          <h1 className="text-4xl md:text-6xl font-serif text-cream mb-3 drop-shadow-lg leading-tight">
            {isEn ? 'Elevate Your Beauty' : 'الارتقاء بجمالك'}
          </h1>
          <p className="text-cream/60 text-sm tracking-[0.2em] font-light max-w-xl mx-auto mb-10">
            {isEn ? 'Unwind in Luxury • Bespoke Treatments' : 'استرخ في الرفاهية • علاجات مخصصة'}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <button
              onClick={() => document.getElementById('services-grid')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-charcoal/80 backdrop-blur-sm border border-white/20 text-cream px-8 py-3.5 uppercase tracking-widest text-xs font-semibold hover:bg-charcoal transition-all duration-300 rounded-lg"
            >
              {isEn ? 'Explore Services' : 'استكشاف الخدمات'}
            </button>
            <button
              onClick={() => navigate('/book')}
              className="bg-primary text-charcoal px-8 py-3.5 uppercase tracking-widest text-xs font-semibold hover:bg-gold-light transition-all duration-300 rounded-lg shadow-glow"
            >
              {isEn ? 'Book Now' : 'احجز الآن'}
            </button>
          </div>
          <div className="inline-flex items-center space-x-2 space-x-reverse bg-charcoal/60 backdrop-blur-sm text-cream text-xs tracking-widest uppercase px-5 py-2.5 rounded-full border border-white/10">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse flex-shrink-0" />
            <span>{isEn ? '12 appointments today' : '١٢ حجز اليوم'}</span>
          </div>
        </div>
      </div>

      {/* ═══ DIVIDER ═══ */}
      <div className="flex items-center justify-center mb-20 -mx-6 md:-mx-8">
        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-primary/30" />
        <span className="text-primary text-lg mx-6">✦</span>
        <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-primary/30" />
      </div>

      {/* ═══ REVIEWS ═══ */}
      <div className="-mx-6 md:-mx-8 mb-24 px-6 md:px-8">
        <p ref={reviewsTitleRef} className="text-[10px] text-primary tracking-[0.4em] uppercase font-semibold text-center mb-10 reveal-up">
          {isEn ? 'What Our Guests Say' : 'ماذا يقول ضيوفنا'}
        </p>
        <div ref={reviewsRef} className="overflow-x-auto flex space-x-5 space-x-reverse pb-4 scrollbar-hide reveal-up">
          {REVIEWS.map((r, i) => (
            <div key={i} className={`flex-none w-72 bg-white rounded-2xl p-7 shadow-luxury border border-gold/10 hover:-translate-y-1 hover:shadow-glow transition-all duration-300 ${!isEn ? 'text-right' : 'text-left'}`}>
              <div className="text-primary mb-3 text-base tracking-widest text-left">{'★'.repeat(r.rating)}</div>
              <p className="text-sm text-neutral italic mb-5 leading-relaxed">"{isEn ? r.text : r.textAr}"</p>
              <p className="text-[11px] text-charcoal font-semibold tracking-widest uppercase">{isEn ? r.name : r.nameAr}</p>
              <p className="text-[10px] text-neutral/50 uppercase tracking-wider mt-1">{isEn ? r.service : r.serviceAr}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ DIVIDER ═══ */}
      <div className="flex items-center justify-center mb-16 -mx-6 md:-mx-8">
        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-primary/30" />
        <span className="text-primary text-lg mx-6">✦</span>
        <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-primary/30" />
      </div>

      {/* ═══ FILTERS ═══ */}
      <div ref={filtersRef} id="services-grid" className="max-w-7xl mx-auto mb-14 reveal-up">
        <p className="text-center text-[10px] text-neutral/40 uppercase tracking-[0.4em] font-semibold mb-8">
          {isEn ? 'Our Curated Experiences' : 'خدماتنا المختارة'}
        </p>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <button
              className={`px-5 py-2.5 rounded-full transition-all duration-300 border text-xs whitespace-nowrap ${selectedCategory === '' ? 'bg-primary border-primary text-charcoal font-semibold shadow-glow' : 'border-neutral/20 text-neutral hover:border-primary hover:text-primary'}`}
              onClick={() => setSelectedCategory('')}
            >
              {isEn ? 'All Experiences' : 'جميع الخدمات'}
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                className={`px-5 py-2.5 rounded-full transition-all duration-300 border text-xs whitespace-nowrap ${selectedCategory === cat.id ? 'bg-primary border-primary text-charcoal font-semibold shadow-glow' : 'border-neutral/20 text-neutral hover:border-primary hover:text-primary'}`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                {isEn ? cat.name_en : cat.name_ar}
              </button>
            ))}
          </div>
          <div className="relative w-full md:w-72 flex-shrink-0">
            <input
              type="text"
              placeholder={isEn ? "Discover services..." : "اكتشف الخدمات..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-neutral/20 rounded-full py-3 px-5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-charcoal text-xs placeholder-neutral/40"
            />
            <span className={`absolute ${isEn ? 'right-4' : 'left-4'} top-3 text-primary`}>⚲</span>
          </div>
        </div>
      </div>

      {/* ═══ SERVICE GRID ═══ */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : services.length === 0 ? (
        <div className="text-center py-28 border border-dashed border-primary/20 rounded-2xl bg-white/40 reveal-up">
          <div className="text-4xl mb-6 text-primary">✦</div>
          <h3 className="text-2xl font-serif text-charcoal mb-3">{isEn ? 'Awaiting the Maestro' : 'في انتظار المايسترو'}</h3>
          <p className="text-neutral font-light text-sm max-w-sm mx-auto">
            {isEn ? 'Run' : 'قم بتشغيل'} <code className="bg-charcoal/5 px-2 py-1 rounded text-xs">node scripts/seed_luxury.js</code> {isEn ? 'to populate the catalogue.' : 'لملء الكتالوج.'}
          </p>
        </div>
      ) : (
        <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service, index) => (
            <ServiceCard key={service.id} service={service} index={index} navigate={navigate} lang={lang} />
          ))}
        </div>
      )}

      {/* ═══ DIVIDER ═══ */}
      <div className="flex items-center justify-center my-24 -mx-6 md:-mx-8">
        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-primary/30" />
        <span className="text-primary text-lg mx-6">✦</span>
        <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-primary/30" />
      </div>

      {/* ═══ MEET THE TEAM ═══ */}
      {tenantId && (
        <div className="-mx-6 md:-mx-8">
          <StaffDirectory tenantId={tenantId} lang={lang} />
        </div>
      )}
    </div>
  );
}

export default ServiceBrowser;