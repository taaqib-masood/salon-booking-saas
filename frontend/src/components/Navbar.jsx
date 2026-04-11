import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useLang } from '../contexts/LangContext';

const navLinks = [
  { href: '/',       labelEn: 'Services',  labelAr: 'الخدمات' },
  { href: '/book',   labelEn: 'Book',      labelAr: 'احجز' },
  { href: '/admin',  labelEn: 'Admin',     labelAr: 'الإدارة' },
];

export default function Navbar() {
  const { lang, setLang } = useLang();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const isAr = lang === 'ar';

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-midnight/80 backdrop-blur-md border-b border-gold/10">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <span className="text-xl font-bold bg-gold-gradient bg-clip-text text-transparent font-inter">
            {isAr ? 'لوكس صالون' : 'LUXE'}
          </span>
          <span className="text-pearl/40 text-xs tracking-[0.3em] uppercase hidden sm:block">
            {isAr ? 'دبي' : 'Dubai'}
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                to={link.href}
                className={`relative text-sm transition-colors ${active ? 'text-gold' : 'text-pearl/60 hover:text-pearl'}`}
              >
                {isAr ? link.labelAr : link.labelEn}
                {active && (
                  <motion.div
                    layoutId="nav-underline"
                    className="absolute -bottom-1 left-0 right-0 h-px bg-gold-gradient"
                  />
                )}
              </Link>
            );
          })}
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-3">
          <motion.button
            onClick={() => setLang(isAr ? 'en' : 'ar')}
            className="text-xs border border-gold/30 text-gold px-3 py-1.5 rounded-lg hover:bg-gold/10 transition-colors"
            whileTap={{ scale: 0.95 }}
          >
            {isAr ? 'EN' : 'عربي'}
          </motion.button>

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-pearl/60 hover:text-pearl"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <div className="space-y-1.5">
              <span className="block w-5 h-px bg-current" />
              <span className="block w-5 h-px bg-current" />
              <span className="block w-3 h-px bg-current" />
            </div>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden bg-midnight/95 border-t border-gold/10 px-6 py-4 flex flex-col gap-4"
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setMenuOpen(false)}
                className={`text-sm ${pathname === link.href ? 'text-gold' : 'text-pearl/60'}`}
              >
                {isAr ? link.labelAr : link.labelEn}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
