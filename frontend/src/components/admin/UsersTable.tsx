import { AxiosError } from 'axios';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { AdminUserRow } from '../../features/admin/hooks';
import {
  useAdminResetPassword,
  useAdminRevokeSessions,
  usePatchAdminUser,
  useSoftDeleteAdminUser,
} from '../../features/admin/hooks';
import { useAuth } from '../../features/auth/AuthProvider';
import { Button } from '../ui/Button';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { Dropdown, DropdownItem, DropdownSeparator } from '../ui/Dropdown';
import { Modal } from '../ui/Modal';

interface Props {
  rows: AdminUserRow[];
  loading?: boolean;
  onSearchChange?: (q: string) => void;
  /** Owned workspace renewal hints keyed by platform user id (billing projection). */
  ownerBillingByUserId?: Record<string, { workspaceCount: number; renewalHint: string }>;
}

type SortKey =
  | 'displayName'
  | 'email'
  | 'platformRole'
  | 'workspaceMemberships'
  | 'createdAt'
  | 'lastLoginAt'
  | 'subscriptionTier'
  | 'isActive';

const COL_COUNT = 13;

function extractApiMessage(err: unknown): string {
  if (err instanceof AxiosError) {
    const d = err.response?.data as { message?: string | string[] } | undefined;
    if (typeof d?.message === 'string') return d.message;
    if (Array.isArray(d?.message)) return d.message.join(', ');
  }
  if (err instanceof Error) return err.message;
  return 'Something went wrong.';
}

