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

/** Nested message tree (locale files share shape but not literal string types). */
type Msg = string | { [k: string]: Msg };
const dicts: Record<'tr' | 'en', Msg> = { tr, en };

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
  locale: 'tr' | 'en';
  setLocale: (l: 'tr' | 'en') => void;
  t: (key: string) => string;
};

const Ctx = createContext<I18nCtx | null>(null);

const STORAGE = 'locale';

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<'tr' | 'en'>(() => {
    try {
      const s = localStorage.getItem(STORAGE);
      if (s === 'en' || s === 'tr') return s;
    } catch {
      /* ignore */
    }
    return 'tr';
  });

  useEffect(() => {
    document.documentElement.lang = locale;
    try {
      localStorage.setItem(STORAGE, locale);
    } catch {
      /* ignore */
    }
  }, [locale]);

  const setLocale = useCallback((l: 'tr' | 'en') => setLocaleState(l), []);

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
