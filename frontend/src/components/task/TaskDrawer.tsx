import type { Task, TaskStatus, TaskPriority } from '../../features/projects/types';
import { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { cn } from '../../lib/cn';
import { useT } from '../../i18n/I18nProvider';

interface TaskDrawerProps {
  open: boolean;
  task: Task | null;
  readOnly: boolean;
  onClose: () => void;
  onSave: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

const STATUS_OPTIONS: TaskStatus[] = ['not_started', 'in_progress', 'blocked', 'done', 'cancelled'];
const PRIORITY_OPTIONS: TaskPriority[] = ['low', 'medium', 'high', 'critical'];

export function TaskDrawer({ open, task, readOnly, onClose, onSave, onDelete }: TaskDrawerProps) {
  const t = useT();
  const [draft, setDraft] = useState<Task | null>(task);

  useEffect(() => {
    setDraft(task);
  }, [task]);

  if (!open || !draft) return null;

  function handleSave() {
    if (draft) {
      onSave(draft);
      onClose();
    }
  }

  function handleDelete() {
    if (draft && window.confirm(t('taskDrawer.confirmDelete'))) {
      onDelete(draft.id);
      onClose();
    }
  }

  function statusLabel(s: TaskStatus) {
    const key = `taskStatus.${s}`;
    const out = t(key);
    return out === key ? s.replace('_', ' ') : out;
  }

  function priorityLabel(p: TaskPriority) {
    const key = `taskPriority.${p}`;
    const out = t(key);
    return out === key ? p : out;
  }

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <aside
        className={cn(
          'fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-surface shadow-lift',
          'translate-x-0 transition-transform',
        )}
      >
        <header className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-sm font-semibold text-fg">{t('taskDrawer.panelTitle')}</h2>
          <button
            type="button"
            onClick={onClose}
            className="grid h-7 w-7 place-items-center rounded-md text-muted hover:bg-surface-2 hover:text-fg"
          >
            ✕
          </button>
        </header>

        <div className="flex-1 overflow-y-auto space-y-4 px-5 py-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">{t('taskDrawer.labelTitle')}</label>
            {readOnly ? (
              <p className="text-sm text-fg">{draft.title}</p>
            ) : (
              <input
                className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-fg outline-none focus:border-brand"
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              />
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted">{t('taskDrawer.description')}</label>
            {readOnly ? (
              <p className="text-sm text-muted">{draft.description ?? t('common.none')}</p>
            ) : (
              <textarea
                rows={3}
                className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-fg outline-none focus:border-brand"
                value={draft.description ?? ''}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">{t('taskDrawer.status')}</label>
              {readOnly ? (
                <p className="text-sm text-fg">{statusLabel(draft.status)}</p>
              ) : (
                <select
                  className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-fg outline-none focus:border-brand"
                  value={draft.status}
                  onChange={(e) => setDraft({ ...draft, status: e.target.value as TaskStatus })}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {statusLabel(s)}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">{t('taskDrawer.priority')}</label>
              {readOnly ? (
                <p className="text-sm text-fg">{priorityLabel(draft.priority)}</p>
              ) : (
                <select
                  className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-fg outline-none focus:border-brand"
                  value={draft.priority}
                  onChange={(e) => setDraft({ ...draft, priority: e.target.value as TaskPriority })}
                >
                  {PRIORITY_OPTIONS.map((p) => (
                    <option key={p} value={p}>
                      {priorityLabel(p)}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {draft.due && (
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">{t('taskDrawer.labelDue')}</label>
              <p className="text-sm text-fg">{draft.due}</p>
            </div>
          )}
        </div>

        {!readOnly && (
          <footer className="flex items-center justify-between border-t border-border px-5 py-4">
            <Button variant="danger" onClick={handleDelete}>{t('common.delete')}</Button>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={onClose}>{t('common.cancel')}</Button>
              <Button onClick={handleSave}>{t('common.save')}</Button>
            </div>
          </footer>
        )}
      </aside>
    </>
  );
}
