import { Link } from 'react-router-dom';
import type { ActivityEvent, ActivityKind } from '../../features/admin/hooks';

interface Props {
  events: ActivityEvent[];
  loading?: boolean;
  limit?: number;
  /** Full activity page route — omit on the activity page itself. */
  viewAllHref?: string;
}

const KIND_META: Record<
  ActivityKind,
  { dot: string; label: string; icon: React.ReactNode }
> = {
  user_joined: {
    dot: 'bg-cyan-500',
    label: 'joined the platform',
    icon: <Dot className="text-cyan-500" />,
  },
  workspace_created: {
    dot: 'bg-brand-500',
    label: 'created workspace',
    icon: <Dot className="text-brand-500" />,
  },
  project_created: {
    dot: 'bg-violet-500',
    label: 'created project',
    icon: <Dot className="text-violet-500" />,
  },
  task_completed: {
    dot: 'bg-emerald-500',
    label: 'completed task',
    icon: <Dot className="text-emerald-500" />,
  },
  task_updated: {
    dot: 'bg-amber-500',
    label: 'updated task',
    icon: <Dot className="text-amber-500" />,
  },
};

export function ActivityFeed({ events, loading, limit = 12, viewAllHref }: Props) {
  const items = events.slice(0, limit);
  return (
    <section className="card">
      <header className="flex items-center justify-between border-b border-ink-200 px-5 py-4">
        <div>
          <h3 className="text-base font-semibold text-ink-900">Recent activity</h3>
          <p className="text-xs text-ink-500">Live cross-workspace event stream</p>
        </div>
        {viewAllHref ? (
          <Link to={viewAllHref} className="text-xs font-medium text-brand-700 hover:underline">
            View all →
          </Link>
        ) : (
          <span className="text-xs tabular-nums text-ink-400">{events.length} events</span>
        )}
      </header>

      <ol className="relative px-5 py-4">
        {loading &&
          Array.from({ length: 4 }).map((_, i) => (
            <li key={i} className="py-3">
              <div className="skeleton h-5 w-full" />
            </li>
          ))}

        {!loading && items.length === 0 && (
          <li className="py-8 text-center text-sm text-ink-500">No recent activity yet.</li>
        )}

        {!loading && items.length > 0 && (
          <span
            className="pointer-events-none absolute left-[26px] top-4 bottom-4 w-px bg-ink-200"
            aria-hidden
          />
        )}

        {!loading &&
          items.map((e) => {
            const meta = KIND_META[e.kind];
            return (
              <li key={e.id} className="relative flex gap-3 py-2.5 pl-8">
                <span
                  className={`absolute left-[18px] top-3 grid h-4 w-4 -translate-x-1/2 place-items-center rounded-full bg-white ring-4 ring-white`}
                  aria-hidden
                >
                  <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm leading-relaxed text-ink-800">
                    <strong className="font-semibold text-ink-900">
                      {e.actor?.displayName ?? 'Someone'}
                    </strong>{' '}
                    {meta.label}
                    {e.target?.label && (
                      <>
                        {' '}
                        <span className="font-medium text-ink-900">{e.target.label}</span>
                      </>
                    )}
                    {e.workspace?.name && (
                      <>
                        {' '}
                        <span className="text-ink-500">in</span>{' '}
                        <span className="font-medium text-ink-700">{e.workspace.name}</span>
                      </>
                    )}
                  </div>
                  <div className="mt-0.5 text-[11px] text-ink-500">{timeAgo(e.at)}</div>
                </div>
              </li>
            );
          })}
      </ol>
    </section>
  );
}

function Dot({ className }: { className?: string }) {
  return (
    <span className={`grid h-3 w-3 place-items-center rounded-full bg-current ${className}`} />
  );
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / (1000 * 60));
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}
