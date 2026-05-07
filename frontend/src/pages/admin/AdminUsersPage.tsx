import { useMemo, useState } from 'react';
import { useAdminBilling, useAdminUsers } from '../../features/admin/hooks';
import { UsersTable } from '../../components/admin/UsersTable';

export default function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const users = useAdminUsers(search, 200);
  const billing = useAdminBilling({ limit: 250, q: '' });

  const ownerBillingByUserId = useMemo(() => {
    const m: Record<string, { workspaceCount: number; renewalHint: string }> = {};
    for (const w of billing.data?.workspaces ?? []) {
      if (!w.owner) continue;
      const cur = m[w.owner.id] ?? { workspaceCount: 0, renewalHint: 'Monthly cycle' };
      cur.workspaceCount += 1;
      if (w.trialEndsAt && new Date(w.trialEndsAt).getTime() > Date.now()) {
        cur.renewalHint = `Trial ends ${new Date(w.trialEndsAt).toLocaleDateString()}`;
      }
      m[w.owner.id] = cur;
    }
    return m;
  }, [billing.data?.workspaces]);

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 px-4 pb-10 sm:px-6">
      <header className="flex flex-col gap-1 pt-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow text-brand-600">Platform administration</p>
          <h1 className="h-display text-2xl text-ink-900">Users</h1>
          <p className="mt-1 max-w-xl text-sm text-ink-500">
            Every account on the platform. Use search to filter by name or email (up to 200 results
            per load).
          </p>
        </div>
      </header>

      {users.isError && (
        <div
          className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
          role="alert"
        >
          {users.error instanceof Error ? users.error.message : 'Could not load users.'}
        </div>
      )}

      <UsersTable
        rows={users.data?.items ?? []}
        loading={users.isLoading}
        onSearchChange={setSearch}
        ownerBillingByUserId={ownerBillingByUserId}
      />
    </div>
  );
}
