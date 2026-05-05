import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useProject } from '../features/projects/hooks';
import {
  useAnalyticsOverview,
  useCpm,
  useCreateDependency,
  useCreateTask,
  useDependencies,
  useDeleteTask,
  useTaskTree,
  useTasks,
  type TaskItem,
} from '../features/tasks/hooks';
import { useWorkspace } from '../features/workspaces/hooks';
import { ProjectGantt } from '../features/gantt/ProjectGantt';
import { WbsTree } from '../features/wbs/WbsTree';

type TabId = 'overview' | 'wbs' | 'gantt' | 'cpm' | 'tasks';

const TABS: { id: TabId; label: string; description: string }[] = [
  { id: 'overview', label: 'Overview', description: 'Health & progress' },
  { id: 'wbs', label: 'WBS', description: 'Work breakdown' },
  { id: 'gantt', label: 'Gantt', description: 'Timeline' },
  { id: 'cpm', label: 'Critical path', description: 'CPM' },
  { id: 'tasks', label: 'Tasks', description: 'List & dependencies' },
];

export default function ProjectDetailPage() {
  const { workspaceId, projectId } = useParams<{
    workspaceId: string;
    projectId: string;
  }>();
  const [tab, setTab] = useState<TabId>('overview');

  const { data: workspace } = useWorkspace(workspaceId);
  const { data: project } = useProject(workspaceId, projectId);
  const { data: tasks = [] } = useTasks(workspaceId, projectId);
  const { data: tree = [] } = useTaskTree(workspaceId, projectId);
  const { data: deps = [] } = useDependencies(workspaceId, projectId);
  const overview = useAnalyticsOverview(workspaceId, projectId);
  const cpm = useCpm(workspaceId, projectId);
  const createTask = useCreateTask(workspaceId!, projectId!);
  const createDep = useCreateDependency(workspaceId!, projectId!);
  const deleteTask = useDeleteTask(workspaceId!, projectId!);

  const cpmEnabled = workspace?.entitlements?.cpmEnabled;
  const criticalIds: string[] = cpm.data?.criticalTaskIds ?? [];

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { to: '/dashboard', label: 'Overview' },
          { to: '/dashboard/workspaces', label: 'Workspaces' },
          {
            to: `/dashboard/workspaces/${workspaceId}/projects`,
            label: workspace?.name ?? 'Projects',
          },
          { label: project?.name ?? 'Project' },
        ]}
      />

      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <span className="eyebrow">Project</span>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-ink-900 md:text-3xl">
              {project?.name ?? 'Project'}
            </h1>
            {project?.code && (
              <span className="rounded-lg bg-ink-100 px-2.5 py-1 font-mono text-xs font-semibold text-ink-700 ring-1 ring-inset ring-ink-200">
                {project.code}
              </span>
            )}
          </div>
          {project?.description ? (
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-600">{project.description}</p>
          ) : (
            <p className="mt-2 text-sm text-ink-400">No description added.</p>
          )}
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            {project?.startDate && (
              <MetaKV label="Start" value={fmt(project.startDate)} />
            )}
            {project?.endDate && <MetaKV label="End" value={fmt(project.endDate)} />}
            <MetaKV
              label="CPM"
              value={cpmEnabled ? 'Enabled on plan' : 'Upgrade required'}
            />
          </div>
        </div>
        <Link
          to={`/dashboard/workspaces/${workspaceId}/projects`}
          className="btn-secondary h-10 shrink-0 self-start px-4 text-sm"
        >
          ← Back to projects
        </Link>
      </header>

      <div className="card overflow-hidden">
        <div className="border-b border-ink-200 bg-ink-50/40 px-2 py-2 sm:px-4">
          <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none sm:flex-wrap sm:pb-0">
            {TABS.map((t) => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`flex min-w-0 flex-col rounded-xl px-3 py-2 text-left transition sm:px-4 ${
                    active
                      ? 'bg-white text-ink-900 shadow-soft ring-1 ring-inset ring-ink-200'
                      : 'text-ink-600 hover:bg-white/70 hover:text-ink-900'
                  }`}
                >
                  <span className="text-sm font-semibold">{t.label}</span>
                  <span className="hidden text-[11px] text-ink-500 sm:block">{t.description}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-5 sm:p-6">
          {tab === 'overview' && (
            <OverviewPanel overview={overview} tasks={tasks} criticalIds={criticalIds} />
          )}

          {tab === 'wbs' && (
            <SectionIntro
              title="Work breakdown structure"
              subtitle="Task hierarchy with critical-path emphasis (red)."
            />
          )}
          {tab === 'wbs' && (
            <div className="mt-4 rounded-2xl border border-ink-100 bg-ink-50/30 p-4 sm:p-5">
              <WbsTree nodes={tree as any} criticalIds={criticalIds} />
            </div>
          )}

          {tab === 'gantt' && (
            <>
              <SectionIntro
                title="Gantt"
                subtitle="Drag bars to reschedule. Critical tasks stay highlighted."
              />
              <div className="mt-4 rounded-2xl border border-ink-100 bg-white p-2 sm:p-4">
                <ProjectGantt
                  workspaceId={workspaceId!}
                  projectId={projectId!}
                  criticalIds={criticalIds}
                />
              </div>
            </>
          )}

          {tab === 'cpm' && (
            <CpmPanel
              cpmEnabled={!!cpmEnabled}
              cpm={cpm}
              tasks={tasks}
            />
          )}

          {tab === 'tasks' && (
            <TasksPanel
              tasks={tasks}
              deps={deps}
              criticalIds={criticalIds}
              onCreateTask={(payload) => createTask.mutateAsync(payload)}
              onCreateDep={(body) => createDep.mutateAsync(body)}
              onDeleteTask={(id) => deleteTask.mutate(id)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function Breadcrumb({
  items,
}: {
  items: Array<{ to?: string; label: string }>;
}) {
  return (
    <nav className="flex flex-wrap items-center gap-1.5 text-xs text-ink-500" aria-label="Breadcrumb">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-ink-300">/</span>}
          {item.to ? (
            <Link to={item.to} className="font-medium text-ink-600 transition hover:text-brand-700">
              {item.label}
            </Link>
          ) : (
            <span className="max-w-[12rem] truncate font-semibold text-ink-800 sm:max-w-md">
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}

function MetaKV({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg bg-ink-100/80 px-2.5 py-1 font-medium text-ink-700 ring-1 ring-inset ring-ink-200/60">
      <span className="text-ink-500">{label}</span>
      {value}
    </span>
  );
}

function SectionIntro({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-ink-900">{title}</h2>
      <p className="mt-1 text-sm text-ink-500">{subtitle}</p>
    </div>
  );
}

function OverviewPanel({
  overview,
  tasks,
  criticalIds,
}: {
  overview: ReturnType<typeof useAnalyticsOverview>;
  tasks: TaskItem[];
  criticalIds: string[];
}) {
  const o = overview.data;
  const criticalCount = tasks.filter((t) => criticalIds.includes(t.id)).length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Tasks" value={o?.total ?? 0} hint="All records" accent="brand" />
        <Kpi
          label="Completion"
          value={`${o?.completionPct ?? 0}%`}
          hint="Done share"
          accent="emerald"
        />
        <Kpi label="In progress" value={o?.inProgress ?? 0} hint="Active work" accent="cyan" />
        <Kpi label="Blocked" value={o?.blocked ?? 0} hint="Needs attention" accent="amber" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <h3 className="text-base font-semibold text-ink-900">Status mix</h3>
          <p className="text-xs text-ink-500">Share of tasks by workflow state</p>
          <div className="mt-5 space-y-3">
            {(
              [
                { key: 'not_started' as const, label: 'Not started', dataKey: 'notStarted' },
                { key: 'in_progress' as const, label: 'In progress', dataKey: 'inProgress' },
                { key: 'blocked' as const, label: 'Blocked', dataKey: 'blocked' },
                { key: 'done' as const, label: 'Done', dataKey: 'done' },
                { key: 'cancelled' as const, label: 'Cancelled', dataKey: 'cancelled' },
              ] as const
            ).map((row) => (
              <StatusBar
                key={row.key}
                label={row.label}
                value={(o as any)?.[row.dataKey] ?? 0}
                total={o?.total ?? 0}
              />
            ))}
          </div>
        </div>
        <div className="card relative overflow-hidden p-5">
          <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-brand-500/15 to-transparent blur-2xl" />
          <h3 className="relative text-base font-semibold text-ink-900">Ops snapshot</h3>
          <p className="relative mt-1 text-xs text-ink-500">Quick health signals</p>
          <ul className="relative mt-4 space-y-3 text-sm text-ink-700">
            <li className="flex justify-between gap-2 border-b border-ink-100 pb-2">
              <span className="text-ink-500">Critical tasks</span>
              <span className="font-semibold tabular-nums text-ink-900">{criticalCount}</span>
            </li>
            <li className="flex justify-between gap-2 border-b border-ink-100 pb-2">
              <span className="text-ink-500">Blocked tasks</span>
              <span className="font-semibold tabular-nums text-ink-900">{o?.blocked ?? 0}</span>
            </li>
            <li className="flex justify-between gap-2">
              <span className="text-ink-500">Completion</span>
              <span className="font-semibold tabular-nums text-emerald-700">
                {o?.completionPct ?? 0}%
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string | number;
  hint: string;
  accent: 'brand' | 'emerald' | 'cyan' | 'amber';
}) {
  const dot = {
    brand: 'bg-brand-500',
    emerald: 'bg-emerald-500',
    cyan: 'bg-cyan-500',
    amber: 'bg-amber-500',
  }[accent];
  return (
    <div className="card relative overflow-hidden p-5">
      <div
        className={`pointer-events-none absolute -right-3 -top-3 h-20 w-20 rounded-full opacity-40 blur-xl ${
          accent === 'brand'
            ? 'bg-brand-400'
            : accent === 'emerald'
              ? 'bg-emerald-400'
              : accent === 'cyan'
                ? 'bg-cyan-400'
                : 'bg-amber-400'
        }`}
      />
      <div className="relative flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${dot}`} />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">{label}</span>
      </div>
      <div className="relative mt-1 text-3xl font-bold tracking-tight text-ink-900">{value}</div>
      <div className="relative text-xs text-ink-500">{hint}</div>
    </div>
  );
}

function StatusBar({ label, value, total }: { label: string; value: number; total: number }) {
  const pct = total === 0 ? 0 : (value / total) * 100;
  return (
    <div>
      <div className="flex justify-between text-xs font-medium text-ink-600">
        <span>{label}</span>
        <span className="tabular-nums text-ink-500">
          {value}
          <span className="text-ink-400"> / {total}</span>
        </span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-ink-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand-600 to-cyan-500 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function CpmPanel({
  cpmEnabled,
  cpm,
  tasks,
}: {
  cpmEnabled: boolean;
  cpm: ReturnType<typeof useCpm>;
  tasks: { id: string; title: string }[];
}) {
  return (
    <div className="space-y-4">
      <SectionIntro
        title="Critical path (CPM)"
        subtitle="Early start/finish with slack; critical activities highlighted."
      />
      {!cpmEnabled && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-900">
          <p className="font-semibold">CPM is not enabled</p>
          <p className="mt-1 text-xs text-amber-800/90">
            Upgrade the workspace plan to unlock full critical-path calculations.
          </p>
        </div>
      )}
      {cpmEnabled && cpm.isLoading && (
        <div className="flex items-center gap-2 text-sm text-ink-500">
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-ink-200 border-t-brand-600" />
          Computing…
        </div>
      )}
      {cpmEnabled && cpm.data && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-ink-200 bg-ink-50/40 px-4 py-3 text-sm">
            <span className="text-ink-500">Project window </span>
            <strong className="text-ink-900">
              {fmt(cpm.data.projectStart)} → {fmt(cpm.data.projectEnd)}
            </strong>
            <span className="text-ink-500"> · </span>
            <span className="font-semibold text-ink-800">{cpm.data.durationDays} days</span>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-ink-800">
              Activities ({cpm.data.tasks.length})
            </h4>
            <ul className="mt-3 divide-y divide-ink-100 rounded-2xl border border-ink-200 bg-white">
              {cpm.data.tasks.map((t: any) => {
                const task = tasks.find((x) => x.id === t.taskId);
                return (
                  <li
                    key={t.taskId}
                    className={`flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${
                      t.isCritical ? 'bg-rose-50/50' : ''
                    }`}
                  >
                    <div className="min-w-0 font-medium text-ink-900">
                      {task?.title ?? t.taskId}
                      {t.isCritical && (
                        <span className="ml-2 inline-block rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rose-800">
                          Critical
                        </span>
                      )}
                    </div>
                    <div className="shrink-0 font-mono text-[11px] text-ink-500">
                      ES {fmt(t.es)} · EF {fmt(t.ef)} · slack ~
                      {Math.round(t.slackMinutes / 60 / 24)}g
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function TasksPanel({
  tasks,
  deps,
  criticalIds,
  onCreateTask,
  onCreateDep,
  onDeleteTask,
}: {
  tasks: TaskItem[];
  deps: {
    id: string;
    predecessorId: string;
    successorId: string;
    type: string;
    lagDays: number;
  }[];
  criticalIds: string[];
  onCreateTask: (payload: any) => Promise<void>;
  onCreateDep: (b: { predecessorId: string; successorId: string }) => Promise<void>;
  onDeleteTask: (id: string) => void;
}) {
  return (
    <div className="space-y-6">
      <NewTaskForm onCreate={onCreateTask} />
      <NewDependencyForm tasks={tasks} onCreate={onCreateDep} />

      <div className="overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-card">
        <div className="border-b border-ink-200 bg-ink-50/40 px-5 py-4">
          <h3 className="text-base font-semibold text-ink-900">All tasks</h3>
          <p className="text-xs text-ink-500">{tasks.length} rows</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b border-ink-200 bg-ink-50/30 text-left text-[11px] font-semibold uppercase tracking-wider text-ink-500">
              <tr>
                <th className="whitespace-nowrap px-5 py-3">Title</th>
                <th className="px-5 py-3">WBS</th>
                <th className="px-5 py-3">Start</th>
                <th className="px-5 py-3">End</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Critical</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {tasks.map((t) => (
                <tr key={t.id} className="transition hover:bg-ink-50/50">
                  <td className="px-5 py-3 font-medium text-ink-900">{t.title}</td>
                  <td className="px-5 py-3 font-mono text-xs text-ink-600">{t.wbsCode ?? '—'}</td>
                  <td className="px-5 py-3 tabular-nums text-ink-700">{fmt(t.startDate)}</td>
                  <td className="px-5 py-3 tabular-nums text-ink-700">{fmt(t.endDate)}</td>
                  <td className="px-5 py-3">
                    <TaskStatusBadge status={t.status} />
                  </td>
                  <td className="px-5 py-3">
                    {criticalIds.includes(t.id) ? (
                      <span className="badge bg-rose-50 text-rose-800 ring-1 ring-inset ring-rose-100">
                        Yes
                      </span>
                    ) : (
                      <span className="text-xs text-ink-400">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      type="button"
                      className="text-xs font-semibold text-rose-600 transition hover:text-rose-700"
                      onClick={() => onDeleteTask(t.id)}
                    >
                        Delete
                    </button>
                  </td>
                </tr>
              ))}
              {tasks.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-sm text-ink-500">
                    No tasks yet. Use the form above to add one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="text-base font-semibold text-ink-900">Dependencies</h3>
        <p className="text-xs text-ink-500">Finish-to-start links and lag in days</p>
        <ul className="mt-4 space-y-2">
          {deps.map((d) => {
            const a = tasks.find((t) => t.id === d.predecessorId);
            const b = tasks.find((t) => t.id === d.successorId);
            return (
              <li
                key={d.id}
                className="flex flex-col gap-2 rounded-xl border border-ink-200 bg-ink-50/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="text-sm text-ink-800">
                  <span className="font-semibold">{a?.title ?? d.predecessorId}</span>
                  <span className="mx-2 text-ink-400">→</span>
                  <span className="font-semibold">{b?.title ?? d.successorId}</span>
                </div>
                <span className="shrink-0 rounded-lg bg-white px-2 py-1 font-mono text-[11px] text-ink-600 ring-1 ring-inset ring-ink-200">
                  {d.type} · lag {d.lagDays}g
                </span>
              </li>
            );
          })}
          {deps.length === 0 && (
            <li className="rounded-xl border border-dashed border-ink-200 px-4 py-8 text-center text-sm text-ink-500">
              No dependencies yet.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}

function TaskStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    not_started: 'bg-ink-100 text-ink-700 ring-ink-200',
    in_progress: 'bg-brand-50 text-brand-800 ring-brand-100',
    blocked: 'bg-amber-50 text-amber-900 ring-amber-100',
    done: 'bg-emerald-50 text-emerald-800 ring-emerald-100',
    cancelled: 'bg-ink-50 text-ink-500 ring-ink-200',
  };
  const label: Record<string, string> = {
    not_started: 'Not started',
    in_progress: 'In progress',
    blocked: 'Blocked',
    done: 'Done',
    cancelled: 'Cancelled',
  };
  const cls = map[status] ?? 'bg-ink-50 text-ink-600 ring-ink-200';
  return (
    <span className={`badge ring-1 ring-inset ${cls}`}>{label[status] ?? status}</span>
  );
}

function NewTaskForm({ onCreate }: { onCreate: (payload: any) => Promise<void> }) {
  const [title, setTitle] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [duration, setDuration] = useState(1);

  return (
    <div className="card p-5">
      <h3 className="text-base font-semibold text-ink-900">New task</h3>
      <p className="text-xs text-ink-500">Use dates together with duration</p>
      <form
        className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-12 lg:items-end"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!title.trim() || !start || !end) return;
          await onCreate({
            title: title.trim(),
            startDate: new Date(start),
            endDate: new Date(end),
            durationDays: duration,
          });
          setTitle('');
          setStart('');
          setEnd('');
          setDuration(1);
        }}
      >
        <div className="sm:col-span-2 lg:col-span-4">
          <label className="label" htmlFor="nt-title">
            Title
          </label>
          <input
            id="nt-title"
            className="input"
            placeholder="e.g. Foundation pour"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="lg:col-span-2">
          <label className="label" htmlFor="nt-start">
            Start
          </label>
          <input
            id="nt-start"
            type="date"
            className="input"
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
        </div>
        <div className="lg:col-span-2">
          <label className="label" htmlFor="nt-end">
            End
          </label>
          <input
            id="nt-end"
            type="date"
            className="input"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
          />
        </div>
        <div className="lg:col-span-2">
          <label className="label" htmlFor="nt-dur">
            Duration (days)
          </label>
          <input
            id="nt-dur"
            type="number"
            min={1}
            className="input"
            value={duration}
            onChange={(e) => setDuration(parseInt(e.target.value || '1', 10))}
          />
        </div>
        <div className="lg:col-span-2">
          <button type="submit" className="btn-primary w-full lg:w-auto">
            Add task
          </button>
        </div>
      </form>
    </div>
  );
}

function NewDependencyForm({
  tasks,
  onCreate,
}: {
  tasks: { id: string; title: string }[];
  onCreate: (b: { predecessorId: string; successorId: string }) => Promise<void>;
}) {
  const [pred, setPred] = useState('');
  const [succ, setSucc] = useState('');
  if (tasks.length < 2) return null;
  return (
    <div className="card p-5">
      <h3 className="text-base font-semibold text-ink-900">Add dependency (FS)</h3>
      <p className="text-xs text-ink-500">Which task must finish before the next one starts</p>
      <form
        className="mt-4 grid gap-4 md:grid-cols-3 md:items-end"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!pred || !succ || pred === succ) return;
          await onCreate({ predecessorId: pred, successorId: succ });
          setPred('');
          setSucc('');
        }}
      >
        <div>
          <label className="label" htmlFor="dep-pred">
            Predecessor
          </label>
          <select id="dep-pred" className="input" value={pred} onChange={(e) => setPred(e.target.value)}>
            <option value="">Choose…</option>
            {tasks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="dep-succ">
            Successor
          </label>
          <select id="dep-succ" className="input" value={succ} onChange={(e) => setSucc(e.target.value)}>
            <option value="">Choose…</option>
            {tasks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn-primary w-full md:w-auto">
          Link
        </button>
      </form>
    </div>
  );
}

function fmt(value: string | Date | undefined | null) {
  if (!value) return '—';
  const d = typeof value === 'string' ? new Date(value) : value;
  return d.toISOString().slice(0, 10);
}
