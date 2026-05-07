import { useEffect, useState } from 'react';
import type { AxiosError } from 'axios';
import { WorkspacesTable } from '../../components/admin/WorkspacesTable';
import { useAdminWorkspaces } from '../../features/admin/hooks';

const LIST_LIMIT = 100;
const SEARCH_DEBOUNCE_MS = 320;

export default function AdminAllWorkspacesPage() {
  const [searchInput, setSearchInput] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedQ(searchInput.trim()), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(id);
  }, [searchInput]);

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    dataUpdatedAt,
  } = useAdminWorkspaces(debouncedQ, LIST_LIMIT);

  const errMsg =
    error && typeof error === 'object' && 'isAxiosError' in error
      ? (error as AxiosError<{ message?: string }>).response?.data?.message ??
        (error as AxiosError).message
      : (error as Error)?.message;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="eyebrow">Admin</span>
          <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-ink-900 md:text-3xl">
            Platform workspaces
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            Browse, search and manage every workspace on the platform (
            <code className="rounded bg-ink-100 px-1.5 py-0.5 font-mono text-xs">
              GET /admin/workspaces
            </code>
            , up to {LIST_LIMIT} rows per query).
          </p>
        </div>
        <button type="button" className="btn-secondary px-4 text-sm" onClick={() => refetch()}>
          Refresh
        </button>
      </header>

      {isError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
          <p className="font-semibold">Could not load workspaces</p>
          <p className="mt-1 text-xs text-rose-800">
            {errMsg ?? 'Check network and platform-admin auth.'}
          </p>
        </div>
      )}

      {dataUpdatedAt > 0 && (
        <p className="text-[11px] text-ink-400">
          Last fetched {new Date(dataUpdatedAt).toLocaleString()}
        </p>
      )}

      <WorkspacesTable
        rows={data?.items ?? []}
        loading={isLoading}
        onSearchChange={setSearchInput}
      />
    </div>
  );
}
