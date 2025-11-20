// i18n configuration
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import en from './locales/en.json';
import es from './locales/es.json';
import fr from './locales/fr.json';

// Detect device language
const getDeviceLanguage = (): string => {
  try {
    const locale = Localization.getLocales()[0]?.languageCode || 'en';
    const languageCode = locale.split('-')[0] || locale.split('_')[0];
    
    // Only return if it's one of our supported languages
    if (['en', 'es', 'fr'].includes(languageCode)) {
      return languageCode;
    }
    return 'en';
  } catch (error) {
    console.error('Error detecting device language:', error);
    return 'en';
  }
};

const deviceLanguage = getDeviceLanguage();

i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v4',
    resources: {
      en: { translation: en },
      es: { translation: es },
      fr: { translation: fr },
    },
    lng: deviceLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes
    },
  });

export default i18n;

