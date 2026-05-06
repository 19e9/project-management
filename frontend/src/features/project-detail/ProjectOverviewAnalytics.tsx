import { useMemo } from 'react';
import { BarChart, LineChart } from '../../components/charts/Sparklines';
import type { TaskItem } from '../tasks/hooks';
import type { WorkspaceMemberRow } from '../workspaces/hooks';
import { countOverdue } from './projectMetrics';
import { workloadByAssignee } from './projectMetrics';

function seed(hash: string) {
  let h = 0;
  for (let i = 0; i < hash.length; i++) h = (h * 31 + hash.charCodeAt(i)) >>> 0;
  return () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return (h >>> 0) / 4294967296;
  };
}

export function ProjectOverviewAnalytics({
  projectId,
  overview,
  tasks,
  members,
  criticalIds,
}: {
  projectId: string;
  overview: {
    total: number;
    completionPct: number;
    inProgress: number;
    blocked: number;
    notStarted?: number;
    done?: number;
    cancelled?: number;
  } | undefined;
  tasks: TaskItem[];
  members: WorkspaceMemberRow[];
  criticalIds: string[];
}) {
  const overdueList = useMemo(() => {
    const today = new Date().setHours(0, 0, 0, 0);
    return tasks.filter((t) => {
      if (t.status === 'done' || t.status === 'cancelled') return false;
      return new Date(t.endDate).setHours(0, 0, 0, 0) < today;
    });
  }, [tasks]);

  const upcoming = useMemo(() => {
    const today = new Date().setHours(0, 0, 0, 0);
    const horizon = today + 14 * 86400000;
    return tasks
      .filter((t) => {
        if (t.status === 'done' || t.status === 'cancelled') return false;
        const end = new Date(t.endDate).setHours(0, 0, 0, 0);
        return end >= today && end <= horizon;
      })
      .sort((a, b) => +new Date(a.endDate) - +new Date(b.endDate))
      .slice(0, 8);
  }, [tasks]);

  const activity = useMemo(() => deriveActivityFeed(tasks, members), [tasks, members]);

  const velocityChart = useMemo(() => synthVelocity(projectId, overview?.total ?? tasks.length), [projectId, overview?.total, tasks.length]);

  const burndownChart = useMemo(
    () => synthBurndown(projectId, overview?.total ?? tasks.length, overview?.completionPct ?? 0),
    [projectId, overview?.total, overview?.completionPct, tasks.length],
  );

  const workload = workloadByAssignee(tasks, members.length ? members : syntheticMembers(tasks));

  const criticalTasks = tasks.filter((t) => criticalIds.includes(t.id)).slice(0, 8);

  const o = overview;

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

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="card p-5 xl:col-span-2">
          <h3 className="text-base font-semibold text-ink-900">Velocity (synthetic)</h3>
          <p className="text-xs text-ink-500">Weekly throughput proxy until history endpoints ship.</p>
          <div className="mt-4">
            <LineChart labels={velocityChart.labels} series={velocityChart.series} height={200} />
          </div>
        </div>
        <div className="card p-5">
          <h3 className="text-base font-semibold text-ink-900">Workload</h3>
          <p className="text-xs text-ink-500">Open tasks by assignee</p>
          <div className="mt-4">
            <BarChart
              height={200}
              data={workload.map((w) => ({
                label: w.label.slice(0, 12),
                value: w.count,
              }))}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <h3 className="text-base font-semibold text-ink-900">Burndown (projected)</h3>
          <p className="text-xs text-ink-500">Ideal vs. modeled remaining work</p>
          <div className="mt-4">
            <LineChart labels={burndownChart.labels} series={burndownChart.series} height={200} />
          </div>
        </div>
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
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-ink-900">Critical alerts</h3>
              <p className="text-xs text-ink-500">Tasks tagged by live CPM output when enabled.</p>
            </div>
            <span className="rounded-full bg-rose-50 px-2 py-1 text-[11px] font-bold text-rose-800 ring-1 ring-rose-100">
              {criticalTasks.length} highlighted
            </span>
          </div>
          <ul className="mt-4 divide-y divide-ink-100">
            {criticalTasks.map((t) => (
              <li key={t.id} className="flex justify-between gap-3 py-3 text-sm">
                <span className="font-medium text-ink-900">{t.title}</span>
                <span className="shrink-0 text-xs text-ink-500">{t.endDate.slice(0, 10)}</span>
              </li>
            ))}
            {criticalTasks.length === 0 && (
              <li className="py-8 text-center text-sm text-ink-500">No critical-path tasks flagged.</li>
            )}
          </ul>
        </div>

        <div className="card space-y-4 p-5">
          <div>
            <h3 className="text-base font-semibold text-ink-900">Overdue</h3>
            <p className="text-xs text-ink-500">{overdueList.length} active tasks behind schedule</p>
          </div>
          <ul className="space-y-2 text-sm">
            {overdueList.slice(0, 6).map((t) => (
              <li key={t.id} className="rounded-xl bg-rose-50/60 px-3 py-2 ring-1 ring-rose-100">
                <div className="font-medium text-rose-950">{t.title}</div>
                <div className="text-[11px] text-rose-800">Was due {t.endDate.slice(0, 10)}</div>
              </li>
            ))}
            {overdueList.length === 0 && (
              <li className="text-sm text-ink-500">Nothing overdue right now.</li>
            )}
          </ul>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wide text-ink-500">Upcoming deadlines</h4>
            <ul className="mt-2 space-y-2 text-sm">
              {upcoming.map((t) => (
                <li key={t.id} className="flex justify-between gap-2 rounded-lg bg-ink-50/60 px-3 py-2">
                  <span className="truncate font-medium text-ink-900">{t.title}</span>
                  <span className="shrink-0 tabular-nums text-xs text-ink-500">{t.endDate.slice(0, 10)}</span>
                </li>
              ))}
              {upcoming.length === 0 && <li className="text-xs text-ink-500">No deadlines in the next two weeks.</li>}
            </ul>
          </div>
        </div>
      </div>

      <div className="card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-ink-900">Recent activity</h3>
            <p className="text-xs text-ink-500">Derived from task freshness until audit logs arrive.</p>
          </div>
          <span className="rounded-full bg-ink-100 px-2 py-1 text-[11px] font-semibold text-ink-700">
            {countOverdue(tasks)} overdue · {o?.blocked ?? 0} blocked
          </span>
        </div>
        <ul className="mt-4 space-y-3">
          {activity.map((ev) => (
            <li key={ev.id} className="flex gap-3 rounded-xl border border-ink-100 bg-ink-50/30 px-4 py-3 text-sm">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-xs font-bold text-brand-700 ring-1 ring-ink-200">
                {ev.avatar}
              </span>
              <div className="min-w-0">
                <p className="text-ink-900">{ev.message}</p>
                <p className="text-[11px] text-ink-500">{new Date(ev.at).toLocaleString()}</p>
              </div>
            </li>
          ))}
          {activity.length === 0 && (
            <li className="py-10 text-center text-sm text-ink-500">No recent task updates.</li>
          )}
        </ul>
      </div>

      <div className="card relative overflow-hidden p-5">
        <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-brand-500/15 to-transparent blur-2xl" />
        <h3 className="relative text-base font-semibold text-ink-900">Ops snapshot</h3>
        <p className="relative mt-1 text-xs text-ink-500">Quick health signals</p>
        <ul className="relative mt-4 space-y-3 text-sm text-ink-700">
          <li className="flex justify-between gap-2 border-b border-ink-100 pb-2">
            <span className="text-ink-500">Critical tasks</span>
            <span className="font-semibold tabular-nums text-ink-900">{criticalIds.length}</span>
          </li>
          <li className="flex justify-between gap-2 border-b border-ink-100 pb-2">
            <span className="text-ink-500">Blocked tasks</span>
            <span className="font-semibold tabular-nums text-ink-900">{o?.blocked ?? 0}</span>
          </li>
          <li className="flex justify-between gap-2">
            <span className="text-ink-500">Completion</span>
            <span className="font-semibold tabular-nums text-emerald-700">{o?.completionPct ?? 0}%</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

function syntheticMembers(tasks: TaskItem[]): WorkspaceMemberRow[] {
  const ids = new Set<string>();
  tasks.forEach((t) => t.assigneeIds.forEach((id) => ids.add(id)));
  return [...ids].map((userId) => ({
    id: userId,
    userId,
    email: '',
    displayName: `User ${userId.slice(-4)}`,
    role: 'member',
    status: 'active',
  }));
}

function deriveActivityFeed(tasks: TaskItem[], members: WorkspaceMemberRow[]) {
  const memberMap = new Map(members.map((m) => [m.userId, m.displayName]));
  const sorted = [...tasks].sort((a, b) => {
    const ta = +(new Date(a.updatedAt ?? a.endDate).getTime());
    const tb = +(new Date(b.updatedAt ?? b.endDate).getTime());
    return tb - ta;
  });
  return sorted.slice(0, 12).map((t, idx) => {
    const actor =
      t.assigneeIds.map((id) => memberMap.get(id)).filter(Boolean)[0] ??
      memberMap.get([...memberMap.keys()][idx % Math.max(1, memberMap.size)]) ??
      'Team member';
    const initials =
      typeof actor === 'string'
        ? actor
            .split(/\s+/)
            .map((s) => s[0])
            .join('')
            .slice(0, 2)
            .toUpperCase()
        : '?';
    const verb =
      t.status === 'done'
        ? 'marked complete'
        : t.status === 'blocked'
          ? 'flagged a blocker on'
          : t.status === 'in_progress'
            ? 'moved forward'
            : 'updated';
    return {
      id: `${t.id}-${idx}`,
      message: `${actor} ${verb} “${t.title}”.`,
      at: t.updatedAt ?? t.endDate,
      avatar: initials.slice(0, 2),
    };
  });
}

function synthVelocity(projectId: string, total: number) {
  const rnd = seed(projectId + 'v');
  const labels = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8'];
  const base = Math.max(2, Math.round(total / 6));
  const values = labels.map((_, i) => Math.round(base * (0.55 + rnd() * (1 + i * 0.07))));
  return {
    labels,
    series: [{ key: 'vel', label: 'Throughput', values, color: '#4f46e5' }],
  };
}

function synthBurndown(projectId: string, total: number, completionPct: number) {
  const rnd = seed(projectId + 'b');
  const labels = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8'];
  const ideal = labels.map((_, i) => Math.max(0, Math.round(total - (total * i) / (labels.length - 1))));
  const targetRemain = Math.round(total * (1 - completionPct / 100));
  const actual = labels.map((_, i) => {
    const t = i / (labels.length - 1);
    const interpolated = Math.round(total - (total - targetRemain) * Math.pow(t, 1.05));
    const jitter = Math.round((rnd() - 0.5) * Math.max(2, total * 0.05));
    return Math.max(0, interpolated + jitter);
  });
  return {
    labels,
    series: [
      { key: 'ideal', label: 'Ideal remaining', values: ideal, color: '#94a3b8' },
      { key: 'actual', label: 'Modeled remaining', values: actual, color: '#06b6d4' },
    ],
  };
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
