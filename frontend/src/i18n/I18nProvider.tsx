import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import en from './locales/en.json';
import tr from './locales/tr.json';
import es from './locales/es';
import it from './locales/it';
import { hasUiPhrase, translateUiPhrase } from './uiPhrases';

/** Nested message tree */
type Msg = string | { [k: string]: Msg };

export type Locale = 'en' | 'tr' | 'es' | 'it';

export const localeOptions: Array<{ code: Locale; label: string; shortLabel: string }> = [
  { code: 'en', label: 'English', shortLabel: 'EN' },
  { code: 'tr', label: 'Turkish', shortLabel: 'TR' },
  { code: 'es', label: 'Spanish', shortLabel: 'SP' },
  { code: 'it', label: 'Italian', shortLabel: 'IT' },
];

const dicts: Record<Locale, Msg> = {
  en: en as Msg,
  tr: tr as Msg,
  es: es as Msg,
  it: it as Msg,
};

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

function interpolate(
  template: string,
  vars?: Record<string, string | number | boolean>,
): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, name: string) => {
    const v = vars[name];
    return v !== undefined && v !== null ? String(v) : `{${name}}`;
  });
}

export type TFunction = (key: string, vars?: Record<string, string | number | boolean>) => string;

type I18nCtx = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: TFunction;
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

  useEffect(() => {
    const translate = () => translateStaticUi(document.body, locale);
    translate();
    const observer = new MutationObserver(() => {
      window.requestAnimationFrame(translate);
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['placeholder', 'title', 'aria-label'],
    });
    return () => observer.disconnect();
  }, [locale]);

  const setLocale = useCallback((l: Locale) => setLocaleState(l), []);

  const t = useCallback<TFunction>(
    (key, vars) => {
      let out = lookup(dicts[locale], key);
      if (out === undefined) out = lookup(dicts.en, key);
      if (out === undefined && import.meta.env.DEV) {
        console.warn(`[i18n] missing key: ${key}`);
      }
      const base = out ?? key;
      return interpolate(base, vars);
    },
    [locale],
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useT(): TFunction {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useT must be used within I18nProvider');
  return ctx.t;
}

export function useI18n(): I18nCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}

export function useTranslation(): I18nCtx {
  return useI18n();
}

function isLocale(value: string | null): value is Locale {
  return localeOptions.some((option) => option.code === value);
}

const textOriginals = new WeakMap<Text, string>();
const attrOriginals = new WeakMap<Element, Map<string, string>>();
const textSkipParents = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'CODE', 'PRE']);
const attrNames = ['placeholder', 'title', 'aria-label'];

function translateStaticUi(root: HTMLElement, locale: Locale) {
  translateTextNodes(root, locale);
  translateAttributes(root, locale);
}

function translateTextNodes(root: HTMLElement, locale: Locale) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || textSkipParents.has(parent.tagName)) return NodeFilter.FILTER_REJECT;
      if (!node.nodeValue?.trim()) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const nodes: Text[] = [];
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);

  for (const node of nodes) {
    const value = node.nodeValue ?? '';
    const leading = value.match(/^\s*/)?.[0] ?? '';
    const trailing = value.match(/\s*$/)?.[0] ?? '';
    const trimmed = value.trim().replace(/\s+/g, ' ');
    const previousOriginal = textOriginals.get(node);
    const previousRendered = previousOriginal ? translateUiPhrase(previousOriginal, locale) : undefined;
    const original =
      previousOriginal && trimmed === previousRendered
        ? previousOriginal
        : hasUiPhrase(trimmed)
          ? trimmed
          : previousOriginal;

    if (!original || !hasUiPhrase(original)) continue;
    textOriginals.set(node, original);
    const next = `${leading}${translateUiPhrase(original, locale)}${trailing}`;
    if (node.nodeValue !== next) node.nodeValue = next;
  }
}

function translateAttributes(root: HTMLElement, locale: Locale) {
  const elements = [root, ...Array.from(root.querySelectorAll('*'))];
  for (const element of elements) {
    let originals = attrOriginals.get(element);
    for (const attr of attrNames) {
      const value = element.getAttribute(attr);
      if (!value) continue;
      const normalized = value.trim().replace(/\s+/g, ' ');
      const previousOriginal = originals?.get(attr);
      const previousRendered = previousOriginal ? translateUiPhrase(previousOriginal, locale) : undefined;
      const original =
        previousOriginal && normalized === previousRendered
          ? previousOriginal
          : hasUiPhrase(normalized)
            ? normalized
            : previousOriginal;
      if (!original || !hasUiPhrase(original)) continue;
      if (!originals) {
        originals = new Map();
        attrOriginals.set(element, originals);
      }
      originals.set(attr, original);
      const next = translateUiPhrase(original, locale);
      if (value !== next) element.setAttribute(attr, next);
    }
  }
}
