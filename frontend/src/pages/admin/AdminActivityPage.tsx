import { useMemo, useState } from 'react';
import type { AxiosError } from 'axios';
import { ActivityFeed } from '../../components/admin/ActivityFeed';
import {
  useAdminActivity,
  type ActivityEvent,
  type ActivityKind,
} from '../../features/admin/hooks';

const ALL_KINDS: ActivityKind[] = [
  'user_joined',
  'workspace_created',
  'project_created',
  'task_completed',
  'task_updated',
];

function kindLabel(kind: ActivityEvent['kind']): string {
  switch (kind) {
    case 'user_joined':
      return 'User joined';
    case 'workspace_created':
      return 'Workspace created';
    case 'project_created':
      return 'Project created';
    case 'task_completed':
      return 'Task completed';
    case 'task_updated':
      return 'Task updated';
    default:
      return kind;
  }
}

type TimeWindow = 'all' | '24h' | '7d' | '30d';

function windowCutoffMs(w: TimeWindow): number | null {
  if (w === 'all') return null;
  if (w === '24h') return Date.now() - 24 * 60 * 60 * 1000;
  if (w === '7d') return Date.now() - 7 * 24 * 60 * 60 * 1000;
  return Date.now() - 30 * 24 * 60 * 60 * 1000;
}

