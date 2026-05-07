import { useBillingDashboard } from '../../features/billing/BillingDashboardContext';
import { BillingLedgerTable } from '../../components/billing/BillingLedgerTable';
import { formatUsd } from '../../features/billing/billingFormat';

export default function BillingRefundsPage() {
  const billing = useBillingDashboard();
  const refunds = billing.data?.refunds ?? [];

  const analytics = {
    total: refunds.reduce((s, r) => s + r.amountUsd, 0),
    count: refunds.length,
    avg: refunds.length ? refunds.reduce((s, r) => s + r.amountUsd, 0) / refunds.length : 0,
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <header>
        <h2 className="text-xl font-bold text-ink-900 dark:text-white">Refunds</h2>
        <p className="mt-1 text-sm text-ink-600 dark:text-ink-400">
          Issuance history linked to originating payments — partial refunds roll up here as separate rows.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl bg-white p-5 shadow-soft ring-1 ring-ink-900/[0.05] dark:bg-ink-900/50 dark:ring-white/[0.06]">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">Volume</p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-ink-900 dark:text-white">
            {formatUsd(analytics.total)}
          </p>
        </div>
        <div className="rounded-3xl bg-white p-5 shadow-soft ring-1 ring-ink-900/[0.05] dark:bg-ink-900/50 dark:ring-white/[0.06]">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">Count</p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-ink-900 dark:text-white">
            {analytics.count}
          </p>
        </div>
        <div className="rounded-3xl bg-white p-5 shadow-soft ring-1 ring-ink-900/[0.05] dark:bg-ink-900/50 dark:ring-white/[0.06]">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">Avg ticket</p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-ink-900 dark:text-white">
            {formatUsd(analytics.avg)}
          </p>
        </div>
      </div>

      <BillingLedgerTable
        title="Refund register"
        subtitle="Payment linkage · Workspace scope"
        loading={billing.isLoading}
        cols={['Workspace ref', 'Amount', 'Status', 'Reason', 'Created']}
        rows={refunds.map((r) => ({
          key: r.id,
          cells: [
            r.workspaceId.slice(-8),
            formatUsd(r.amountUsd),
            r.status,
            r.reason ?? '—',
            new Date(r.createdAt).toLocaleString(),
          ],
        }))}
      />
    </div>
  );
}
