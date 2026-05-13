import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthProvider';

interface Props {
  onMenu: () => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  generatedAt?: string;
}

export function AdminTopBar({ onMenu, onRefresh, refreshing, generatedAt }: Props) {
  const { user, signOut } = useAuth();
  const nav = useNavigate();

  return (
    <header className="sticky top-0 z-20 border-b border-ink-200 bg-white/90 backdrop-blur">
      <div className="flex h-14 items-center gap-3 px-4 lg:px-6">
        <button
          type="button"
          onClick={onMenu}
          aria-label="Open sidebar"
          className="grid h-9 w-9 place-items-center rounded-xl border border-ink-200 lg:hidden"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5">
            <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
        </button>

        {/* Search */}
        <label className="relative hidden flex-1 max-w-md md:block">
          <span className="sr-only">Search</span>
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
            </svg>
          </span>
          <input
            placeholder="Search workspaces, users, tasks…"
            className="input pl-9"
          />
          <kbd className="absolute right-2 top-1/2 hidden -translate-y-1/2 rounded border border-ink-200 bg-ink-50 px-1.5 py-0.5 text-[10px] font-medium text-ink-500 lg:inline-block">
            ⌘K
          </kbd>
        </label>

        <div className="ml-auto flex items-center gap-2">
          {generatedAt && (
            <span className="hidden text-[11px] text-ink-500 sm:inline-block">
              Updated {timeAgo(generatedAt)}
            </span>
          )}
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={refreshing}
              className="btn-ghost h-9 px-3 text-xs disabled:opacity-50"
            >
              <svg
                viewBox="0 0 24 24"
                className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
              >
                <path d="M21 12a9 9 0 1 1-3-6.7" strokeLinecap="round" />
                <path d="M21 4v5h-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Refresh
            </button>
          )}
          <button
            type="button"
            className="relative grid h-9 w-9 place-items-center rounded-xl border border-ink-200 text-ink-600 hover:bg-ink-50"
            aria-label="Notifications"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M6 8a6 6 0 1 1 12 0v5l1.5 3h-15L6 13V8z" />
              <path d="M10 19a2 2 0 0 0 4 0" />
            </svg>
            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-rose-500 ring-2 ring-white" />
          </button>

          <div className="hidden h-9 items-center gap-2 rounded-xl border border-ink-200 px-2 sm:flex">
            <span
              className="grid h-7 w-7 place-items-center rounded-lg bg-brand-gradient text-[11px] font-semibold text-white"
              aria-hidden
            >
              {(user?.displayName ?? '?')
                .split(' ')
                .map((s) => s[0])
                .slice(0, 2)
                .join('')}
            </span>
            <div className="leading-tight">
              <div className="text-[12px] font-medium text-ink-900">
                {user?.displayName ?? 'Admin'}
              </div>
              <div className="text-[10px] text-ink-500">Platform admin</div>
            </div>
          </div>

          <button
            type="button"
            onClick={async () => {
              await signOut();
              nav('/', { replace: true });
            }}
            className="btn-secondary h-9 px-3 text-xs"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(iso).toLocaleDateString();
}