function formatAccountAge(createdAtIso: string): string {
  const created = new Date(createdAtIso).getTime();
  const days = Math.floor((Date.now() - created) / (24 * 60 * 60 * 1000));
  if (days <= 0) return 'New';
  if (days < 30) return `${days} day${days === 1 ? '' : 's'}`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} mo`;
  const years = Math.floor(months / 12);
  return `${years} yr`;
}

function formatLastLogin(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function UsersTable({ rows, loading, onSearchChange, ownerBillingByUserId }: Props) {
  const { user: authUser } = useAuth();
  const selfId = authUser?.id;

  const patchUser = usePatchAdminUser();
  const softDelete = useSoftDeleteAdminUser();
  const resetPw = useAdminResetPassword();
  const revokeSessions = useAdminRevokeSessions();

  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({
    key: 'createdAt',
    dir: 'desc',
  });
  const [roleFilter, setRoleFilter] = useState<'all' | 'platform_admin' | 'user'>('all');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const [editUser, setEditUser] = useState<AdminUserRow | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [resetUser, setResetUser] = useState<AdminUserRow | null>(null);
  const [resetPw1, setResetPw1] = useState('');
  const [resetPw2, setResetPw2] = useState('');
  const [deleteUser, setDeleteUser] = useState<AdminUserRow | null>(null);
  const [logoutUser, setLogoutUser] = useState<AdminUserRow | null>(null);

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
      case 'lastLoginAt':
        return row.lastLoginAt ?? '';
      case 'subscriptionTier':
        return row.subscriptionTier;
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
              s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' },
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

  const rowBusy =
    patchUser.isPending || softDelete.isPending || resetPw.isPending || revokeSessions.isPending;

  async function submitEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editUser) return;
    try {
      await patchUser.mutateAsync({
        userId: editUser.id,
        body: { displayName: editName.trim(), email: editEmail.trim().toLowerCase() },
      });
      setEditUser(null);
    } catch (err) {
      alert(extractApiMessage(err));
    }
  }

  async function submitResetPw(e: React.FormEvent) {
    e.preventDefault();
    if (!resetUser) return;
    if (resetPw1.length < 8) {
      alert('Password must be at least 8 characters.');
      return;
    }
    if (resetPw1 !== resetPw2) {
      alert('Passwords do not match.');
      return;
    }
    try {
      await resetPw.mutateAsync({ userId: resetUser.id, newPassword: resetPw1 });
      setResetUser(null);
      setResetPw1('');
      setResetPw2('');
    } catch (err) {
      alert(extractApiMessage(err));
    }
  }

  return (
    <>
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
                {header('Last login', 'lastLoginAt')}
                {header('Account age')}
                {header('Plan', 'subscriptionTier')}
                <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                  Renewal
                </th>
                <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                  Billing
                </th>
                {header('Status', 'isActive')}
                {header('Actions')}
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-200">
              {loading &&
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={COL_COUNT} className="px-5 py-3">
                      <div className="skeleton h-6 w-full" />
                    </td>
                  </tr>
                ))}
              {!loading && sorted.length === 0 && (
                <tr>
                  <td colSpan={COL_COUNT} className="px-5 py-12 text-center text-sm text-ink-500">
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
                    <td className="whitespace-nowrap px-4 py-3">
                      <select
                        aria-label={`Platform role for ${u.displayName}`}
                        className="max-w-[11rem] rounded-lg border border-ink-200 bg-white px-2 py-1 text-xs font-medium text-ink-800 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:opacity-50"
                        value={u.platformRole}
                        disabled={
                          rowBusy || (selfId === u.id && u.platformRole === 'platform_admin')
                        }
                        onChange={async (e) => {
                          const platformRole = e.target.value as 'platform_admin' | 'user';
                          try {
                            await patchUser.mutateAsync({
                              userId: u.id,
                              body: { platformRole },
                            });
                          } catch (err) {
                            alert(extractApiMessage(err));
                          }
                        }}
                      >
                        <option value="user">User</option>
                        <option value="platform_admin">Platform admin</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-ink-700">{u.workspaceMemberships}</td>
                    <td className="px-4 py-3">
                      <AuthChips providers={u.authProviders} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-ink-600">
                      {new Date(u.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-ink-600">
                      {formatLastLogin(u.lastLoginAt)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-ink-600">
                      {formatAccountAge(u.createdAt)}
                    </td>
                    <td className="max-w-[140px] px-4 py-3">
                      <PlanCell tier={u.subscriptionTier} label={u.subscriptionLabel} />
                    </td>
                    <td className="max-w-[160px] px-4 py-3">
                      {ownerBillingByUserId?.[u.id] ? (
                        <>
                          <div className="text-xs text-ink-800">
                            {ownerBillingByUserId[u.id].renewalHint}
                          </div>
                          <div className="text-[11px] text-ink-500">
                            {ownerBillingByUserId[u.id].workspaceCount} owned workspace
                            {ownerBillingByUserId[u.id].workspaceCount === 1 ? '' : 's'}
                          </div>
                        </>
                      ) : (
                        <span className="text-ink-400">—</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <Link
                        to={`/dashboard/users/${u.id}/billing`}
                        className="text-xs font-semibold text-brand-700 hover:underline"
                      >
                        Manage subscription
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={u.isActive}
                        disabled={rowBusy || selfId === u.id}
                        title={
                          selfId === u.id ? 'You cannot deactivate your own account here.' : undefined
                        }
                        onClick={async () => {
                          try {
                            await patchUser.mutateAsync({
                              userId: u.id,
                              body: { isActive: !u.isActive },
                            });
                          } catch (err) {
                            alert(extractApiMessage(err));
                          }
                        }}
                        className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border transition ${
                          u.isActive
                            ? 'border-emerald-200 bg-emerald-500'
                            : 'border-ink-200 bg-ink-200'
                        } disabled:cursor-not-allowed disabled:opacity-40`}
                      >
                        <span
                          className={`pointer-events-none mt-0.5 inline-block h-6 w-6 transform rounded-full bg-white shadow transition ${
                            u.isActive ? 'translate-x-5' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                      <span className="ml-2 text-xs text-ink-500">{u.isActive ? 'Active' : 'Off'}</span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <Dropdown
                        align="right"
                        trigger={
                          <button
                            type="button"
                            className="rounded-lg border border-ink-200 bg-white px-2 py-1 text-lg leading-none text-ink-600 hover:bg-ink-50 disabled:opacity-40"
                            aria-label={`Actions for ${u.displayName}`}
                            disabled={rowBusy}
                          >
                            ···
                          </button>
                        }
                      >
                        <DropdownItem
                          onClick={() => {
                            setEditUser(u);
                            setEditName(u.displayName);
                            setEditEmail(u.email);
                          }}
                        >
                          Edit user
                        </DropdownItem>
                        <DropdownItem
                          onClick={() => {
                            setResetUser(u);
                            setResetPw1('');
                            setResetPw2('');
                          }}
                        >
                          Reset password
                        </DropdownItem>
                        <DropdownItem onClick={() => setLogoutUser(u)}>Force logout</DropdownItem>
                        <DropdownSeparator />
                        <DropdownItem
                          danger
                          disabled={selfId === u.id}
                          onClick={() => {
                            if (selfId !== u.id) setDeleteUser(u);
                          }}
                        >
                          Delete user (soft)
                        </DropdownItem>
                      </Dropdown>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>

      <Modal
        open={Boolean(editUser)}
        onClose={() => setEditUser(null)}
        title="Edit user"
        footer={
          <>
            <Button variant="ghost" type="button" onClick={() => setEditUser(null)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" form="edit-user-form">
              Save
            </Button>
          </>
        }
      >
        <form id="edit-user-form" className="space-y-3" onSubmit={submitEdit}>
          <label className="block text-xs font-medium text-ink-600">
            Display name
            <input
              className="input mt-1 w-full"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              required
            />
          </label>
          <label className="block text-xs font-medium text-ink-600">
            Email
            <input
              type="email"
              className="input mt-1 w-full"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              required
            />
          </label>
        </form>
      </Modal>

      <Modal
        open={Boolean(resetUser)}
        onClose={() => {
          setResetUser(null);
          setResetPw1('');
          setResetPw2('');
        }}
        title="Reset password"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setResetUser(null);
                setResetPw1('');
                setResetPw2('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              form="admin-reset-pw-form"
              loading={resetPw.isPending}
            >
              Reset & revoke sessions
            </Button>
          </>
        }
      >
        <form id="admin-reset-pw-form" className="space-y-3" onSubmit={submitResetPw}>
          <p className="text-sm text-ink-600">
            Sets a new password and signs this user out everywhere (refresh tokens revoked).
          </p>
          <label className="block text-xs font-medium text-ink-600">
            New password
            <input
              type="password"
              autoComplete="new-password"
              className="input mt-1 w-full"
              value={resetPw1}
              onChange={(e) => setResetPw1(e.target.value)}
              minLength={8}
              required
            />
          </label>
          <label className="block text-xs font-medium text-ink-600">
            Confirm
            <input
              type="password"
              autoComplete="new-password"
              className="input mt-1 w-full"
              value={resetPw2}
              onChange={(e) => setResetPw2(e.target.value)}
              minLength={8}
              required
            />
          </label>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteUser)}
        title="Delete user?"
        destructive
        body={
          deleteUser
            ? `Soft-delete ${deleteUser.displayName} (${deleteUser.email}). They will be signed out and hidden from this directory.`
            : undefined
        }
        loading={softDelete.isPending}
        onCancel={() => setDeleteUser(null)}
        onConfirm={async () => {
          if (!deleteUser) return;
          try {
            await softDelete.mutateAsync(deleteUser.id);
            setDeleteUser(null);
          } catch (err) {
            alert(extractApiMessage(err));
          }
        }}
      />

      <ConfirmDialog
        open={Boolean(logoutUser)}
        title="Force logout?"
        body={
          logoutUser
            ? `Revoke all refresh tokens for ${logoutUser.displayName}. Active access tokens may remain valid until they expire.`
            : undefined
        }
        loading={revokeSessions.isPending}
        onCancel={() => setLogoutUser(null)}
        onConfirm={async () => {
          if (!logoutUser) return;
          try {
            await revokeSessions.mutateAsync(logoutUser.id);
            setLogoutUser(null);
          } catch (err) {
            alert(extractApiMessage(err));
          }
        }}
      />
    </>
  );
}

function PlanCell({
  tier,
  label,
}: {
  tier: 'free' | 'pro' | 'enterprise';
  label: string;
}) {
  const cls =
    tier === 'enterprise'
      ? 'bg-violet-50 text-violet-800 ring-violet-100'
      : tier === 'pro'
        ? 'bg-sky-50 text-sky-800 ring-sky-100'
        : 'bg-ink-100 text-ink-700 ring-ink-200';
  return (
    <div className="flex flex-col gap-0.5">
      <span className={`badge w-fit ring-1 ring-inset ${cls}`}>
        {tier === 'enterprise' ? 'Enterprise' : tier === 'pro' ? 'Pro' : 'Free'}
      </span>
      <span className="truncate text-[11px] text-ink-500">{label}</span>
    </div>
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
