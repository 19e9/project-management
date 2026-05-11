import { useMemo, useState } from 'react';
import {
  useBillingDashboard,
} from '../../features/billing/BillingDashboardContext';
import {
  useCreateSubscriptionPlan,
  useDeactivateSubscriptionPlan,
  useDeleteSubscriptionPlan,
  useUpdateSubscriptionPlan,
  type AdminSubscriptionPlanRow,
} from '../../features/admin/hooks';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { formatUsd } from '../../features/billing/billingFormat';

type DraftPlan = Partial<AdminSubscriptionPlanRow> & {
  key: string;
  displayName: string;
  tier: 'free' | 'pro' | 'enterprise';
};

/** Must match backend `PROTECTED_SUBSCRIPTION_PLAN_KEYS` in billing.service.ts */
const PROTECTED_PLAN_KEYS = new Set(['free-default', 'pro-default', 'enterprise-default']);

function planDeleteBlockedReason(
  plan: AdminSubscriptionPlanRow,
  attachedWorkspaces: number,
): string | null {
  if (PROTECTED_PLAN_KEYS.has(plan.key)) {
    return 'Built-in default plans cannot be deleted.';
  }
  if (attachedWorkspaces > 0) {
    return `This plan is assigned to ${attachedWorkspaces} workspace(s). Reassign workspaces before deleting.`;
  }
  return null;
}

function PlanStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-400 dark:text-ink-500">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold text-ink-900 dark:text-white">{value}</p>
    </div>
  );
}

