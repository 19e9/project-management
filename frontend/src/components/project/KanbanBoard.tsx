import type { Task, TaskStatus } from '../../features/projects/types';
import { Badge } from '../ui/Badge';
import { cn } from '../../lib/cn';

const COLUMNS: { id: TaskStatus; label: string }[] = [
  { id: 'not_started', label: 'Başlamadı' },
  { id: 'in_progress', label: 'Devam Ediyor' },
  { id: 'blocked', label: 'Engellendi' },
  { id: 'done', label: 'Tamamlandı' },
];

const STATUS_TONE: Record<TaskStatus, 'neutral' | 'info' | 'danger' | 'success' | 'warning'> = {
  not_started: 'neutral',
  in_progress: 'info',
  blocked: 'danger',
  done: 'success',
  cancelled: 'warning',
};

interface KanbanBoardProps {
  tasks: Task[];
  readOnly: boolean;
  onOpenTask: (taskId: string) => void;
  onMove: (taskId: string, status: TaskStatus) => void;
}

export function KanbanBoard({ tasks, readOnly, onOpenTask, onMove }: KanbanBoardProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {COLUMNS.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.id);
        return (
          <div key={col.id} className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">{col.label}</h3>
              <span className="rounded-full bg-surface-3 px-2 py-0.5 text-xs text-muted">
                {colTasks.length}
              </span>
            </div>
            <div className="flex flex-col gap-2 min-h-[4rem]">
              {colTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  readOnly={readOnly}
                  onOpen={() => onOpenTask(task.id)}
                  onMove={onMove}
                  columns={COLUMNS}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TaskCard({
  task,
  readOnly,
  onOpen,
  onMove,
  columns,
}: {
  task: Task;
  readOnly: boolean;
  onOpen: () => void;
  onMove: (taskId: string, status: TaskStatus) => void;
  columns: { id: TaskStatus; label: string }[];
}) {
  return (
    <div
      className={cn('card cursor-pointer p-3 hover:shadow-lift')}
      onClick={onOpen}
    >
      <p className="text-sm font-medium text-fg">{task.title}</p>
      {task.assigneeName && (
        <p className="mt-1 text-xs text-muted">{task.assigneeName}</p>
      )}
      <div className="mt-2 flex items-center gap-2">
        <Badge tone={STATUS_TONE[task.status]}>{task.status.replace('_', ' ')}</Badge>
      </div>
      {!readOnly && (
        <select
          className="mt-2 w-full rounded border border-border bg-surface-2 px-2 py-1 text-xs text-muted"
          value={task.status}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => onMove(task.id, e.target.value as TaskStatus)}
        >
          {columns.map((c) => (
            <option key={c.id} value={c.id}>{c.label}</option>
          ))}
        </select>
      )}
    </div>
  );
}
