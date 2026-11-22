import { getLocales, useCalendars, useLocales } from 'expo-localization';
import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { APP_STRINGS } from './appStrings';
import designStrings from './strings.json';

export type Locale = 'es' | 'en';
export type StringEntry = Record<Locale, string>;

const STRINGS = { ...designStrings, ...APP_STRINGS } as unknown as Record<string, StringEntry>;

function localeFromCode(code: string | null | undefined): Locale {
  return code === 'es' ? 'es' : 'en';
}

// The app follows the system language; anything but Spanish falls back to English.
export function resolveLocale(): Locale {
  return localeFromCode(getLocales()[0]?.languageCode);
}

export function translate(key: string, params?: Record<string, string | number>, locale: Locale = resolveLocale()): string {
  const entry = STRINGS[key];
  const template = entry ? entry[locale] : key;
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_match, name: string) => String(params[name] ?? `{${name}}`));
}

export interface I18n {
  locale: Locale;
  t: (key: string, params?: Record<string, string | number>) => string;
  formatTime: (date: Date) => string;
  formatDay: (date: Date) => string; // "sáb 21 nov" / "Sat, Nov 21"
  weekdayShort: (day: number) => string; // 0 = Sunday
}

const I18nContext = createContext<I18n | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const locales = useLocales();
  const calendars = useCalendars();
  const tag = locales[0]?.languageTag ?? 'en';
  const locale = localeFromCode(locales[0]?.languageCode);
  const uses24h = calendars[0]?.uses24hourClock;

  const value = useMemo<I18n>(() => {
    const timeFormat = new Intl.DateTimeFormat(tag, {
      hour: '2-digit',
      minute: '2-digit',
      ...(typeof uses24h === 'boolean' ? { hour12: !uses24h } : {}),
    });
    const dayFormat = new Intl.DateTimeFormat(tag, { weekday: 'short', day: 'numeric', month: 'short' });
    const weekdayFormat = new Intl.DateTimeFormat(tag, { weekday: 'narrow' });
    return {
      locale,
      t: (key, params) => translate(key, params, locale),
      formatTime: (date) => timeFormat.format(date),
      formatDay: (date) => dayFormat.format(date).replace(/[.,]/g, '').replace(/\s+/g, ' ').trim(),
      // 2023-01-01 was a Sunday.
      weekdayShort: (day) => weekdayFormat.format(new Date(2023, 0, 1 + day)),
    };
  }, [tag, locale, uses24h]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18n {
  const value = useContext(I18nContext);
  if (!value) throw new Error('useI18n must be used inside <I18nProvider>');
  return value;
}
