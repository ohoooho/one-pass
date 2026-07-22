import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// one-pass only ships zh-CN (default) + en. Other locale files in the repo
// are kept for future contributors but are intentionally not registered.
import { en, zhCN } from '../locales';

i18n
  .use(initReactI18next)
  .use(LanguageDetector)
  .init({
    resources: {
      en: {
        translation: en,
      },
      'zh-CN': {
        translation: zhCN,
      },
    },
    // Default language is Chinese (one-pass is built for Chinese-speaking users)
    fallbackLng: 'zh-CN',
    lng: 'zh-CN',
    debug: false,

    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },

    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: [], // Don't cache auto-detected language
    },
  });

export default i18n;
