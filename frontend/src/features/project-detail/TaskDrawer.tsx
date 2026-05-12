import { useEffect, useMemo, useState } from 'react';
import type { TaskItem } from '../tasks/hooks';
import type { WorkspaceMemberRow } from '../workspaces/hooks';
import {
  appendTaskComment,
  appendProjectDoc,
  loadProjectDocs,
  loadTaskComments,
  saveTaskComments,
  type TaskComment,
} from '../../lib/projectDetailLocal';

const LABELS_KEY = (id: string) => `planforge.taskLabels.${id}`;
const EST_KEY = (id: string) => `planforge.taskEstHours.${id}`;
const WATCH_KEY = (id: string) => `planforge.taskWatchers.${id}`;

function loadLabels(taskId: string): string[] {
  try {
    const raw = localStorage.getItem(LABELS_KEY(taskId));
    if (!raw) return [];
    const j = JSON.parse(raw) as string[];
    return Array.isArray(j) ? j : [];
  } catch {
    return [];
  }
}

function saveLabels(taskId: string, labels: string[]) {
  localStorage.setItem(LABELS_KEY(taskId), JSON.stringify(labels));
}

function loadEst(taskId: string): number {
  const raw = localStorage.getItem(EST_KEY(taskId));
  const n = raw ? parseFloat(raw) : NaN;
  return Number.isFinite(n) ? n : 0;
}

function saveEst(taskId: string, n: number) {
  if (!n || n <= 0) localStorage.removeItem(EST_KEY(taskId));
  else localStorage.setItem(EST_KEY(taskId), String(n));
}

function loadWatchers(taskId: string): string[] {
  try {
    const raw = localStorage.getItem(WATCH_KEY(taskId));
    if (!raw) return [];
    const j = JSON.parse(raw) as string[];
    return Array.isArray(j) ? j : [];
  } catch {
    return [];
  }
}

function saveWatchers(taskId: string, ids: string[]) {
  localStorage.setItem(WATCH_KEY(taskId), JSON.stringify(ids));
}

