// Custom hook for translations with settings integration
import { useEffect } from 'react';
import { useTranslation as useI18nTranslation } from 'react-i18next';
import { useSettingsStore } from '../store/useSettingsStore';

export function useTranslation() {
  const { language } = useSettingsStore();
  const { t, i18n } = useI18nTranslation();

  // Ensure i18n language matches settings
  useEffect(() => {
    if (i18n.language !== language) {
      i18n.changeLanguage(language);
    }
  }, [language, i18n]);

  return { t, i18n };
}

