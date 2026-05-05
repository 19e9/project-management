import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  useAdminBilling,
  useAdminWorkspaceBillingDetail,
  useAssignWorkspacePlan,
  useCreateSubscriptionPlan,
  useDeactivateSubscriptionPlan,
  useUpdateSubscriptionPlan,
  useUpsertEnterpriseContract,
  downloadAdminBillingCsv,
  openInvoiceHtmlTab,
  type AdminBillingWorkspaceRow,
  type AdminSubscriptionPlanRow,
} from '../../features/admin/hooks';
import { StatsCard } from '../../components/admin/StatsCard';
import { DonutChart } from '../../components/admin/charts/DonutChart';
import { LineChart } from '../../components/admin/charts/LineChart';
import { BarChart } from '../../components/admin/charts/BarChart';
import { BillingWorkspacesTable } from '../../components/admin/BillingWorkspacesTable';

const money = (n: number, fraction = 2) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: fraction,
    minimumFractionDigits: fraction,
  }).format(n);

type IP = React.SVGProps<SVGSVGElement>;

function IconCard(p: IP) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 10h18" strokeLinecap="round" />
    </svg>
  );
}

function IconTrend(p: IP) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}>
      <path d="M4 16l5-5 4 4 6-6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 8h4v4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconSeat(p: IP) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}>
      <circle cx="12" cy="8" r="3" />
      <path d="M5 19c1-3 3.5-5 7-5s6 2 7 5" strokeLinecap="round" />
    </svg>
  );
}

function IconBriefcase(p: IP) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}>
      <path d="M9 8V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
      <rect x="4" y="8" width="16" height="12" rx="2" />
    </svg>
  );
}

type PlanFilter = 'all' | 'free' | 'pro' | 'enterprise';
type SortKey = 'mrr' | 'revenue' | 'created' | 'name';

function sortRows(
  rows: AdminBillingWorkspaceRow[],
  key: SortKey,
  dir: 'asc' | 'desc',
): AdminBillingWorkspaceRow[] {
  const m = dir === 'asc' ? 1 : -1;
  const cp = [...rows];
  cp.sort((a, b) => {
    if (key === 'name') return a.name.localeCompare(b.name) * m;
    if (key === 'mrr') return (a.mrrUsd - b.mrrUsd) * m;
    if (key === 'revenue') return (a.revenueLast30dUsd - b.revenueLast30dUsd) * m;
    return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * m;
  });
  return cp;
}

