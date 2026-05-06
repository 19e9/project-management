import { useMemo, useState } from 'react';
import {
  useAdminActivity,
  useAdminGrowth,
  useAdminInsights,
  useAdminOverview,
  useAdminWorkspaces,
  useRoleDistribution,
  useTasksByStatus,
} from '../../admin/hooks';
import { StatsCard } from '../../../components/admin/StatsCard';
import { WorkspacesTable } from '../../../components/admin/WorkspacesTable';
import { ActivityFeed } from '../../../components/admin/ActivityFeed';
import { InsightsPanel } from '../../../components/admin/InsightsPanel';
import { LineChart } from '../../../components/admin/charts/LineChart';
import { BarChart } from '../../../components/admin/charts/BarChart';
import { DonutChart } from '../../../components/admin/charts/DonutChart';

export function AdminDashboardView() {
  const [days, setDays] = useState<7 | 14 | 30 | 90>(30);
  const [search, setSearch] = useState('');

  const overview = useAdminOverview();
  const growth = useAdminGrowth(days);
  const status = useTasksByStatus();
  const roles = useRoleDistribution();
  const workspaces = useAdminWorkspaces(search);
  const activity = useAdminActivity(20);
  const insights = useAdminInsights();

  const ovr = overview.data;
  const sparkUsers = useMemo(() => growth.data?.map((g) => g.users) ?? [], [growth.data]);
  const sparkWs = useMemo(() => growth.data?.map((g) => g.workspaces) ?? [], [growth.data]);
  const sparkProjects = useMemo(() => growth.data?.map((g) => g.projects) ?? [], [growth.data]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="eyebrow">Platform admin · Overview</span>
          <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-ink-900 md:text-3xl">
            Platform overview
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            Real-time KPIs, growth, and operational health across every workspace.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-full border border-ink-200 bg-white p-1 shadow-soft">
            {([7, 14, 30, 90] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDays(d)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  days === d ? 'bg-ink-900 text-white shadow-soft' : 'text-ink-600 hover:text-ink-900'
                }`}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          label="Total users"
          value={ovr ? ovr.users.total.toLocaleString() : '—'}
          hint={ovr ? `${ovr.users.active.toLocaleString()} active` : undefined}
          changePct={ovr?.users.changePct}
          series={sparkUsers}
          accent="cyan"
          icon={<Ico><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></Ico>}
        />
        <StatsCard
          label="Workspaces"
          value={ovr ? ovr.workspaces.total.toLocaleString() : '—'}
          hint={ovr ? `${ovr.workspaces.active} active, ${ovr.workspaces.suspended} suspended` : undefined}
          changePct={ovr?.workspaces.changePct}
          series={sparkWs}
          accent="brand"
          icon={<Ico><path d="M3 7l9-4 9 4-9 4-9-4z" /><path d="M3 7v10l9 4 9-4V7" /></Ico>}
        />
        <StatsCard
          label="Active projects"
          value={ovr ? ovr.projects.active.toLocaleString() : '—'}
          hint={ovr ? `${ovr.projects.total.toLocaleString()} total, ${ovr.projects.archived} archived` : undefined}
          changePct={ovr?.projects.changePct}
          series={sparkProjects}
          accent="emerald"
          icon={<Ico><path d="M12 3l9 4.5-9 4.5-9-4.5L12 3z" /><path d="M3 12l9 4.5L21 12" /></Ico>}
        />
        <StatsCard
          label="Task completion"
          value={ovr ? `${ovr.tasks.completionPct.toFixed(1)}%` : '—'}
          hint={ovr ? `${ovr.tasks.overdue} overdue · ${ovr.tasks.blocked} blocked` : undefined}
          changePct={ovr?.tasks.changePct}
          series={sparkProjects}
          accent={ovr && ovr.tasks.overdue > 0 ? 'rose' : 'amber'}
          icon={<Ico><path d="M5 12.5l4 4L19 7" /></Ico>}
        />
      </div>

      {/* Growth + Status */}
      <div className="grid gap-4 lg:grid-cols-12">
        <div className="card p-5 lg:col-span-7">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-base font-semibold text-ink-900">Platform growth</h3>
              <p className="text-xs text-ink-500">Daily new registrations · last {days}d</p>
            </div>
            <div className="flex items-center gap-3">
              {[['#06b6d4', 'Users'], ['#4f46e5', 'Workspaces'], ['#10b981', 'Projects']].map(([c, l]) => (
                <span key={l} className="inline-flex items-center gap-1.5 text-[11px] text-ink-500">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c }} />
                  {l}
                </span>
              ))}
            </div>
          </div>
          <div className="mt-4">
            {growth.isLoading ? (
              <div className="skeleton h-56 w-full" />
            ) : (
              <LineChart
                labels={(growth.data ?? []).map((g) => g.date)}
                series={[
                  { key: 'users', label: 'Users', color: '#06b6d4', values: (growth.data ?? []).map((g) => g.users) },
                  { key: 'ws', label: 'Workspaces', color: '#4f46e5', values: (growth.data ?? []).map((g) => g.workspaces) },
                  { key: 'proj', label: 'Projects', color: '#10b981', values: (growth.data ?? []).map((g) => g.projects) },
                ]}
              />
            )}
          </div>
        </div>

        <div className="card p-5 lg:col-span-5">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-base font-semibold text-ink-900">Tasks by status</h3>
              <p className="text-xs text-ink-500">Platform-wide</p>
            </div>
            {ovr && ovr.tasks.overdue > 0 && (
              <span className="badge bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-100">
                {ovr.tasks.overdue} overdue
              </span>
            )}
          </div>
          <div className="mt-5">
            {status.isLoading ? (
              <div className="skeleton h-52 w-full" />
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
      </div>

      {/* Donuts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <h3 className="text-base font-semibold text-ink-900">Role distribution</h3>
          <p className="text-xs text-ink-500">Active workspace memberships</p>
          <div className="mt-4">
            {roles.isLoading ? <div className="skeleton h-44 w-full" /> : (
              <DonutChart
                centerLabel={String((roles.data?.owner ?? 0) + (roles.data?.member ?? 0) + (roles.data?.client ?? 0))}
                centerSubLabel="members"
                slices={[
                  { label: 'Owners', value: roles.data?.owner ?? 0, color: '#4f46e5' },
                  { label: 'Members', value: roles.data?.member ?? 0, color: '#06b6d4' },
                  { label: 'Clients', value: roles.data?.client ?? 0, color: '#94a3b8' },
                  { label: 'Admins', value: roles.data?.platform_admin ?? 0, color: '#f43f5e' },
                ]}
              />
            )}
          </div>
        </div>
        <div className="card p-5">
          <h3 className="text-base font-semibold text-ink-900">Plan distribution</h3>
          <p className="text-xs text-ink-500">Conversion funnel · workspaces by tier</p>
          <div className="mt-4">
            {overview.isLoading || !ovr ? <div className="skeleton h-44 w-full" /> : (
              <DonutChart
                centerLabel={String(ovr.plans.free + ovr.plans.pro + ovr.plans.enterprise)}
                centerSubLabel="workspaces"
                slices={[
                  { label: 'Free', value: ovr.plans.free, color: '#cbd5e1' },
                  { label: 'Pro', value: ovr.plans.pro, color: '#4f46e5' },
                  { label: 'Enterprise', value: ovr.plans.enterprise, color: '#f59e0b' },
                ]}
              />
            )}
          </div>
        </div>
      </div>

      {/* Workspaces table */}
      <WorkspacesTable
        rows={workspaces.data?.items ?? []}
        loading={workspaces.isLoading}
        onSearchChange={setSearch}
      />

      {/* Activity + Insights */}
      <div className="grid gap-4 lg:grid-cols-12">
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
      </div>
    </div>
  );
}

function Ico({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}
