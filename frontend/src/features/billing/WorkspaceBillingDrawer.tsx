import { useEffect, useState } from 'react';
import {
  useAdminWorkspaceBillingDetail,
  useAssignWorkspacePlan,
  useUpsertEnterpriseContract,
} from '../admin/hooks';
import { formatUsd } from './billingFormat';
import { BillingLedgerMini } from '../../components/billing/BillingLedgerTable';
import { Link } from 'react-router-dom';

interface Props {
  workspaceId: string;
  plans: { id: string; displayName: string; key: string; isActive: boolean }[];
  onClose: () => void;
}

export function WorkspaceBillingDrawer({ workspaceId, plans, onClose }: Props) {
  const detail = useAdminWorkspaceBillingDetail(workspaceId);
  const assignPlan = useAssignWorkspacePlan();
  const upsertContract = useUpsertEnterpriseContract();

  const [planSelection, setPlanSelection] = useState('');
  const [contractForm, setContractForm] = useState({
    monthlyAmountUsd: 2500,
    contractStart: new Date().toISOString().slice(0, 10),
    contractEnd: '',
    trialEndsAt: '',
    notes: '',
    manualInvoiceUrls: '',
  });

  useEffect(() => {
    setPlanSelection(detail.data?.workspace.subscriptionPlanId ?? '');
  }, [detail.data?.workspace.subscriptionPlanId]);

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <button
        type="button"
        className="h-full flex-1 cursor-default bg-ink-950/40 backdrop-blur-[2px] dark:bg-black/50"
        aria-label="Close drawer"
        onClick={onClose}
      />
      <aside className="flex h-full w-full max-w-xl flex-col border-l border-ink-200 bg-white shadow-2xl dark:border-white/[0.08] dark:bg-ink-950">
        <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4 dark:border-white/[0.06]">
          <div>
            <h3 className="text-sm font-semibold text-ink-900 dark:text-ink-50">Subscription</h3>
            <p className="text-[11px] text-ink-500 dark:text-ink-400">Workspace ledger & lifecycle</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to={`/dashboard/workspaces/${workspaceId}/projects`}
              className="rounded-full px-3 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-500/10"
            >
              Open workspace →
            </Link>
            <button
              type="button"
              className="rounded-full px-3 py-1.5 text-xs font-medium text-ink-600 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-white/10"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 text-sm">
          {detail.isLoading && (
            <p className="text-ink-500 dark:text-ink-400">Loading workspace billing…</p>
          )}
          {detail.data && (
            <div className="space-y-8">
              <div className="rounded-2xl bg-gradient-to-br from-ink-50 to-white p-4 ring-1 ring-ink-900/[0.04] dark:from-ink-900 dark:to-ink-950 dark:ring-white/[0.06]">
                <div className="text-lg font-semibold tracking-tight text-ink-900 dark:text-ink-50">
                  {detail.data.workspace.name}
                </div>
                <div className="mt-1 flex flex-wrap gap-2 text-xs text-ink-600 dark:text-ink-400">
                  <span className="rounded-full bg-white px-2 py-0.5 font-medium ring-1 ring-ink-200 dark:bg-ink-900 dark:ring-white/10">
                    {detail.data.workspace.plan}
                  </span>
                  <span className="tabular-nums">
                    Plan key {detail.data.workspace.subscriptionPlanKey ?? '—'}
                  </span>
                </div>
                {detail.data.workspace.trialEndsAt && (
                  <p className="mt-3 text-xs font-medium text-amber-800 dark:text-amber-300">
                    Trial ends {new Date(detail.data.workspace.trialEndsAt).toLocaleString()}
                  </p>
                )}
              </div>

              <section>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-500 dark:text-ink-400">
                  Assign plan
                </h4>
                <div className="mt-2 flex flex-wrap gap-2">
                  <select
                    className="input min-w-[200px] flex-1 text-sm dark:border-white/10 dark:bg-ink-900 dark:text-ink-100"
                    value={planSelection}
                    onChange={(e) => setPlanSelection(e.target.value)}
                  >
                    <option value="">Select plan…</option>
                    {plans
                      .filter((p) => p.isActive)
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.displayName} ({p.key})
                        </option>
                      ))}
                  </select>
                  <button
                    type="button"
                    disabled={!planSelection || assignPlan.isPending}
                    className="btn-primary px-4 py-2 text-xs disabled:opacity-50"
                    onClick={() =>
                      void assignPlan.mutateAsync({
                        workspaceId,
                        subscriptionPlanId: planSelection,
                      })
                    }
                  >
                    Apply
                  </button>
                </div>
              </section>

              <section className="rounded-2xl bg-amber-50/40 p-4 ring-1 ring-amber-100 dark:bg-amber-500/5 dark:ring-amber-500/20">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-900 dark:text-amber-200">
                  Enterprise contract
                </h4>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <label className="text-[11px] text-ink-600 dark:text-ink-400">
                    Monthly (USD)
                    <input
                      type="number"
                      className="input mt-1 dark:border-white/10 dark:bg-ink-950"
                      value={contractForm.monthlyAmountUsd}
                      onChange={(e) =>
                        setContractForm((s) => ({
                          ...s,
                          monthlyAmountUsd: Number(e.target.value),
                        }))
                      }
                    />
                  </label>
                  <label className="text-[11px] text-ink-600 dark:text-ink-400">
                    Start
                    <input
                      type="date"
                      className="input mt-1 dark:border-white/10 dark:bg-ink-950"
                      value={contractForm.contractStart}
                      onChange={(e) =>
                        setContractForm((s) => ({ ...s, contractStart: e.target.value }))
                      }
                    />
                  </label>
                  <label className="text-[11px] text-ink-600 dark:text-ink-400">
                    End
                    <input
                      type="date"
                      className="input mt-1 dark:border-white/10 dark:bg-ink-950"
                      value={contractForm.contractEnd}
                      onChange={(e) =>
                        setContractForm((s) => ({ ...s, contractEnd: e.target.value }))
                      }
                    />
                  </label>
                  <label className="text-[11px] text-ink-600 dark:text-ink-400">
                    Trial ends
                    <input
                      type="date"
                      className="input mt-1 dark:border-white/10 dark:bg-ink-950"
                      value={contractForm.trialEndsAt}
                      onChange={(e) =>
                        setContractForm((s) => ({ ...s, trialEndsAt: e.target.value }))
                      }
                    />
                  </label>
                </div>
                <label className="mt-2 block text-[11px] text-ink-600 dark:text-ink-400">
                  Invoice URLs (comma-separated)
                  <input
                    className="input mt-1 dark:border-white/10 dark:bg-ink-950"
                    value={contractForm.manualInvoiceUrls}
                    onChange={(e) =>
                      setContractForm((s) => ({ ...s, manualInvoiceUrls: e.target.value }))
                    }
                  />
                </label>
                <label className="mt-2 block text-[11px] text-ink-600 dark:text-ink-400">
                  Notes
                  <textarea
                    className="input mt-1 min-h-[72px] dark:border-white/10 dark:bg-ink-950"
                    value={contractForm.notes}
                    onChange={(e) =>
                      setContractForm((s) => ({ ...s, notes: e.target.value }))
                    }
                  />
                </label>
                <button
                  type="button"
                  className="mt-3 rounded-full bg-amber-600 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
                  disabled={upsertContract.isPending}
                  onClick={() =>
                    void upsertContract.mutateAsync({
                      workspaceId,
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
              </section>

              <BillingLedgerMini
                title="Seat timeline"
                rows={detail.data.seatEvents.map((s) => ({
                  id: s.id,
                  line: `${s.userName} · ${s.action} · billable ${String(s.billableAfter)} · ${new Date(s.occurredAt).toLocaleString()}`,
                }))}
              />
              <BillingLedgerMini
                title="Plan changes"
                rows={detail.data.planChanges.map((l) => ({
                  id: l.id,
                  line: `${l.fromPlanKey} → ${l.toPlanKey} · ${new Date(l.changedAt).toLocaleString()}`,
                }))}
              />
              <BillingLedgerMini
                title="Payments"
                rows={detail.data.payments.map((p) => ({
                  id: p.id,
                  line: `${p.status} ${formatUsd(p.amountUsd)} · ${new Date(p.createdAt).toLocaleString()}`,
                }))}
              />
              <BillingLedgerMini
                title="Invoices"
                rows={detail.data.invoices.map((i) => ({
                  id: i.id,
                  line: `${i.invoiceNumber} ${i.status} ${formatUsd(i.amountDueFinalUsd)}`,
                }))}
              />
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
