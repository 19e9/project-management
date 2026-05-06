import { type ReactNode, useMemo, useState } from 'react';
import type { TaskItem } from '../tasks/hooks';
import type { WorkspaceMemberRow } from '../workspaces/hooks';
import {
  loadBudgetPrefs,
  loadProjectUiPriority,
  loadSprintLabel,
  saveBudgetPrefs,
  saveProjectUiPriority,
  saveSprintLabel,
  type UiPriority,
} from '../../lib/projectUiPrefs';
import {
  countOverdue,
  daysUntil,
  deriveHealth,
  deriveRiskLevel,
  maxTaskPriority,
} from './projectMetrics';

export function ProjectCommandCenter({
  projectId,
  projectName,
  projectEnd,
  tasks,
  members,
  overview,
  criticalCount,
  blocked,
  completionPct,
  cpmEnabled,
  onQuickAction,
}: {
  projectId: string;
  projectName: string;
  projectEnd?: string | null;
  tasks: TaskItem[];
  members: WorkspaceMemberRow[];
  overview: { total: number; inProgress: number } | undefined;
  criticalCount: number;
  blocked: number;
  completionPct: number;
  cpmEnabled: boolean;
  onQuickAction: (action: QuickAction) => void;
}) {
  const overdue = useMemo(() => countOverdue(tasks), [tasks]);
  const health = deriveHealth({ blocked, overdue, completionPct, criticalCount });
  const risk = deriveRiskLevel({ overdue, blocked, completionPct });
  const priorityFromTasks = maxTaskPriority(tasks);
  const [prefsPriority, setPrefsPriority] = useState<UiPriority | null>(() =>
    loadProjectUiPriority(projectId),
  );
  const priorityLabel = (prefsPriority ?? priorityFromTasks ?? 'medium').replace('_', ' ');
  const [sprintOpen, setSprintOpen] = useState(false);
  const [sprintDraft, setSprintDraft] = useState(() => loadSprintLabel(projectId));
  const [budgetOpen, setBudgetOpen] = useState(false);
  const [budget, setBudget] = useState(() => loadBudgetPrefs(projectId));

  const dueDays = daysUntil(projectEnd ?? undefined);

  const effectiveBudget =
    budget ??
    ({
      capUsd: Math.max(8000, tasks.length * 2400),
      spentUsd: Math.round(Math.max(1200, tasks.length * 900 * (completionPct / 100))),
    } as const);

  const progressPctRounded = Math.round(completionPct);

  return (
    <section className="overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-card">
      <div className="border-b border-ink-100 bg-gradient-to-r from-brand-50/60 via-white to-cyan-50/40 px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="eyebrow">Project control center</span>
              {!cpmEnabled && (
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-900 ring-1 ring-inset ring-amber-200">
                  CPM locked on plan
                </span>
              )}
            </div>
            <h1 className="mt-1 truncate text-2xl font-bold tracking-tight text-ink-900 md:text-3xl">
              {projectName}
            </h1>
          </div>

          <div className="flex flex-wrap gap-2">
            <QuickBtn icon="＋" label="Task" onClick={() => onQuickAction({ type: 'task' })} />
            <QuickBtn icon="◇" label="Milestone" onClick={() => onQuickAction({ type: 'milestone' })} />
            <QuickBtn icon="✉" label="Invite" onClick={() => onQuickAction({ type: 'invite' })} />
            <QuickBtn icon="⭳" label="Upload" onClick={() => onQuickAction({ type: 'docs' })} />
            <QuickBtn icon="↗" label="Export" onClick={() => onQuickAction({ type: 'export' })} />
            <QuickBtn icon="▦" label="Kanban" onClick={() => onQuickAction({ type: 'kanban' })} />
            <QuickBtn icon="⌗" label="Report" onClick={() => onQuickAction({ type: 'report' })} />
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-6">
          <MetricTile label="Progress" value={`${progressPctRounded}%`} hint="Portfolio completion" tone="brand" />
          <MetricTile label="Health" value={health} hint="Signals from blockers & overdue" tone="emerald" />
          <MetricTile
            label="Due date"
            value={dueDays === null ? '—' : dueDays >= 0 ? `In ${dueDays}d` : `${Math.abs(dueDays)}d overdue`}
            hint={projectEnd ? projectEnd.slice(0, 10) : 'Set project end date'}
            tone="cyan"
          />
          <MetricTile
            label="Budget"
            value={`$${effectiveBudget.spentUsd.toLocaleString()} / $${effectiveBudget.capUsd.toLocaleString()}`}
            hint="Tap to simulate budget"
            tone="amber"
            onClick={() => setBudgetOpen(true)}
          />
          <MetricTile label="Blockers" value={String(blocked)} hint="Workflow blocked column" tone="rose" />
          <MetricTile label="Overdue" value={String(overdue)} hint="Active tasks past end date" tone="orange" />
          <MetricTile
            label="Sprint"
            value={sprintDraft.trim() ? sprintDraft : '—'}
            hint="Local sprint label"
            tone="slate"
            onClick={() => setSprintOpen(true)}
          />
          <MetricTile label="Priority" value={priorityLabel} hint="Workspace override or highest task" tone="violet" />
          <MetricTile label="Risk" value={risk} hint="Heuristic from overdue + blocked" tone="red" />
          <MetricTile label="Active" value={String(overview?.inProgress ?? 0)} hint="In progress tasks" tone="blue" />
          <MetricTile label="Critical path" value={String(criticalCount)} hint={cpmEnabled ? 'Live CPM ids' : 'Preview ids'} tone="pink" />
          <MetricTile label="Team" value={`${members.length}`} hint={`${members.length} seats active`} tone="ink">
            <div className="mt-2 flex -space-x-2">
              {members.slice(0, 6).map((m) => (
                <span
                  key={m.userId}
                  title={m.displayName}
                  className="grid h-9 w-9 place-items-center rounded-full border-2 border-white bg-gradient-to-br from-brand-500 to-violet-600 text-[11px] font-bold text-white"
                >
                  {m.avatarUrl ? (
                    <img src={m.avatarUrl} alt="" className="h-full w-full rounded-full object-cover" />
                  ) : (
                    initials(m.displayName)
                  )}
                </span>
              ))}
              {members.length === 0 && <span className="text-xs text-ink-400">No members loaded</span>}
            </div>
          </MetricTile>
        </div>
      </div>

      {budgetOpen && (
        <BudgetModal
          initial={effectiveBudget}
          onSave={(b) => {
            setBudget(b);
            saveBudgetPrefs(projectId, b);
            setBudgetOpen(false);
          }}
          onClose={() => setBudgetOpen(false)}
        />
      )}

      {sprintOpen && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-ink-900/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl ring-1 ring-ink-200">
            <h3 className="text-base font-semibold text-ink-900">Sprint label</h3>
            <p className="mt-1 text-xs text-ink-500">Stored locally for narrative dashboards.</p>
            <input
              className="input mt-3 text-sm"
              placeholder="e.g. Sprint 24 · Cutover"
              value={sprintDraft}
              onChange={(e) => setSprintDraft(e.target.value)}
            />
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" className="btn-secondary px-3 text-sm" onClick={() => setSprintOpen(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary px-3 text-sm"
                onClick={() => {
                  saveSprintLabel(projectId, sprintDraft);
                  setSprintOpen(false);
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 border-t border-ink-100 bg-ink-50/30 px-4 py-3 text-xs text-ink-600 sm:px-5">
        <span className="font-semibold text-ink-800">Priority override</span>
        {(['low', 'medium', 'high', 'critical'] as UiPriority[]).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => {
              setPrefsPriority(p);
              saveProjectUiPriority(projectId, p);
            }}
            className={`rounded-full px-2.5 py-1 font-semibold capitalize ring-1 ring-inset ${
              (prefsPriority ?? '') === p || (!prefsPriority && priorityFromTasks === p)
                ? 'bg-brand-600 text-white ring-brand-700'
                : 'bg-white text-ink-700 ring-ink-200 hover:bg-ink-50'
            }`}
          >
            {p}
          </button>
        ))}
        <button
          type="button"
          className="ml-auto text-[11px] font-semibold text-brand-700 hover:text-brand-900"
          onClick={() => {
            setPrefsPriority(null);
            localStorage.removeItem(`planforge.projectPriority.${projectId}`);
          }}
        >
          Reset to tasks
        </button>
      </div>
    </section>
  );
}

