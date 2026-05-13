/**
 * Normalize CMS-provided footer copy using known English seed strings from
 * `backend/src/cms/cms.service.ts`. Custom admin text that does not match
 * these defaults still flows through `pickLocalized`.
 */
import type { Locale, TFunction } from './I18nProvider';
import type { LocalizedString } from './pickLocalized';
import { pickLocalized } from './pickLocalized';
import { landingAnchorTranslationKey } from './marketingLandingAnchors';

export const CMS_DEFAULT_FOOTER_TAGLINE =
  'Plan, schedule and ship faster. PlanForge brings Gantt, WBS and the Critical Path Method into one calm, modern workspace.';

export const CMS_DEFAULT_SECONDARY_CTA_LABEL = 'See pricing →';

function normSpace(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

const FOOTER_COLUMN_EN_TO_KEY: Record<string, string> = {
  Product: 'marketing.footer.colProduct',
  Company: 'marketing.footer.colCompany',
  Resources: 'marketing.footer.colResources',
  Legal: 'marketing.footer.colLegal',
};

/** Default footer links with href "#" only — disambiguated by English label */
const FOOTER_HASH_LINK_EN_TO_KEY: Record<string, string> = {
  About: 'marketing.footer.about',
  Careers: 'marketing.footer.careers',
  Contact: 'marketing.footer.contact',
  Documentation: 'marketing.footer.documentation',
  'API reference': 'marketing.footer.apiReference',
  Status: 'marketing.footer.status',
  Privacy: 'marketing.footer.privacy',
  Terms: 'marketing.footer.terms',
  Security: 'marketing.footer.security',
};

export function resolveFooterTagline(
  locale: Locale,
  t: TFunction,
  raw: string | undefined,
): string {
  if (!raw) return '';
  if (normSpace(raw) === normSpace(CMS_DEFAULT_FOOTER_TAGLINE)) {
    return t('marketing.footer.tagline');
  }
  return pickLocalized(locale, raw as LocalizedString);
}

export function resolveFooterSecondaryCta(
  locale: Locale,
  t: TFunction,
  raw: string | undefined,
): string {
  if (!raw) return '';
  if (normSpace(raw) === normSpace(CMS_DEFAULT_SECONDARY_CTA_LABEL)) {
    return t('marketing.footer.secondaryCta');
  }
  return pickLocalized(locale, raw as LocalizedString);
}

export function resolveFooterColumnTitle(
  locale: Locale,
  t: TFunction,
  raw: string | undefined,
): string {
  if (!raw) return '';
  const key = FOOTER_COLUMN_EN_TO_KEY[raw.trim()];
  if (key) return t(key);
  return pickLocalized(locale, raw as LocalizedString);
}

export function resolveFooterLinkLabel(
  locale: Locale,
  t: TFunction,
  href: string,
  label: string,
): string {
  const anchorKey = landingAnchorTranslationKey(href);
  if (anchorKey) return t(anchorKey);

  const h = href.trim();
  if (h === '' || h === '#') {
    const key = FOOTER_HASH_LINK_EN_TO_KEY[normSpace(label)];
    if (key) return t(key);
  }

  return pickLocalized(locale, label as LocalizedString);
}
