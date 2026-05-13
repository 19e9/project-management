/**
 * i18n entry — re-export for imports like `from '@/i18n/i18n'`.
 * Source of strings: `./locales/tr.json`, `./locales/en.json`.
 * CMS-managed copy can later expose `locale` fields (tr/en) consumed here.
 */

export type { TFunction } from './I18nProvider';
export { I18nProvider, useI18n, useT, useTranslation } from './I18nProvider';
export { LanguageSwitcher } from '../components/ui/LanguageSwitcher';
export { pickLocalized, type LocalizedString } from './pickLocalized';
