import { useMemo, useState } from 'react';
import {
  useAdminActivity,
  useAdminGrowth,
  useAdminInsights,
  useAdminOverview,
  useAdminWorkspaces,
  useRoleDistribution,
  useTasksByStatus,
} from '../../features/admin/hooks';
import { StatsCard } from '../../components/admin/StatsCard';
import { WorkspacesTable } from '../../components/admin/WorkspacesTable';
import { ActivityFeed } from '../../components/admin/ActivityFeed';
import { InsightsPanel } from '../../components/admin/InsightsPanel';
import { LineChart } from '../../components/admin/charts/LineChart';
import { BarChart } from '../../components/admin/charts/BarChart';
import { DonutChart } from '../../components/admin/charts/DonutChart';

export default function AdminOverviewPage() {
  const [days, setDays] = useState<7 | 14 | 30 | 90>(30);
  const [search, setSearch] = useState('');

  const overview = useAdminOverview();
  const growth = useAdminGrowth(days);
  const status = useTasksByStatus();
  const roles = useRoleDistribution();
  const workspaces = useAdminWorkspaces(search);
  const activity = useAdminActivity(20);
  const insights = useAdminInsights();

  // Sparklines from growth (cumulative-ish: just daily counts smoothed for vibe)
  const ovr = overview.data;
  const sparkUsers = useMemo(() => growth.data?.map((g) => g.users) ?? [], [growth.data]);
  const sparkWs = useMemo(() => growth.data?.map((g) => g.workspaces) ?? [], [growth.data]);
  const sparkProjects = useMemo(() => growth.data?.map((g) => g.projects) ?? [], [growth.data]);

  return (
    <div className="space-y-6">
      <PageHeader days={days} setDays={setDays} />

      {/* KPI cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          label="Users"
          value={ovr ? ovr.users.total.toLocaleString() : '—'}
          hint={ovr ? `${ovr.users.active.toLocaleString()} active` : undefined}
          changePct={ovr?.users.changePct}
          series={sparkUsers}
          accent="cyan"
          icon={<IconUsers />}
        />
        <StatsCard
          label="Workspaces"
          value={ovr ? ovr.workspaces.total.toLocaleString() : '—'}
          hint={ovr ? `${ovr.workspaces.active} active` : undefined}
          changePct={ovr?.workspaces.changePct}
          series={sparkWs}
          accent="brand"
          icon={<IconBox />}
        />
        <StatsCard
          label="Projects"
          value={ovr ? ovr.projects.total.toLocaleString() : '—'}
          hint={ovr ? `${ovr.projects.active} active` : undefined}
          changePct={ovr?.projects.changePct}
          series={sparkProjects}
          accent="emerald"
          icon={<IconLayers />}
        />
        <StatsCard
          label="Tasks completed"
          value={ovr ? `${ovr.tasks.completionPct.toFixed(1)}%` : '—'}
          hint={
            ovr
              ? `${ovr.tasks.completed.toLocaleString()} of ${ovr.tasks.total.toLocaleString()}`
              : undefined
          }
          changePct={ovr?.tasks.changePct}
          series={sparkProjects}
          accent="amber"
          icon={<IconCheck />}
        />
      </section>

      {/* Charts row */}
      <section className="grid gap-4 lg:grid-cols-12">
        <div className="card p-5 lg:col-span-7">
          <header className="flex items-start justify-between">
            <div>
              <h3 className="text-base font-semibold text-ink-900">Platform growth</h3>
              <p className="text-xs text-ink-500">
                Daily new users, workspaces, projects · last {days}d
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Legend dot="#06b6d4" label="Users" />
              <Legend dot="#4f46e5" label="Workspaces" />
              <Legend dot="#10b981" label="Projects" />
            </div>
          </header>
          <div className="mt-4">
            {growth.isLoading ? (
              <div className="skeleton h-60 w-full" />
            ) : (
              <LineChart
                labels={(growth.data ?? []).map((g) => g.date)}
                series={[
                  {
                    key: 'users',
                    label: 'Users',
                    color: '#06b6d4',
                    values: (growth.data ?? []).map((g) => g.users),
                  },
                  {
                    key: 'workspaces',
                    label: 'Workspaces',
                    color: '#4f46e5',
                    values: (growth.data ?? []).map((g) => g.workspaces),
                  },
                  {
                    key: 'projects',
                    label: 'Projects',
                    color: '#10b981',
                    values: (growth.data ?? []).map((g) => g.projects),
                  },
                ]}
              />
            )}
          </div>
        </div>

        <div className="card p-5 lg:col-span-5">
          <header className="flex items-start justify-between">
            <div>
              <h3 className="text-base font-semibold text-ink-900">Tasks by status</h3>
              <p className="text-xs text-ink-500">Across every workspace</p>
            </div>
            {ovr && (
              <span className="badge bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-100">
                {ovr.tasks.overdue} overdue
              </span>
            )}
          </header>
          <div className="mt-6">
            {status.isLoading ? (
              <div className="skeleton h-56 w-full" />
            ) : (
              <BarChart
                items={[
                  { label: 'Not started', value: status.data?.not_started ?? 0, color: '#94a3b8' },
                  { label: 'In progress', value: status.data?.in_progress ?? 0, color: '#4f46e5' },
                  { label: 'Blocked', value: status.data?.blocked ?? 0, color: '#f59e0b' },
                  { label: 'Done', value: status.data?.done ?? 0, color: '#10b981' },
                  { label: 'Cancelled', value: status.data?.cancelled ?? 0, color: '#cbd5e1' },
                ]}
              />
            )}
          </div>
        </div>
      </section>

      {/* Distributions row */}
      <section className="grid gap-4 lg:grid-cols-12">
        <div className="card p-5 lg:col-span-6">
          <header>
            <h3 className="text-base font-semibold text-ink-900">Role distribution</h3>
            <p className="text-xs text-ink-500">
              Who's in your workspaces · platform-wide
            </p>
          </header>
          <div className="mt-4">
            {roles.isLoading ? (
              <div className="skeleton h-44 w-full" />
            ) : (
              <DonutChart
                centerLabel={String(
                  (roles.data?.owner ?? 0) +
                    (roles.data?.member ?? 0) +
                    (roles.data?.client ?? 0),
                )}
                centerSubLabel="active members"
                slices={[
                  { label: 'Owners', value: roles.data?.owner ?? 0, color: '#4f46e5' },
                  { label: 'Members', value: roles.data?.member ?? 0, color: '#06b6d4' },
                  { label: 'Clients', value: roles.data?.client ?? 0, color: '#94a3b8' },
                  {
                    label: 'Platform admins',
                    value: roles.data?.platform_admin ?? 0,
                    color: '#f43f5e',
                  },
                ]}
              />
            )}
          </div>
        </div>

        <div className="card p-5 lg:col-span-6">
          <header>
            <h3 className="text-base font-semibold text-ink-900">Plan distribution</h3>
            <p className="text-xs text-ink-500">
              Conversion signal · workspaces by subscription tier
            </p>
          </header>
          <div className="mt-4">
            {overview.isLoading || !ovr ? (
              <div className="skeleton h-44 w-full" />
            ) : (
              <DonutChart
                centerLabel={String(
                  ovr.plans.free + ovr.plans.pro + ovr.plans.enterprise,
                )}
                centerSubLabel="total"
                slices={[
                  { label: 'Free', value: ovr.plans.free, color: '#cbd5e1' },
                  { label: 'Pro', value: ovr.plans.pro, color: '#4f46e5' },
                  { label: 'Enterprise', value: ovr.plans.enterprise, color: '#f59e0b' },
                ]}
              />
            )}
          </div>
        </div>
      </section>

      {/* Workspaces table */}
      <WorkspacesTable
        rows={workspaces.data?.items ?? []}
        loading={workspaces.isLoading}
        onSearchChange={(q) => setSearch(q)}
      />

      {/* Activity + Insights */}
      <section className="grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <ActivityFeed
            events={activity.data ?? []}
            loading={activity.isLoading}
            viewAllHref="/dashboard/activity"
          />
        </div>
        <div className="lg:col-span-5">
          <InsightsPanel data={insights.data} loading={insights.isLoading} />
        </div>
      </section>
    </div>
  );
}

