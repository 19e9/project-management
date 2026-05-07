import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAdminBilling } from '../../features/admin/hooks';
import { formatUsd } from '../../features/billing/billingFormat';

export default function UserBillingPage() {
  const { userId } = useParams<{ userId: string }>();
  const billing = useAdminBilling({ limit: 250, q: '' });

  const owned = useMemo(() => {
    return (billing.data?.workspaces ?? []).filter((w) => w.owner?.id === userId);
  }, [billing.data?.workspaces, userId]);

  const primaryId = owned[0]?.id;

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 pb-12 pt-4 animate-fade-in-up">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-500">Users · Billing</p>
        <h1 className="mt-2 text-2xl font-bold text-ink-900 dark:text-white">Subscription snapshot</h1>
        <p className="mt-2 text-sm text-ink-600 dark:text-ink-400">
          Aggregates workspaces where this user is the billing owner. Opens the same operational drawer as the
          billing module.
        </p>
      </header>

      {billing.isError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-50">
          Could not load billing projection.
        </div>
      )}

      {billing.isLoading && <div className="skeleton h-40 w-full rounded-3xl dark:bg-ink-800" />}

      {!billing.isLoading && owned.length === 0 && (
        <div className="rounded-3xl border border-dashed border-ink-200 p-8 text-center text-sm text-ink-600 dark:border-white/10 dark:text-ink-400">
          No owned workspaces on record — billing signals appear once the user provisions a workspace as owner.
        </div>
      )}

      {!billing.isLoading && owned.length > 0 && (
        <div className="space-y-4">
          <div className="rounded-3xl bg-white p-6 shadow-soft ring-1 ring-ink-900/[0.05] dark:bg-ink-900/50 dark:ring-white/[0.06]">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Portfolio</p>
            <p className="mt-2 text-3xl font-bold tabular-nums text-ink-900 dark:text-white">
              {formatUsd(owned.reduce((s, w) => s + w.mrrUsd, 0))}
            </p>
            <p className="text-xs text-ink-500">Combined MRR · {owned.length} workspace(s)</p>
          </div>

          <ul className="space-y-3">
            {owned.map((w) => (
              <li
                key={w.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 shadow-soft ring-1 ring-ink-900/[0.05] dark:bg-ink-900/40 dark:ring-white/[0.06]"
              >
                <div>
                  <p className="font-semibold text-ink-900 dark:text-white">{w.name}</p>
                  <p className="text-xs text-ink-500">
                    {w.plan.toUpperCase()} · {formatUsd(w.mrrUsd)} MRR · {w.billableSeats} seats
                  </p>
                </div>
                <Link
                  to={`/dashboard/billing/subscriptions?drawer=${w.id}`}
                  className="rounded-full bg-ink-900 px-4 py-2 text-xs font-semibold text-white dark:bg-white dark:text-ink-950"
                >
                  Manage subscription
                </Link>
              </li>
            ))}
          </ul>

          {primaryId && (
            <Link
              to={`/dashboard/billing/subscriptions?drawer=${primaryId}`}
              className="inline-flex text-sm font-semibold text-brand-700 hover:underline dark:text-brand-300"
            >
              Open primary workspace drawer →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
