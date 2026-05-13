import type { Locale } from './I18nProvider';

/**
 * CMS / API content may evolve to `{ tr, en }` fields. Plain strings stay supported.
 */
export type LocalizedString = string | { tr?: string; en?: string };

export function pickLocalized(
  locale: Locale,
  value: LocalizedString | null | undefined,
): string {
  if (value == null || value === '') return '';
  if (typeof value === 'string') return value;
  const loc = locale === 'tr' ? 'tr' : 'en';
  return (loc === 'tr' ? value.tr : value.en) ?? value.en ?? value.tr ?? '';
}