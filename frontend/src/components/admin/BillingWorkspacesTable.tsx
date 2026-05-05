import type { AdminBillingWorkspaceRow } from '../../features/admin/hooks';

interface Props {
  rows: AdminBillingWorkspaceRow[];
  loading?: boolean;
  proSeatListUsd: number;
  onOpenWorkspace?: (id: string) => void;
}

const money = (n: number, fraction = 2) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: fraction,
    minimumFractionDigits: fraction,
  }).format(n);

function TrendCell({ row }: { row: AdminBillingWorkspaceRow }) {
  const g = row.revenueGrowthPct;
  const sym = row.trend === 'up' ? '↑' : row.trend === 'down' ? '↓' : '→';
  const cls =
    row.trend === 'up'
      ? 'text-emerald-700'
      : row.trend === 'down'
        ? 'text-rose-700'
        : 'text-ink-500';
  return (
    <span className={`tabular-nums font-medium ${cls}`}>
      {sym}{' '}
      {g == null ? '—' : `${g > 0 ? '+' : ''}${g}%`}
    </span>
  );
}

export function BillingWorkspacesTable({ rows, loading, proSeatListUsd, onOpenWorkspace }: Props) {
  return (
    <section className="card overflow-hidden">
      <header className="border-b border-ink-200 px-5 py-4">
        <h3 className="text-base font-semibold text-ink-900">Workspace revenue map</h3>
        <p className="text-xs text-ink-500">
          MRR from subscription plans + contracts; 30d revenue from succeeded payments. Pro list{' '}
          {money(proSeatListUsd)} / seat / mo. Click a row for ledger detail.
        </p>
      </header>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-ink-50/40">
            <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-ink-500">
              <th className="px-4 py-2.5">Workspace</th>
              <th className="px-4 py-2.5">Owner</th>
              <th className="px-4 py-2.5">Plan</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5">MRR</th>
              <th className="px-4 py-2.5">Rev 30d</th>
              <th className="px-4 py-2.5">Growth</th>
              <th className="px-4 py-2.5">Seats</th>
              <th className="px-4 py-2.5">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-200">
            {loading &&
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={9} className="px-5 py-3">
                    <div className="skeleton h-6 w-full" />
                  </td>
                </tr>
              ))}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={9} className="px-5 py-12 text-center text-ink-500">
                  No workspaces in this view.
                </td>
              </tr>
            )}
            {!loading &&
              rows.map((w) => (
                <tr
                  key={w.id}
                  className={`transition hover:bg-ink-50/50 ${onOpenWorkspace ? 'cursor-pointer' : ''}`}
                  onClick={() => onOpenWorkspace?.(w.id)}
                  onKeyDown={(e) => {
                    if (onOpenWorkspace && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault();
                      onOpenWorkspace(w.id);
                    }
                  }}
                  tabIndex={onOpenWorkspace ? 0 : undefined}
                  role={onOpenWorkspace ? 'button' : undefined}
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-ink-900">{w.name}</div>
                    <div className="font-mono text-[11px] text-ink-400">
                      {w.subscriptionPlanKey ?? w.plan} · {w.id.slice(-8)}
                    </div>
                  </td>
                  <td className="max-w-[200px] px-4 py-3">
                    {w.owner ? (
                      <div>
                        <div className="truncate text-ink-800">{w.owner.displayName}</div>
                        <div className="truncate text-[11px] text-ink-500">{w.owner.email}</div>
                      </div>
                    ) : (
                      <span className="text-ink-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <PlanChip plan={w.plan} />
                  </td>
                  <td className="px-4 py-3">
                    {w.status === 'suspended' ? (
                      <span className="badge bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-100">
                        Suspended
                      </span>
                    ) : (
                      <span className="badge bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-100">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    {w.mrrUsd <= 0 && w.enterpriseContractUsd == null ? (
                      <span className="text-ink-400">—</span>
                    ) : (
                      <span className="font-medium text-ink-900">{money(w.mrrUsd)}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-ink-800">
                    {money(w.revenueLast30dUsd)}
                  </td>
                  <td className="px-4 py-3">
                    <TrendCell row={w} />
                  </td>
                  <td className="px-4 py-3 text-ink-700">
                    <span className="tabular-nums">{w.billableSeats}</span>
                    <span className="text-ink-400"> / </span>
                    <span className="tabular-nums text-ink-500">{w.clientSeats} cl</span>
                  </td>
                  <td className="px-4 py-3 text-ink-600">
                    {new Date(w.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function PlanChip({ plan }: { plan: 'free' | 'pro' | 'enterprise' }) {
  const map = {
    free: 'bg-ink-100 text-ink-700 ring-ink-200',
    pro: 'bg-brand-50 text-brand-700 ring-brand-100',
    enterprise: 'bg-amber-50 text-amber-700 ring-amber-100',
  } as const;
  return (
    <span className={`badge ring-1 ring-inset ${map[plan]}`}>
      {plan[0].toUpperCase() + plan.slice(1)}
    </span>
  );
}
