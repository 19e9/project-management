import type { To } from 'react-router-dom';

function isExternalHref(href: string): boolean {
  const h = href.trim();
  return /^https?:\/\//i.test(h) || h.startsWith('//');
}

/**
 * React Router v6 does not scroll to document fragments after SPA navigation when
 * `to` is the string `"/#id"`. Use `{ pathname: '/', hash: '#id' }` instead.
 */
export function marketingNavTo(href: string): To | string {
  const h = href.trim();
  if (!h || isExternalHref(h)) return h;

  if (h.startsWith('/#')) {
    const rest = h.slice(2);
    if (rest && !rest.includes('/')) {
      return { pathname: '/', hash: `#${rest}` };
    }
  }

  if (h.startsWith('#') && h.length > 1) {
    return { pathname: '/', hash: h };
  }

  return h;
}