export default function AdminActivityPage() {
  const limit = 100;
  const { data: events = [], isLoading, isError, error, refetch, dataUpdatedAt } =
    useAdminActivity(limit);

  const [search, setSearch] = useState('');
  const [timeWindow, setTimeWindow] = useState<TimeWindow>('all');
  const [allowedKinds, setAllowedKinds] = useState<Set<ActivityKind>>(
    () => new Set(ALL_KINDS),
  );

  const filtered = useMemo(() => {
    let list = events;

    const cutoff = windowCutoffMs(timeWindow);
    if (cutoff !== null) {
      list = list.filter((e) => new Date(e.at).getTime() >= cutoff);
    }

    if (allowedKinds.size > 0 && allowedKinds.size < ALL_KINDS.length) {
      list = list.filter((e) => allowedKinds.has(e.kind));
    }
    if (allowedKinds.size === 0) {
      list = [];
    }

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((e) => {
        const blob = [
          e.actor?.displayName,
          e.target?.label,
          e.workspace?.name,
          kindLabel(e.kind),
          e.kind,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return blob.includes(q);
      });
    }

    return list;
  }, [events, search, timeWindow, allowedKinds]);

  function toggleKind(k: ActivityKind) {
    setAllowedKinds((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  }

  function selectAllKinds() {
    setAllowedKinds(new Set(ALL_KINDS));
  }

  function clearFilters() {
    setSearch('');
    setTimeWindow('all');
    setAllowedKinds(new Set(ALL_KINDS));
  }

  const filtersActive =
    search.trim() !== '' ||
    timeWindow !== 'all' ||
    allowedKinds.size !== ALL_KINDS.length;

  const errMsg =
    error && typeof error === 'object' && 'isAxiosError' in error
      ? (error as AxiosError<{ message?: string }>).response?.data?.message ??
        (error as AxiosError).message
      : (error as Error)?.message;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="eyebrow">Admin</span>
          <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-ink-900 md:text-3xl">
            Activity log
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            Aggregated signals from users, workspaces, projects, and tasks (same pipeline as{' '}
            <code className="rounded bg-ink-100 px-1.5 py-0.5 font-mono text-xs">GET /admin/activity</code>
            ).
          </p>
        </div>
        <button type="button" className="btn-secondary px-4 text-sm" onClick={() => refetch()}>
          Refresh
        </button>
      </header>

      {isError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
          <p className="font-semibold">Could not load activity</p>
          <p className="mt-1 text-xs text-rose-800">
            {errMsg ?? 'Check network and platform-admin auth.'}
          </p>
        </div>
      )}

      {dataUpdatedAt > 0 && (
        <p className="text-[11px] text-ink-400">
          Last fetched {new Date(dataUpdatedAt).toLocaleString()}
        </p>
      )}

      <section className="card p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 pb-4">
          <div>
            <h2 className="text-sm font-semibold text-ink-900">Filters</h2>
            <p className="text-xs text-ink-500">
              Client-side on the last {limit} rows from the API (types support server filters later).
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {filtersActive && (
              <button type="button" className="btn-secondary px-3 py-1.5 text-xs" onClick={clearFilters}>
                Clear filters
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-5">
            <label className="label" htmlFor="act-search">
              Search
            </label>
            <input
              id="act-search"
              type="search"
              className="input text-sm"
              placeholder="Actor, workspace, task, event type…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="lg:col-span-4">
            <span className="label">Time window</span>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {(
                [
                  ['all', 'All time'],
                  ['24h', '24h'],
                  ['7d', '7 days'],
                  ['30d', '30 days'],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTimeWindow(key)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    timeWindow === key
                      ? 'bg-ink-900 text-white shadow-soft'
                      : 'bg-ink-100 text-ink-700 ring-1 ring-inset ring-ink-200 hover:bg-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="lg:col-span-3">
            <span className="label">Showing</span>
            <p className="mt-2 rounded-xl bg-ink-50 px-3 py-2 text-center font-mono text-sm font-semibold tabular-nums text-ink-900 ring-1 ring-inset ring-ink-100">
              {filtered.length}
              <span className="font-normal text-ink-500"> / {events.length}</span>
            </p>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wide text-ink-500">
              Event types
            </span>
            <button
              type="button"
              className="text-[11px] font-semibold text-brand-700 hover:text-brand-900"
              onClick={selectAllKinds}
            >
              Select all
            </button>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {ALL_KINDS.map((k) => {
              const on = allowedKinds.has(k);
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => toggleKind(k)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ring-1 ring-inset ${
                    on
                      ? 'bg-brand-50 text-brand-900 ring-brand-200'
                      : 'bg-white text-ink-400 line-through ring-ink-200 hover:bg-ink-50'
                  }`}
                >
                  {kindLabel(k)}
                </button>
              );
            })}
          </div>
          {allowedKinds.size === 0 && (
            <p className="mt-2 text-xs font-medium text-amber-800">
              Select at least one event type to see rows.
            </p>
          )}
        </div>

        {filtersActive && events.length > 0 && filtered.length === 0 && allowedKinds.size > 0 && (
          <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50/80 px-3 py-2 text-xs text-amber-950">
            No rows match the current filters. Try clearing search or widening the time window.
          </p>
        )}
      </section>

      <ActivityFeed events={filtered} loading={isLoading} limit={limit} />

      <div className="card overflow-hidden">
        <div className="border-b border-ink-200 bg-ink-50/40 px-5 py-4">
          <h2 className="text-base font-semibold text-ink-900">Audit table</h2>
          <p className="text-xs text-ink-500">
            Dense listing — newest first ({filtered.length} shown · {events.length} loaded).
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b border-ink-200 bg-ink-50/30 text-left text-[11px] font-semibold uppercase tracking-wider text-ink-500">
              <tr>
                <th className="whitespace-nowrap px-5 py-3">When</th>
                <th className="px-5 py-3">Event</th>
                <th className="px-5 py-3">Actor</th>
                <th className="px-5 py-3">Target</th>
                <th className="px-5 py-3">Workspace</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {isLoading && events.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-sm text-ink-500">
                    Loading…
                  </td>
                </tr>
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-sm text-ink-500">
                    No activity rows yet — seed users/tasks or trigger workspace/project creates.
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-sm text-ink-500">
                    {allowedKinds.size === 0
                      ? 'Choose at least one event type above.'
                      : 'No rows match your filters — adjust search or time window.'}
                  </td>
                </tr>
              ) : (
                filtered.map((e) => (
                  <tr key={e.id} className="hover:bg-ink-50/40">
                    <td className="whitespace-nowrap px-5 py-2.5 font-mono text-xs text-ink-600">
                      {new Date(e.at).toLocaleString()}
                    </td>
                    <td className="px-5 py-2.5">
                      <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[11px] font-semibold text-ink-800">
                        {kindLabel(e.kind)}
                      </span>
                    </td>
                    <td className="max-w-[200px] truncate px-5 py-2.5 text-ink-800">
                      {e.actor?.displayName ?? '—'}
                    </td>
                    <td className="max-w-[240px] truncate px-5 py-2.5 font-medium text-ink-900">
                      {e.target?.label ?? '—'}
                    </td>
                    <td className="max-w-[200px] truncate px-5 py-2.5 text-ink-600">
                      {e.workspace?.name ?? '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
