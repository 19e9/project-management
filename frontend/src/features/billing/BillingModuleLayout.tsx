import { useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useSearchParams } from 'react-router-dom';
import { BillingDashboardProvider, useBillingDashboard } from './BillingDashboardContext';
import { WorkspaceBillingDrawer } from './WorkspaceBillingDrawer';

const STORAGE_THEME = 'planforge-billing-theme';

const NAV = [
  { to: '/dashboard/billing/overview', label: 'Overview' },
  { to: '/dashboard/billing/subscriptions', label: 'Subscriptions' },
  { to: '/dashboard/billing/plans', label: 'Plans' },
  { to: '/dashboard/billing/invoices', label: 'Invoices' },
  { to: '/dashboard/billing/payments', label: 'Payments' },
  { to: '/dashboard/billing/refunds', label: 'Refunds' },
  { to: '/dashboard/billing/enterprise', label: 'Enterprise' },
  { to: '/dashboard/billing/analytics', label: 'Analytics' },
  { to: '/dashboard/billing/settings', label: 'Settings' },
] as const;

function BillingShellBody() {
  const billing = useBillingDashboard();
  const [params, setParams] = useSearchParams();
  const drawerWs = params.get('drawer');

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light';
    const saved = window.localStorage.getItem(STORAGE_THEME) as 'light' | 'dark' | null;
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_THEME, theme);
  }, [theme]);

  const plansMin = useMemo(
    () =>
      (billing.data?.plans ?? []).map((p) => ({
        id: p.id,
        displayName: p.displayName,
        key: p.key,
        isActive: p.isActive,
      })),
    [billing.data?.plans],
  );

  function closeDrawer() {
    const next = new URLSearchParams(params);
    next.delete('drawer');
    setParams(next, { replace: true });
  }

  return (
    <div
      className={`billing-module-root min-h-[calc(100vh-8rem)] ${theme === 'dark' ? 'dark' : ''}`}
    >
      <div className="rounded-[2rem] bg-gradient-to-b from-ink-50 via-white to-ink-50/80 pb-12 ring-1 ring-ink-900/[0.04] dark:from-ink-950 dark:via-ink-950 dark:to-ink-950 dark:ring-white/[0.06]">
        <header className="border-b border-ink-100 px-5 py-8 sm:px-10 dark:border-white/[0.06]">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-2xl space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-500 dark:text-ink-400">
                Revenue operations
              </p>
              <h1 className="text-3xl font-bold tracking-tight text-ink-900 dark:text-white md:text-4xl">
                Billing
              </h1>
              <p className="text-sm leading-relaxed text-ink-600 dark:text-ink-300">
                Executive cockpit for subscriptions, cash collection, and plan economics — modular views
                over the same <span className="font-mono text-xs text-brand-700 dark:text-brand-300">GET /admin/billing</span>{' '}
                ledger.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="rounded-full border border-ink-200 bg-white px-4 py-2 text-xs font-semibold text-ink-800 shadow-soft hover:bg-ink-50 dark:border-white/10 dark:bg-ink-900 dark:text-ink-100 dark:hover:bg-white/5"
                onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
              >
                {theme === 'dark' ? 'Light mode' : 'Dark mode'}
              </button>
              <button
                type="button"
                className="rounded-full bg-ink-900 px-4 py-2 text-xs font-semibold text-white shadow-soft hover:bg-ink-800 dark:bg-white dark:text-ink-950 dark:hover:bg-ink-100"
                onClick={() => void billing.refetch()}
              >
                Refresh data
              </button>
            </div>
          </div>

          <nav className="mt-8 flex gap-1 overflow-x-auto pb-1 scrollbar-none">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `whitespace-nowrap rounded-full px-3.5 py-2 text-xs font-semibold transition ${
                    isActive
                      ? 'bg-ink-900 text-white shadow-soft dark:bg-white dark:text-ink-950'
                      : 'text-ink-600 hover:bg-white hover:text-ink-900 dark:text-ink-400 dark:hover:bg-white/10 dark:hover:text-white'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </header>

        <div className="px-5 py-8 sm:px-10">
          {billing.isError && (
            <div
              className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-100"
              role="alert"
            >
              {billing.error instanceof Error ? billing.error.message : 'Could not load billing data.'}
            </div>
          )}
          <Outlet />
        </div>
      </div>

      {drawerWs ? (
        <WorkspaceBillingDrawer workspaceId={drawerWs} plans={plansMin} onClose={closeDrawer} />
      ) : null}
    </div>
  );
}

export default function BillingModuleLayout() {
  return (
    <BillingDashboardProvider>
      <BillingShellBody />
    </BillingDashboardProvider>
  );
}