function PageHeader({
  days,
  setDays,
}: {
  days: number;
  setDays: (d: 7 | 14 | 30 | 90) => void;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <span className="eyebrow">Platform overview</span>
        <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-ink-900 md:text-3xl">
          Welcome back. Here's how the platform is running.
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          Real-time KPIs, growth, and operational health across every workspace.
        </p>
      </div>

      <div className="flex items-center gap-2 rounded-full border border-ink-200 bg-white p-1 shadow-soft">
        {([7, 14, 30, 90] as const).map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDays(d)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              days === d
                ? 'bg-ink-900 text-white shadow-soft'
                : 'text-ink-600 hover:text-ink-900'
            }`}
          >
            {d}d
          </button>
        ))}
      </div>
    </header>
  );
}

function Legend({ dot, label }: { dot: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-ink-500">
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: dot }} />
      {label}
    </span>
  );
}

/* ---- KPI icons ---- */
type IP = React.SVGProps<SVGSVGElement>;
function IconUsers(p: IP) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 19c.5-3.2 3-5 6-5s5.5 1.8 6 5" strokeLinecap="round" />
      <circle cx="17" cy="9" r="2.4" />
    </svg>
  );
}
function IconBox(p: IP) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}>
      <path d="M3 7l9-4 9 4-9 4-9-4z" />
      <path d="M3 7v10l9 4 9-4V7" />
    </svg>
  );
}
function IconLayers(p: IP) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}>
      <path d="M12 3l9 4.5-9 4.5-9-4.5L12 3z" />
      <path d="M3 12l9 4.5L21 12" />
    </svg>
  );
}
function IconCheck(p: IP) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
      <path d="M5 12.5l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
