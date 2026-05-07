import { useBillingDashboard } from '../../features/billing/BillingDashboardContext';
import { formatUsd } from '../../features/billing/billingFormat';
import { Link } from 'react-router-dom';

export default function BillingEnterprisePage() {
  const billing = useBillingDashboard();
  const contracts = billing.data?.enterpriseContracts ?? [];

  return (
    <div className="space-y-8 animate-fade-in-up">
      <header>
        <h2 className="text-xl font-bold text-ink-900 dark:text-white">Enterprise accounts</h2>
        <p className="mt-1 max-w-3xl text-sm text-ink-600 dark:text-ink-400">
          Contracts, SLA posture, and negotiated economics. Tie operational notes to workspace drawers — renewal
          pipeline data lands here as soon as CRM fields sync (placeholder tiles describe future hooks).
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
        {[
          ['Contract management', 'MSA / order forms stored alongside ledger totals'],
          ['SLA tiers', 'Premium success packages mapped per workspace'],
          ['Negotiated pricing', 'Overrides reflected in enterprise MRR waterfall'],
          ['Account managers', 'Named CSM assignments (directory integration)'],
          ['Invoice scheduling', 'Manual billing cadence separate from self-serve'],
          ['Renewal pipeline', 'Forecast stages · exec rollup coming soon'],
        ].map(([title, body]) => (
          <div
            key={title}
            className="rounded-3xl bg-gradient-to-br from-white to-ink-50 p-5 shadow-soft ring-1 ring-ink-900/[0.05] dark:from-ink-900 dark:to-ink-950 dark:ring-white/[0.06]"
          >
            <h3 className="text-sm font-semibold text-ink-900 dark:text-white">{title}</h3>
            <p className="mt-2 text-xs leading-relaxed text-ink-600 dark:text-ink-400">{body}</p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-3xl bg-white shadow-soft ring-1 ring-ink-900/[0.05] dark:bg-ink-900/50 dark:ring-white/[0.06]">
        <div className="border-b border-ink-100 px-6 py-4 dark:border-white/[0.06]">
          <h3 className="text-sm font-semibold text-ink-900 dark:text-white">Active contracts</h3>
          <p className="text-xs text-ink-500 dark:text-ink-400">
            Linked workspaces · jump into subscription drawer for notes & uploads
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-ink-50/70 text-left text-[11px] font-semibold uppercase tracking-wider text-ink-500 dark:bg-white/[0.04] dark:text-ink-400">
              <tr>
                <th className="px-5 py-3">Workspace</th>
                <th className="px-5 py-3">Monthly</th>
                <th className="px-5 py-3">Term</th>
                <th className="px-5 py-3">Trial</th>
                <th className="px-5 py-3">Docs</th>
                <th className="px-5 py-3 text-right"> </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100 dark:divide-white/[0.06]">
              {billing.isLoading &&
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-5 py-3">
                      <div className="skeleton h-7 w-full dark:bg-ink-800" />
                    </td>
                  </tr>
                ))}
              {!billing.isLoading && contracts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-ink-500 dark:text-ink-400">
                    No enterprise contracts yet — promote from subscription drawer.
                  </td>
                </tr>
              )}
              {!billing.isLoading &&
                contracts.map((c) => (
                  <tr key={c.id} className="hover:bg-ink-50/60 dark:hover:bg-white/[0.03]">
                    <td className="px-5 py-3 font-medium text-ink-900 dark:text-white">{c.workspaceName}</td>
                    <td className="px-5 py-3 tabular-nums">{formatUsd(c.monthlyAmountUsd)}</td>
                    <td className="px-5 py-3 text-xs text-ink-600 dark:text-ink-400">
                      {new Date(c.contractStart).toLocaleDateString()} →{' '}
                      {c.contractEnd ? new Date(c.contractEnd).toLocaleDateString() : 'Open'}
                    </td>
                    <td className="px-5 py-3 text-xs text-ink-600 dark:text-ink-400">
                      {c.trialEndsAt ? new Date(c.trialEndsAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-5 py-3 text-xs text-ink-600 dark:text-ink-400">
                      {c.manualInvoiceUrls?.length ? `${c.manualInvoiceUrls.length} files` : '—'}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        to={`/dashboard/billing/subscriptions?drawer=${c.workspaceId}`}
                        className="text-xs font-semibold text-brand-700 hover:underline dark:text-brand-300"
                      >
                        Manage →
                      </Link>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
