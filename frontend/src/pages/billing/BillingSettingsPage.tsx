import { downloadAdminBillingCsv } from '../../features/admin/hooks';
import { useBillingDashboard } from '../../features/billing/BillingDashboardContext';
import { useAdminPlatformSettings } from '../../features/admin/hooks';

export default function BillingSettingsPage() {
  const billing = useBillingDashboard();
  const settings = useAdminPlatformSettings();

  return (
    <div className="space-y-8 animate-fade-in-up">
      <header>
        <h2 className="text-xl font-bold text-ink-900 dark:text-white">Billing configuration</h2>
        <p className="mt-1 max-w-3xl text-sm text-ink-600 dark:text-ink-400">
          Provider wiring, retry posture, and monetization guardrails. Sensitive secrets stay in environment
          variables — UI surfaces read-only health checks.
        </p>
      </header>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl bg-white p-6 shadow-soft ring-1 ring-ink-900/[0.05] dark:bg-ink-900/50 dark:ring-white/[0.06]">
          <h3 className="text-sm font-semibold text-ink-900 dark:text-white">Stripe connectivity</h3>
          <ul className="mt-4 space-y-3 text-sm text-ink-600 dark:text-ink-300">
            <li className="flex justify-between gap-4 border-b border-ink-100 pb-2 dark:border-white/[0.06]">
              <span>Webhook signing secret</span>
              <span className="font-mono text-xs text-ink-400">STRIPE_WEBHOOK_SECRET</span>
            </li>
            <li className="flex justify-between gap-4 border-b border-ink-100 pb-2 dark:border-white/[0.06]">
              <span>Publishable key</span>
              <span className="font-mono text-xs text-ink-400">STRIPE_PUBLISHABLE_KEY</span>
            </li>
            <li className="flex justify-between gap-4">
              <span>API base</span>
              <span className="font-mono text-xs text-ink-400">{settings.data?.api.publicBaseUrl ?? '—'}</span>
            </li>
          </ul>
          <p className="mt-4 text-xs text-ink-500 dark:text-ink-400">
            Configure retry ladders &amp; smart dunning inside Stripe Billing — mirrored here via webhook events.
          </p>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-soft ring-1 ring-ink-900/[0.05] dark:bg-ink-900/50 dark:ring-white/[0.06]">
          <h3 className="text-sm font-semibold text-ink-900 dark:text-white">Tax &amp; currency</h3>
          <p className="mt-3 text-sm text-ink-600 dark:text-ink-300">
            Ledger currency <span className="font-semibold">{billing.data?.currency ?? 'USD'}</span>. Regional
            pricing tables plug into plan cards — Avalara / Stripe Tax toggles land behind feature flags.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-full border border-ink-200 px-3 py-1.5 text-xs font-semibold dark:border-white/10"
              onClick={() => void downloadAdminBillingCsv('monthly-report')}
            >
              Download finance CSV
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-soft ring-1 ring-ink-900/[0.05] dark:bg-ink-900/50 dark:ring-white/[0.06]">
        <h3 className="text-sm font-semibold text-ink-900 dark:text-white">Operational templates</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {[
            ['Invoice branding', 'Logo, legal footer, PO instructions'],
            ['Email cadences', 'Receipt, dunning, churn-save sequences'],
            ['Automation rules', 'Grace periods & seat reconciliation'],
          ].map(([title, note]) => (
            <div key={title} className="rounded-2xl bg-ink-50/80 p-4 dark:bg-white/[0.03]">
              <p className="text-sm font-semibold text-ink-900 dark:text-white">{title}</p>
              <p className="mt-2 text-xs text-ink-600 dark:text-ink-400">{note}</p>
            </div>
          ))}
        </div>
      </section>

      <p className="text-[11px] text-ink-400 dark:text-ink-500">
        Pro seat reference rate from platform settings:{' '}
        <span className="font-mono">
          {settings.data
            ? `$${settings.data.product.billingProSeatUsdMonthly}/seat/mo`
            : '—'}
        </span>
      </p>
    </div>
  );
}
