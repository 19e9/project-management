import type { Task, TaskStatus, TaskPriority } from '../../features/projects/types';
import { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { cn } from '../../lib/cn';

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
    if (draft && window.confirm('Bu görevi silmek istediğinize emin misiniz?')) {
      onDelete(draft.id);
      onClose();
    }
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
          <h2 className="text-sm font-semibold text-fg">Görev Detayı</h2>
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
            <label className="mb-1 block text-xs font-medium text-muted">Başlık</label>
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
            <label className="mb-1 block text-xs font-medium text-muted">Açıklama</label>
            {readOnly ? (
              <p className="text-sm text-muted">{draft.description ?? '—'}</p>
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
              <label className="mb-1 block text-xs font-medium text-muted">Durum</label>
              {readOnly ? (
                <p className="text-sm text-fg">{draft.status}</p>
              ) : (
                <select
                  className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-fg outline-none focus:border-brand"
                  value={draft.status}
                  onChange={(e) => setDraft({ ...draft, status: e.target.value as TaskStatus })}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s.replace('_', ' ')}</option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Öncelik</label>
              {readOnly ? (
                <p className="text-sm text-fg">{draft.priority}</p>
              ) : (
                <select
                  className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-fg outline-none focus:border-brand"
                  value={draft.priority}
                  onChange={(e) => setDraft({ ...draft, priority: e.target.value as TaskPriority })}
                >
                  {PRIORITY_OPTIONS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {draft.due && (
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Son Tarih</label>
              <p className="text-sm text-fg">{draft.due}</p>
            </div>
          )}
        </div>

        {!readOnly && (
          <footer className="flex items-center justify-between border-t border-border px-5 py-4">
            <Button variant="danger" onClick={handleDelete}>Sil</Button>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={onClose}>İptal</Button>
              <Button onClick={handleSave}>Kaydet</Button>
            </div>
          </footer>
        )}
      </aside>
    </>
  );
}