export function TaskDrawer({
  open,
  task,
  tasks,
  members,
  projectId,
  canManage,
  onClose,
  patchTask,
  createTask,
}: {
  open: boolean;
  task: TaskItem | null;
  tasks: TaskItem[];
  members: WorkspaceMemberRow[];
  projectId: string;
  canManage: boolean;
  onClose: () => void;
  patchTask: (patch: Partial<TaskItem> & { id: string }) => Promise<unknown>;
  createTask: (body: Partial<TaskItem>) => Promise<unknown>;
}) {
  const [tab, setTab] = useState<'details' | 'comments' | 'files'>('details');
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [commentDraft, setCommentDraft] = useState('');
  const [labels, setLabels] = useState<string[]>([]);
  const [labelDraft, setLabelDraft] = useState('');
  const [estHours, setEstHours] = useState(0);
  const [watchers, setWatchers] = useState<string[]>([]);
  const [subTitle, setSubTitle] = useState('');
  const [authorName, setAuthorName] = useState('You');

  useEffect(() => {
    if (!task) return;
    setTab('details');
    setComments(loadTaskComments(task.id));
    setLabels(loadLabels(task.id));
    setEstHours(loadEst(task.id));
    setWatchers(loadWatchers(task.id));
    setCommentDraft('');
    setSubTitle('');
  }, [task?.id]);

  const subtasks = useMemo(
    () => tasks.filter((t) => t.parentTaskId === task?.id),
    [tasks, task?.id],
  );

  const depsPreview = useMemo(() => {
    if (!task) return [];
    return tasks.filter((t) => t.id !== task.id && (t.title.includes(task.title.slice(0, 8)) || false));
  }, [task, tasks]);

  if (!open || !task) return null;

  const toggleAssignee = async (userId: string) => {
    const set = new Set(task.assigneeIds ?? []);
    if (set.has(userId)) set.delete(userId);
    else set.add(userId);
    await patchTask({ id: task.id, assigneeIds: [...set] });
  };

  const deleteComment = (id: string) => {
    const next = comments.filter((c) => c.id !== id);
    setComments(next);
    saveTaskComments(task.id, next);
  };

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-ink-900/40 backdrop-blur-[2px]"
        aria-label="Close task panel"
        onClick={onClose}
      />
      <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l border-ink-200 bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-3 border-b border-ink-100 px-5 py-4">
          <div className="min-w-0 flex-1">
            <input
              className="w-full border-none bg-transparent text-lg font-bold text-ink-900 outline-none ring-0 placeholder:text-ink-400 focus:ring-0"
              value={task.title}
              readOnly={!canManage}
              onChange={(e) => patchTask({ id: task.id, title: e.target.value })}
            />
            <p className="mt-1 truncate font-mono text-[11px] text-ink-500">{task.id}</p>
          </div>
          <button type="button" className="btn-secondary h-9 shrink-0 px-3 text-xs" onClick={onClose}>
            Close
          </button>
        </header>

        <div className="flex border-b border-ink-100 px-5">
          {(['details', 'comments', 'files'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`relative -mb-px border-b-2 px-3 py-3 text-xs font-semibold capitalize ${
                tab === t
                  ? 'border-brand-600 text-brand-800'
                  : 'border-transparent text-ink-500 hover:text-ink-800'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {tab === 'details' && (
            <div className="space-y-5">
              <div>
                <label className="label">Description</label>
                <textarea
                  className="input min-h-[88px] resize-y text-sm"
                  placeholder="Context, acceptance criteria, links…"
                  value={task.description ?? ''}
                  readOnly={!canManage}
                  onChange={(e) => patchTask({ id: task.id, description: e.target.value || null })}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">Status</label>
                  <select
                    className="input text-sm"
                    value={task.status}
                    onChange={(e) =>
                      patchTask({ id: task.id, status: e.target.value as TaskItem['status'] })
                    }
                  >
                    <option value="not_started">Not started</option>
                    <option value="in_progress">In progress</option>
                    <option value="blocked">Blocked</option>
                    <option value="done">Done</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="label">Priority</label>
                  <select
                    className="input text-sm"
                    value={task.priority}
                    disabled={!canManage}
                    onChange={(e) =>
                      patchTask({ id: task.id, priority: e.target.value as TaskItem['priority'] })
                    }
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">Start</label>
                  <input
                    type="date"
                    className="input text-sm"
                    value={isoDate(task.startDate)}
                    disabled={!canManage}
                    onChange={(e) =>
                      patchTask({ id: task.id, startDate: dayToIso(e.target.value) })
                    }
                  />
                </div>
                <div>
                  <label className="label">End</label>
                  <input
                    type="date"
                    className="input text-sm"
                    value={isoDate(task.endDate)}
                    disabled={!canManage}
                    onChange={(e) =>
                      patchTask({ id: task.id, endDate: dayToIso(e.target.value) })
                    }
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between gap-2">
                  <label className="label">Progress</label>
                  <span className="text-xs font-semibold tabular-nums text-ink-700">
                    {task.progressPct ?? 0}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={task.progressPct ?? 0}
                  onChange={(e) =>
                    patchTask({ id: task.id, progressPct: parseInt(e.target.value, 10) })
                  }
                  className="mt-1 w-full accent-brand-600"
                />
              </div>

              <div>
                <label className="label">Estimated hours (local)</label>
                <input
                  type="number"
                  min={0}
                  step={0.25}
                  className="input text-sm"
                  value={estHours || ''}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value || '0');
                    setEstHours(v);
                    saveEst(task.id, v);
                  }}
                />
              </div>

              {canManage && <div>
                <label className="label">Assignees</label>
                <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto rounded-xl border border-ink-200 bg-ink-50/30 p-2">
                  {members.map((m) => (
                    <li key={m.userId}>
                      <label className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-white">
                        <input
                          type="checkbox"
                          checked={task.assigneeIds.includes(m.userId)}
                          onChange={() => toggleAssignee(m.userId)}
                        />
                        <span className="truncate">{m.displayName}</span>
                        <span className="ml-auto text-[10px] text-ink-400">{m.role}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>}

              <div>
                <label className="label">Labels (local)</label>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {labels.map((l) => (
                    <button
                      key={l}
                      type="button"
                      className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-900 ring-1 ring-brand-100"
                      onClick={() => {
                        const next = labels.filter((x) => x !== l);
                        setLabels(next);
                        saveLabels(task.id, next);
                      }}
                    >
                      {l} ×
                    </button>
                  ))}
                </div>
                <form
                  className="mt-2 flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const v = labelDraft.trim();
                    if (!v || labels.includes(v)) return;
                    const next = [...labels, v];
                    setLabels(next);
                    saveLabels(task.id, next);
                    setLabelDraft('');
                  }}
                >
                  <input
                    className="input flex-1 text-sm"
                    placeholder="Add label"
                    value={labelDraft}
                    onChange={(e) => setLabelDraft(e.target.value)}
                  />
                  <button type="submit" className="btn-secondary shrink-0 px-3 text-xs">
                    Add
                  </button>
                </form>
              </div>

              {canManage && <div>
                <label className="label">Watchers (local)</label>
                <ul className="mt-2 space-y-1 rounded-xl border border-ink-200 bg-ink-50/30 p-2">
                  {members.map((m) => (
                    <label key={m.userId} className="flex items-center gap-2 px-2 py-1 text-sm">
                      <input
                        type="checkbox"
                        checked={watchers.includes(m.userId)}
                        onChange={() => {
                          const next = watchers.includes(m.userId)
                            ? watchers.filter((id) => id !== m.userId)
                            : [...watchers, m.userId];
                          setWatchers(next);
                          saveWatchers(task.id, next);
                        }}
                      />
                      {m.displayName}
                    </label>
                  ))}
                </ul>
              </div>}

              <div>
                <label className="label">Subtasks ({subtasks.length})</label>
                <ul className="mt-2 space-y-2">
                  {subtasks.map((st) => (
                    <li
                      key={st.id}
                      className="flex items-center justify-between rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm"
                    >
                      <span className="truncate font-medium">{st.title}</span>
                      <TaskStatusMini status={st.status} />
                    </li>
                  ))}
                </ul>
                {canManage && <form
                  className="mt-3 flex gap-2"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const title = subTitle.trim();
                    if (!title) return;
                    await createTask({
                      title,
                      parentTaskId: task.id,
                      startDate: task.startDate,
                      endDate: task.endDate,
                      durationDays: task.durationDays,
                      status: 'not_started',
                      priority: task.priority,
                    });
                    setSubTitle('');
                  }}
                >
                  <input
                    className="input flex-1 text-sm"
                    placeholder="New subtask title"
                    value={subTitle}
                    onChange={(e) => setSubTitle(e.target.value)}
                  />
                  <button type="submit" className="btn-primary shrink-0 px-3 text-xs">
                    Add
                  </button>
                </form>}
              </div>

              <div className="rounded-xl border border-dashed border-ink-200 bg-ink-50/20 p-3 text-xs text-ink-600">
                <p className="font-semibold text-ink-800">Dependencies</p>
                <p className="mt-1 text-ink-500">
                  Link predecessors from the Tasks tab. Nearby matches for quick context:
                </p>
                <ul className="mt-2 space-y-1">
                  {depsPreview.slice(0, 4).map((t) => (
                    <li key={t.id} className="truncate font-mono text-[11px]">
                      {t.title}
                    </li>
                  ))}
                  {depsPreview.length === 0 && (
                    <li className="text-ink-400">No heuristic matches.</li>
                  )}
                </ul>
              </div>
            </div>
          )}

          {tab === 'comments' && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  className="input flex-1 text-sm"
                  placeholder="Your name"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                />
              </div>
              <form
                className="space-y-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  const body = commentDraft.trim();
                  if (!body) return;
                  appendTaskComment(task.id, body, authorName.trim() || 'Member');
                  setComments(loadTaskComments(task.id));
                  setCommentDraft('');
                }}
              >
                <textarea
                  className="input min-h-[72px] resize-y text-sm"
                  placeholder="Write an update…"
                  value={commentDraft}
                  onChange={(e) => setCommentDraft(e.target.value)}
                />
                <button type="submit" className="btn-primary text-sm">
                  Post comment
                </button>
              </form>
              <ul className="space-y-3">
                {comments.map((c) => (
                  <li key={c.id} className="rounded-xl border border-ink-100 bg-ink-50/40 p-3">
                    <div className="flex justify-between gap-2 text-[11px] text-ink-500">
                      <span className="font-semibold text-ink-800">{c.author}</span>
                      <span>{new Date(c.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-ink-800">{c.body}</p>
                    <button
                      type="button"
                      className="mt-2 text-[11px] font-semibold text-rose-600"
                      onClick={() => deleteComment(c.id)}
                    >
                      Remove
                    </button>
                  </li>
                ))}
                {comments.length === 0 && (
                  <li className="text-center text-sm text-ink-500">No comments yet.</li>
                )}
              </ul>
            </div>
          )}

          {tab === 'files' && (
            <ProjectFilesTab taskId={task.id} projectId={projectId} />
          )}
        </div>
      </aside>
    </>
  );
}

function ProjectFilesTab({ taskId, projectId }: { taskId: string; projectId: string }) {
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [docs, setDocs] = useState(() =>
    loadProjectDocs(projectId).filter((d) => !d.taskId || d.taskId === taskId),
  );

  useEffect(() => {
    setDocs(loadProjectDocs(projectId).filter((d) => !d.taskId || d.taskId === taskId));
  }, [projectId, taskId]);

  return (
    <div className="space-y-4">
      <p className="text-xs text-ink-500">
        Attachments are stored in this browser for demo workflows (no server upload yet).
      </p>
      <form
        className="space-y-2 rounded-xl border border-ink-200 bg-ink-50/30 p-3"
        onSubmit={(e) => {
          e.preventDefault();
          const n = name.trim();
          if (!n) return;
          appendProjectDoc(projectId, { name: n, note: note.trim() || undefined, taskId });
          setName('');
          setNote('');
          setDocs(loadProjectDocs(projectId).filter((d) => !d.taskId || d.taskId === taskId));
        }}
      >
        <input className="input text-sm" placeholder="File name (e.g. SOW-v2.pdf)" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="input text-sm" placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
        <button type="submit" className="btn-primary text-sm">
          Register attachment
        </button>
      </form>
      <ul className="space-y-2">
        {docs.map((d) => (
          <li key={d.id} className="flex items-start justify-between gap-3 rounded-xl border border-ink-100 bg-white px-3 py-2 text-sm">
            <div className="min-w-0">
              <p className="truncate font-semibold text-ink-900">{d.name}</p>
              {d.note && <p className="text-xs text-ink-500">{d.note}</p>}
              <p className="text-[11px] text-ink-400">{new Date(d.uploadedAt).toLocaleString()}</p>
            </div>
          </li>
        ))}
        {docs.length === 0 && <li className="text-sm text-ink-500">No files linked to this task.</li>}
      </ul>
    </div>
  );
}

function TaskStatusMini({ status }: { status: string }) {
  const cls =
    status === 'done'
      ? 'bg-emerald-50 text-emerald-800'
      : status === 'blocked'
        ? 'bg-amber-50 text-amber-900'
        : status === 'in_progress'
          ? 'bg-brand-50 text-brand-800'
          : 'bg-ink-100 text-ink-700';
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${cls}`}>{status}</span>;
}

function isoDate(iso: string) {
  try {
    return new Date(iso).toISOString().slice(0, 10);
  } catch {
    return '';
  }
}

function dayToIso(day: string) {
  const d = new Date(day + 'T12:00:00.000Z');
  return d.toISOString();
}
