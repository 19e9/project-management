import { Link } from 'react-router-dom';
import { type MeDashboardData, type UpcomingTask } from '../hooks';

interface Props {
  data: MeDashboardData;
  userName?: string;
}

export function ClientDashboardView({ data, userName }: Props) {
  const { workspaces, myProjects, taskStats, upcomingTasks } = data;

  const totalTasks = myProjects.reduce((s, p) => s + p.taskCount, 0);
  const avgCompletion =
    myProjects.length > 0
      ? Math.round(myProjects.reduce((s, p) => s + p.completionPct, 0) / myProjects.length * 10) / 10
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <span className="eyebrow">Client overview</span>
        <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-ink-900 md:text-3xl">
          {userName ? `Welcome, ${userName.split(' ')[0]}` : 'Project overview'}
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          Read-only view of the projects and workspaces you have access to.
        </p>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 rounded-xl border border-brand-100 bg-brand-50 p-4 text-sm text-brand-800">
        <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 flex-none text-brand-600" fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v5M12 16.5h.01" strokeLinecap="round" />
        </svg>
        <div>
          <span className="font-semibold">Client access.</span> You can view project progress
          and follow status updates from your workspace team.
        </div>
      </div>

      {upcomingTasks.length > 0 && (
        <div className="card overflow-hidden">
          <div className="border-b border-ink-200 px-5 py-4">
            <h3 className="text-base font-semibold text-ink-900">Assigned to me</h3>
            <p className="text-xs text-ink-500">Read-only tasks shared with you</p>
          </div>
          <ul className="divide-y divide-ink-200">
            {upcomingTasks.map((t) => (
              <AssignedTaskRow
                key={t.id}
                task={t}
              />
            ))}
          </ul>
        </div>
      )}

      {/* Summary KPIs */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">Workspaces</div>
          <div className="mt-1 text-3xl font-bold text-ink-900">{workspaces.length}</div>
          <div className="mt-0.5 text-xs text-ink-500">you have access to</div>
        </div>
        <div className="card p-5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">Projects</div>
          <div className="mt-1 text-3xl font-bold text-ink-900">{myProjects.length}</div>
          <div className="mt-0.5 text-xs text-ink-500">{totalTasks} total tasks</div>
        </div>
        <div className="card p-5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">Avg. completion</div>
          <div className="mt-1 text-3xl font-bold gradient-text">{avgCompletion}%</div>
          <div className="mt-0.5 text-xs text-ink-500">across all projects</div>
        </div>
      </div>

      {/* Projects */}
      <div className="card overflow-hidden">
        <div className="border-b border-ink-200 px-5 py-4">
          <h3 className="text-base font-semibold text-ink-900">Project overview</h3>
          <p className="text-xs text-ink-500">Progress and health — read only</p>
        </div>

        {myProjects.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-4xl">📂</div>
            <h3 className="mt-3 font-semibold text-ink-900">No projects yet</h3>
            <p className="mt-1 text-sm text-ink-500">
              You haven't been added to any projects. Ask your workspace owner to add you.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-ink-200">
            {myProjects.map((p) => {
              const overdue = p.overdueCount > 0;
              return (
                <li key={p.id} className="px-5 py-4 transition hover:bg-ink-50/40">
                  <div className="flex flex-wrap items-start gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-ink-900">{p.name}</h4>
                        {overdue && (
                          <span className="badge bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-100">
                            {p.overdueCount} overdue
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 text-xs text-ink-500">{p.workspaceName}</div>

                      <div className="mt-3 flex items-center gap-3">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink-100">
                          <div
                            className={`h-full rounded-full ${overdue ? 'bg-rose-400' : 'bg-brand-gradient'}`}
                            style={{ width: `${p.completionPct}%` }}
                          />
                        </div>
                        <span className="flex-none text-sm font-medium tabular-nums text-ink-700">
                          {p.completionPct.toFixed(0)}%
                        </span>
                      </div>

                      <div className="mt-2 flex flex-wrap gap-3 text-xs text-ink-500">
                        <span>{p.taskCount} tasks</span>
                        <span className="text-ink-300">·</span>
                        <span className="text-emerald-700">
                          {Math.round((p.completionPct / 100) * p.taskCount)} done
                        </span>
                        {overdue && (
                          <>
                            <span className="text-ink-300">·</span>
                            <span className="text-rose-600">{p.overdueCount} late</span>
                          </>
                        )}
                      </div>
                    </div>
                    <Link
                      to={`/dashboard/workspaces/${p.workspaceId}/projects/${p.id}`}
                      className="btn-secondary flex-none px-3 py-1.5 text-xs"
                    >
                      View project →
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Workspaces */}
      <div>
        <h3 className="mb-3 text-base font-semibold text-ink-900">Your workspaces</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {workspaces.map((ws) => (
            <Link
              key={ws.id}
              to={`/dashboard/workspaces/${ws.id}/projects`}
              className="card card-hover flex items-center gap-3 p-4"
            >
              <span className="grid h-9 w-9 flex-none place-items-center rounded-xl bg-ink-100 text-sm font-bold text-ink-700">
                {ws.name.slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0">
                <div className="truncate font-medium text-ink-900">{ws.name}</div>
                <div className="text-[11px] text-ink-500">{ws.projectCount} projects</div>
              </div>
              <span className="ml-auto text-ink-400">→</span>
            </Link>
          ))}
          {workspaces.length === 0 && (
            <div className="rounded-xl border border-dashed border-ink-300 px-5 py-10 text-center text-sm text-ink-500">
              Not added to any workspaces yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AssignedTaskRow({
  task,
}: {
  task: UpcomingTask;
}) {
  return (
    <li className="px-5 py-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-ink-900">{task.title}</p>
          <p className="mt-0.5 text-xs text-ink-500">
            {task.projectName} · {task.workspaceName}
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-100">
            <div className="h-full rounded-full bg-brand-gradient" style={{ width: `${task.progressPct}%` }} />
          </div>
        </div>
        <Link
          to={`/dashboard/workspaces/${task.workspaceId}/projects/${task.projectId}`}
          className="btn-secondary px-3 py-1.5 text-xs"
        >
          Open
        </Link>
      </div>
    </li>
  );
}
