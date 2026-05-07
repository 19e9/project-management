import { useMemo } from 'react';
import { useBillingDashboard } from '../../features/billing/BillingDashboardContext';
import { formatUsd } from '../../features/billing/billingFormat';
import { LineChart } from '../../components/admin/charts/LineChart';
import { BarChart } from '../../components/admin/charts/BarChart';

export default function BillingAnalyticsPage() {
  const billing = useBillingDashboard();
  const b = billing.data;

  const labels = (b?.mrrTrend ?? []).map((p) => p.date.slice(5));

  const funnel = useMemo(() => {
    const dist = b?.planDistribution;
    if (!dist) return [];
    return [
      { label: 'Free', value: dist.free, color: '#94a3b8' },
      { label: 'Pro', value: dist.pro, color: '#6366f1' },
      { label: 'Enterprise', value: dist.enterprise, color: '#f59e0b' },
    ];
  }, [b?.planDistribution]);

  const topWs = (b?.revenueByWorkspace ?? []).slice(0, 6).map((x, i) => ({
    label: x.name.length > 16 ? `${x.name.slice(0, 15)}…` : x.name,
    value: x.revenue30dUsd,
    color: ['#6366f1', '#22c55e', '#f59e0b', '#94a3b8', '#ec4899', '#06b6d4'][i],
    hint: `${x.name}: ${formatUsd(x.revenue30dUsd)}`,
  }));

  return (
    <div className="space-y-8 animate-fade-in-up">
      <header>
        <h2 className="text-xl font-bold text-ink-900 dark:text-white">Financial analytics</h2>
        <p className="mt-1 max-w-3xl text-sm text-ink-600 dark:text-ink-400">
          Executive-grade charts backed by the billing ledger. Cohort & LTV curves extend automatically as event
          volume grows.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ['MRR Δ (window)', b ? formatUsd(b.breakdown.netMrrChangeUsd) : '—'],
          ['Expansion', b ? formatUsd(b.breakdown.expansionMrrUsd) : '—'],
          ['New', b ? formatUsd(b.breakdown.newMrrUsd) : '—'],
          ['Churn MRR', b ? formatUsd(b.breakdown.churnedMrrUsd) : '—'],
        ].map(([label, val]) => (
          <div
            key={label}
            className="rounded-3xl bg-white p-5 shadow-soft ring-1 ring-ink-900/[0.05] dark:bg-ink-900/50 dark:ring-white/[0.06]"
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-500 dark:text-ink-400">
              {label}
            </p>
            <p className="mt-2 text-xl font-bold tabular-nums text-ink-900 dark:text-white">{val}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl bg-white p-6 shadow-soft ring-1 ring-ink-900/[0.05] dark:bg-ink-900/40 dark:ring-white/[0.06]">
          <h3 className="text-sm font-semibold text-ink-900 dark:text-white">Net revenue trend</h3>
          <p className="text-xs text-ink-500 dark:text-ink-400">Payments vs invoices · trailing sample</p>
          <div className="mt-4 min-h-[220px]">
            {billing.isLoading ? (
              <div className="skeleton h-[220px] w-full rounded-2xl dark:bg-ink-800" />
            ) : (
              <LineChart
                labels={labels}
                yLabelFormatter={(n) => formatUsd(n, 0)}
                series={[
                  {
                    key: 'cash',
                    label: 'Cash',
                    color: '#22c55e',
                    values: (b?.mrrTrend ?? []).map((p) => p.paymentCashUsd),
                  },
                  {
                    key: 'inv',
                    label: 'Invoiced',
                    color: '#6366f1',
                    values: (b?.mrrTrend ?? []).map((p) => p.invoiceIssuedUsd),
                  },
                ]}
              />
            )}
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-soft ring-1 ring-ink-900/[0.05] dark:bg-ink-900/40 dark:ring-white/[0.06]">
          <h3 className="text-sm font-semibold text-ink-900 dark:text-white">Subscription funnel</h3>
          <p className="text-xs text-ink-500 dark:text-ink-400">Plan distribution snapshot</p>
          <div className="mt-6">
            <BarChart items={funnel.length ? funnel : [{ label: '—', value: 1, color: '#475569' }]} />
          </div>
        </div>
      </div>

      <div className="rounded-3xl bg-white p-6 shadow-soft ring-1 ring-ink-900/[0.05] dark:bg-ink-900/40 dark:ring-white/[0.06]">
        <h3 className="text-sm font-semibold text-ink-900 dark:text-white">Top paying workspaces</h3>
        <p className="text-xs text-ink-500 dark:text-ink-400">Seat growth overlays sync when HRIS connectors ship</p>
        <div className="mt-6">
          <BarChart items={topWs.length ? topWs : [{ label: '—', value: 1, color: '#334155' }]} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          ['Trial → paid', 'Coming soon · Stripe trial hooks'],
          ['Cohort retention', 'Placeholder · requires event warehouse'],
          ['Seat growth index', 'Derived from membership ledger'],
        ].map(([title, note]) => (
          <div
            key={title}
            className="rounded-3xl border border-dashed border-ink-200 p-5 text-sm dark:border-white/10"
          >
            <p className="font-semibold text-ink-900 dark:text-white">{title}</p>
            <p className="mt-2 text-xs text-ink-500 dark:text-ink-400">{note}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
