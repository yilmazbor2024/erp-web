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

// Varsayılan dil ayarı
const defaultLanguage = 'tr';

// localStorage'dan dil tercihini al
const savedLanguage = localStorage.getItem('i18nextLng');

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage || defaultLanguage,
    fallbackLng: 'en',
    debug: false, // Debug mesajlarını konsola yazdırmayı devre dışı bırak
    interpolation: {
      escapeValue: false, // React zaten XSS koruması sağlıyor
    },
    detection: {
      order: ['querystring', 'localStorage', 'cookie', 'navigator'],
      lookupQuerystring: 'lng',
      lookupCookie: 'i18next',
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage', 'cookie'],
    },
    react: {
      useSuspense: false, // Suspense kullanımını devre dışı bırak
      transSupportBasicHtmlNodes: true,
      transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'p']
    }
  });

// Dil değiştiğinde localStorage'a kaydet ve HTML lang özelliğini güncelle
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('i18nextLng', lng);
  document.documentElement.setAttribute('lang', lng);
  // Arapça için RTL yönünü ayarla
  document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
});

export default i18n;
