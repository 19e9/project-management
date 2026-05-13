import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMyDashboard } from '../features/dashboard/hooks';
import {
  useCreateWorkspace,
  useDeleteWorkspace,
  useUpdateWorkspace,
  useWorkspaces,
} from '../features/workspaces/hooks';
import type { TFunction } from '../i18n/I18nProvider';
import { useT } from '../i18n/I18nProvider';

export default function WorkspacesPage() {
  const t = useT();
  const { data: workspaces, isLoading } = useWorkspaces();
  const { data: dashboard } = useMyDashboard();
  const create = useCreateWorkspace();
  const [name, setName] = useState('');

  const list = workspaces ?? [];
  const isPlatformAdmin = dashboard?.myRole === 'platform_admin';
  const activeCount = list.filter((w: { status?: string }) => w.status === 'active').length;

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="eyebrow">{t('workspaces.eyebrow')}</span>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink-900 md:text-3xl">
            {t('workspaces.title')}
          </h1>
          <p className="mt-1 max-w-xl text-sm text-ink-500">{t('workspaces.intro')}</p>
        </div>
        <Link to="/dashboard" className="btn-secondary h-10 px-4 text-sm">
          {t('workspaces.backOverview')}
        </Link>
      </header>

      {!isLoading && (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatChip label={t('workspaces.statWorkspaces')} value={list.length} accent="brand" />
          <StatChip label={t('workspaces.statActive')} value={activeCount} accent="emerald" />
          <StatChip
            label={t('workspaces.statAccess')}
            value={
              list.length
                ? list.length === 1
                  ? t('workspacesUi.statAcrossOne')
                  : t('workspaces.statAcross', { n: list.length })
                : t('common.none')
            }
            accent="cyan"
            isText
          />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
        {isPlatformAdmin ? (
          <section className="card p-5 lg:col-span-5">
            <div className="border-b border-ink-100 pb-4">
              <h2 className="text-base font-semibold text-ink-900">{t('workspaces.createTitle')}</h2>
              <p className="mt-1 text-xs text-ink-500">{t('workspaces.createHelp')}</p>
            </div>
            <form
              className="mt-5 space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!name.trim()) return;
                await create.mutateAsync(name.trim());
                setName('');
              }}
            >
              <div>
                <label htmlFor="ws-name" className="label">
                  {t('workspaces.workspaceName')}
                </label>
                <input
                  id="ws-name"
                  className="input"
                  placeholder={t('workspaces.placeholderName')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="organization"
                />
              </div>
              <button
                type="submit"
                className="btn-brand w-full sm:w-auto"
                disabled={create.isPending || !name.trim()}
              >
                {create.isPending ? t('workspaces.creating') : t('workspaces.createSubmit')}
              </button>
            </form>
          </section>
        ) : (
          <section className="card p-5 lg:col-span-5">
            <div className="rounded-2xl border border-dashed border-ink-200 bg-ink-50/40 p-5">
              <h2 className="text-base font-semibold text-ink-900">{t('workspaces.waitingTitle')}</h2>
              <p className="mt-2 text-sm text-ink-500">{t('workspaces.waitingBody')}</p>
            </div>
          </section>
        )}
        <section className="card overflow-hidden lg:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-200 bg-ink-50/30 px-5 py-4">
            <div>
              <h2 className="text-base font-semibold text-ink-900">{t('workspacesUi.listHeading')}</h2>
              <p className="text-xs text-ink-500">{t('workspacesUi.listSub')}</p>
            </div>
          </div>

          {isLoading && (
            <ul className="divide-y divide-ink-100 p-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <li key={i} className="flex items-center gap-4 p-4">
                  <div className="skeleton h-12 w-12 shrink-0 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-4 w-40 rounded" />
                    <div className="skeleton h-3 w-56 rounded" />
                  </div>
                </li>
              ))}
            </ul>
          )}

          {!isLoading && list.length === 0 && (
            <div className="px-6 py-14 text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-2xl ring-1 ring-inset ring-brand-100">
                🏢
              </div>
              <h3 className="mt-4 font-semibold text-ink-900">{t('workspacesUi.emptyTitle')}</h3>
              <p className="mx-auto mt-1 max-w-sm text-sm text-ink-500">{t('workspacesUi.emptyBody')}</p>
            </div>
          )}

          {!isLoading && list.length > 0 && (
            <ul className="divide-y divide-ink-100">
              {list.map((w: any) => (
                <WorkspaceRow
                  key={w.id}
                  workspace={w}
                  canManage={isPlatformAdmin || w.role === 'owner'}
                />
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function membershipRoleLabel(t: TFunction, role: string): string {
  switch (role) {
    case 'owner':
      return t('roles.workspaceOwner');
    case 'admin':
      return t('roles.workspaceAdmin');
    case 'member':
      return t('roles.member');
    case 'viewer':
    case 'client':
      return t('roles.viewer');
    default:
      return role;
  }
}

function StatChip({
  label,
  value,
  accent,
  isText,
}: {
  label: string;
  value: string | number;
  accent: 'brand' | 'emerald' | 'cyan';
  isText?: boolean;
}) {
  const dot = {
    brand: 'bg-brand-500',
    emerald: 'bg-emerald-500',
    cyan: 'bg-cyan-500',
  }[accent];
  return (
    <div className="card flex items-center gap-3 p-4">
      <span className={`h-2 w-2 shrink-0 rounded-full ${dot}`} aria-hidden />
      <div className="min-w-0">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">{label}</div>
        <div
          className={`mt-0.5 font-semibold tracking-tight text-ink-900 ${isText ? 'text-sm' : 'text-2xl'}`}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

function WorkspaceRow({ workspace: w, canManage }: { workspace: any; canManage: boolean }) {
  const t = useT();
  const update = useUpdateWorkspace(w.id);
  const remove = useDeleteWorkspace(w.id);
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(w.name ?? '');
  const planStyles: Record<string, string> = {
    free: 'bg-ink-100 text-ink-700 ring-ink-200/80',
    pro: 'bg-brand-50 text-brand-800 ring-brand-100',
    enterprise: 'bg-amber-50 text-amber-900 ring-amber-100',
  };
  const roleStyles: Record<string, string> = {
    owner: 'bg-amber-50 text-amber-800 ring-amber-100',
    admin: 'bg-indigo-50 text-indigo-800 ring-indigo-100',
    member: 'bg-cyan-50 text-cyan-800 ring-cyan-100',
    viewer: 'bg-ink-50 text-ink-600 ring-ink-200',
    client: 'bg-ink-50 text-ink-600 ring-ink-200',
  };
  const plan = String(w.plan ?? 'free');
  const role = String(w.role ?? 'member');
  const initial = (w.name || '?').slice(0, 2).toUpperCase();

  return (
    <li className="card-hover transition-colors hover:bg-ink-50/40">
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-gradient text-sm font-bold text-white shadow-soft">
            {initial}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="truncate font-semibold text-ink-900">{w.name}</span>
              <span className={`badge ring-1 ring-inset ${planStyles[plan] ?? planStyles.free}`}>
                {plan}
              </span>
              <span className={`badge ring-1 ring-inset ${roleStyles[role] ?? roleStyles.member}`}>
                {membershipRoleLabel(t, role)}
              </span>
            </div>
            <p className="mt-1 text-xs text-ink-500">{t('workspacesUi.rowHint')}</p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2 sm:self-center">
          {canManage && editing ? (
            <form
              className="flex flex-wrap gap-2"
              onSubmit={async (e) => {
                e.preventDefault();
                const name = draftName.trim();
                if (!name) return;
                await update.mutateAsync({ name });
                setEditing(false);
              }}
            >
              <input
                className="input h-10 w-44 text-sm"
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
              />
              <button type="submit" className="btn-secondary px-3 text-xs" disabled={update.isPending}>
                {t('common.save')}
              </button>
              <button type="button" className="btn-secondary px-3 text-xs" onClick={() => setEditing(false)}>
                {t('common.cancel')}
              </button>
            </form>
          ) : (
            <>
              {canManage && (
                <button
                  type="button"
                  className="btn-secondary px-3 py-2 text-xs"
                  onClick={() => {
                    setDraftName(w.name ?? '');
                    setEditing(true);
                  }}
                >
                  {t('common.edit')}
                </button>
              )}
              {canManage && (
                <button
                  type="button"
                  className="btn-secondary px-3 py-2 text-xs text-rose-700"
                  disabled={remove.isPending}
                  onClick={() => {
                    if (window.confirm(t('workspacesUi.confirmDelete', { name: w.name ?? '' }))) remove.mutate();
                  }}
                >
                  {t('common.delete')}
                </button>
              )}
              <Link
                to={`/dashboard/workspaces/${w.id}/projects`}
                className="btn-brand px-5 py-2.5 text-sm"
              >
                {t('workspacesUi.projectsArrow')}
              </Link>
            </>
          )}
        </div>
      </div>
    </li>
  );
}
