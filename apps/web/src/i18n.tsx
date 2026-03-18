import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
// Import directly from source TS to avoid CJS/ESM interop issues
import { en } from '@devsim/shared/src/i18n/en';
import { es } from '@devsim/shared/src/i18n/es';
import type { Translations } from '@devsim/shared/src/i18n/types';
import type { Locale } from '@devsim/shared/src/i18n/types';
import { api } from './api';

const localeMap: Record<string, Translations> = { en, es };

interface I18nContextValue {
  locale: Locale;
  t: Translations;
  setLocale: (locale: Locale) => void;
}

const I18nContext = createContext<I18nContextValue>({
  locale: 'en',
  t: en,
  setLocale: () => {},
});

/** Detect browser language, fallback to 'en' */
function detectLocale(): Locale {
  const saved = localStorage.getItem('devsim-locale');
  if (saved === 'en' || saved === 'es') return saved;
  const nav = navigator.language?.slice(0, 2);
  if (nav === 'es') return 'es';
  return 'en';
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(detectLocale);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem('devsim-locale', l);
    // Sync server locale for simulation chat
    api.setLocale(l).catch(() => {});
  }, []);

  // Sync server on mount
  useEffect(() => {
    api.setLocale(locale).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <I18nContext.Provider value={{ locale, t: localeMap[locale] ?? en, setLocale }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