export type QuickAction =
  | { type: 'task' }
  | { type: 'milestone' }
  | { type: 'invite' }
  | { type: 'docs' }
  | { type: 'export' }
  | { type: 'kanban' }
  | { type: 'report' };

function QuickBtn({
  icon,
  label,
  onClick,
}: {
  icon: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-xl border border-ink-200 bg-white px-3 py-2 text-xs font-semibold text-ink-800 shadow-sm transition hover:border-brand-300 hover:bg-brand-50/60"
    >
      <span className="text-[13px] leading-none text-brand-600">{icon}</span>
      {label}
    </button>
  );
}

function MetricTile({
  label,
  value,
  hint,
  tone,
  onClick,
  children,
}: {
  label: string;
  value: string;
  hint: string;
  tone:
    | 'brand'
    | 'emerald'
    | 'cyan'
    | 'amber'
    | 'rose'
    | 'orange'
    | 'slate'
    | 'violet'
    | 'red'
    | 'blue'
    | 'pink'
    | 'ink';
  onClick?: () => void;
  children?: ReactNode;
}) {
  const ring =
    tone === 'brand'
      ? 'ring-brand-100'
      : tone === 'emerald'
        ? 'ring-emerald-100'
        : tone === 'cyan'
          ? 'ring-cyan-100'
          : tone === 'amber'
            ? 'ring-amber-100'
            : tone === 'rose'
              ? 'ring-rose-100'
              : tone === 'orange'
                ? 'ring-orange-100'
                : tone === 'violet'
                  ? 'ring-violet-100'
                  : tone === 'red'
                    ? 'ring-red-100'
                    : tone === 'blue'
                      ? 'ring-blue-100'
                      : tone === 'pink'
                        ? 'ring-pink-100'
                        : 'ring-ink-100';
  const cls = `rounded-2xl bg-white/90 p-3 text-left shadow-sm ring-1 ring-inset ${ring} ${
    onClick ? 'cursor-pointer transition hover:bg-white hover:shadow-md' : ''
  }`;
  const inner = (
    <>
      <div className="text-[10px] font-bold uppercase tracking-wide text-ink-500">{label}</div>
      <div className="mt-1 text-lg font-bold tracking-tight text-ink-900">{value}</div>
      {children}
      <p className={`mt-1 text-[11px] ${onClick ? 'text-brand-700' : 'text-ink-400'}`}>{hint}</p>
    </>
  );
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cls}>
        {inner}
      </button>
    );
  }
  return <div className={cls}>{inner}</div>;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((s) => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function BudgetModal({
  initial,
  onSave,
  onClose,
}: {
  initial: { capUsd: number; spentUsd: number };
  onSave: (b: { capUsd: number; spentUsd: number }) => void;
  onClose: () => void;
}) {
  const [cap, setCap] = useState(String(initial.capUsd));
  const [spent, setSpent] = useState(String(initial.spentUsd));
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-ink-900/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl ring-1 ring-ink-200">
        <h3 className="text-base font-semibold text-ink-900">Budget simulation</h3>
        <p className="mt-1 text-xs text-ink-500">Numbers stay in this browser until backend budgeting ships.</p>
        <label className="label mt-3">Cap (USD)</label>
        <input className="input text-sm" value={cap} onChange={(e) => setCap(e.target.value)} />
        <label className="label mt-3">Spent (USD)</label>
        <input className="input text-sm" value={spent} onChange={(e) => setSpent(e.target.value)} />
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className="btn-secondary px-3 text-sm" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary px-3 text-sm"
            onClick={() =>
              onSave({
                capUsd: Math.max(0, parseFloat(cap) || 0),
                spentUsd: Math.max(0, parseFloat(spent) || 0),
              })
            }
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
