import {
  Gantt,
  Task as GTask,
  ViewMode,
} from 'gantt-task-react';
import 'gantt-task-react/dist/index.css';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  useDependencies,
  usePatchTask,
  useTasks,
} from '../tasks/hooks';
import type { WorkspaceMemberRow } from '../workspaces/hooks';

// Each column (Name, From, To) gets colWidth px → total left panel = 3 * colWidth
const COL_MIN = 50;
const COL_MAX = 320;
const COL_DEFAULT = 160;

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
  const [colWidth, setColWidth] = useState(COL_DEFAULT);
  const [isResizing, setIsResizing] = useState(false);

  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartCol = useRef(colWidth);

  const { data: tasks = [] } = useTasks(workspaceId, projectId);
  const { data: deps = [] } = useDependencies(workspaceId, projectId);
  const patch = usePatchTask(workspaceId, projectId);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const dx = e.clientX - dragStartX.current;
      // total panel moves by dx → each of 3 cols moves by dx/3
      const next = Math.max(COL_MIN, Math.min(COL_MAX, Math.round(dragStartCol.current + dx / 3)));
      setColWidth(next);
    };
    const onUp = () => {
      if (isDragging.current) {
        isDragging.current = false;
        setIsResizing(false);
      }
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
  }, []);

  const memberByUserId = useMemo(
    () => new Map(members.map((m) => [m.userId, m])),
    [members],
  );

  const chartColumnWidth =
    viewMode === ViewMode.Month ? 88 : viewMode === ViewMode.Week ? 72 : 52;

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
            ? nm.split(/\s+/).map((s) => s[0]).join('').slice(0, 2).toUpperCase()
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

  // left panel = 3 columns × colWidth; handle sits at that boundary
  const leftPanelPx = colWidth * 3;

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

      {/* Chart + resizable divider */}
      <div
        className={`relative rounded-md border border-slate-200 ${isResizing ? 'select-none' : ''}`}
        style={{ cursor: isResizing ? 'col-resize' : undefined }}
      >
        <Gantt
          tasks={items}
          viewMode={viewMode}
          listCellWidth={`${colWidth}px`}
          columnWidth={chartColumnWidth}
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

        {/* Drag handle — sits at the right edge of the task list panel */}
        <div
          title="Drag to resize columns"
          style={{ left: leftPanelPx - 3 }}
          className="group absolute bottom-0 top-0 z-20 w-[7px] cursor-col-resize"
          onMouseDown={(e) => {
            isDragging.current = true;
            dragStartX.current = e.clientX;
            dragStartCol.current = colWidth;
            setIsResizing(true);
            e.preventDefault();
          }}
        >
          {/* visible line */}
          <div className="absolute bottom-0 left-[3px] top-0 w-px bg-ink-200 opacity-0 transition-opacity group-hover:opacity-100" />
          {/* grip dots */}
          <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col gap-[3px] opacity-0 transition-opacity group-hover:opacity-100">
            {[0, 1, 2].map((i) => (
              <span key={i} className="h-1 w-1 rounded-full bg-ink-400" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
