import {
  Gantt,
  Task as GTask,
  ViewMode,
} from 'gantt-task-react';
import 'gantt-task-react/dist/index.css';
import { useMemo } from 'react';
import {
  useDependencies,
  usePatchTask,
  useTasks,
} from '../tasks/hooks';

export function ProjectGantt({
  workspaceId,
  projectId,
  criticalIds = [],
}: {
  workspaceId: string;
  projectId: string;
  criticalIds?: string[];
}) {
  const { data: tasks = [] } = useTasks(workspaceId, projectId);
  const { data: deps = [] } = useDependencies(workspaceId, projectId);
  const patch = usePatchTask(workspaceId, projectId);

  const items: GTask[] = useMemo(() => {
    return tasks.map((t) => {
      const isCritical = criticalIds.includes(t.id);
      const predecessors = deps
        .filter((d) => d.successorId === t.id)
        .map((d) => d.predecessorId);
      return {
        id: t.id,
        name: t.title,
        start: new Date(t.startDate),
        end: new Date(t.endDate),
        type: t.parentTaskId ? 'task' : 'project',
        progress: t.progressPct ?? 0,
        dependencies: predecessors,
        styles: isCritical
          ? {
              backgroundColor: '#dc2626',
              backgroundSelectedColor: '#b91c1c',
              progressColor: '#fef2f2',
              progressSelectedColor: '#fee2e2',
            }
          : undefined,
      };
    });
  }, [tasks, deps, criticalIds]);

  if (tasks.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-slate-300 p-8 text-center text-slate-500">
        No tasks yet — create some on the Tasks tab to see the Gantt.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border border-slate-200">
      <Gantt
        tasks={items}
        viewMode={ViewMode.Day}
        listCellWidth=""
        columnWidth={48}
        onDateChange={async (t) => {
          await patch.mutateAsync({
            id: t.id,
            startDate: t.start as unknown as string,
            endDate: t.end as unknown as string,
          });
        }}
      />
    </div>
  );
}
