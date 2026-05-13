import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { downloadAdminBillingCsv } from '../../features/admin/hooks';
import { useBillingDashboard } from '../../features/billing/BillingDashboardContext';
import { formatUsd } from '../../features/billing/billingFormat';
import { LineChart } from '../../components/admin/charts/LineChart';
import { BarChart } from '../../components/admin/charts/BarChart';
import { DonutChart } from '../../components/admin/charts/DonutChart';
import { useT } from '../../i18n/I18nProvider';

function Kpi({
  label,
  value,
  hint,
  trend,
}: {
  label: string;
  value: string;
  hint?: string;
  trend?: 'up' | 'down' | 'neutral';
}) {
  const trendCls =
    trend === 'up'
      ? 'text-emerald-600 dark:text-emerald-400'
      : trend === 'down'
        ? 'text-rose-600 dark:text-rose-400'
        : 'text-ink-400';
  return (
    <div className="flex flex-col gap-1 rounded-2xl px-1 py-2">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-500 dark:text-ink-400">
        {label}
      </p>
      <p className="text-2xl font-bold tabular-nums tracking-tight text-ink-900 dark:text-white md:text-3xl">
        {value}
      </p>
      {hint && (
        <p className={`text-xs font-medium tabular-nums ${trendCls}`}>{hint}</p>
      )}
    </div>
  );
}

