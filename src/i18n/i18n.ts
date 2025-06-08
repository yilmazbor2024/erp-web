import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Dil dosyaları
import en from './locales/en.json';
import tr from './locales/tr.json';
import ar from './locales/ar.json';
import ru from './locales/ru.json';

const resources = {
  en: {
    translation: en
  },
  tr: {
    translation: tr
  },
  ar: {
    translation: ar
  },
  ru: {
    translation: ru
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    interpolation: {
      escapeValue: false, // React zaten XSS koruması sağlıyor
    },
    detection: {
      order: ['querystring', 'cookie', 'localStorage', 'navigator'],
      lookupQuerystring: 'lng',
      lookupCookie: 'i18next',
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage', 'cookie'],
    }
  });

export default i18n;
