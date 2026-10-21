import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

type Language = 'fr' | 'en' | 'ar';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { i18n } = useTranslation();
  const [language, setLanguageState] = useState<Language>('fr');
  const [isRTL, setIsRTL] = useState(false);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
    localStorage.setItem('i18nextLng', lang);

    const rtl = lang === 'ar';
    setIsRTL(rtl);
    if (rtl) {
      document.documentElement.dir = 'rtl';
      document.documentElement.lang = 'ar';
    } else {
      document.documentElement.dir = 'ltr';
      document.documentElement.lang = lang;
    }
  };

  useEffect(() => {
    const savedLang = (localStorage.getItem('language') || localStorage.getItem('i18nextLng')) as Language | null;
    if (savedLang && ['fr', 'en', 'ar'].includes(savedLang)) {
      setLanguage(savedLang);
    } else if (['fr', 'en', 'ar'].includes(i18n.language)) {
      setLanguage(i18n.language as Language);
    }
  }, []);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};