export default function BillingOverviewPage() {
  const t = useT();
  const billing = useBillingDashboard();
  const b = billing.data;
  const dash = t('common.none');

  const lineLabels = (b?.mrrTrend ?? []).map((p) => p.date.slice(5));
  const trialsOpen = useMemo(
    () =>
      (b?.workspaces ?? []).filter(
        (w) => w.trialEndsAt && new Date(w.trialEndsAt).getTime() > Date.now(),
      ).length,
    [b?.workspaces],
  );

  const refundTotal = useMemo(
    () => (b?.refunds ?? []).reduce((s, r) => s + r.amountUsd, 0),
    [b?.refunds],
  );

  const conversionPct = useMemo(() => {
    const dist = b?.planDistribution;
    if (!dist) return null;
    const paid = dist.pro + dist.enterprise;
    const tot = dist.free + paid;
    if (!tot) return null;
    return (paid / tot) * 100;
  }, [b?.planDistribution]);

  const revenueGrowthHint = useMemo(() => {
    const pts = b?.mrrTrend ?? [];
    if (pts.length < 2) return null;
    const first = pts[0]?.paymentCashUsd ?? 0;
    const last = pts[pts.length - 1]?.paymentCashUsd ?? 0;
    if (!first) return last ? t('billingOv.cashAccelerating') : null;
    const pct = ((last - first) / first) * 100;
    const pctStr = `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
    return `${pctStr} ${t('billingOv.cashVelVsWindow')}`;
  }, [b?.mrrTrend, t]);

  const barItems = (b?.revenueByWorkspace ?? []).slice(0, 8).map((x, i) => ({
    label: x.name.length > 14 ? `${x.name.slice(0, 13)}…` : x.name,
    value: x.revenue30dUsd,
    color: ['#6366f1', '#22c55e', '#f59e0b', '#94a3b8', '#ec4899', '#06b6d4', '#a855f7', '#14b8a6'][i % 8],
    hint: `${x.name}: ${formatUsd(x.revenue30dUsd)}`,
  }));

  const totalWs =
    (b?.planDistribution.free ?? 0) +
    (b?.planDistribution.pro ?? 0) +
    (b?.planDistribution.enterprise ?? 0);

  return (
    <div className="space-y-10 animate-fade-in-up">
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(260px,360px)]">
        <div className="rounded-3xl bg-gradient-to-br from-white via-white to-ink-50/90 p-8 shadow-[0_24px_80px_-32px_rgba(15,23,42,0.35)] ring-1 ring-ink-900/[0.06] dark:from-ink-900 dark:via-ink-950 dark:to-ink-950 dark:ring-white/[0.08]">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-ink-500 dark:text-ink-400">{t('billingOv.netMrrEyebrow')}</p>
              <p className="mt-2 text-4xl font-bold tabular-nums tracking-tight text-ink-950 dark:text-white md:text-5xl">
                {b ? formatUsd(b.mrrTotalUsd) : dash}
              </p>
              <p className="mt-2 max-w-xl text-sm text-ink-600 dark:text-ink-300">
                {t('billingOv.intro')}{' '}
                <span className="font-medium text-ink-900 dark:text-ink-100">
                  {t('billingOv.arrLine', { amount: b ? formatUsd(b.arrTotalUsd) : dash })}
                </span>
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-full border border-ink-200 bg-white/80 px-3 py-1.5 text-[11px] font-semibold text-ink-800 backdrop-blur hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-ink-100"
                onClick={() => void downloadAdminBillingCsv('invoices')}
              >
                {t('billingOv.exportInvoices')}
              </button>
              <button
                type="button"
                className="rounded-full border border-ink-200 bg-white/80 px-3 py-1.5 text-[11px] font-semibold text-ink-800 backdrop-blur hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-ink-100"
                onClick={() => void downloadAdminBillingCsv('payments')}
              >
                {t('billingOv.exportPayments')}
              </button>
              <Link
                to="/dashboard/billing/analytics"
                className="rounded-full bg-brand-600 px-3 py-1.5 text-[11px] font-semibold text-white shadow-soft hover:bg-brand-700"
              >
                {t('billingOv.openAnalytics')}
              </Link>
            </div>
          </div>

          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi
              label={t('billingOv.kpiActiveSubs')}
              value={b ? String(b.breakdown.payingAccountCount) : dash}
              hint={t('billingOv.kpiBillableSeats', { n: b?.payingSeatCount ?? dash })}
            />
            <Kpi label={t('billingOv.kpiTrialsLive')} value={String(trialsOpen)} hint={t('billingOv.kpiTrialsHint')} />
            <Kpi
              label={t('billingOv.kpiChurn')}
              value={b ? `${b.breakdown.churnRateMonthlyPct}%` : dash}
              hint={t('billingOv.kpiChurnHint')}
              trend="neutral"
            />
            <Kpi
              label={t('billingOv.kpiFailedPay')}
              value={String(b?.failedPayments.length ?? dash)}
              hint={t('billingOv.kpiFailedHint')}
              trend={(b?.failedPayments.length ?? 0) > 0 ? 'down' : 'neutral'}
            />
          </div>

          <div className="mt-10 grid gap-8 border-t border-ink-100 pt-10 dark:border-white/[0.06] sm:grid-cols-2 lg:grid-cols-4">
            <Kpi
              label={t('billingOv.kpiConversion')}
              value={conversionPct != null ? `${conversionPct.toFixed(1)}%` : dash}
              hint={t('billingOv.kpiConversionHint')}
            />
            <Kpi
              label={t('billingOv.kpiCashVel')}
              value={revenueGrowthHint ?? dash}
              hint={t('billingOv.kpiCashVelTrailing')}
            />
            <Kpi
              label={t('billingOv.kpiArpu')}
              value={b ? formatUsd(b.breakdown.arpuUsd) : dash}
              hint={t('billingOv.kpiArpuHint')}
            />
            <Kpi
              label={t('billingOv.kpiLtv')}
              value={b ? formatUsd(b.breakdown.ltvEstimateUsd, 0) : dash}
              hint={t('billingOv.kpiLtvHint')}
            />
          </div>
        </div>

        <aside className="flex min-w-0 flex-col justify-between overflow-hidden rounded-3xl bg-ink-900 p-6 text-white shadow-xl dark:bg-black dark:ring-1 dark:ring-white/10">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
              {t('billingOv.subHealth')}
            </p>
            <p className="mt-3 text-3xl font-bold tabular-nums">{totalWs || dash}</p>
            <p className="text-sm text-white/70">{t('billingOv.wsOnPlatform')}</p>
          </div>
          <div className="mt-6 w-full min-w-0">
            {billing.isLoading ? (
              <div className="mx-auto aspect-square w-full max-w-[220px] rounded-full bg-white/10 skeleton" />
            ) : (
              <DonutChart
                legendPlacement="below"
                tone="dark"
                thickness={20}
                centerLabel={totalWs ? String(totalWs) : '0'}
                centerSubLabel={t('billingOv.mixLabel')}
                slices={[
                  { label: 'Free', value: b?.planDistribution.free ?? 0, color: '#94a3b8' },
                  { label: 'Pro', value: b?.planDistribution.pro ?? 0, color: '#818cf8' },
                  { label: 'Enterprise', value: b?.planDistribution.enterprise ?? 0, color: '#fbbf24' },
                ]}
              />
            )}
          </div>
          <div className="mt-4 space-y-2 border-t border-white/10 pt-4 text-[11px] text-white/65">
            <div className="flex justify-between">
              <span>{t('billingOv.refundsLedger')}</span>
              <span className="font-semibold tabular-nums text-white">{formatUsd(refundTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>{t('billingOv.entContracts')}</span>
              <span className="font-semibold tabular-nums text-white">
                {(b?.enterpriseContracts ?? []).length}
              </span>
            </div>
          </div>
        </aside>
      </section>

      {b && b.alerts.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-ink-900 dark:text-white">{t('billingOv.operationalSignals')}</h2>
          <div className="grid gap-2 md:grid-cols-2">
            {b.alerts.slice(0, 6).map((a) => (
              <div
                key={a.id}
                className={`rounded-2xl px-4 py-3 text-sm ring-1 ${
                  a.level === 'critical'
                    ? 'bg-rose-50 ring-rose-100 text-rose-950 dark:bg-rose-500/10 dark:ring-rose-500/25 dark:text-rose-50'
                    : a.level === 'warning'
                      ? 'bg-amber-50 ring-amber-100 text-amber-950 dark:bg-amber-500/10 dark:ring-amber-500/25 dark:text-amber-50'
                      : 'bg-sky-50 ring-sky-100 text-sky-950 dark:bg-sky-500/10 dark:ring-sky-500/25 dark:text-sky-50'
                }`}
              >
                <div className="font-semibold">{a.title}</div>
                <p className="mt-1 text-xs opacity-90">{a.body}</p>
                {a.workspaceId && (
                  <Link
                    to={`/dashboard/billing/subscriptions?drawer=${a.workspaceId}`}
                    className="mt-2 inline-block text-xs font-semibold text-brand-700 underline dark:text-brand-300"
                  >
                    {t('billingOv.openSubscription')}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl bg-white/90 p-6 shadow-soft ring-1 ring-ink-900/[0.05] dark:bg-ink-900/40 dark:ring-white/[0.06]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-ink-900 dark:text-white">{t('billingOv.cashVsInvoicedTitle')}</h3>
              <p className="text-xs text-ink-500 dark:text-ink-400">{t('billingOv.cashVsInvoicedSub')}</p>
            </div>
          </div>
          <div className="mt-6 min-h-[240px]">
            {billing.isLoading ? (
              <div className="skeleton h-[240px] w-full rounded-2xl dark:bg-ink-800" />
            ) : (
              <LineChart
                labels={lineLabels}
                yLabelFormatter={(n) => formatUsd(n, 0)}
                series={[
                  {
                    key: 'pay',
                    label: t('billingOv.seriesPayments'),
                    color: '#22c55e',
                    values: (b?.mrrTrend ?? []).map((p) => p.paymentCashUsd),
                  },
                  {
                    key: 'inv',
                    label: t('billingOv.seriesInvoices'),
                    color: '#6366f1',
                    values: (b?.mrrTrend ?? []).map((p) => p.invoiceIssuedUsd),
                  },
                ]}
              />
            )}
          </div>
        </div>

        <div className="rounded-3xl bg-white/90 p-6 shadow-soft ring-1 ring-ink-900/[0.05] dark:bg-ink-900/40 dark:ring-white/[0.06]">
          <h3 className="text-sm font-semibold text-ink-900 dark:text-white">{t('billingOv.topWsCashTitle')}</h3>
          <p className="text-xs text-ink-500 dark:text-ink-400">{t('billingOv.topWsCashSub')}</p>
          <div className="mt-6">
            {billing.isLoading ? (
              <div className="skeleton h-[220px] w-full rounded-2xl dark:bg-ink-800" />
            ) : (
              <BarChart
                items={
                  barItems.length
                    ? barItems
                    : [{ label: dash, value: 1, color: '#334155' }]
                }
              />
            )}
          </div>
        </div>
      </section>

      {b?.disclaimer && (
        <p className="text-center text-[11px] leading-relaxed text-ink-400 dark:text-ink-500">
          {b.disclaimer}
        </p>
      )}
    </div>
  );
}
