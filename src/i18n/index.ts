// i18n configuration
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { resolveMvpUiLocale } from '../config/mvpRuntimeGates';
import en from './locales/en.json';
import es from './locales/es.json';
import fr from './locales/fr.json';

/**
 * AU/NZ MVP: consumer UI is English-only.
 * Device language must not activate es/fr. Locale JSON for es/fr remains dormant scaffolding.
 */
const mvpUiLocale = resolveMvpUiLocale();

i18n.use(initReactI18next).init({
  compatibilityJSON: 'v4',
  resources: {
    en: { translation: en },
    // Dormant scaffolding — not MVP-selectable (see MVP_ENABLED_UI_LOCALES).
    es: { translation: es },
    fr: { translation: fr },
  },
  lng: mvpUiLocale,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false, // React already escapes
  },
});

export default i18n;
