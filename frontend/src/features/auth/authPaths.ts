import { tokens } from '../../lib/api-client';

/** Default post-auth destination */
export const APP_HOME_PATH = '/dashboard' as const;

/**
 * Landing / Logo home target:
 * — signed-in → app shell
 * — session rehydrating (token present, `/me` in flight) → app shell to avoid flashing public UI
 */
export function resolveMarketingHomePath(
  user: { id: string } | null,
  authLoading: boolean,
): typeof APP_HOME_PATH | '/' {
  if (user) return APP_HOME_PATH;
  if (authLoading && tokens.getAccess()) return APP_HOME_PATH;
  return '/';
}

/** Navbar / landing: treat as signed-in (incl. session bootstrap with token present). */
export function showMarketingAsAuthenticated(user: { id: string } | null, authLoading: boolean): boolean {
  return !!user || (!!tokens.getAccess() && authLoading);
}
