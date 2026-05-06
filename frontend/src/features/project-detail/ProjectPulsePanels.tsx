import { Link } from 'react-router-dom';
import { appendProjectDoc, loadProjectDocs, saveProjectDocs, type ProjectDocRow } from '../../lib/projectDetailLocal';
import { useMemo, useState } from 'react';
import type { TaskItem } from '../tasks/hooks';

export function ProjectActivityTab({ tasks }: { tasks: TaskItem[] }) {
  const lines = useMemo(() => {
    const sorted = [...tasks].sort(
      (a, b) =>
        +new Date(b.updatedAt ?? b.endDate).getTime() -
        +new Date(a.updatedAt ?? a.endDate).getTime(),
    );
    return sorted.slice(0, 40).map((t) => ({
      id: t.id,
      text:
        t.status === 'done'
          ? `Task completed · ${t.title}`
          : t.status === 'blocked'
            ? `Risk raised · ${t.title}`
            : t.status === 'in_progress'
              ? `Progress logged · ${t.title}`
              : `Scheduled · ${t.title}`,
      at: t.updatedAt ?? t.startDate,
    }));
  }, [tasks]);

  return (
    <div className="card p-5">
      <h2 className="text-lg font-semibold text-ink-900">Activity feed</h2>
      <p className="text-xs text-ink-500">Synthetic pulse built from task updates.</p>
      <ul className="mt-4 divide-y divide-ink-100">
        {lines.map((l) => (
          <li key={l.id} className="flex flex-col gap-1 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
            <span className="text-ink-900">{l.text}</span>
            <span className="shrink-0 font-mono text-[11px] text-ink-400">
              {new Date(l.at).toLocaleString()}
            </span>
          </li>
        ))}
        {lines.length === 0 && (
          <li className="py-16 text-center text-sm text-ink-500">No activity yet.</li>
        )}
      </ul>
    </div>
  );
}

export function ProjectDocsTab({
  projectId,
  workspaceId,
}: {
  projectId: string;
  workspaceId: string;
}) {
  const [rows, setRows] = useState<ProjectDocRow[]>(() => loadProjectDocs(projectId));
  const [name, setName] = useState('');
  const [note, setNote] = useState('');

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="card space-y-3 p-5 lg:col-span-1">
        <h2 className="text-lg font-semibold text-ink-900">Knowledge base</h2>
        <p className="text-xs text-ink-500">
          Contracts, specs, meeting notes — stored locally until workspace drive ships.
        </p>
        <Link to={`/dashboard/workspaces/${workspaceId}/projects`} className="text-xs font-semibold text-brand-700">
          ← Back to projects library
        </Link>
        <form
          className="space-y-2 border-t border-ink-100 pt-4"
          onSubmit={(e) => {
            e.preventDefault();
            const n = name.trim();
            if (!n) return;
            appendProjectDoc(projectId, { name: n, note: note.trim() || undefined });
            setName('');
            setNote('');
            setRows(loadProjectDocs(projectId));
          }}
        >
          <label className="label">Document title</label>
          <input className="input text-sm" value={name} onChange={(e) => setName(e.target.value)} />
          <label className="label">Notes</label>
          <textarea className="input min-h-[72px] text-sm" value={note} onChange={(e) => setNote(e.target.value)} />
          <button type="submit" className="btn-primary w-full text-sm">
            Save reference
          </button>
        </form>
      </div>
      <div className="card p-5 lg:col-span-2">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-ink-900">Registered files</h3>
          <button
            type="button"
            className="text-xs font-semibold text-rose-700"
            onClick={() => {
              saveProjectDocs(projectId, []);
              setRows([]);
            }}
          >
            Clear local vault
          </button>
        </div>
        <table className="mt-4 w-full text-sm">
          <thead className="border-b border-ink-200 text-left text-[11px] font-semibold uppercase tracking-wide text-ink-500">
            <tr>
              <th className="pb-2">Name</th>
              <th className="pb-2">Linked task</th>
              <th className="pb-2">Uploaded</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="py-3 font-medium text-ink-900">{r.name}</td>
                <td className="py-3 font-mono text-xs text-ink-500">{r.taskId ?? '—'}</td>
                <td className="py-3 text-xs text-ink-500">{new Date(r.uploadedAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <p className="mt-8 text-center text-sm text-ink-500">No docs captured yet.</p>
        )}
      </div>
    </div>
  );
}

export function ProjectAiTab({
  tasks,
  projectName,
  blocked,
  overdue,
}: {
  tasks: TaskItem[];
  projectName: string;
  blocked: number;
  overdue: number;
}) {
  const bullets = useMemo(() => {
    const rank = { critical: 4, high: 3, medium: 2, low: 1 };
    const hottest = [...tasks]
      .filter((t) => t.status !== 'done')
      .sort((a, b) => {
        const pa = rank[a.priority as keyof typeof rank] ?? 0;
        const pb = rank[b.priority as keyof typeof rank] ?? 0;
        return pb - pa;
      })
      .slice(0, 5);

    return [
      `${projectName} currently carries ${tasks.length} tasks with ${blocked} blocked and ${overdue} overdue.`,
      hottest.length
        ? `Highest leverage unblockers: ${hottest.map((t) => t.title).join('; ')}.`
        : 'No open priorities detected.',
      overdue > 0 ? `Expect slip risk: reschedule overdue tasks or split scopes.` : 'Schedule hygiene looks stable.',
      `Suggested sprint focus: ${['Ship risky integrations', 'Close QA debt', 'Align stakeholders'][tasks.length % 3]}.`,
      `Auto-generated checklist: ${tasks
        .filter((t) => t.status === 'not_started')
        .slice(0, 3)
        .map((t) => `Prep "${t.title}"`)
        .join(' · ') || 'Create discovery tasks for upcoming milestones.'}`,
    ];
  }, [tasks, projectName, blocked, overdue]);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="card space-y-4 p-5 lg:col-span-2">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold text-ink-900">AI copilot (offline heuristics)</h2>
          <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-800 ring-1 ring-brand-100">
            Preview
          </span>
        </div>
        <p className="text-xs text-ink-500">
          Deterministic narrative built from live tasks — swap this panel for an LLM endpoint when ready.
        </p>
        <ul className="space-y-3 text-sm text-ink-800">
          {bullets.map((b, i) => (
            <li key={i} className="rounded-xl border border-ink-100 bg-ink-50/40 px-4 py-3 leading-relaxed">
              {b}
            </li>
          ))}
        </ul>
      </div>
      <div className="card space-y-3 p-5">
        <h3 className="text-base font-semibold text-ink-900">Suggested prompts</h3>
        <ul className="space-y-2 text-xs text-ink-600">
          <li>• Summarize blockers for executives.</li>
          <li>• Estimate delay if QA slips one week.</li>
          <li>• Generate subtasks for the next milestone.</li>
          <li>• Detect duplicate scopes across tasks.</li>
        </ul>
      </div>
    </div>
  );
}
