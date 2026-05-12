import { Link } from 'react-router-dom';
import { useUpdateDashboardTask, type MeDashboardData, type UpcomingTask } from '../hooks';

interface Props {
  data: MeDashboardData;
  userName?: string;
}

export function MemberDashboardView({ data, userName }: Props) {
  const { taskStats, upcomingTasks, myProjects, workspaces } = data;
  const updateTask = useUpdateDashboardTask();

  const workTask = (task: UpcomingTask, patch: { status?: string; progressPct?: number }) =>
    updateTask.mutate({
      workspaceId: task.workspaceId,
      projectId: task.projectId,
      taskId: task.id,
      patch,
    });

  const overdueTasks = upcomingTasks.filter((t) => t.isOverdue);
  const soonTasks = upcomingTasks.filter((t) => !t.isOverdue && t.daysUntilDue <= 7);
  const laterTasks = upcomingTasks.filter((t) => !t.isOverdue && t.daysUntilDue > 7);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="eyebrow">Member workspace</span>
          <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-ink-900 md:text-3xl">
            Good to see you{userName ? `, ${userName.split(' ')[0]}` : ''}.
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            Here's your personal work snapshot — tasks, deadlines, and projects.
          </p>
        </div>
      </div>

      {/* My task KPIs */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MiniKpi
          label="My tasks"
          value={taskStats.total}
          sub={`${taskStats.inProgress} in progress`}
          icon="📋"
          accent="brand"
        />
        <MiniKpi
          label="Done"
          value={taskStats.done}
          sub={`${taskStats.completionPct.toFixed(0)}% completion rate`}
          icon="✅"
          accent="emerald"
        />
        <MiniKpi
          label="Due soon"
          value={taskStats.upcomingSoon}
          sub="within the next 7 days"
          icon="⏰"
          accent={taskStats.upcomingSoon > 0 ? 'amber' : 'brand'}
        />
        <MiniKpi
          label="Overdue"
          value={taskStats.overdue}
          sub={taskStats.overdue > 0 ? 'Need immediate attention' : 'Nothing overdue 🎉'}
          icon={taskStats.overdue > 0 ? '🚨' : '🟢'}
          accent={taskStats.overdue > 0 ? 'rose' : 'emerald'}
        />
      </div>

      {/* My task progress bar */}
      <div className="card p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-ink-900">My task progress</h3>
            <p className="text-xs text-ink-500">{taskStats.total} tasks assigned to me</p>
          </div>
          <span className="text-2xl font-bold gradient-text">
            {taskStats.completionPct.toFixed(0)}%
          </span>
        </div>
        <div className="mt-4 space-y-2">
          <StatusBar
            label="Done"
            count={taskStats.done}
            total={taskStats.total}
            color="bg-emerald-500"
          />
          <StatusBar
            label="In progress"
            count={taskStats.inProgress}
            total={taskStats.total}
            color="bg-brand-500"
          />
          <StatusBar
            label="Blocked"
            count={taskStats.blocked}
            total={taskStats.total}
            color="bg-amber-500"
          />
          <StatusBar
            label="Not started"
            count={taskStats.notStarted}
            total={taskStats.total}
            color="bg-ink-200"
          />
        </div>
      </div>

      {/* Upcoming tasks (grouped) */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          {overdueTasks.length > 0 && (
            <TaskGroup
              title="Overdue"
              badge={`${overdueTasks.length}`}
              badgeColor="bg-rose-500"
              tasks={overdueTasks}
              borderColor="border-rose-200"
              bgColor="bg-rose-50/40"
              onWork={workTask}
              workingTaskId={updateTask.variables?.taskId}
            />
          )}
          {soonTasks.length > 0 && (
            <TaskGroup
              title="Due this week"
              badge={`${soonTasks.length}`}
              badgeColor="bg-amber-500"
              tasks={soonTasks}
              borderColor="border-amber-200"
              bgColor="bg-amber-50/40"
              onWork={workTask}
              workingTaskId={updateTask.variables?.taskId}
            />
          )}
          {upcomingTasks.length === 0 && (
            <div className="card flex flex-col items-center gap-2 py-12 text-center">
              <span className="text-4xl">🎯</span>
              <h3 className="font-semibold text-ink-900">All caught up!</h3>
              <p className="text-sm text-ink-500">No upcoming deadlines in the next 3 weeks.</p>
            </div>
          )}
        </div>

        <div className="space-y-3">
          {laterTasks.length > 0 && (
            <TaskGroup
              title="Coming up"
              badge={`${laterTasks.length}`}
              badgeColor="bg-brand-500"
              tasks={laterTasks.slice(0, 5)}
              borderColor="border-ink-200"
              bgColor="bg-white"
              onWork={workTask}
              workingTaskId={updateTask.variables?.taskId}
            />
          )}
          {/* Blocked tasks */}
          {taskStats.blocked > 0 && (
            <div className="card p-4">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-amber-700">⚠ {taskStats.blocked} tasks blocked</span>
              </div>
              <p className="mt-1 text-xs text-ink-600">
                Blocked tasks may delay your project. Reach out to your workspace owner to unblock them.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* My projects */}
      <div className="card overflow-hidden">
        <div className="border-b border-ink-200 px-5 py-4">
          <h3 className="text-base font-semibold text-ink-900">My projects</h3>
          <p className="text-xs text-ink-500">Projects you're contributing to</p>
        </div>
        {myProjects.length === 0 ? (
          <div className="py-12 text-center text-sm text-ink-500">
            You haven't been added to any projects yet.
          </div>
        ) : (
          <ul className="divide-y divide-ink-200">
            {myProjects.map((p) => (
              <li key={p.id} className="flex items-center gap-4 px-5 py-3 transition hover:bg-ink-50/50">
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-ink-900">{p.name}</div>
                  <div className="text-xs text-ink-500">{p.workspaceName}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="hidden items-center gap-2 sm:flex">
                    <div className="h-1.5 w-20 overflow-hidden rounded-full bg-ink-100">
                      <div
                        className="h-full rounded-full bg-brand-gradient"
                        style={{ width: `${p.completionPct}%` }}
                      />
                    </div>
                    <span className="text-xs tabular-nums text-ink-700">
                      {p.completionPct.toFixed(0)}%
                    </span>
                  </div>
                  {p.overdueCount > 0 && (
                    <span className="badge bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-100">
                      +{p.overdueCount}d late
                    </span>
                  )}
                  <Link
                    to={`/dashboard/workspaces/${p.workspaceId}/projects/${p.id}`}
                    className="text-xs font-medium text-brand-700 hover:underline"
                  >
                    Open →
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Workspaces I'm in */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {workspaces.map((ws) => (
          <Link
            key={ws.id}
            to={`/dashboard/workspaces/${ws.id}/projects`}
            className="card card-hover flex items-center gap-3 p-4"
          >
            <span className="grid h-9 w-9 flex-none place-items-center rounded-xl bg-brand-gradient text-sm font-bold text-white">
              {ws.name.slice(0, 2).toUpperCase()}
            </span>
            <div className="min-w-0">
              <div className="truncate font-medium text-ink-900">{ws.name}</div>
              <div className="text-[11px] text-ink-500">{ws.projectCount} projects</div>
            </div>
            <span className="ml-auto text-ink-400">→</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ── helpers ───────────────────────────────────────────── */

function MiniKpi({
  label, value, sub, icon, accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: string;
  accent: 'brand' | 'cyan' | 'emerald' | 'amber' | 'rose';
}) {
  const ring: Record<string, string> = {
    brand: 'ring-brand-100 bg-brand-50 text-brand-700',
    cyan: 'ring-cyan-100 bg-cyan-50 text-cyan-700',
    emerald: 'ring-emerald-100 bg-emerald-50 text-emerald-700',
    amber: 'ring-amber-100 bg-amber-50 text-amber-700',
    rose: 'ring-rose-100 bg-rose-50 text-rose-700',
  };
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">{label}</div>
          <div className="mt-0.5 text-3xl font-bold text-ink-900">{value}</div>
          {sub && <div className="mt-0.5 text-xs text-ink-500">{sub}</div>}
        </div>
        <span className={`grid h-10 w-10 flex-none place-items-center rounded-xl ring-1 ring-inset text-lg ${ring[accent]}`}>
          {icon}
        </span>
      </div>
    </div>
  );
}

function StatusBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-20 flex-none text-xs text-ink-600">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink-100">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-8 flex-none text-right text-xs font-medium tabular-nums text-ink-700">{count}</span>
    </div>
  );
}

function TaskGroup({
  title, badge, badgeColor, tasks, borderColor, bgColor, onWork, workingTaskId,
}: {
  title: string;
  badge: string;
  badgeColor: string;
  tasks: UpcomingTask[];
  borderColor: string;
  bgColor: string;
  onWork: (task: UpcomingTask, patch: { status?: string; progressPct?: number }) => void;
  workingTaskId?: string;
}) {
  return (
    <div className={`overflow-hidden rounded-2xl border ${borderColor} ${bgColor}`}>
      <div className="flex items-center gap-2 px-4 py-3">
        <span className={`grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold text-white ${badgeColor}`}>
          {badge}
        </span>
        <span className="text-sm font-semibold text-ink-900">{title}</span>
      </div>
      <ul className="divide-y divide-white/50">
        {tasks.map((t) => (
          <li key={t.id} className="px-4 py-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="text-sm font-medium text-ink-900 truncate">{t.title}</div>
                <div className="mt-0.5 text-[11px] text-ink-500">
                  {t.projectName} · {t.workspaceName}
                </div>
              </div>
              <span className={`flex-none text-[11px] font-semibold ${t.isOverdue ? 'text-rose-600' : 'text-amber-700'}`}>
                {t.isOverdue ? `+${Math.abs(t.daysUntilDue)}d` : t.daysUntilDue === 0 ? 'Today' : `${t.daysUntilDue}d`}
              </span>
            </div>
            <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/60">
              <div className="h-full rounded-full bg-brand-500" style={{ width: `${t.progressPct}%` }} />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Link
                to={`/dashboard/workspaces/${t.workspaceId}/projects/${t.projectId}`}
                className="btn-secondary px-3 py-1 text-[11px]"
              >
                Open
              </Link>
              {t.status === 'not_started' && (
                <button
                  type="button"
                  className="btn-secondary px-3 py-1 text-[11px]"
                  disabled={workingTaskId === t.id}
                  onClick={() => onWork(t, { status: 'in_progress', progressPct: Math.max(t.progressPct, 10) })}
                >
                  Start
                </button>
              )}
              {t.status !== 'done' && (
                <button
                  type="button"
                  className="btn-primary px-3 py-1 text-[11px]"
                  disabled={workingTaskId === t.id}
                  onClick={() => onWork(t, { status: 'done', progressPct: 100 })}
                >
                  Done
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
