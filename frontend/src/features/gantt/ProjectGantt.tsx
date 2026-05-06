import {
  Gantt,
  Task as GTask,
  ViewMode,
} from 'gantt-task-react';
import 'gantt-task-react/dist/index.css';
import { useMemo, useState } from 'react';
import {
  useDependencies,
  usePatchTask,
  useTasks,
} from '../tasks/hooks';
import type { WorkspaceMemberRow } from '../workspaces/hooks';

export function ProjectGantt({
  workspaceId,
  projectId,
  criticalIds = [],
  members = [],
}: {
  workspaceId: string;
  projectId: string;
  criticalIds?: string[];
  members?: WorkspaceMemberRow[];
}) {
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Day);
  const { data: tasks = [] } = useTasks(workspaceId, projectId);
  const { data: deps = [] } = useDependencies(workspaceId, projectId);
  const patch = usePatchTask(workspaceId, projectId);

  const memberByUserId = useMemo(
    () => new Map(members.map((m) => [m.userId, m])),
    [members],
  );

  const columnWidth =
    viewMode === ViewMode.Month ? 88 : viewMode === ViewMode.Week ? 72 : viewMode === ViewMode.Day ? 52 : 64;

  const items: GTask[] = useMemo(() => {
    return tasks.map((t) => {
      const isCritical = criticalIds.includes(t.id);
      const predecessors = deps
        .filter((d) => d.successorId === t.id)
        .map((d) => d.predecessorId);
      const initials = (t.assigneeIds ?? [])
        .slice(0, 3)
        .map((id) => {
          const nm = memberByUserId.get(id)?.displayName ?? '';
          return nm
            ? nm
                .split(/\s+/)
                .map((s) => s[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()
            : '';
        })
        .filter(Boolean)
        .join('·');
      const name = initials ? `${t.title} · ${initials}` : t.title;
      return {
        id: t.id,
        name,
        start: new Date(t.startDate),
        end: new Date(t.endDate),
        type: t.parentTaskId ? 'task' : 'project',
        progress: t.progressPct ?? 0,
        dependencies: predecessors,
        styles: isCritical
          ? {
              backgroundColor: '#dc2626',
              backgroundSelectedColor: '#b91c1c',
              progressColor: '#fecaca',
              progressSelectedColor: '#fca5a5',
            }
          : undefined,
      };
    });
  }, [tasks, deps, criticalIds, memberByUserId]);

  const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), []);

  if (tasks.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-slate-300 p-8 text-center text-slate-500">
        No tasks yet — create some on the Tasks tab to see the Gantt.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink-200 bg-ink-50/40 px-3 py-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">Zoom</span>
          {(
            [
              [ViewMode.Day, 'Day'],
              [ViewMode.Week, 'Week'],
              [ViewMode.Month, 'Month'],
            ] as const
          ).map(([mode, label]) => (
            <button
              key={label}
              type="button"
              onClick={() => setViewMode(mode)}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                viewMode === mode
                  ? 'bg-white text-ink-900 shadow-soft ring-1 ring-inset ring-ink-200'
                  : 'text-ink-600 hover:bg-white/70 hover:text-ink-900'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-ink-600">
          <span className="rounded-full bg-white px-2 py-1 font-mono text-[11px] ring-1 ring-inset ring-ink-200">
            Today {todayIso}
          </span>
          <span className="hidden text-ink-500 sm:inline">
            Dependencies render when predecessor links exist in Tasks → Dependencies.
          </span>
        </div>
      </div>

      <div className="relative overflow-x-auto rounded-md border border-slate-200">
        <Gantt
          tasks={items}
          viewMode={viewMode}
          listCellWidth="240px"
          columnWidth={columnWidth}
          rowHeight={44}
          barCornerRadius={4}
          todayColor="#f472b6"
          onDateChange={async (t) => {
            await patch.mutateAsync({
              id: t.id,
              startDate: t.start as unknown as string,
              endDate: t.end as unknown as string,
            });
          }}
          onProgressChange={async (t) => {
            await patch.mutateAsync({
              id: t.id,
              progressPct: Math.round(t.progress ?? 0),
            });
          }}
        />
      </div>
    </div>
  );
}

