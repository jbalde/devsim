export { en } from './en';
export { es } from './es';
export { Locale } from './types';
export type { Translations } from './types';

import { en } from './en';
import { es } from './es';
import { Locale, Translations } from './types';

const translations: Record<Locale, Translations> = {
  en,
  es,
};

let currentLocale: Locale = 'en';

/** Set the active locale */
export function setLocale(locale: Locale) {
  currentLocale = locale;
}

/** Get the active locale */
export function getLocale(): Locale {
  return currentLocale;
}

/** Get the full translations object for the current (or given) locale */
export function getTranslations(locale?: Locale): Translations {
  return translations[locale ?? currentLocale];
}

/** Simple {{key}} interpolation */
export function interpolate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => String(vars[key] ?? ''));
}

/** Shorthand: get translations for current locale */
export function t(): Translations {
  return translations[currentLocale];
}
