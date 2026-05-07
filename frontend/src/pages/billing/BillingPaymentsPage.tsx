import { useMemo, useState } from 'react';
import { BillingLedgerTable } from '../../components/billing/BillingLedgerTable';
import { useBillingDashboard } from '../../features/billing/BillingDashboardContext';
import { formatUsd } from '../../features/billing/billingFormat';
import { Link } from 'react-router-dom';

export default function BillingPaymentsPage() {
  const billing = useBillingDashboard();
  const [filter, setFilter] = useState<'all' | 'succeeded' | 'failed' | 'retry'>('all');

  const merged = useMemo(() => {
    const ok = billing.data?.payments ?? [];
    const fail = billing.data?.failedPayments ?? [];
    return { ok, fail };
  }, [billing.data?.payments, billing.data?.failedPayments]);

  const rows = useMemo(() => {
    if (filter === 'failed' || filter === 'retry') {
      return merged.fail.map((p) => ({ kind: 'fail' as const, p }));
    }
    const base = merged.ok.map((p) => ({ kind: 'ok' as const, p }));
    if (filter === 'all') {
      return [
        ...base,
        ...merged.fail.map((p) => ({ kind: 'fail' as const, p })),
      ];
    }
    return base.filter(({ p }) => p.status?.toLowerCase().includes('succeed'));
  }, [filter, merged]);

  return (
    <div className="space-y-6 animate-fade-in-up">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-ink-900 dark:text-white">Payments</h2>
          <p className="mt-1 text-sm text-ink-600 dark:text-ink-400">
            Stripe-shaped architecture: attempt records, retries, and reconciliation against invoices.
          </p>
        </div>
        <Link
          to="/dashboard/billing/settings"
          className="text-xs font-semibold text-brand-700 hover:underline dark:text-brand-300"
        >
          Webhook console →
        </Link>
      </header>

      <div className="flex flex-wrap gap-2">
        {(['all', 'succeeded', 'failed', 'retry'] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${
              filter === s
                ? 'bg-ink-900 text-white dark:bg-white dark:text-ink-950'
                : 'bg-white text-ink-600 ring-1 ring-ink-200 dark:bg-ink-900 dark:text-ink-300 dark:ring-white/10'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <BillingLedgerTable
        title="Payment attempts"
        subtitle="Includes failure queue · Times in local TZ"
        loading={billing.isLoading}
        cols={['Workspace', 'Status', 'Amount', 'Method', 'Attempts', 'When']}
        rows={rows.map(({ kind, p }) => ({
          key: p.id,
          cells: [
            p.workspaceName,
            p.status,
            formatUsd(p.amountUsd),
            p.method,
            kind === 'fail' ? String(p.attemptCount) : '1',
            p.settledAt ? new Date(p.settledAt).toLocaleString() : new Date(p.createdAt).toLocaleString(),
          ],
          action:
            kind === 'fail' ? (
              <button
                type="button"
                className="text-xs font-semibold text-brand-700 hover:underline dark:text-brand-300"
                onClick={() =>
                  alert(p.failureMessage ?? 'Configure Stripe webhook retries in Settings.')
                }
              >
                Details
              </button>
            ) : null,
        }))}
      />
    </div>
  );
}
