import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';

import translationFR from './locales/fr.json';
import translationEN from './locales/en.json';
import translationAR from './locales/ar.json';

const buildNamespaces = (translation: typeof translationFR) => {
  const t = translation as any;
  return {
    translation,
    common: translation.common || {},
    auth: t.auth || {},
    property: translation.property || {},
    dashboard: t.dashboard || t.property?.dashboard || {},
    admin: t.admin || {},
    settings: t.settings || {},
    errors: t.errors || t.property?.errors || {},
    chat: t.chatbot || {},
  };
};

const resources = {
  fr: buildNamespaces(translationFR),
  en: buildNamespaces(translationEN),
  ar: buildNamespaces(translationAR),
};

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'fr',
    supportedLngs: ['fr', 'en', 'ar'],
    ns: ['translation', 'common', 'auth', 'property', 'dashboard', 'admin', 'settings', 'errors', 'chat'],
    defaultNS: 'translation',

    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage'],
    },

    interpolation: {
      escapeValue: false,
    },

    react: {
      useSuspense: false,
    },

    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },

    debug: false,
  });

const applyDocumentLanguage = (lng: string) => {
  const direction = lng === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.dir = direction;
  document.documentElement.lang = lng;
  document.body.classList.toggle('rtl', direction === 'rtl');
};

const updatePageTitle = (lng: string) => {
  const titles: Record<string, string> = {
    fr: 'MAROC-LOC — Location au Maroc',
    en: 'MAROC-LOC — Rent in Morocco',
    ar: 'ماروك لوك — تأجير في المغرب',
  };
  document.title = titles[lng] || titles.fr;
};

i18n.on('languageChanged', (lng: string) => {
  applyDocumentLanguage(lng);
  updatePageTitle(lng);
});
applyDocumentLanguage(i18n.language || 'fr');
updatePageTitle(i18n.language || 'fr');

export default i18n;