export default function AdminBillingPage() {
  const [search, setSearch] = useState('');
  const [qDebounced, setQDebounced] = useState('');
  const [planFilter, setPlanFilter] = useState<PlanFilter>('all');
  const [sortKey, setSortKey] = useState<SortKey>('mrr');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setQDebounced(search.trim()), 400);
    return () => window.clearTimeout(t);
  }, [search]);

  const billing = useAdminBilling({ limit: 120, q: qDebounced });
  const detail = useAdminWorkspaceBillingDetail(selectedWorkspaceId);
  const assignPlan = useAssignWorkspacePlan();
  const upsertContract = useUpsertEnterpriseContract();
  const createPlan = useCreateSubscriptionPlan();
  const updatePlan = useUpdateSubscriptionPlan();
  const deactivatePlan = useDeactivateSubscriptionPlan();

  const b = billing.data;

  const tableRows = useMemo(() => {
    let r = [...(b?.workspaces ?? [])];
    if (planFilter !== 'all') r = r.filter((w) => w.plan === planFilter);
    return sortRows(r, sortKey, sortDir);
  }, [b?.workspaces, planFilter, sortKey, sortDir]);

  const totalPlans =
    (b?.planDistribution.free ?? 0) +
    (b?.planDistribution.pro ?? 0) +
    (b?.planDistribution.enterprise ?? 0);

  const lineLabels = (b?.mrrTrend ?? []).map((p) => p.date.slice(5));
  const barItems = (b?.revenueByWorkspace ?? []).slice(0, 10).map((x, i) => ({
    label: x.name.length > 12 ? `${x.name.slice(0, 11)}…` : x.name,
    value: x.revenue30dUsd,
    color: ['#6366f1', '#22c55e', '#f59e0b', '#94a3b8', '#ec4899', '#06b6d4'][i % 6],
    hint: `${x.name}: ${money(x.revenue30dUsd)}`,
  }));

  const [newPlan, setNewPlan] = useState({
    key: '',
    displayName: '',
    tier: 'pro' as 'free' | 'pro' | 'enterprise',
    pricePerSeatMonthlyUsd: 12,
    maxMembers: 25,
    maxProjects: 25,
    storageLimitMb: 10240,
    ganttEnabled: true,
    cpmEnabled: true,
    auditLogEnabled: false,
  });

  const [contractForm, setContractForm] = useState({
    monthlyAmountUsd: 2500,
    contractStart: new Date().toISOString().slice(0, 10),
    contractEnd: '',
    trialEndsAt: '',
    notes: '',
    manualInvoiceUrls: '',
  });

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 px-4 pb-10 sm:px-6">
      <header className="pt-2">
        <p className="eyebrow text-brand-600">Platform administration</p>
        <h1 className="h-display text-2xl text-ink-900">Billing &amp; revenue</h1>
        <p className="mt-1 max-w-3xl text-sm text-ink-500">
          Ledger-backed invoices, payments, and refunds; MRR breakdown; workspace trends; dynamic plans;
          enterprise contracts; exports. Connect a payment provider to post real payment webhooks into the
          ledger.
        </p>
      </header>

      {billing.isError && (
        <div
          className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
          role="alert"
        >
          {billing.error instanceof Error ? billing.error.message : 'Could not load billing data.'}
        </div>
      )}

      {b && (
        <div className="rounded-xl border border-ink-200 bg-ink-50/60 px-4 py-3 text-sm text-ink-800">
          <span className="font-semibold text-ink-900">Disclaimer · </span>
          {b.disclaimer}
        </div>
      )}

      {b && b.alerts.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-ink-900">Alerts &amp; risk</h2>
          <ul className="space-y-2">
            {b.alerts.slice(0, 12).map((a) => (
              <li
                key={a.id}
                className={`flex flex-wrap items-start justify-between gap-2 rounded-lg border px-3 py-2 text-sm ${
                  a.level === 'critical'
                    ? 'border-rose-200 bg-rose-50 text-rose-950'
                    : a.level === 'warning'
                      ? 'border-amber-200 bg-amber-50 text-amber-950'
                      : 'border-sky-200 bg-sky-50 text-sky-950'
                }`}
              >
                <div>
                  <div className="font-semibold">{a.title}</div>
                  <div className="text-xs opacity-90">{a.body}</div>
                </div>
                {a.workspaceId && (
                  <button
                    type="button"
                    className="shrink-0 text-xs font-medium text-brand-700 underline"
                    onClick={() => setSelectedWorkspaceId(a.workspaceId!)}
                  >
                    Open workspace
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-xs font-medium text-ink-800 shadow-sm hover:bg-ink-50"
          onClick={() => void downloadAdminBillingCsv('invoices')}
        >
          Export invoices CSV
        </button>
        <button
          type="button"
          className="rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-xs font-medium text-ink-800 shadow-sm hover:bg-ink-50"
          onClick={() => void downloadAdminBillingCsv('payments')}
        >
          Export payments CSV
        </button>
        <button
          type="button"
          className="rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-xs font-medium text-ink-800 shadow-sm hover:bg-ink-50"
          onClick={() => void downloadAdminBillingCsv('monthly-report')}
        >
          Monthly summary CSV
        </button>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          label="MRR (platform)"
          value={b ? money(b.mrrTotalUsd, 2) : '—'}
          hint={b ? `${b.payingSeatCount} billable Pro seats` : undefined}
          accent="emerald"
          icon={<IconCard className="text-emerald-700" />}
        />
        <StatsCard
          label="ARR"
          value={b ? money(b.arrTotalUsd, 2) : '—'}
          hint="MRR × 12 (run-rate)"
          accent="brand"
          icon={<IconTrend className="text-brand-700" />}
        />
        <StatsCard
          label="Paying accounts"
          value={b ? b.breakdown.payingAccountCount.toLocaleString() : '—'}
          hint={b ? `${b.breakdown.windowDays}d window` : undefined}
          accent="cyan"
          icon={<IconBriefcase className="text-cyan-700" />}
        />
        <StatsCard
          label="Pro list / seat"
          value={b ? money(b.proSeatListUsd, 2) : '—'}
          hint="Seat × price on Pro workspaces"
          accent="amber"
          icon={<IconSeat className="text-amber-700" />}
        />
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">New MRR</div>
          <div className="mt-1 text-lg font-semibold tabular-nums text-ink-900">
            {b ? money(b.breakdown.newMrrUsd) : '—'}
          </div>
        </div>
        <div className="card p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">Expansion</div>
          <div className="mt-1 text-lg font-semibold tabular-nums text-emerald-800">
            {b ? money(b.breakdown.expansionMrrUsd) : '—'}
          </div>
        </div>
        <div className="card p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">Churned MRR</div>
          <div className="mt-1 text-lg font-semibold tabular-nums text-rose-800">
            {b ? money(b.breakdown.churnedMrrUsd) : '—'}
          </div>
        </div>
        <div className="card p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">Net MRR change</div>
          <div className="mt-1 text-lg font-semibold tabular-nums text-ink-900">
            {b ? money(b.breakdown.netMrrChangeUsd) : '—'}
          </div>
        </div>
        <div className="card p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">ARPU</div>
          <div className="mt-1 text-lg font-semibold tabular-nums text-ink-900">
            {b ? money(b.breakdown.arpuUsd) : '—'}
          </div>
        </div>
        <div className="card p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">LTV (est.)</div>
          <div className="mt-1 text-lg font-semibold tabular-nums text-ink-900">
            {b ? money(b.breakdown.ltvEstimateUsd) : '—'}
          </div>
        </div>
        <div className="card p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">Churn (monthly)</div>
          <div className="mt-1 text-lg font-semibold tabular-nums text-ink-900">
            {b ? `${b.breakdown.churnRateMonthlyPct}%` : '—'}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h3 className="text-base font-semibold text-ink-900">Cash vs invoiced (30 days)</h3>
          <p className="text-xs text-ink-500">Succeeded payment amounts vs non-void invoice totals by day</p>
          <div className="mt-4 min-h-[240px]">
            {billing.isLoading ? (
              <div className="skeleton h-[240px] w-full rounded-lg" />
            ) : (
              <LineChart
                labels={lineLabels}
                yLabelFormatter={(n) => money(n, 0)}
                series={[
                  {
                    key: 'pay',
                    label: 'Payments',
                    color: '#22c55e',
                    values: (b?.mrrTrend ?? []).map((p) => p.paymentCashUsd),
                  },
                  {
                    key: 'inv',
                    label: 'Invoices',
                    color: '#6366f1',
                    values: (b?.mrrTrend ?? []).map((p) => p.invoiceIssuedUsd),
                  },
                ]}
              />
            )}
          </div>
        </div>
        <div className="card p-5">
          <h3 className="text-base font-semibold text-ink-900">Revenue by workspace (30d)</h3>
          <p className="text-xs text-ink-500">Top workspaces by cash collected</p>
          <div className="mt-6">
            {billing.isLoading ? (
              <div className="skeleton h-[220px] w-full rounded-lg" />
            ) : (
              <BarChart items={barItems.length ? barItems : [{ label: '—', value: 1, color: '#e2e8f0' }]} />
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-3">
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-xs text-ink-600">
              Search workspaces
              <input
                className="rounded-lg border border-ink-200 px-3 py-2 text-sm text-ink-900 shadow-sm"
                placeholder="Name…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-ink-600">
              Plan filter
              <select
                className="rounded-lg border border-ink-200 px-3 py-2 text-sm text-ink-900 shadow-sm"
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value as PlanFilter)}
              >
                <option value="all">All</option>
                <option value="free">Free</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs text-ink-600">
              Sort by
              <select
                className="rounded-lg border border-ink-200 px-3 py-2 text-sm text-ink-900 shadow-sm"
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as SortKey)}
              >
                <option value="mrr">MRR</option>
                <option value="revenue">30d revenue</option>
                <option value="created">Created</option>
                <option value="name">Name</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs text-ink-600">
              Direction
              <select
                className="rounded-lg border border-ink-200 px-3 py-2 text-sm text-ink-900 shadow-sm"
                value={sortDir}
                onChange={(e) => setSortDir(e.target.value as 'asc' | 'desc')}
              >
                <option value="desc">High → low</option>
                <option value="asc">Low → high</option>
              </select>
            </label>
          </div>
          <BillingWorkspacesTable
            rows={tableRows}
            loading={billing.isLoading}
            proSeatListUsd={b?.proSeatListUsd ?? 12}
            onOpenWorkspace={(id) => setSelectedWorkspaceId(id)}
          />
        </div>

        <div className="card flex flex-col justify-between p-5">
          <div>
            <h3 className="text-base font-semibold text-ink-900">Plan mix</h3>
            <p className="mt-0.5 text-xs text-ink-500">Workspaces by tier</p>
          </div>
          {billing.isLoading ? (
            <div className="skeleton mx-auto mt-6 h-44 w-44 rounded-full" />
          ) : (
            <DonutChart
              size={200}
              thickness={20}
              centerLabel={totalPlans ? String(totalPlans) : '0'}
              centerSubLabel="workspaces"
              slices={[
                { label: 'Free', value: b?.planDistribution.free ?? 0, color: '#94a3b8' },
                { label: 'Pro', value: b?.planDistribution.pro ?? 0, color: '#6366f1' },
                { label: 'Enterprise', value: b?.planDistribution.enterprise ?? 0, color: '#d97706' },
              ]}
            />
          )}
          <ul className="mt-4 space-y-2 text-xs text-ink-600">
            <li className="flex justify-between">
              <span className="text-ink-500">Growth vs churn (window)</span>
              <span className="font-medium tabular-nums text-emerald-700">
                +{money(b?.breakdown.newMrrUsd ?? 0, 0)} new
              </span>
            </li>
            <li className="flex justify-between">
              <span className="text-ink-500">Churned MRR</span>
              <span className="font-medium tabular-nums text-rose-700">
                −{money(b?.breakdown.churnedMrrUsd ?? 0, 0)}
              </span>
            </li>
          </ul>
          {b && (
            <p className="mt-4 border-t border-ink-100 pt-3 text-[11px] text-ink-400">
              Generated {new Date(b.generatedAt).toLocaleString()}
            </p>
          )}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <LedgerTable
          title="Invoices"
          subtitle="Open and paid · print-friendly HTML"
          loading={billing.isLoading}
          cols={['#', 'Workspace', 'Status', 'Amount', 'Due']}
          rows={(b?.invoices ?? []).map((i) => ({
            key: i.id,
            cells: [
              i.invoiceNumber,
              i.workspaceName,
              i.status,
              money(i.amountDueFinalUsd),
              new Date(i.dueAt).toLocaleDateString(),
            ],
            action:
              i.status !== 'void' ? (
                <button
                  type="button"
                  className="text-xs font-medium text-brand-700 underline"
                  onClick={() => void openInvoiceHtmlTab(i.id)}
                >
                  PDF / print
                </button>
              ) : null,
          }))}
        />
        <LedgerTable
          title="Payments"
          subtitle="Latest attempts"
          loading={billing.isLoading}
          cols={['Workspace', 'Status', 'Amount', 'When']}
          rows={(b?.payments ?? []).slice(0, 25).map((p) => ({
            key: p.id,
            cells: [
              p.workspaceName,
              p.status,
              money(p.amountUsd),
              p.settledAt ? new Date(p.settledAt).toLocaleString() : new Date(p.createdAt).toLocaleString(),
            ],
          }))}
        />
      </section>

      <LedgerTable
        title="Failed / retrying payments"
        subtitle="Requires ops follow-up"
        loading={billing.isLoading}
        cols={['Workspace', 'Status', 'Attempts', 'Next retry', 'Message']}
        rows={(b?.failedPayments ?? []).map((p) => ({
          key: p.id,
          cells: [
            p.workspaceName,
            p.status,
            String(p.attemptCount),
            p.nextRetryAt ? new Date(p.nextRetryAt).toLocaleString() : '—',
            p.failureMessage ?? '—',
          ],
        }))}
      />

      <LedgerTable
        title="Refunds"
        subtitle="Linked to payment ledger entries"
        loading={billing.isLoading}
        cols={['Workspace', 'Amount', 'Status', 'When']}
        rows={(b?.refunds ?? []).map((r) => ({
          key: r.id,
          cells: [r.workspaceId.slice(-6), money(r.amountUsd), r.status, new Date(r.createdAt).toLocaleString()],
        }))}
      />

      <section className="card overflow-hidden">
        <header className="border-b border-ink-200 px-5 py-4">
          <h3 className="text-base font-semibold text-ink-900">Enterprise contracts</h3>
          <p className="text-xs text-ink-500">Custom MRR, trials, manual invoice URLs</p>
        </header>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-ink-50/40">
              <tr className="text-left text-[11px] font-semibold uppercase text-ink-500">
                <th className="px-4 py-2">Workspace</th>
                <th className="px-4 py-2">Monthly</th>
                <th className="px-4 py-2">Start</th>
                <th className="px-4 py-2">End</th>
                <th className="px-4 py-2">Docs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-200">
              {(b?.enterpriseContracts ?? []).length === 0 && !billing.isLoading && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-ink-500">
                    No enterprise contracts yet. Open a workspace to add one.
                  </td>
                </tr>
              )}
              {(b?.enterpriseContracts ?? []).map((c) => (
                <tr key={c.id} className="hover:bg-ink-50/40">
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      className="text-left font-medium text-brand-800 underline"
                      onClick={() => setSelectedWorkspaceId(c.workspaceId)}
                    >
                      {c.workspaceName}
                    </button>
                  </td>
                  <td className="px-4 py-3 tabular-nums">{money(c.monthlyAmountUsd)}</td>
                  <td className="px-4 py-3">{new Date(c.contractStart).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    {c.contractEnd ? new Date(c.contractEnd).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-600">
                    {c.manualInvoiceUrls?.length ? `${c.manualInvoiceUrls.length} file(s)` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card p-5">
        <h3 className="text-base font-semibold text-ink-900">Dynamic subscription plans</h3>
        <p className="mt-1 text-xs text-ink-500">Create price books and entitlements; assign from workspace drawer</p>
        <form
          className="mt-4 grid gap-3 border-t border-ink-100 pt-4 sm:grid-cols-2 lg:grid-cols-4"
          onSubmit={(e) => {
            e.preventDefault();
            void createPlan.mutateAsync({
              key: newPlan.key.trim(),
              displayName: newPlan.displayName.trim(),
              tier: newPlan.tier,
              pricePerSeatMonthlyUsd: newPlan.pricePerSeatMonthlyUsd,
              maxMembers: newPlan.maxMembers,
              maxProjects: newPlan.maxProjects,
              storageLimitMb: newPlan.storageLimitMb,
              ganttEnabled: newPlan.ganttEnabled,
              cpmEnabled: newPlan.cpmEnabled,
              auditLogEnabled: newPlan.auditLogEnabled,
              isActive: true,
              isDefaultForTier: false,
              sortOrder: 50,
            });
          }}
        >
          <input
            required
            className="rounded-lg border border-ink-200 px-2 py-2 text-sm"
            placeholder="key (e.g. pro-20)"
            value={newPlan.key}
            onChange={(e) => setNewPlan((s) => ({ ...s, key: e.target.value }))}
          />
          <input
            required
            className="rounded-lg border border-ink-200 px-2 py-2 text-sm"
            placeholder="Display name"
            value={newPlan.displayName}
            onChange={(e) => setNewPlan((s) => ({ ...s, displayName: e.target.value }))}
          />
          <select
            className="rounded-lg border border-ink-200 px-2 py-2 text-sm"
            value={newPlan.tier}
            onChange={(e) =>
              setNewPlan((s) => ({ ...s, tier: e.target.value as AdminSubscriptionPlanRow['tier'] }))
            }
          >
            <option value="free">Free tier</option>
            <option value="pro">Pro tier</option>
            <option value="enterprise">Enterprise tier</option>
          </select>
          <input
            type="number"
            className="rounded-lg border border-ink-200 px-2 py-2 text-sm"
            value={newPlan.pricePerSeatMonthlyUsd}
            onChange={(e) =>
              setNewPlan((s) => ({ ...s, pricePerSeatMonthlyUsd: Number(e.target.value) }))
            }
          />
          <input
            type="number"
            className="rounded-lg border border-ink-200 px-2 py-2 text-sm"
            placeholder="max members"
            value={newPlan.maxMembers}
            onChange={(e) => setNewPlan((s) => ({ ...s, maxMembers: Number(e.target.value) }))}
          />
          <input
            type="number"
            className="rounded-lg border border-ink-200 px-2 py-2 text-sm"
            placeholder="max projects"
            value={newPlan.maxProjects}
            onChange={(e) => setNewPlan((s) => ({ ...s, maxProjects: Number(e.target.value) }))}
          />
          <input
            type="number"
            className="rounded-lg border border-ink-200 px-2 py-2 text-sm"
            placeholder="storage MB"
            value={newPlan.storageLimitMb}
            onChange={(e) => setNewPlan((s) => ({ ...s, storageLimitMb: Number(e.target.value) }))}
          />
          <label className="flex items-center gap-2 text-xs text-ink-700">
            <input
              type="checkbox"
              checked={newPlan.ganttEnabled}
              onChange={(e) => setNewPlan((s) => ({ ...s, ganttEnabled: e.target.checked }))}
            />
            Gantt
          </label>
          <label className="flex items-center gap-2 text-xs text-ink-700">
            <input
              type="checkbox"
              checked={newPlan.cpmEnabled}
              onChange={(e) => setNewPlan((s) => ({ ...s, cpmEnabled: e.target.checked }))}
            />
            CPM
          </label>
          <label className="flex items-center gap-2 text-xs text-ink-700">
            <input
              type="checkbox"
              checked={newPlan.auditLogEnabled}
              onChange={(e) => setNewPlan((s) => ({ ...s, auditLogEnabled: e.target.checked }))}
            />
            Audit log
          </label>
          <button
            type="submit"
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Create plan
          </button>
        </form>

        <PlanEditorTable
          plans={b?.plans ?? []}
          loading={billing.isLoading}
          onPatch={(id, patch) => void updatePlan.mutateAsync({ id, patch })}
          onDeactivate={(id) => void deactivatePlan.mutateAsync(id)}
        />
      </section>

      {selectedWorkspaceId && (
        <div className="fixed inset-0 z-40 flex justify-end bg-black/30 backdrop-blur-[1px]">
          <button
            type="button"
            className="h-full flex-1 cursor-default bg-transparent"
            aria-label="Close drawer"
            onClick={() => setSelectedWorkspaceId(null)}
          />
          <aside className="h-full w-full max-w-lg overflow-y-auto border-l border-ink-200 bg-white shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-ink-200 bg-white px-4 py-3">
              <h3 className="text-sm font-semibold text-ink-900">Workspace billing</h3>
              <button
                type="button"
                className="rounded-lg px-2 py-1 text-xs text-ink-600 hover:bg-ink-100"
                onClick={() => setSelectedWorkspaceId(null)}
              >
                Close
              </button>
            </div>
            {detail.isLoading && <div className="p-4 text-sm text-ink-500">Loading…</div>}
            {detail.data && (
              <div className="space-y-6 p-4 text-sm">
                <div>
                  <div className="text-lg font-semibold text-ink-900">{detail.data.workspace.name}</div>
                  <div className="text-xs text-ink-500">
                    Plan {detail.data.workspace.plan} · {detail.data.workspace.subscriptionPlanKey ?? '—'}
                  </div>
                  {detail.data.workspace.trialEndsAt && (
                    <div className="mt-1 text-xs text-amber-800">
                      Trial ends {new Date(detail.data.workspace.trialEndsAt).toLocaleString()}
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-xs font-medium text-ink-600">Assign subscription plan</label>
                  <div className="mt-1 flex gap-2">
                    <select
                      key={detail.data.workspace.subscriptionPlanId ?? 'none'}
                      className="flex-1 rounded-lg border border-ink-200 px-2 py-2 text-sm"
                      id="assign-plan-select"
                      defaultValue={detail.data.workspace.subscriptionPlanId ?? ''}
                    >
                      {(b?.plans ?? [])
                        .filter((p) => p.isActive)
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.displayName} ({p.key})
                          </option>
                        ))}
                    </select>
                    <button
                      type="button"
                      className="rounded-lg bg-ink-900 px-3 py-2 text-xs font-medium text-white"
                      onClick={() => {
                        const sel = document.getElementById('assign-plan-select') as HTMLSelectElement | null;
                        if (!sel?.value) return;
                        void assignPlan.mutateAsync({
                          workspaceId: selectedWorkspaceId,
                          subscriptionPlanId: sel.value,
                        });
                      }}
                    >
                      Apply
                    </button>
                  </div>
                </div>

                <div className="rounded-lg border border-ink-100 bg-ink-50/50 p-3">
                  <div className="text-xs font-semibold text-ink-800">Enterprise contract</div>
                  <div className="mt-2 grid gap-2">
                    <input
                      type="number"
                      className="rounded border border-ink-200 px-2 py-1 text-sm"
                      value={contractForm.monthlyAmountUsd}
                      onChange={(e) =>
                        setContractForm((s) => ({ ...s, monthlyAmountUsd: Number(e.target.value) }))
                      }
                    />
                    <input
                      type="date"
                      className="rounded border border-ink-200 px-2 py-1 text-sm"
                      value={contractForm.contractStart}
                      onChange={(e) => setContractForm((s) => ({ ...s, contractStart: e.target.value }))}
                    />
                    <input
                      type="date"
                      className="rounded border border-ink-200 px-2 py-1 text-sm"
                      placeholder="End"
                      value={contractForm.contractEnd}
                      onChange={(e) => setContractForm((s) => ({ ...s, contractEnd: e.target.value }))}
                    />
                    <input
                      type="date"
                      className="rounded border border-ink-200 px-2 py-1 text-sm"
                      placeholder="Trial ends"
                      value={contractForm.trialEndsAt}
                      onChange={(e) => setContractForm((s) => ({ ...s, trialEndsAt: e.target.value }))}
                    />
                    <input
                      className="rounded border border-ink-200 px-2 py-1 text-sm"
                      placeholder="Manual invoice URLs (comma-separated)"
                      value={contractForm.manualInvoiceUrls}
                      onChange={(e) =>
                        setContractForm((s) => ({ ...s, manualInvoiceUrls: e.target.value }))
                      }
                    />
                    <textarea
                      className="rounded border border-ink-200 px-2 py-1 text-sm"
                      placeholder="Notes"
                      rows={2}
                      value={contractForm.notes}
                      onChange={(e) => setContractForm((s) => ({ ...s, notes: e.target.value }))}
                    />
                    <button
                      type="button"
                      className="rounded-lg bg-amber-600 px-3 py-2 text-xs font-medium text-white"
                      onClick={() =>
                        void upsertContract.mutateAsync({
                          workspaceId: selectedWorkspaceId,
                          monthlyAmountUsd: contractForm.monthlyAmountUsd,
                          contractStart: contractForm.contractStart,
                          contractEnd: contractForm.contractEnd || undefined,
                          trialEndsAt: contractForm.trialEndsAt || undefined,
                          notes: contractForm.notes || undefined,
                          manualInvoiceUrls: contractForm.manualInvoiceUrls
                            .split(',')
                            .map((s) => s.trim())
                            .filter(Boolean),
                        })
                      }
                    >
                      Save contract
                    </button>
                  </div>
                </div>

                <LedgerMini
                  title="Per-user billing / seat timeline"
                  rows={detail.data.seatEvents.map((s) => ({
                    id: s.id,
                    line: `${s.userName} · ${s.action} · billable ${s.billableAfter} · ${new Date(s.occurredAt).toLocaleString()}`,
                  }))}
                />
                <LedgerMini
                  title="Plan changes"
                  rows={detail.data.planChanges.map((l) => ({
                    id: l.id,
                    line: `${l.fromPlanKey} → ${l.toPlanKey} · ${new Date(l.changedAt).toLocaleString()}`,
                  }))}
                />
                <LedgerMini
                  title="Payments"
                  rows={detail.data.payments.map((p) => ({
                    id: p.id,
                    line: `${p.status} ${money(p.amountUsd)} · ${new Date(p.createdAt).toLocaleString()}`,
                  }))}
                />
                <LedgerMini
                  title="Invoices"
                  rows={detail.data.invoices.map((i) => ({
                    id: i.id,
                    line: `${i.invoiceNumber} ${i.status} ${money(i.amountDueFinalUsd)}`,
                  }))}
                />
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}

function LedgerTable(props: {
  title: string;
  subtitle?: string;
  cols: string[];
  rows: { key: string; cells: string[]; action?: ReactNode }[];
  loading?: boolean;
}) {
  const hasAction = props.rows.some((r) => r.action);
  return (
    <section className="card overflow-hidden">
      <header className="border-b border-ink-200 px-5 py-4">
        <h3 className="text-base font-semibold text-ink-900">{props.title}</h3>
        {props.subtitle && <p className="text-xs text-ink-500">{props.subtitle}</p>}
      </header>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-ink-50/40">
            <tr className="text-left text-[11px] font-semibold uppercase text-ink-500">
              {props.cols.map((c) => (
                <th key={c} className="px-4 py-2">
                  {c}
                </th>
              ))}
              {hasAction ? <th className="px-4 py-2" /> : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-200">
            {props.loading &&
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={props.cols.length + (hasAction ? 1 : 0)} className="px-4 py-2">
                    <div className="skeleton h-6 w-full" />
                  </td>
                </tr>
              ))}
            {!props.loading && props.rows.length === 0 && (
              <tr>
                <td colSpan={props.cols.length + (hasAction ? 1 : 0)} className="px-5 py-8 text-center text-ink-500">
                  No rows.
                </td>
              </tr>
            )}
            {!props.loading &&
              props.rows.map((r) => (
                <tr key={r.key} className="hover:bg-ink-50/40">
                  {r.cells.map((c, i) => (
                    <td key={i} className="px-4 py-2 text-ink-800">
                      {c}
                    </td>
                  ))}
                  {hasAction ? <td className="px-4 py-2 text-right">{r.action}</td> : null}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function LedgerMini(props: { title: string; rows: { id: string; line: string }[] }) {
  return (
    <div>
      <div className="text-xs font-semibold text-ink-800">{props.title}</div>
      <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto text-xs text-ink-700">
        {props.rows.length === 0 && <li className="text-ink-400">No entries.</li>}
        {props.rows.map((r) => (
          <li key={r.id} className="border-b border-ink-100 py-1">
            {r.line}
          </li>
        ))}
      </ul>
    </div>
  );
}

function PlanEditorTable(props: {
  plans: AdminSubscriptionPlanRow[];
  loading?: boolean;
  onPatch: (id: string, patch: Partial<AdminSubscriptionPlanRow>) => void;
  onDeactivate: (id: string) => void;
}) {
  const [drafts, setDrafts] = useState<Record<string, Partial<AdminSubscriptionPlanRow>>>({});
  return (
    <div className="mt-6 overflow-x-auto">
      <table className="w-full text-xs">
        <thead className="bg-ink-50/60 text-[11px] font-semibold uppercase text-ink-500">
          <tr>
            <th className="px-2 py-2 text-left">Key</th>
            <th className="px-2 py-2 text-left">Tier</th>
            <th className="px-2 py-2 text-left">$/seat</th>
            <th className="px-2 py-2 text-left">Members</th>
            <th className="px-2 py-2 text-left">Projects</th>
            <th className="px-2 py-2 text-left">Storage MB</th>
            <th className="px-2 py-2 text-left">Active</th>
            <th className="px-2 py-2" />
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-100">
          {props.loading &&
            Array.from({ length: 3 }).map((_, i) => (
              <tr key={i}>
                <td colSpan={8} className="py-2">
                  <div className="skeleton h-6 w-full" />
                </td>
              </tr>
            ))}
          {!props.loading &&
            props.plans.map((p) => (
                <tr key={p.id} className="text-ink-800">
                  <td className="px-2 py-2 font-mono">{p.key}</td>
                  <td className="px-2 py-2">{p.tier}</td>
                  <td className="px-2 py-2">
                    <input
                      type="number"
                      className="w-20 rounded border border-ink-200 px-1"
                      defaultValue={p.pricePerSeatMonthlyUsd}
                      onChange={(e) =>
                        setDrafts((s) => ({
                          ...s,
                          [p.id]: { ...s[p.id], pricePerSeatMonthlyUsd: Number(e.target.value) },
                        }))
                      }
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="number"
                      className="w-16 rounded border border-ink-200 px-1"
                      defaultValue={p.maxMembers}
                      onChange={(e) =>
                        setDrafts((s) => ({
                          ...s,
                          [p.id]: { ...s[p.id], maxMembers: Number(e.target.value) },
                        }))
                      }
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="number"
                      className="w-16 rounded border border-ink-200 px-1"
                      defaultValue={p.maxProjects}
                      onChange={(e) =>
                        setDrafts((s) => ({
                          ...s,
                          [p.id]: { ...s[p.id], maxProjects: Number(e.target.value) },
                        }))
                      }
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="number"
                      className="w-20 rounded border border-ink-200 px-1"
                      defaultValue={p.storageLimitMb}
                      onChange={(e) =>
                        setDrafts((s) => ({
                          ...s,
                          [p.id]: { ...s[p.id], storageLimitMb: Number(e.target.value) },
                        }))
                      }
                    />
                  </td>
                  <td className="px-2 py-2">{p.isActive ? 'yes' : 'no'}</td>
                  <td className="px-2 py-2 text-right">
                    <button
                      type="button"
                      className="mr-2 text-brand-700 underline"
                      onClick={() => {
                        const patch = drafts[p.id];
                        if (patch && Object.keys(patch).length) props.onPatch(p.id, patch);
                      }}
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      className="text-rose-700 underline"
                      onClick={() => props.onDeactivate(p.id)}
                    >
                      Deactivate
                    </button>
                  </td>
                </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
