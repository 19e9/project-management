import { Link } from 'react-router-dom';
import type { MeDashboardData, ProjectSummary, WorkspaceSummary } from '../hooks';
import { DonutChart } from '../../../components/admin/charts/DonutChart';

interface Props {
  data: MeDashboardData;
  userName?: string;
}

export function OwnerDashboardView({ data, userName }: Props) {
  const { workspaces, taskStats, upcomingTasks, myProjects } = data;

  const totalMembers = workspaces.reduce((s, w) => s + w.memberCount, 0);
  const totalProjects = workspaces.reduce((s, w) => s + w.projectCount, 0);
  const activeTasks = workspaces.reduce((s, w) => s + w.activeTaskCount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="eyebrow">Owner dashboard</span>
          <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-ink-900 md:text-3xl">
            Your workspace overview
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            {workspaces.length} workspace{workspaces.length !== 1 ? 's' : ''} ·{' '}
            {totalProjects} project{totalProjects !== 1 ? 's' : ''} ·{' '}
            {totalMembers} member{totalMembers !== 1 ? 's' : ''}
          </p>
        </div>
        <Link to="/dashboard/workspaces" className="btn-brand">
          Manage workspaces →
        </Link>
      </div>

      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Workspaces"
          value={workspaces.length}
          sub={`${workspaces.filter(w => w.status === 'active').length} active`}
          accent="brand"
        />
        <KpiCard
          label="Members"
          value={totalMembers}
          sub={`across ${workspaces.length} workspaces`}
          accent="cyan"
        />
        <KpiCard
          label="Active tasks"
          value={activeTasks}
          sub={taskStats.overdue > 0 ? `${taskStats.overdue} overdue` : 'All on track'}
          accent={taskStats.overdue > 0 ? 'rose' : 'emerald'}
        />
        <KpiCard
          label="Completion"
          value={`${taskStats.completionPct.toFixed(0)}%`}
          sub={`${taskStats.done} of ${taskStats.total} tasks done`}
          accent="amber"
        />
      </div>

      {/* Workspace cards + task status donut */}
      <div className="grid gap-4 lg:grid-cols-12">
        <div className="space-y-3 lg:col-span-7">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-ink-900">Your workspaces</h2>
          </div>
          {workspaces.length === 0 ? (
            <EmptyState
              icon="🏢"
              title="No workspaces yet"
              sub="Create a workspace to start managing projects and teams."
              action={<Link to="/dashboard/workspaces" className="btn-brand mt-3">Create workspace</Link>}
            />
          ) : (
            workspaces.map((ws) => <WorkspaceCard key={ws.id} ws={ws} />)
          )}
        </div>

        <div className="card p-5 lg:col-span-5">
          <h3 className="text-base font-semibold text-ink-900">Task status across your workspaces</h3>
          <p className="text-xs text-ink-500">All projects combined</p>
          <div className="mt-5">
            <DonutChart
              centerLabel={String(taskStats.total)}
              centerSubLabel="tasks"
              slices={[
                { label: 'Not started', value: taskStats.notStarted, color: '#94a3b8' },
                { label: 'In progress', value: taskStats.inProgress, color: '#4f46e5' },
                { label: 'Blocked', value: taskStats.blocked, color: '#f59e0b' },
                { label: 'Done', value: taskStats.done, color: '#10b981' },
              ]}
            />
          </div>

          {taskStats.overdue > 0 && (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50/60 p-3 text-sm">
              <span className="font-semibold text-rose-700">⚠ {taskStats.overdue} tasks overdue</span>
              <p className="mt-0.5 text-xs text-rose-600">
                Check your project timelines and reassign if needed.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Projects table */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-ink-200 px-5 py-4">
          <div>
            <h3 className="text-base font-semibold text-ink-900">Active projects</h3>
            <p className="text-xs text-ink-500">Health signals across all workspaces</p>
          </div>
        </div>
        {myProjects.length === 0 ? (
          <div className="py-12 text-center text-sm text-ink-500">
            No active projects. <Link to="/dashboard/workspaces" className="text-brand-700 hover:underline">Go to workspaces →</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-ink-50/40 text-left text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                <tr>
                  <th className="px-5 py-3">Project</th>
                  <th className="px-5 py-3">Workspace</th>
                  <th className="px-5 py-3 text-right">Tasks</th>
                  <th className="px-5 py-3">Progress</th>
                  <th className="px-5 py-3 text-right">Overdue</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-200">
                {myProjects.map((p) => (
                  <ProjectRow key={p.id} p={p} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Upcoming tasks */}
      {upcomingTasks.length > 0 && (
        <div className="card p-5">
          <h3 className="mb-4 text-base font-semibold text-ink-900">
            Upcoming deadlines across your workspaces
          </h3>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {upcomingTasks.slice(0, 6).map((t) => (
              <UpcomingTaskCard key={t.id} task={t} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────────── */

function KpiCard({
  label, value, sub, accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent: 'brand' | 'cyan' | 'emerald' | 'amber' | 'rose';
}) {
  const bg: Record<string, string> = {
    brand: 'from-brand-500/10 to-brand-500/0',
    cyan: 'from-cyan-500/10 to-cyan-500/0',
    emerald: 'from-emerald-500/10 to-emerald-500/0',
    amber: 'from-amber-500/10 to-amber-500/0',
    rose: 'from-rose-500/10 to-rose-500/0',
  };
  const dot: Record<string, string> = {
    brand: 'bg-brand-500',
    cyan: 'bg-cyan-500',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
  };
  return (
    <div className={`card relative overflow-hidden p-5`}>
      <div className={`pointer-events-none absolute -right-4 -top-4 h-24 w-24 rounded-full bg-gradient-to-br ${bg[accent]} blur-xl`} />
      <div className="relative">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${dot[accent]}`} />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">{label}</span>
        </div>
        <div className="mt-1 text-3xl font-bold tracking-tight text-ink-900">{value}</div>
        {sub && <div className="mt-0.5 text-xs text-ink-500">{sub}</div>}
      </div>
    </div>
  );
}

function WorkspaceCard({ ws }: { ws: WorkspaceSummary }) {
  const planColors: Record<string, string> = {
    free: 'bg-ink-100 text-ink-600',
    pro: 'bg-brand-50 text-brand-700',
    enterprise: 'bg-amber-50 text-amber-700',
  };
  return (
    <div className="card card-hover flex items-center gap-4 p-4">
      <span className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-brand-gradient text-sm font-bold text-white shadow-lift">
        {ws.name.slice(0, 2).toUpperCase()}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-ink-900 truncate">{ws.name}</span>
          <span className={`badge ${planColors[ws.plan]}`}>{ws.plan}</span>
        </div>
        <div className="mt-0.5 text-xs text-ink-500">
          {ws.memberCount} members · {ws.projectCount} projects · {ws.activeTaskCount} active tasks
        </div>
        <div className="mt-2 flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-100">
            <div
              className="h-full rounded-full bg-brand-gradient"
              style={{ width: `${ws.completionPct}%` }}
            />
          </div>
          <span className="text-[11px] font-medium text-ink-700">{ws.completionPct.toFixed(0)}%</span>
        </div>
      </div>
      <Link
        to={`/dashboard/workspaces/${ws.id}/projects`}
        className="btn-secondary flex-none px-3 py-1.5 text-xs"
      >
        Open →
      </Link>
    </div>
  );
}

function ProjectRow({ p }: { p: ProjectSummary }) {
  return (
    <tr className="transition hover:bg-ink-50/50">
      <td className="px-5 py-3">
        <div className="font-medium text-ink-900">{p.name}</div>
      </td>
      <td className="px-5 py-3 text-xs text-ink-500">{p.workspaceName}</td>
      <td className="px-5 py-3 text-right tabular-nums text-ink-700">{p.taskCount}</td>
      <td className="px-5 py-3">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-ink-100">
            <div
              className="h-full rounded-full bg-brand-gradient"
              style={{ width: `${p.completionPct}%` }}
            />
          </div>
          <span className="text-xs tabular-nums text-ink-700">{p.completionPct.toFixed(0)}%</span>
        </div>
      </td>
      <td className="px-5 py-3 text-right">
        {p.overdueCount > 0 ? (
          <span className="badge bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-100">
            +{p.overdueCount}
          </span>
        ) : (
          <span className="text-xs text-emerald-600">On track</span>
        )}
      </td>
      <td className="px-5 py-3 text-right">
        <Link
          to={`/dashboard/workspaces/${p.workspaceId}/projects/${p.id}`}
          className="text-xs font-medium text-brand-700 hover:underline"
        >
          Open →
        </Link>
      </td>
    </tr>
  );
}

function UpcomingTaskCard({ task }: { task: any }) {
  const priorityColor: Record<string, string> = {
    critical: 'bg-rose-500/15 text-rose-700',
    high: 'bg-amber-500/15 text-amber-700',
    medium: 'bg-brand-500/15 text-brand-700',
    low: 'bg-ink-100 text-ink-600',
  };
  return (
    <div className={`rounded-xl border p-3 ${task.isOverdue ? 'border-rose-200 bg-rose-50/50' : 'border-ink-200 bg-white'}`}>
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-medium text-ink-900 line-clamp-2">{task.title}</span>
        <span className={`badge flex-none ${priorityColor[task.priority] ?? priorityColor.medium}`}>
          {task.priority}
        </span>
      </div>
      <div className="mt-2 text-[11px] text-ink-500">
        {task.projectName} · {task.workspaceName}
      </div>
      <div className={`mt-1 text-[11px] font-medium ${task.isOverdue ? 'text-rose-600' : 'text-ink-700'}`}>
        {task.isOverdue
          ? `${Math.abs(task.daysUntilDue)}d overdue`
          : task.daysUntilDue === 0
            ? 'Due today'
            : `Due in ${task.daysUntilDue}d`}
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-100">
        <div
          className="h-full rounded-full bg-brand-gradient"
          style={{ width: `${task.progressPct}%` }}
        />
      </div>
    </div>
  );
}

function EmptyState({
  icon, title, sub, action,
}: {
  icon: string;
  title: string;
  sub: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center gap-2 px-6 py-12 text-center">
      <span className="text-4xl">{icon}</span>
      <h3 className="font-semibold text-ink-900">{title}</h3>
      <p className="text-sm text-ink-500">{sub}</p>
      {action}
    </div>
  );
}
