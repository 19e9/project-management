import { useState } from 'react';
import type { AdminUserRow } from '../../features/admin/hooks';

interface Props {
  rows: AdminUserRow[];
  loading?: boolean;
  onSearchChange?: (q: string) => void;
}

type SortKey = 'displayName' | 'email' | 'platformRole' | 'workspaceMemberships' | 'createdAt' | 'isActive';

export function UsersTable({ rows, loading, onSearchChange }: Props) {
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({
    key: 'createdAt',
    dir: 'desc',
  });
  const [roleFilter, setRoleFilter] = useState<'all' | 'platform_admin' | 'user'>('all');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const filtered = rows.filter((r) => {
    if (roleFilter !== 'all' && r.platformRole !== roleFilter) return false;
    if (activeFilter === 'active' && !r.isActive) return false;
    if (activeFilter === 'inactive' && r.isActive) return false;
    return true;
  });

  function sortValue(row: AdminUserRow, key: SortKey): string | number | boolean {
    switch (key) {
      case 'displayName':
        return row.displayName.toLowerCase();
      case 'email':
        return row.email.toLowerCase();
      case 'platformRole':
        return row.platformRole;
      case 'workspaceMemberships':
        return row.workspaceMemberships;
      case 'createdAt':
        return row.createdAt;
      case 'isActive':
        return row.isActive;
      default:
        return '';
    }
  }

  const sorted = [...filtered].sort((a, b) => {
    const av = sortValue(a, sort.key);
    const bv = sortValue(b, sort.key);
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
          <svg
            viewBox="0 0 12 12"
            className={`h-2.5 w-2.5 transition ${
              active && sort.dir === 'asc' ? 'rotate-180' : ''
            } ${active ? 'text-ink-700' : 'text-ink-400'}`}
          >
            <path
              d="M3 5l3 3 3-3"
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </th>
    );
  }

  const adminCount = rows.filter((r) => r.platformRole === 'platform_admin').length;
  const activeCount = rows.filter((r) => r.isActive).length;

  return (
    <section className="card overflow-hidden">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-200 px-5 py-4">
        <div>
          <h3 className="text-base font-semibold text-ink-900">Directory</h3>
          <p className="text-xs text-ink-500">
            Showing {filtered.length} of {rows.length} loaded
            {filtered.length < rows.length ? ' · adjust filters to see more from this page.' : ''}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <FilterPill
            active={roleFilter === 'all'}
            onClick={() => setRoleFilter('all')}
            count={rows.length}
          >
            All roles
          </FilterPill>
          <FilterPill
            active={roleFilter === 'platform_admin'}
            onClick={() => setRoleFilter('platform_admin')}
            count={adminCount}
          >
            Admin
          </FilterPill>
          <FilterPill
            active={roleFilter === 'user'}
            onClick={() => setRoleFilter('user')}
            count={rows.length - adminCount}
          >
            User
          </FilterPill>
          <span className="hidden h-6 w-px bg-ink-200 sm:block" aria-hidden />
          <FilterPill
            active={activeFilter === 'all'}
            onClick={() => setActiveFilter('all')}
            count={rows.length}
          >
            Any status
          </FilterPill>
          <FilterPill
            active={activeFilter === 'active'}
            onClick={() => setActiveFilter('active')}
            count={activeCount}
          >
            Active
          </FilterPill>
          <FilterPill
            active={activeFilter === 'inactive'}
            onClick={() => setActiveFilter('inactive')}
            count={rows.length - activeCount}
          >
            Inactive
          </FilterPill>
          <input
            placeholder="Search name or email…"
            className="input ml-1 hidden h-9 min-w-[11rem] sm:block"
            onChange={(e) => onSearchChange?.(e.target.value)}
          />
        </div>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-ink-50/40">
            <tr className="text-left">
              {header('User', 'displayName')}
              {header('Email', 'email')}
              {header('Platform role', 'platformRole')}
              {header('Workspaces', 'workspaceMemberships')}
              {header('Auth')}
              {header('Joined', 'createdAt')}
              {header('Status', 'isActive')}
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-200">
            {loading &&
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={7} className="px-5 py-3">
                    <div className="skeleton h-6 w-full" />
                  </td>
                </tr>
              ))}
            {!loading && sorted.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-sm text-ink-500">
                  No users match the current filters or search.
                </td>
              </tr>
            )}
            {!loading &&
              sorted.map((u) => (
                <tr key={u.id} className="transition hover:bg-ink-50/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {u.avatarUrl ? (
                        <img
                          src={u.avatarUrl}
                          alt=""
                          className="h-8 w-8 flex-none rounded-lg object-cover"
                        />
                      ) : (
                        <span
                          className="grid h-8 w-8 flex-none place-items-center rounded-lg bg-brand-gradient text-[11px] font-semibold text-white"
                          aria-hidden
                        >
                          {u.displayName
                            .split(' ')
                            .map((s) => s[0])
                            .slice(0, 2)
                            .join('')
                            .toUpperCase()}
                        </span>
                      )}
                      <div className="min-w-0">
                        <div className="truncate font-medium text-ink-900">{u.displayName}</div>
                        <div className="font-mono text-[11px] text-ink-400">{u.id.slice(-8)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="max-w-[220px] truncate px-4 py-3 text-ink-700">{u.email}</td>
                  <td className="px-4 py-3">
                    {u.platformRole === 'platform_admin' ? (
                      <span className="badge bg-violet-50 text-violet-800 ring-1 ring-inset ring-violet-100">
                        Platform admin
                      </span>
                    ) : (
                      <span className="badge bg-ink-100 text-ink-700 ring-1 ring-inset ring-ink-200">
                        User
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-ink-700">{u.workspaceMemberships}</td>
                  <td className="px-4 py-3">
                    <AuthChips providers={u.authProviders} />
                  </td>
                  <td className="px-4 py-3 text-ink-600">
                    {new Date(u.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                  <td className="px-4 py-3">
                    {u.isActive ? (
                      <span className="badge bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-100">
                        Active
                      </span>
                    ) : (
                      <span className="badge bg-ink-100 text-ink-600 ring-1 ring-inset ring-ink-200">
                        Inactive
                      </span>
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

function AuthChips({ providers }: { providers: string[] }) {
  const set = new Set(providers.map((p) => p.toLowerCase()));
  return (
    <div className="flex flex-wrap gap-1">
      {set.has('google') && (
        <span className="rounded-md bg-ink-100 px-1.5 py-0.5 text-[10px] font-medium text-ink-700">
          Google
        </span>
      )}
      {set.has('local') && (
        <span className="rounded-md bg-ink-100 px-1.5 py-0.5 text-[10px] font-medium text-ink-700">
          Email
        </span>
      )}
      {!set.has('google') && !set.has('local') && providers.length > 0 && (
        <span className="text-[11px] text-ink-500">{providers.join(', ')}</span>
      )}
    </div>
  );
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
