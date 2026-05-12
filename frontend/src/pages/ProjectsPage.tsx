import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMyDashboard } from '../features/dashboard/hooks';
import {
  useCreateProject,
  useDeleteProject,
  useProjects,
  useUpdateProject,
} from '../features/projects/hooks';
import { useWorkspace } from '../features/workspaces/hooks';

export default function ProjectsPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { data: workspace, isLoading: wsLoading } = useWorkspace(workspaceId);
  const { data: projects, isLoading: projLoading } = useProjects(workspaceId);
  const { data: dashboard } = useMyDashboard();
  const create = useCreateProject(workspaceId!);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);

  const list = projects ?? [];
  const loading = wsLoading || projLoading;
  const workspaceRole = dashboard?.workspaces.find((w) => w.id === workspaceId)?.role;
  const canManageProjects = dashboard?.myRole === 'platform_admin' || workspaceRole === 'owner';
  const maxProjects = workspace?.entitlements?.maxProjects ?? null;
  const atProjectLimit = canManageProjects && maxProjects !== null && list.length >= maxProjects;
  const emptyTitle = canManageProjects ? 'No projects yet' : 'No visible projects yet';
  const emptyDescription = canManageProjects
    ? 'Add your first project with the form on the left, then shape the WBS and schedule.'
    : workspaceRole === 'client'
      ? 'Your workspace owner has not shared any active projects in this workspace yet.'
      : 'You have not been assigned to any active project tasks in this workspace yet.';

  return (
    <div className="space-y-8">
      <Breadcrumb
        items={[
          { to: '/dashboard', label: 'Overview' },
          { to: '/dashboard/workspaces', label: 'Workspaces' },
          { label: workspace?.name ?? 'Projects' },
        ]}
      />

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <span className="eyebrow">Project portfolio</span>
          <h1 className="mt-2 truncate text-2xl font-bold tracking-tight text-ink-900 md:text-3xl">
            {workspace?.name ?? 'Projects'}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-ink-500">
            All projects in this workspace. Each one has its own WBS, Gantt, and (when your plan
            allows) critical-path analysis.
          </p>
          {!wsLoading && workspace && (
            <div className="mt-4 flex flex-wrap gap-2">
              <MetaPill label="Plan" value={String(workspace.plan ?? '—').toUpperCase()} tone="brand" />
              <MetaPill
                label="CPM"
                value={workspace.entitlements?.cpmEnabled ? 'On' : 'Locked'}
                tone={workspace.entitlements?.cpmEnabled ? 'ok' : 'muted'}
              />
              <MetaPill
                label="Gantt"
                value={workspace.entitlements?.ganttEnabled !== false ? 'On' : 'Off'}
                tone="muted"
              />
              <MetaPill
                label="Projects"
                value={`${list.length}/${workspace.entitlements?.maxProjects ?? '∞'}`}
                tone={atProjectLimit ? 'warn' : 'muted'}
              />
            </div>
          )}
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
        {canManageProjects && <section className="card p-5 lg:col-span-5">
          <div className="border-b border-ink-100 pb-4">
            <h2 className="text-base font-semibold text-ink-900">New project</h2>
            <p className="mt-1 text-xs text-ink-500">
              {atProjectLimit
                ? 'This workspace has reached its active project limit for the current plan.'
                : 'Title is required; a short description helps your team.'}
            </p>
          </div>
          <form
            className="mt-5 space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              setCreateError(null);
              if (!name.trim()) return;
              try {
                await create.mutateAsync({
                  name: name.trim(),
                  ...(description.trim() ? { description: description.trim() } : {}),
                });
                setName('');
                setDescription('');
              } catch (err: any) {
                setCreateError(
                  err?.response?.data?.message ??
                    err?.response?.data?.code ??
                    err?.message ??
                    'Could not create project.',
                );
              }
            }}
          >
            <div>
              <label htmlFor="proj-name" className="label">
                Project name
              </label>
              <input
                id="proj-name"
                className="input"
                placeholder="e.g. Plot 14 build-out"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="proj-desc" className="label">
                Description <span className="font-normal text-ink-400">(optional)</span>
              </label>
              <textarea
                id="proj-desc"
                className="input min-h-[88px] resize-y py-3"
                placeholder="Scope, target dates, or client context…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="btn-brand w-full sm:w-auto"
              disabled={create.isPending || !name.trim() || atProjectLimit}
            >
              {create.isPending ? 'Creating…' : 'Create project'}
            </button>
            {createError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
                {createError}
              </div>
            )}
            {atProjectLimit && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
                Active projects: {list.length}/{maxProjects}. Archive an active project or move this workspace to a higher plan to add more.
              </div>
            )}
          </form>
        </section>}

        <section className={`overflow-hidden ${canManageProjects ? 'lg:col-span-7' : 'lg:col-span-12'}`}>
          <div className="mb-3 flex items-center justify-between px-1">
            <h2 className="text-base font-semibold text-ink-900">All projects</h2>
            {!loading && (
              <span className="text-xs font-medium text-ink-500">{list.length} total</span>
            )}
          </div>

          {loading && (
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="card p-5">
                  <div className="skeleton mb-3 h-5 w-2/3 rounded" />
                  <div className="skeleton h-3 w-full rounded" />
                  <div className="skeleton mt-4 h-10 w-full rounded-xl" />
                </div>
              ))}
            </div>
          )}

          {!loading && list.length === 0 && (
            <div className="card px-6 py-14 text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-ink-50 text-2xl ring-1 ring-inset ring-ink-100">
                📁
              </div>
              <h3 className="mt-4 font-semibold text-ink-900">{emptyTitle}</h3>
              <p className="mx-auto mt-1 max-w-sm text-sm text-ink-500">
                {emptyDescription}
              </p>
            </div>
          )}

          {!loading && list.length > 0 && (
            <ul className="grid gap-4 sm:grid-cols-2">
              {list.map((p: any) => (
                <li key={p.id}>
                  <ProjectCard project={p} workspaceId={workspaceId!} canManage={!!canManageProjects} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function Breadcrumb({
  items,
}: {
  items: Array<{ to?: string; label: string }>;
}) {
  return (
    <nav className="flex flex-wrap items-center gap-1.5 text-xs text-ink-500" aria-label="Breadcrumb">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-ink-300">/</span>}
          {item.to ? (
            <Link to={item.to} className="font-medium text-ink-600 transition hover:text-brand-700">
              {item.label}
            </Link>
          ) : (
            <span className="font-semibold text-ink-800">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

function MetaPill({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'brand' | 'ok' | 'muted' | 'warn';
}) {
  const ring =
    tone === 'brand'
      ? 'bg-brand-50 text-brand-900 ring-brand-100'
      : tone === 'ok'
        ? 'bg-emerald-50 text-emerald-900 ring-emerald-100'
        : tone === 'warn'
          ? 'bg-amber-50 text-amber-900 ring-amber-200'
        : 'bg-ink-50 text-ink-700 ring-ink-200';
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold ring-1 ring-inset ${ring}`}>
      <span className="text-ink-500">{label}</span>
      <span className="tabular-nums">{value}</span>
    </span>
  );
}

function ProjectCard({
  project: p,
  workspaceId,
  canManage,
}: {
  project: any;
  workspaceId: string;
  canManage: boolean;
}) {
  const update = useUpdateProject(workspaceId, p.id);
  const remove = useDeleteProject(workspaceId);
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(p.name ?? '');
  const [draftDescription, setDraftDescription] = useState(p.description ?? '');
  const status = String(p.status ?? 'active');
  const isArchived = status === 'archived';
  return (
    <div
      className={`card card-hover flex h-full flex-col p-5 ${isArchived ? 'opacity-80' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {editing ? (
            <input
              className="input h-10 text-sm"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
            />
          ) : (
            <h3 className="font-semibold leading-snug text-ink-900 line-clamp-2">{p.name}</h3>
          )}
          {p.code && (
            <span className="mt-1 inline-block rounded-md bg-ink-100 px-2 py-0.5 font-mono text-[11px] font-medium text-ink-600">
              {p.code}
            </span>
          )}
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset ${
            isArchived
              ? 'bg-ink-100 text-ink-600 ring-ink-200'
              : 'bg-emerald-50 text-emerald-800 ring-emerald-100'
          }`}
        >
          {isArchived ? 'Archived' : 'Active'}
        </span>
      </div>
      {editing && (
        <textarea
          className="input mt-3 min-h-[84px] resize-y text-sm"
          placeholder="Project description"
          value={draftDescription}
          onChange={(e) => setDraftDescription(e.target.value)}
        />
      )}
      {!editing && p.description && (
        <p className="mt-3 line-clamp-3 flex-1 text-sm leading-relaxed text-ink-600">{p.description}</p>
      )}
      {!editing && !p.description && <div className="mt-3 flex-1 text-xs italic text-ink-400">No description</div>}
      <div className="mt-5 flex flex-wrap gap-2">
        {editing ? (
          <>
            <button
              type="button"
              className="btn-secondary flex-1 justify-center text-sm"
              disabled={update.isPending}
              onClick={async () => {
                const name = draftName.trim();
                if (!name) return;
                await update.mutateAsync({ name, description: draftDescription.trim() });
                setEditing(false);
              }}
            >
              Save
            </button>
            <button type="button" className="btn-secondary flex-1 justify-center text-sm" onClick={() => setEditing(false)}>
              Cancel
            </button>
          </>
        ) : (
          <>
            {canManage && (
              <button
                type="button"
                className="btn-secondary px-3 text-sm"
                onClick={() => {
                  setDraftName(p.name ?? '');
                  setDraftDescription(p.description ?? '');
                  setEditing(true);
                }}
              >
                Edit
              </button>
            )}
            {canManage && (
              <button
                type="button"
                className="btn-secondary px-3 text-sm text-rose-700"
                disabled={remove.isPending}
                onClick={() => {
                  if (window.confirm(`Delete project "${p.name}"?`)) remove.mutate(p.id);
                }}
              >
                Delete
              </button>
            )}
            <Link
              to={`/dashboard/workspaces/${workspaceId}/projects/${p.id}`}
              className="btn-secondary flex-1 justify-center text-sm"
            >
              Open project →
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
