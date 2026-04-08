import React, { createContext, useState, useEffect } from 'react';
import en from './en.json';
import ar from './ar.json';

const LangContext = createContext();

export function LangProvider({ children }) {
  const [lang, setLang] = useState('en');
  const [dir, setDir] = useState(lang === 'en' ? 'ltr' : 'rtl');
  
  const t = (key) => {
    switch (lang) {
      case 'ar':
        return ar[key];
      default:
        return en[key];
    }
  };

  useEffect(() => {
    document.dir = dir;
    document.documentElement.lang = lang;
  }, [lang, dir]);

  const value = {
    lang,
    setLang: (newLang) => {
      setLang(newLang);
      setDir(newLang === 'en' ? 'ltr' : 'rtl');
    },
    t,
  };

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang() {
  const context = React.useContext(LangContext);
  if (context === undefined) {
    throw new Error('useLang must be used within a LangProvider');
  }
  return context;
}