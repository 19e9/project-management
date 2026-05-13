import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { ActivityEvent, ActivityKind } from '../../features/admin/hooks';
import type { TFunction } from '../../i18n/I18nProvider';
import { useT } from '../../i18n/I18nProvider';

interface Props {
  events: ActivityEvent[];
  loading?: boolean;
  limit?: number;
  viewAllHref?: string;
}

function kindLabel(t: TFunction, kind: ActivityKind): string {
  const map: Record<ActivityKind, string> = {
    user_joined: t('adminView.activityKindUserJoined'),
    workspace_created: t('adminView.activityKindWorkspaceCreated'),
    project_created: t('adminView.activityKindProjectCreated'),
    task_completed: t('adminView.activityKindTaskCompleted'),
    task_updated: t('adminView.activityKindTaskUpdated'),
  };
  return map[kind];
}

export function formatAdminTimeAgo(iso: string, t: TFunction): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / (1000 * 60));
  if (m < 1) return t('adminView.timeJustNow');
  if (m < 60) return t('adminView.timeMinutesAgo', { n: m });
  const h = Math.floor(m / 60);
  if (h < 24) return t('adminView.timeHoursAgo', { n: h });
  const d = Math.floor(h / 24);
  return t('adminView.timeDaysAgo', { n: d });
}

export function ActivityFeed({ events, loading, limit = 12, viewAllHref }: Props) {
  const t = useT();
  const items = events.slice(0, limit);

  const dotCls: Record<ActivityKind, string> = useMemo(
    () => ({
      user_joined: 'bg-cyan-500',
      workspace_created: 'bg-brand-500',
      project_created: 'bg-violet-500',
      task_completed: 'bg-emerald-500',
      task_updated: 'bg-amber-500',
    }),
    [],
  );

  return (
    <section className="card">
      <header className="flex items-center justify-between border-b border-ink-200 px-5 py-4">
        <div>
          <h3 className="text-base font-semibold text-ink-900">{t('adminView.activityTitle')}</h3>
          <p className="text-xs text-ink-500">{t('adminView.activitySub')}</p>
        </div>
        {viewAllHref ? (
          <Link to={viewAllHref} className="text-xs font-medium text-brand-700 hover:underline">
            {t('adminView.activityViewAll')}
          </Link>
        ) : (
          <span className="text-xs tabular-nums text-ink-400">
            {t('adminView.activityEventsN', { n: events.length })}
          </span>
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
          <li className="py-8 text-center text-sm text-ink-500">{t('adminView.activityEmpty')}</li>
        )}

        {!loading && items.length > 0 && (
          <span
            className="pointer-events-none absolute left-[26px] top-4 bottom-4 w-px bg-ink-200"
            aria-hidden
          />
        )}

        {!loading &&
          items.map((e) => (
            <li key={e.id} className="relative flex gap-3 py-2.5 pl-8">
              <span
                className="absolute left-[18px] top-3 grid h-4 w-4 -translate-x-1/2 place-items-center rounded-full bg-white ring-4 ring-white"
                aria-hidden
              >
                <span className={`h-2 w-2 rounded-full ${dotCls[e.kind]}`} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-sm leading-relaxed text-ink-800">
                  <strong className="font-semibold text-ink-900">
                    {e.actor?.displayName ?? t('adminView.activitySomeone')}
                  </strong>{' '}
                  {kindLabel(t, e.kind)}
                  {e.target?.label && (
                    <>
                      {' '}
                      <span className="font-medium text-ink-900">{e.target.label}</span>
                    </>
                  )}
                  {e.workspace?.name && (
                    <>
                      {' '}
                      <span className="text-ink-500">{t('adminView.activityIn')}</span>{' '}
                      <span className="font-medium text-ink-700">{e.workspace.name}</span>
                    </>
                  )}
                </div>
                <div className="mt-0.5 text-[11px] text-ink-500">{formatAdminTimeAgo(e.at, t)}</div>
              </div>
            </li>
          ))}
      </ol>
    </section>
  );
}
