import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useBillingDashboard } from '../../features/billing/BillingDashboardContext';
import {
  deriveWorkspaceLifecycle,
  lifecycleLabel,
  type SubscriptionLifecycle,
} from '../../features/billing/workspaceLifecycle';
import { formatUsd } from '../../features/billing/billingFormat';
import type { AdminBillingWorkspaceRow, AdminPaymentRow } from '../../features/admin/hooks';

const TABS: { id: SubscriptionLifecycle | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'trialing', label: 'Trialing' },
  { id: 'paused', label: 'Paused' },
  { id: 'past_due', label: 'Past due' },
  { id: 'unpaid', label: 'Unpaid' },
  { id: 'canceled', label: 'Canceled' },
  { id: 'grace_period', label: 'Grace' },
  { id: 'scheduled_cancel', label: 'Cancel pending' },
];

function LifecycleBadge({ s }: { s: SubscriptionLifecycle }) {
  const cls =
    s === 'active'
      ? 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/25 dark:text-emerald-300'
      : s === 'trialing'
        ? 'bg-sky-500/10 text-sky-800 ring-sky-500/25 dark:text-sky-200'
        : s === 'past_due' || s === 'unpaid'
          ? 'bg-rose-500/10 text-rose-800 ring-rose-500/25 dark:text-rose-200'
          : s === 'paused'
            ? 'bg-amber-500/10 text-amber-900 ring-amber-500/25 dark:text-amber-200'
            : 'bg-ink-500/10 text-ink-700 ring-ink-500/20 dark:text-ink-200';
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${cls}`}>
      {lifecycleLabel(s)}
    </span>
  );
}

export default function BillingSubscriptionsPage() {
  const billing = useBillingDashboard();
  const [, setParams] = useSearchParams();
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(() => new Set());

  const failedByWs = useMemo(() => {
    const m = new Map<string, AdminPaymentRow[]>();
    for (const p of billing.data?.failedPayments ?? []) {
      const arr = m.get(p.workspaceId) ?? [];
      arr.push(p);
      m.set(p.workspaceId, arr);
    }
    return m;
  }, [billing.data?.failedPayments]);

  const rowsWithLifecycle = useMemo(() => {
    const list = billing.data?.workspaces ?? [];
    return list.map((w) => ({
      row: w,
      lifecycle: deriveWorkspaceLifecycle(w, failedByWs.get(w.id) ?? []),
    }));
  }, [billing.data?.workspaces, failedByWs]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rowsWithLifecycle.filter(({ row: w, lifecycle }) => {
      if (tab !== 'all' && lifecycle !== tab) return false;
      if (!q) return true;
      const blob = [
        w.name,
        w.owner?.displayName,
        w.owner?.email,
        w.subscriptionPlanKey,
        w.plan,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return blob.includes(q);
    });
  }, [rowsWithLifecycle, search, tab]);

  function openDrawer(id: string) {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('drawer', id);
      return next;
    });
  }

  function toggleBulk(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-ink-900 dark:text-white">
            Subscription lifecycle
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-ink-600 dark:text-ink-400">
            Workspace-linked subscriptions with operational statuses derived from trials, suspension, and
            payment retries. Deep links open the subscription drawer.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {selected.size > 0 && (
            <button
              type="button"
              className="rounded-full border border-ink-200 bg-white px-3 py-1.5 text-xs font-semibold dark:border-white/10 dark:bg-ink-900"
              onClick={() => alert('Bulk exports & automation hooks ship with ledger webhooks (Stripe).')}
            >
              Bulk actions ({selected.size})
            </button>
          )}
        </div>
      </header>

      <div className="flex flex-wrap gap-2 overflow-x-auto pb-1 scrollbar-none">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              tab === t.id
                ? 'bg-ink-900 text-white dark:bg-white dark:text-ink-950'
                : 'bg-white text-ink-600 ring-1 ring-ink-200 hover:bg-ink-50 dark:bg-ink-900 dark:text-ink-300 dark:ring-white/10'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          placeholder="Search workspace, owner, plan key…"
          className="input max-w-md flex-1 dark:border-white/10 dark:bg-ink-900 dark:text-white"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span className="text-xs text-ink-500 dark:text-ink-400">
          Showing {filtered.length} workspaces
        </span>
      </div>

      <div className="overflow-hidden rounded-3xl bg-white shadow-soft ring-1 ring-ink-900/[0.05] dark:bg-ink-900/50 dark:ring-white/[0.06]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-ink-50/80 text-left text-[11px] font-semibold uppercase tracking-wider text-ink-500 dark:bg-white/[0.04] dark:text-ink-400">
              <tr>
                <th className="px-4 py-3 w-10">
                  <span className="sr-only">Select</span>
                </th>
                <th className="px-4 py-3">Workspace</th>
                <th className="px-4 py-3">Owner</th>
                <th className="px-4 py-3">Lifecycle</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3 text-right">MRR</th>
                <th className="px-4 py-3 text-right">Seats</th>
                <th className="px-4 py-3">Renewal</th>
                <th className="px-4 py-3 text-right"> </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100 dark:divide-white/[0.06]">
              {billing.isLoading &&
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={9} className="px-4 py-3">
                      <div className="skeleton h-7 w-full dark:bg-ink-800" />
                    </td>
                  </tr>
                ))}
              {!billing.isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-14 text-center text-sm text-ink-500 dark:text-ink-400">
                    No workspaces for this filter yet. Some statuses activate when payment webhooks flow in.
                  </td>
                </tr>
              )}
              {!billing.isLoading &&
                filtered.map(({ row: w, lifecycle }) => (
                  <SubscriptionRow
                    key={w.id}
                    w={w}
                    lifecycle={lifecycle}
                    selected={selected.has(w.id)}
                    onToggle={() => toggleBulk(w.id)}
                    onOpen={() => openDrawer(w.id)}
                  />
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SubscriptionRow({
  w,
  lifecycle,
  selected,
  onToggle,
  onOpen,
}: {
  w: AdminBillingWorkspaceRow;
  lifecycle: SubscriptionLifecycle;
  selected: boolean;
  onToggle: () => void;
  onOpen: () => void;
}) {
  const renewal =
    w.trialEndsAt && new Date(w.trialEndsAt).getTime() > Date.now()
      ? `Trial ${new Date(w.trialEndsAt).toLocaleDateString()}`
      : 'Monthly cycle';
  return (
    <tr className="transition hover:bg-ink-50/70 dark:hover:bg-white/[0.03]">
      <td className="px-4 py-3 align-middle">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          className="rounded border-ink-300 dark:border-white/20 dark:bg-ink-950"
          aria-label={`Select ${w.name}`}
        />
      </td>
      <td className="px-4 py-3">
        <button
          type="button"
          className="text-left font-medium text-ink-900 hover:text-brand-700 dark:text-white dark:hover:text-brand-300"
          onClick={onOpen}
        >
          {w.name}
        </button>
        <div className="font-mono text-[11px] text-ink-400">{w.subscriptionPlanKey ?? w.plan}</div>
      </td>
      <td className="max-w-[200px] px-4 py-3">
        {w.owner ? (
          <>
            <div className="truncate text-ink-800 dark:text-ink-200">{w.owner.displayName}</div>
            <div className="truncate text-[11px] text-ink-500">{w.owner.email}</div>
          </>
        ) : (
          <span className="text-ink-400">—</span>
        )}
      </td>
      <td className="px-4 py-3">
        <LifecycleBadge s={lifecycle} />
      </td>
      <td className="px-4 py-3 capitalize text-ink-700 dark:text-ink-200">{w.plan}</td>
      <td className="px-4 py-3 text-right tabular-nums font-medium text-ink-900 dark:text-white">
        {formatUsd(w.mrrUsd)}
      </td>
      <td className="px-4 py-3 text-right tabular-nums text-ink-700 dark:text-ink-300">
        {w.billableSeats}
      </td>
      <td className="px-4 py-3 text-xs text-ink-600 dark:text-ink-400">{renewal}</td>
      <td className="px-4 py-3 text-right">
        <button
          type="button"
          className="text-xs font-semibold text-brand-700 hover:underline dark:text-brand-300"
          onClick={onOpen}
        >
          Manage →
        </button>
      </td>
    </tr>
  );
}
