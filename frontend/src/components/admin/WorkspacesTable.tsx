import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { AdminWorkspaceRow } from '../../features/admin/hooks';
import type { TFunction } from '../../i18n/I18nProvider';
import { useI18n, useT } from '../../i18n/I18nProvider';

interface Props {
  rows: AdminWorkspaceRow[];
  loading?: boolean;
  onSearchChange?: (q: string) => void;
}

type SortKey = 'name' | 'memberCount' | 'projectCount' | 'taskCount' | 'lastActivityAt';

export function WorkspacesTable({ rows, loading, onSearchChange }: Props) {
  const t = useT();
  const { locale } = useI18n();
  const dateLocale = locale === 'tr' ? 'tr-TR' : 'en-US';
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({
    key: 'lastActivityAt',
    dir: 'desc',
  });
  const [filter, setFilter] = useState<'all' | 'free' | 'pro' | 'enterprise'>('all');

  const filtered = rows.filter((r) => filter === 'all' || r.plan === filter);
  const sorted = [...filtered].sort((a, b) => {
    const av = (a as any)[sort.key];
    const bv = (b as any)[sort.key];
    if (av == null) return 1;
    if (bv == null) return -1;
    const cmp = av < bv ? -1 : av > bv ? 1 : 0;
    return sort.dir === 'asc' ? cmp : -cmp;
  });

  function header(label: string, key?: SortKey) {
    if (!key)
      return (
        <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-ink-500">
          {label}
        </th>
      );
    const active = sort.key === key;
    return (
      <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-ink-500">
        <button
          type="button"
          onClick={() =>
            setSort((s) =>
              s.key === key
                ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' }
                : { key, dir: 'desc' },
            )
          }
          className={`inline-flex items-center gap-1 transition ${
            active ? 'text-ink-900' : 'hover:text-ink-700'
          }`}
        >
          {label}
          <svg viewBox="0 0 12 12" className={`h-2.5 w-2.5 transition ${
            active && sort.dir === 'asc' ? 'rotate-180' : ''
          } ${active ? 'text-ink-700' : 'text-ink-400'}`}>
            <path d="M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          </svg>
        </button>
      </th>
    );
  }

  return (
    <section className="card overflow-hidden">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-200 px-5 py-4">
        <div>
          <h3 className="text-base font-semibold text-ink-900">{t('adminView.wsTableTitle')}</h3>
          <p className="text-xs text-ink-500">
            {t('adminView.wsTableSub', { shown: filtered.length, total: rows.length })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <FilterPill active={filter === 'all'} onClick={() => setFilter('all')} count={rows.length}>
            {t('adminView.wsFilterAll')}
          </FilterPill>
          <FilterPill
            active={filter === 'free'}
            onClick={() => setFilter('free')}
            count={rows.filter((r) => r.plan === 'free').length}
          >
            {t('adminView.sliceFree')}
          </FilterPill>
          <FilterPill
            active={filter === 'pro'}
            onClick={() => setFilter('pro')}
            count={rows.filter((r) => r.plan === 'pro').length}
          >
            {t('adminView.slicePro')}
          </FilterPill>
          <FilterPill
            active={filter === 'enterprise'}
            onClick={() => setFilter('enterprise')}
            count={rows.filter((r) => r.plan === 'enterprise').length}
          >
            {t('adminView.sliceEnterprise')}
          </FilterPill>
          <input
            placeholder={t('adminView.wsSearchPlaceholder')}
            className="input ml-2 hidden h-9 w-44 sm:block"
            onChange={(e) => onSearchChange?.(e.target.value)}
          />
        </div>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-ink-50/40">
            <tr className="text-left">
              {header(t('adminView.wsColWorkspace'), 'name')}
              {header(t('adminView.wsColOwner'))}
              {header(t('adminView.wsColPlan'))}
              {header(t('adminView.wsColMembers'), 'memberCount')}
              {header(t('adminView.wsColProjects'), 'projectCount')}
              {header(t('adminView.wsColTasks'), 'taskCount')}
              {header(t('adminView.wsColLastActivity'), 'lastActivityAt')}
              {header('')}
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-200">
            {loading &&
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={8} className="px-5 py-3">
                    <div className="skeleton h-6 w-full" />
                  </td>
                </tr>
              ))}
            {!loading && sorted.length === 0 && (
              <tr>
                <td colSpan={8} className="px-5 py-12 text-center text-sm text-ink-500">
                  {t('adminView.wsNoMatch')}
                </td>
              </tr>
            )}
            {!loading &&
              sorted.map((w) => (
                <tr key={w.id} className="transition hover:bg-ink-50/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span
                        className="grid h-8 w-8 flex-none place-items-center rounded-lg bg-brand-gradient text-[11px] font-semibold text-white"
                        aria-hidden
                      >
                        {w.name
                          .split(' ')
                          .map((s) => s[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <div className="truncate font-medium text-ink-900">{w.name}</div>
                        <div className="text-[11px] text-ink-500">
                          {t('adminView.wsCreated', {
                            date: new Date(w.createdAt).toLocaleDateString(dateLocale),
                          })}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {w.owner ? (
                      <div>
                        <div className="text-ink-800">{w.owner.displayName}</div>
                        <div className="text-[11px] text-ink-500">{w.owner.email}</div>
                      </div>
                    ) : (
                      <span className="text-ink-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <PlanChip plan={w.plan} t={t} />
                  </td>
                  <td className="px-4 py-3 tabular-nums text-ink-700">{w.memberCount}</td>
                  <td className="px-4 py-3 tabular-nums text-ink-700">{w.projectCount}</td>
                  <td className="px-4 py-3 tabular-nums text-ink-700">{w.taskCount}</td>
                  <td className="px-4 py-3">
                    <ActivityChip iso={w.lastActivityAt} t={t} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    {w.status === 'suspended' ? (
                      <span className="badge bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-100">
                        {t('adminView.wsSuspended')}
                      </span>
                    ) : (
                      <Link
                        to={`/dashboard/workspaces/${w.id}/projects`}
                        className="text-xs font-medium text-brand-700 hover:underline"
                      >
                        {t('adminView.wsOpen')}
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function PlanChip({
  plan,
  t,
}: {
  plan: 'free' | 'pro' | 'enterprise';
  t: TFunction;
}) {
  const map = {
    free: 'bg-ink-100 text-ink-700 ring-ink-200',
    pro: 'bg-brand-50 text-brand-700 ring-brand-100',
    enterprise: 'bg-amber-50 text-amber-700 ring-amber-100',
  } as const;
  const label =
    plan === 'free' ? t('adminView.sliceFree') : plan === 'pro' ? t('adminView.slicePro') : t('adminView.sliceEnterprise');
  return (
    <span className={`badge ring-1 ring-inset ${map[plan]}`}>
      {plan === 'pro' && (
        <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor">
          <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />
        </svg>
      )}
      {label}
    </span>
  );
}

function ActivityChip({
  iso,
  t,
}: {
  iso: string | null;
  t: TFunction;
}) {
  if (!iso) return <span className="text-ink-400">{t('adminView.activityChipNoActivity')}</span>;
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const recent = days <= 1;
  const stale = days > 14;
  const cls = recent
    ? 'bg-emerald-50 text-emerald-700 ring-emerald-100'
    : stale
      ? 'bg-rose-50 text-rose-700 ring-rose-100'
      : 'bg-ink-100 text-ink-700 ring-ink-200';
  const label =
    days <= 0
      ? t('adminView.timeToday')
      : days === 1
        ? t('adminView.timeYesterday')
        : t('adminView.timeDaysAgo', { n: days });
  return <span className={`badge ring-1 ring-inset ${cls}`}>{label}</span>;
}

function FilterPill({
  active,
  onClick,
  children,
  count,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition ${
        active
          ? 'bg-ink-900 text-white shadow-soft'
          : 'border border-ink-200 bg-white text-ink-700 hover:bg-ink-50'
      }`}
    >
      {children}
      <span className={`text-[10px] ${active ? 'text-white/70' : 'text-ink-400'}`}>{count}</span>
    </button>
  );
}
