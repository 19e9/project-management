import { useAuth } from '../features/auth/AuthProvider';
import { useMyDashboard } from '../features/dashboard/hooks';
import { AdminDashboardView } from '../features/dashboard/views/AdminDashboardView';
import { OwnerDashboardView } from '../features/dashboard/views/OwnerDashboardView';
import { MemberDashboardView } from '../features/dashboard/views/MemberDashboardView';
import { ClientDashboardView } from '../features/dashboard/views/ClientDashboardView';

export default function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading, isError } = useMyDashboard();

  if (isLoading) return <DashboardSkeleton />;
  if (isError || !data) return <ErrorState />;

  const { myRole } = data;

  if (myRole === 'platform_admin') {
    return <AdminDashboardView />;
  }
  if (myRole === 'owner') {
    return <OwnerDashboardView data={data} userName={user?.displayName} />;
  }
  if (myRole === 'member') {
    return <MemberDashboardView data={data} userName={user?.displayName} />;
  }
  return <ClientDashboardView data={data} userName={user?.displayName} />;
}

/* ── Loading skeleton ──────────────────────────────────── */
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="skeleton h-4 w-24 rounded" />
        <div className="skeleton h-8 w-72 rounded" />
        <div className="skeleton h-4 w-56 rounded" />
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card p-5 space-y-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1.5">
                <div className="skeleton h-3 w-20 rounded" />
                <div className="skeleton h-8 w-16 rounded" />
                <div className="skeleton h-3 w-28 rounded" />
              </div>
              <div className="skeleton h-9 w-9 rounded-xl" />
            </div>
            <div className="flex items-end justify-between">
              <div className="skeleton h-5 w-16 rounded-full" />
              <div className="skeleton h-9 w-28 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-12">
        <div className="card p-5 lg:col-span-7">
          <div className="skeleton h-4 w-32 rounded mb-4" />
          <div className="skeleton h-56 w-full rounded-xl" />
        </div>
        <div className="card p-5 lg:col-span-5">
          <div className="skeleton h-4 w-28 rounded mb-4" />
          <div className="skeleton h-56 w-full rounded-xl" />
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="border-b border-ink-200 px-5 py-4">
          <div className="skeleton h-5 w-32 rounded" />
        </div>
        <div className="divide-y divide-ink-200">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-3">
              <div className="skeleton h-8 w-8 rounded-lg" />
              <div className="flex-1 space-y-1">
                <div className="skeleton h-4 w-40 rounded" />
                <div className="skeleton h-3 w-28 rounded" />
              </div>
              <div className="skeleton h-5 w-12 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Error state ───────────────────────────────────────── */
function ErrorState() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-rose-50 text-rose-500">
        <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v6M12 16.5h.01" strokeLinecap="round" />
        </svg>
      </div>
      <div>
        <h3 className="text-lg font-semibold text-ink-900">Dashboard failed to load</h3>
        <p className="mt-1 text-sm text-ink-500">
          Could not reach the API. Check your connection and make sure the backend is running.
        </p>
      </div>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="btn-brand"
      >
        Retry
      </button>
    </div>
  );
}
