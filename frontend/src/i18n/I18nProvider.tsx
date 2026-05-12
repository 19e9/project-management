import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import tr from './locales/tr';
import en from './locales/en';
import es from './locales/es';
import it from './locales/it';

/** Nested message tree (locale files share shape but not literal string types). */
type Msg = string | { [k: string]: Msg };
export type Locale = 'en' | 'tr' | 'es' | 'it';
export const localeOptions: Array<{ code: Locale; label: string; shortLabel: string }> = [
  { code: 'en', label: 'English', shortLabel: 'EN' },
  { code: 'tr', label: 'Turkish', shortLabel: 'TR' },
  { code: 'es', label: 'Spanish', shortLabel: 'ES' },
  { code: 'it', label: 'Italian', shortLabel: 'IT' },
];
const dicts: Record<Locale, Msg> = { en, tr, es, it };

function lookup(dict: Msg, key: string): string | undefined {
  const parts = key.split('.');
  let cur: unknown = dict;
  for (const p of parts) {
    if (cur && typeof cur === 'object' && p in cur) {
      cur = (cur as Record<string, unknown>)[p];
    } else {
      return undefined;
    }
  }
  return typeof cur === 'string' ? cur : undefined;
}

type I18nCtx = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
};

const Ctx = createContext<I18nCtx | null>(null);

const STORAGE = 'locale';

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    try {
      const s = localStorage.getItem(STORAGE);
      if (isLocale(s)) return s;
    } catch {
      /* ignore */
    }
    return 'en';
  });

  useEffect(() => {
    document.documentElement.lang = locale;
    try {
      localStorage.setItem(STORAGE, locale);
    } catch {
      /* ignore */
    }
  }, [locale]);

  const setLocale = useCallback((l: Locale) => setLocaleState(l), []);

  const t = useCallback(
    (key: string) => {
      let out = lookup(dicts[locale], key);
      if (out === undefined) out = lookup(dicts.en, key);
      if (out === undefined && import.meta.env.DEV) {
        console.warn(`[i18n] missing key: ${key}`);
      }
      return out ?? key;
    },
    [locale],
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useT(): I18nCtx['t'] {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useT must be used within I18nProvider');
  return ctx.t;
}

export function useI18n(): I18nCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}

function isLocale(value: string | null): value is Locale {
  return localeOptions.some((option) => option.code === value);
}
