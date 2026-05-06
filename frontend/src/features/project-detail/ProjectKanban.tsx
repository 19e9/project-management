import { useEffect, useMemo, useState } from 'react';
import type { TaskItem } from '../tasks/hooks';
import type { WorkspaceMemberRow } from '../workspaces/hooks';
import {
  loadKanbanWip,
  saveKanbanWip,
  type KanbanWipPrefs,
} from '../../lib/projectUiPrefs';

const COLS: { status: TaskItem['status']; title: string }[] = [
  { status: 'not_started', title: 'Backlog' },
  { status: 'in_progress', title: 'In progress' },
  { status: 'blocked', title: 'Blocked' },
  { status: 'done', title: 'Done' },
];

export function ProjectKanban({
  projectId,
  tasks,
  members,
  onStatusChange,
  onOpenTask,
}: {
  projectId: string;
  tasks: TaskItem[];
  members: WorkspaceMemberRow[];
  onStatusChange: (taskId: string, status: TaskItem['status']) => void;
  onOpenTask: (task: TaskItem) => void;
}) {
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [dragId, setDragId] = useState<string | null>(null);
  const [wip, setWip] = useState<KanbanWipPrefs>(() => loadKanbanWip(projectId));

  useEffect(() => {
    setWip(loadKanbanWip(projectId));
  }, [projectId]);

  useEffect(() => {
    saveKanbanWip(projectId, wip);
  }, [projectId, wip]);

  const memberMap = useMemo(
    () => new Map(members.map((m) => [m.userId, m])),
    [members],
  );

  const filtered = useMemo(() => {
    if (assigneeFilter === 'all') return tasks.filter((t) => t.status !== 'cancelled');
    return tasks.filter(
      (t) =>
        t.status !== 'cancelled' &&
        (assigneeFilter === 'unassigned'
          ? t.assigneeIds.length === 0
          : t.assigneeIds.includes(assigneeFilter)),
    );
  }, [tasks, assigneeFilter]);

  const byStatus = useMemo(() => {
    const m = new Map<string, TaskItem[]>();
    for (const c of COLS) m.set(c.status, []);
    for (const t of filtered) {
      const list = m.get(t.status);
      if (list) list.push(t);
    }
    return m;
  }, [filtered]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-ink-900">Kanban</h2>
          <p className="text-xs text-ink-500">
            Drag cards to update status · WIP limits apply to In progress & Blocked
          </p>
        </div>
        <label className="flex items-center gap-2 text-xs font-medium text-ink-600">
          Assignee
          <select
            className="input max-w-[220px] py-1.5 text-xs"
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
          >
            <option value="all">Everyone</option>
            <option value="unassigned">Unassigned</option>
            {members.map((m) => (
              <option key={m.userId} value={m.userId}>
                {m.displayName}
              </option>
            ))}
          </select>
        </label>
      </div>

      <details className="rounded-xl border border-ink-200 bg-white px-4 py-3 text-xs">
        <summary className="cursor-pointer font-semibold text-ink-800">WIP limits per column</summary>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(Object.keys(wip) as (keyof KanbanWipPrefs)[]).map((k) => (
            <label key={k} className="space-y-1">
              <span className="block text-[10px] font-bold uppercase tracking-wide text-ink-500">
                {k.replace('_', ' ')}
              </span>
              <input
                type="number"
                min={0}
                className="input py-1 text-xs"
                value={wip[k]}
                onChange={(e) =>
                  setWip((prev) => ({
                    ...prev,
                    [k]: Math.max(0, parseInt(e.target.value || '0', 10)),
                  }))
                }
              />
            </label>
          ))}
        </div>
      </details>

      <div className="grid gap-3 lg:grid-cols-4">
        {COLS.map((col) => {
          const list = byStatus.get(col.status) ?? [];
          const limit =
            col.status === 'in_progress'
              ? wip.in_progress
              : col.status === 'blocked'
                ? wip.blocked
                : col.status === 'not_started'
                  ? wip.not_started
                  : wip.done;
          const over = limit > 0 && list.length > limit;
          return (
            <section
              key={col.status}
              className={`flex min-h-[420px] flex-col rounded-2xl border bg-ink-50/40 p-3 ${
                over ? 'border-amber-300 ring-1 ring-amber-200' : 'border-ink-200'
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
              }}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData('task/id');
                if (!id) return;
                onStatusChange(id, col.status as TaskItem['status']);
                setDragId(null);
              }}
            >
              <header className="mb-3 flex items-center justify-between gap-2 px-1">
                <span className="text-xs font-bold uppercase tracking-wide text-ink-700">{col.title}</span>
                <span
                  className={`rounded-full px-2 py-0.5 font-mono text-[11px] font-semibold ${
                    over ? 'bg-amber-100 text-amber-900' : 'bg-white text-ink-600 ring-1 ring-inset ring-ink-200'
                  }`}
                >
                  {list.length}
                  {limit ? ` / ${limit}` : ''}
                </span>
              </header>
              <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
                {list.map((t) => (
                  <article
                    key={t.id}
                    draggable
                    onDragStart={(e) => {
                      setDragId(t.id);
                      e.dataTransfer.setData('task/id', t.id);
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    onDragEnd={() => setDragId(null)}
                    role="button"
                    tabIndex={0}
                    onClick={() => onOpenTask(t)}
                    onKeyDown={(ev) => {
                      if (ev.key === 'Enter' || ev.key === ' ') {
                        ev.preventDefault();
                        onOpenTask(t);
                      }
                    }}
                    className={`cursor-grab rounded-xl border border-ink-200 bg-white p-3 text-left shadow-sm transition hover:border-brand-300 hover:shadow-md active:cursor-grabbing ${
                      dragId === t.id ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold text-ink-900">{t.title}</h3>
                      <PriorityDot priority={t.priority} />
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="badge bg-ink-50 text-[10px] font-semibold uppercase text-ink-600 ring-1 ring-inset ring-ink-200">
                        {t.progressPct ?? 0}%
                      </span>
                      {t.wbsCode && (
                        <span className="font-mono text-[10px] text-ink-500">{t.wbsCode}</span>
                      )}
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <div className="flex -space-x-2">
                        {(t.assigneeIds.slice(0, 3) ?? []).map((uid) => (
                          <MiniAvatar key={uid} member={memberMap.get(uid)} fallback={uid.slice(-4)} />
                        ))}
                        {t.assigneeIds.length === 0 && (
                          <span className="text-[10px] text-ink-400">Unassigned</span>
                        )}
                      </div>
                      <span className="text-[10px] tabular-nums text-ink-500">
                        {fmtShort(t.endDate)}
                      </span>
                    </div>
                  </article>
                ))}
                {list.length === 0 && (
                  <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-ink-200 px-3 py-10 text-center text-xs text-ink-400">
                    Drop tasks here
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function PriorityDot({ priority }: { priority: string }) {
  const color =
    priority === 'critical'
      ? 'bg-rose-500'
      : priority === 'high'
        ? 'bg-orange-500'
        : priority === 'medium'
          ? 'bg-amber-400'
          : 'bg-slate-300';
  return <span className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${color}`} title={priority} />;
}

function MiniAvatar({
  member,
  fallback,
}: {
  member?: WorkspaceMemberRow;
  fallback: string;
}) {
  const label = member?.displayName ?? fallback;
  const initials = member?.displayName
    ? member.displayName
        .split(/\s+/)
        .map((s) => s[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : fallback.toUpperCase();
  return (
    <span
      title={label}
      className="grid h-7 w-7 place-items-center rounded-full border-2 border-white bg-gradient-to-br from-brand-500 to-cyan-500 text-[10px] font-bold text-white"
    >
      {member?.avatarUrl ? (
        <img src={member.avatarUrl} alt="" className="h-full w-full rounded-full object-cover" />
      ) : (
        initials
      )}
    </span>
  );
}

function fmtShort(iso: string) {
  try {
    return new Date(iso).toISOString().slice(5, 10);
  } catch {
    return '—';
  }
}