export default function BillingPlansPage() {
  const billing = useBillingDashboard();
  const createPlan = useCreateSubscriptionPlan();
  const updatePlan = useUpdateSubscriptionPlan();
  const deactivatePlan = useDeactivateSubscriptionPlan();
  const deletePlan = useDeleteSubscriptionPlan();

  const [createOpen, setCreateOpen] = useState(false);
  const [editPlan, setEditPlan] = useState<AdminSubscriptionPlanRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminSubscriptionPlanRow | null>(null);

  const planEconomics = useMemo(() => {
    const map = new Map<
      string,
      { subs: number; mrr: number }
    >();
    for (const w of billing.data?.workspaces ?? []) {
      const key = w.subscriptionPlanKey ?? w.plan;
      const cur = map.get(key) ?? { subs: 0, mrr: 0 };
      cur.subs += 1;
      cur.mrr += w.mrrUsd;
      map.set(key, cur);
    }
    return map;
  }, [billing.data?.workspaces]);

  const totalPaidWs =
    (billing.data?.planDistribution.pro ?? 0) +
    (billing.data?.planDistribution.enterprise ?? 0);

  return (
    <div className="space-y-8 animate-fade-in-up">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-ink-900 dark:text-white">
            Commercial packaging
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-ink-600 dark:text-ink-400">
            Cards mirror how buyers experience pricing; edits stay modular — no endless scroll forms.
            Only <strong className="font-semibold text-ink-800 dark:text-ink-200">live</strong>{' '}
            plans appear on the public landing pricing section; <strong className="font-semibold text-ink-800 dark:text-ink-200">off</strong>{' '}
            plans are hidden until activated.
          </p>
        </div>
        <button
          type="button"
          className="rounded-full bg-ink-900 px-5 py-2 text-xs font-semibold text-white hover:bg-ink-800 dark:bg-white dark:text-ink-950"
          onClick={() => setCreateOpen(true)}
        >
          New plan
        </button>
      </header>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {billing.isLoading &&
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-72 rounded-3xl dark:bg-ink-800" />
          ))}
        {!billing.isLoading &&
          (billing.data?.plans ?? []).map((p) => {
            const econ = planEconomics.get(p.key) ?? { subs: 0, mrr: 0 };
            const deleteBlocked = planDeleteBlockedReason(p, econ.subs);
            const conv =
              totalPaidWs > 0 ? ((econ.subs / totalPaidWs) * 100).toFixed(1) : '—';
            return (
              <article
                key={p.id}
                className={`relative flex flex-col rounded-3xl p-6 shadow-soft ring-1 transition hover:-translate-y-0.5 hover:shadow-lg ${
                  p.isHighlighted
                    ? 'bg-gradient-to-b from-brand-50 to-white ring-brand-200 dark:from-brand-500/10 dark:to-ink-950 dark:ring-brand-500/30'
                    : 'bg-white ring-ink-900/[0.06] dark:bg-ink-900/60 dark:ring-white/[0.08]'
                }`}
              >
                {p.isHighlighted && (
                  <span className="absolute right-5 top-5 rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                    Featured
                  </span>
                )}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-ink-900 dark:text-white">{p.displayName}</h3>
                    <p className="font-mono text-[11px] text-ink-400">{p.key}</p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ring-1 ring-inset ${
                      p.isActive
                        ? 'bg-emerald-500/10 text-emerald-800 ring-emerald-500/20 dark:text-emerald-200'
                        : 'bg-ink-500/10 text-ink-600 ring-ink-500/20 dark:text-ink-300'
                    }`}
                  >
                    {p.isActive ? 'live' : 'off'}
                  </span>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4">
                  <PlanStat
                    label="Monthly / seat"
                    value={
                      p.useCustomPricing ? p.customPriceLabel || 'Custom' : formatUsd(p.pricePerSeatMonthlyUsd)
                    }
                  />
                  <PlanStat
                    label="Annual discount"
                    value={`${p.annualDiscountPercent}%`}
                  />
                  <PlanStat label="Members cap" value={String(p.maxMembers)} />
                  <PlanStat label="Projects cap" value={String(p.maxProjects)} />
                  <PlanStat
                    label="Storage"
                    value={`${(p.storageLimitMb / 1024).toFixed(1)} GB`}
                  />
                  <PlanStat label="Tier" value={p.tier} />
                </div>

                <div className="mt-5 flex flex-wrap gap-2 text-[11px] text-ink-600 dark:text-ink-400">
                  <span className="rounded-full bg-ink-50 px-2 py-0.5 dark:bg-white/5">
                    Gantt {p.ganttEnabled ? 'on' : 'off'}
                  </span>
                  <span className="rounded-full bg-ink-50 px-2 py-0.5 dark:bg-white/5">
                    CPM {p.cpmEnabled ? 'on' : 'off'}
                  </span>
                  <span className="rounded-full bg-ink-50 px-2 py-0.5 dark:bg-white/5">
                    Audit {p.auditLogEnabled ? 'on' : 'off'}
                  </span>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3 border-t border-ink-100 pt-5 dark:border-white/[0.06]">
                  <PlanStat label="Attached workspaces" value={String(econ.subs)} />
                  <PlanStat label="MRR attributed" value={formatUsd(econ.mrr)} />
                  <PlanStat label="Share of paid" value={`${conv}%`} />
                  <PlanStat label="Sort" value={String(p.sortOrder)} />
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="rounded-full border border-ink-200 px-3 py-1.5 text-xs font-semibold hover:bg-ink-50 dark:border-white/10 dark:hover:bg-white/5"
                    onClick={() => setEditPlan(p)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    disabled={Boolean(deleteBlocked)}
                    title={deleteBlocked ?? undefined}
                    className="rounded-full border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-rose-500/30 dark:text-rose-300 dark:hover:bg-rose-500/10"
                    onClick={() => setDeleteTarget(p)}
                  >
                    Delete
                  </button>
                  {p.isActive ? (
                    <button
                      type="button"
                      className="rounded-full px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-500/10"
                      onClick={() => void deactivatePlan.mutateAsync(p.id)}
                    >
                      Deactivate
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500"
                      onClick={() =>
                        void updatePlan.mutateAsync({ id: p.id, patch: { isActive: true } })
                      }
                    >
                      Activate
                    </button>
                  )}
                </div>
              </article>
            );
          })}
      </div>

      <CreatePlanModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        loading={createPlan.isPending}
        onSubmit={async (body) => {
          await createPlan.mutateAsync(body);
          setCreateOpen(false);
        }}
      />

      {editPlan && (
        <EditPlanModal
          plan={editPlan}
          loading={updatePlan.isPending}
          onClose={() => setEditPlan(null)}
          onSave={async (patch) => {
            await updatePlan.mutateAsync({ id: editPlan.id, patch });
            setEditPlan(null);
          }}
        />
      )}

      {deleteTarget && (
        <Modal
          open
          onClose={() => setDeleteTarget(null)}
          title="Delete plan"
          footer={
            <>
              <Button variant="ghost" type="button" onClick={() => setDeleteTarget(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                type="button"
                loading={deletePlan.isPending}
                onClick={() =>
                  void (async () => {
                    await deletePlan.mutateAsync(deleteTarget.id);
                    setDeleteTarget(null);
                  })()
                }
              >
                Delete plan
              </Button>
            </>
          }
        >
          <p className="text-sm text-ink-600 dark:text-ink-400">
            Permanently delete{' '}
            <strong className="font-semibold text-ink-900 dark:text-white">
              {deleteTarget.displayName}
            </strong>{' '}
            (<span className="font-mono text-xs">{deleteTarget.key}</span>)? This cannot be undone.
          </p>
        </Modal>
      )}
    </div>
  );
}

function CreatePlanModal({
  open,
  onClose,
  loading,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  loading: boolean;
  onSubmit: (body: DraftPlan) => Promise<void>;
}) {
  const [draft, setDraft] = useState<DraftPlan>(() => ({
    key: '',
    displayName: '',
    tier: 'pro',
    pricePerSeatMonthlyUsd: 12,
    maxMembers: 25,
    maxProjects: 25,
    storageLimitMb: 10240,
    ganttEnabled: true,
    cpmEnabled: true,
    auditLogEnabled: false,
    marketingDescription: '',
    annualDiscountPercent: 20,
    isHighlighted: false,
    useCustomPricing: false,
    ctaLabel: 'Start trial',
    ctaHref: '/register',
    customPriceLabel: '',
  }));
  const [bulletText, setBulletText] = useState('');

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create plan"
      size="lg"
      footer={
        <>
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            form="create-plan-form"
            loading={loading}
          >
            Publish plan
          </Button>
        </>
      }
    >
      <form
        id="create-plan-form"
        className="grid gap-4 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          const marketingBullets = bulletText
            .split('\n')
            .map((s) => s.trim())
            .filter(Boolean);
          void onSubmit({
            ...draft,
            marketingBullets,
            isActive: true,
            isDefaultForTier: false,
            sortOrder: 50,
          });
        }}
      >
        <label className="sm:col-span-2 text-xs font-medium text-ink-600">
          Internal key
          <input
            className="input mt-1"
            required
            value={draft.key}
            onChange={(e) => setDraft((s) => ({ ...s, key: e.target.value }))}
          />
        </label>
        <label className="sm:col-span-2 text-xs font-medium text-ink-600">
          Display name
          <input
            className="input mt-1"
            required
            value={draft.displayName}
            onChange={(e) => setDraft((s) => ({ ...s, displayName: e.target.value }))}
          />
        </label>
        <label className="text-xs font-medium text-ink-600">
          Tier
          <select
            className="input mt-1"
            value={draft.tier}
            onChange={(e) =>
              setDraft((s) => ({ ...s, tier: e.target.value as DraftPlan['tier'] }))
            }
          >
            <option value="free">Free</option>
            <option value="pro">Pro</option>
            <option value="enterprise">Enterprise</option>
          </select>
        </label>
        <label className="text-xs font-medium text-ink-600">
          $ / seat / mo
          <input
            type="number"
            className="input mt-1"
            value={draft.pricePerSeatMonthlyUsd}
            onChange={(e) =>
              setDraft((s) => ({ ...s, pricePerSeatMonthlyUsd: Number(e.target.value) }))
            }
          />
        </label>
        <label className="text-xs font-medium text-ink-600">
          Members
          <input
            type="number"
            className="input mt-1"
            value={draft.maxMembers}
            onChange={(e) => setDraft((s) => ({ ...s, maxMembers: Number(e.target.value) }))}
          />
        </label>
        <label className="text-xs font-medium text-ink-600">
          Projects
          <input
            type="number"
            className="input mt-1"
            value={draft.maxProjects}
            onChange={(e) => setDraft((s) => ({ ...s, maxProjects: Number(e.target.value) }))}
          />
        </label>
        <label className="text-xs font-medium text-ink-600">
          Storage (MB)
          <input
            type="number"
            className="input mt-1"
            value={draft.storageLimitMb}
            onChange={(e) =>
              setDraft((s) => ({ ...s, storageLimitMb: Number(e.target.value) }))
            }
          />
        </label>
        <label className="text-xs font-medium text-ink-600">
          Annual discount %
          <input
            type="number"
            className="input mt-1"
            value={draft.annualDiscountPercent}
            onChange={(e) =>
              setDraft((s) => ({ ...s, annualDiscountPercent: Number(e.target.value) }))
            }
          />
        </label>
        <div className="flex flex-wrap gap-4 sm:col-span-2">
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={draft.ganttEnabled}
              onChange={(e) => setDraft((s) => ({ ...s, ganttEnabled: e.target.checked }))}
            />
            Gantt
          </label>
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={draft.cpmEnabled}
              onChange={(e) => setDraft((s) => ({ ...s, cpmEnabled: e.target.checked }))}
            />
            CPM
          </label>
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={draft.auditLogEnabled}
              onChange={(e) => setDraft((s) => ({ ...s, auditLogEnabled: e.target.checked }))}
            />
            Audit log
          </label>
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={draft.isHighlighted}
              onChange={(e) => setDraft((s) => ({ ...s, isHighlighted: e.target.checked }))}
            />
            Highlight card
          </label>
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={draft.useCustomPricing}
              onChange={(e) => setDraft((s) => ({ ...s, useCustomPricing: e.target.checked }))}
            />
            Custom pricing label
          </label>
        </div>
        <label className="sm:col-span-2 text-xs font-medium text-ink-600">
          Marketing description
          <textarea
            className="input mt-1 min-h-[72px]"
            value={draft.marketingDescription}
            onChange={(e) =>
              setDraft((s) => ({ ...s, marketingDescription: e.target.value }))
            }
          />
        </label>
        <label className="text-xs font-medium text-ink-600">
          CTA label
          <input
            className="input mt-1"
            value={draft.ctaLabel}
            onChange={(e) => setDraft((s) => ({ ...s, ctaLabel: e.target.value }))}
          />
        </label>
        <label className="text-xs font-medium text-ink-600">
          CTA href
          <input
            className="input mt-1"
            value={draft.ctaHref}
            onChange={(e) => setDraft((s) => ({ ...s, ctaHref: e.target.value }))}
          />
        </label>
        <label className="sm:col-span-2 text-xs font-medium text-ink-600">
          Custom price label
          <input
            className="input mt-1"
            value={draft.customPriceLabel}
            onChange={(e) =>
              setDraft((s) => ({ ...s, customPriceLabel: e.target.value }))
            }
          />
        </label>
        <label className="sm:col-span-2 text-xs font-medium text-ink-600">
          Marketing bullets (one per line)
          <textarea
            className="input mt-1 min-h-[96px]"
            value={bulletText}
            onChange={(e) => setBulletText(e.target.value)}
          />
        </label>
      </form>
    </Modal>
  );
}

function EditPlanModal({
  plan,
  onClose,
  onSave,
  loading,
}: {
  plan: AdminSubscriptionPlanRow;
  onClose: () => void;
  onSave: (patch: Partial<AdminSubscriptionPlanRow>) => Promise<void>;
  loading: boolean;
}) {
  const [patch, setPatch] = useState<Partial<AdminSubscriptionPlanRow>>({});

  function field<K extends keyof AdminSubscriptionPlanRow>(key: K): AdminSubscriptionPlanRow[K] {
    return (patch[key] ?? plan[key]) as AdminSubscriptionPlanRow[K];
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Edit · ${plan.displayName}`}
      size="lg"
      footer={
        <>
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            loading={loading}
            type="button"
            onClick={() => void onSave(patch)}
          >
            Save changes
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="sm:col-span-2 text-xs font-medium text-ink-600">
          Display name
          <input
            className="input mt-1"
            value={String(field('displayName'))}
            onChange={(e) => setPatch((p) => ({ ...p, displayName: e.target.value }))}
          />
        </label>
        <label className="text-xs font-medium text-ink-600">
          $ / seat / mo
          <input
            type="number"
            className="input mt-1"
            value={Number(field('pricePerSeatMonthlyUsd'))}
            onChange={(e) =>
              setPatch((p) => ({ ...p, pricePerSeatMonthlyUsd: Number(e.target.value) }))
            }
          />
        </label>
        <label className="text-xs font-medium text-ink-600">
          Annual discount %
          <input
            type="number"
            className="input mt-1"
            value={Number(field('annualDiscountPercent'))}
            onChange={(e) =>
              setPatch((p) => ({ ...p, annualDiscountPercent: Number(e.target.value) }))
            }
          />
        </label>
        <label className="text-xs font-medium text-ink-600">
          Members
          <input
            type="number"
            className="input mt-1"
            value={Number(field('maxMembers'))}
            onChange={(e) => setPatch((p) => ({ ...p, maxMembers: Number(e.target.value) }))}
          />
        </label>
        <label className="text-xs font-medium text-ink-600">
          Projects
          <input
            type="number"
            className="input mt-1"
            value={Number(field('maxProjects'))}
            onChange={(e) => setPatch((p) => ({ ...p, maxProjects: Number(e.target.value) }))}
          />
        </label>
        <label className="text-xs font-medium text-ink-600">
          Storage MB
          <input
            type="number"
            className="input mt-1"
            value={Number(field('storageLimitMb'))}
            onChange={(e) =>
              setPatch((p) => ({ ...p, storageLimitMb: Number(e.target.value) }))
            }
          />
        </label>
        <label className="text-xs font-medium text-ink-600">
          Sort order
          <input
            type="number"
            className="input mt-1"
            value={Number(field('sortOrder'))}
            onChange={(e) => setPatch((p) => ({ ...p, sortOrder: Number(e.target.value) }))}
          />
        </label>
        <label className="flex items-center gap-2 text-xs sm:col-span-2">
          <input
            type="checkbox"
            checked={Boolean(field('isActive'))}
            onChange={(e) => setPatch((p) => ({ ...p, isActive: e.target.checked }))}
          />
          <span>
            <strong className="font-semibold text-ink-800">Live on marketing site</strong>
            <span className="block text-[11px] font-normal text-ink-500">
              When off, this plan is hidden from the public pricing page.
            </span>
          </span>
        </label>
        <div className="flex flex-wrap gap-4 sm:col-span-2">
          {(['ganttEnabled', 'cpmEnabled', 'auditLogEnabled', 'isHighlighted', 'useCustomPricing'] as const).map(
            (k) => (
              <label key={k} className="flex items-center gap-2 text-xs capitalize">
                <input
                  type="checkbox"
                  checked={Boolean(field(k))}
                  onChange={(e) => setPatch((p) => ({ ...p, [k]: e.target.checked }))}
                />
                {k.replace(/([A-Z])/g, ' $1')}
              </label>
            ),
          )}
        </div>
        <label className="sm:col-span-2 text-xs font-medium text-ink-600">
          Marketing description
          <textarea
            className="input mt-1 min-h-[72px]"
            value={String(field('marketingDescription'))}
            onChange={(e) =>
              setPatch((p) => ({ ...p, marketingDescription: e.target.value }))
            }
          />
        </label>
        <label className="text-xs font-medium text-ink-600">
          CTA label
          <input
            className="input mt-1"
            value={String(field('ctaLabel'))}
            onChange={(e) => setPatch((p) => ({ ...p, ctaLabel: e.target.value }))}
          />
        </label>
        <label className="text-xs font-medium text-ink-600">
          CTA href
          <input
            className="input mt-1"
            value={String(field('ctaHref'))}
            onChange={(e) => setPatch((p) => ({ ...p, ctaHref: e.target.value }))}
          />
        </label>
      </div>
    </Modal>
  );
}
