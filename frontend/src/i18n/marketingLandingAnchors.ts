/** Sync with backend seed `cms.service.ts` landing hash targets */
const LANDING_NAV_FRAGMENT_TO_I18N: Record<string, string> = {
  features: 'marketing.nav.features',
  how: 'marketing.nav.howItWorks',
  pricing: 'marketing.nav.pricing',
  proof: 'marketing.nav.customers',
};

/** Returns i18n key for known marketing section anchors (#features, /#pricing, …). */
export function landingAnchorTranslationKey(href: string): string | null {
  const trimmed = href.trim();
  let fragment = '';
  try {
    if (/^https?:\/\//i.test(trimmed)) {
      fragment = new URL(trimmed).hash.slice(1);
    } else {
      const idx = trimmed.indexOf('#');
      fragment = idx >= 0 ? trimmed.slice(idx + 1) : '';
    }
  } catch {
    return null;
  }
  const id = fragment.split(/[?&]/)[0].toLowerCase();
  return id ? LANDING_NAV_FRAGMENT_TO_I18N[id] ?? null : null;
}
