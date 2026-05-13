import type { AdminInsights } from '../../features/admin/hooks';
import { useT } from '../../i18n/I18nProvider';

interface Props {
  data?: AdminInsights;
  loading?: boolean;
}

const LEVEL_STYLE: Record<
  'info' | 'warning' | 'critical',
  { bg: string; ring: string; text: string; icon: string }
> = {
  info: {
    bg: 'bg-emerald-50/60',
    ring: 'ring-emerald-200',
    text: 'text-emerald-700',
    icon: '✓',
  },
  warning: {
    bg: 'bg-amber-50/60',
    ring: 'ring-amber-200',
    text: 'text-amber-800',
    icon: '!',
  },
  critical: {
    bg: 'bg-rose-50/60',
    ring: 'ring-rose-200',
    text: 'text-rose-700',
    icon: '!!',
  },
};

export function InsightsPanel({ data, loading }: Props) {
  const t = useT();
  return (
    <section className="card">
      <header className="border-b border-ink-200 px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-ink-900">{t('adminView.insightsTitle')}</h3>
            <p className="text-xs text-ink-500">{t('adminView.insightsSub')}</p>
          </div>
          <span className="badge bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-100">
            {t('adminView.insightsLive')}
          </span>
        </div>
      </header>

      <div className="space-y-5 p-5">
        {/* Warnings */}
        <div className="space-y-2">
          {loading &&
            Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="skeleton h-12 w-full" />
            ))}
          {!loading &&
            (data?.warnings ?? []).map((w) => {
              const s = LEVEL_STYLE[w.level];
              return (
                <div
                  key={w.id}
                  className={`rounded-xl ring-1 ring-inset ${s.bg} ${s.ring} px-3 py-2.5`}
                >
                  <div className="flex items-start gap-2.5">
                    <span
                      className={`grid h-6 w-6 flex-none place-items-center rounded-full bg-white text-xs font-bold ${s.text}`}
                      aria-hidden
                    >
                      {s.icon}
                    </span>
                    <div>
                      <div className="text-sm font-semibold text-ink-900">{w.title}</div>
                      <div className="mt-0.5 text-xs text-ink-600">{w.body}</div>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>

        {/* Overloaded users */}
        <div>
          <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-500">
            {t('adminView.insightsOverloaded')}
          </h4>
          <ul className="space-y-2">
            {loading &&
              Array.from({ length: 3 }).map((_, i) => (
                <li key={i} className="skeleton h-12 w-full" />
              ))}
            {!loading && (data?.overloadedUsers?.length ?? 0) === 0 && (
              <li className="rounded-lg border border-dashed border-ink-200 px-3 py-4 text-center text-xs text-ink-500">
                {t('adminView.insightsOverloadedEmpty')}
              </li>
            )}
            {!loading &&
              data?.overloadedUsers?.map((u) => {
                const cap = Math.min(150, u.allocationPct);
                return (
                  <li
                    key={u.userId}
                    className="rounded-xl border border-ink-200 px-3 py-2.5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-ink-900">
                          {u.displayName}
                        </div>
                        <div className="truncate text-[11px] text-ink-500">{u.email}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-medium text-ink-700">
                          {t('adminView.insightsActiveTasks', { n: u.activeTaskCount })}
                        </div>
                        <div className="text-[11px] text-ink-500">
                          {t('adminView.insightsCapacity', { n: u.allocationPct })}
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-100">
                      <div
                        className={`h-full rounded-full ${
                          u.allocationPct >= 100 ? 'bg-rose-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${(cap / 150) * 100}%` }}
                      />
                    </div>
                  </li>
                );
              })}
          </ul>
        </div>

        {/* Overdue tasks */}
        <div>
          <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-500">
            {t('adminView.insightsOverdue')}
          </h4>
          <ul className="space-y-1.5">
            {loading &&
              Array.from({ length: 3 }).map((_, i) => (
                <li key={i} className="skeleton h-9 w-full" />
              ))}
            {!loading && (data?.overdueTasks?.length ?? 0) === 0 && (
              <li className="rounded-lg border border-dashed border-ink-200 px-3 py-4 text-center text-xs text-ink-500">
                {t('adminView.insightsOverdueEmpty')}
              </li>
            )}
            {!loading &&
              data?.overdueTasks?.slice(0, 6).map((task) => (
                <li
                  key={task.taskId}
                  className="flex items-center justify-between gap-3 rounded-lg border border-rose-200/70 bg-rose-50/40 px-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-ink-900">{task.title}</div>
                    <div className="truncate text-[11px] text-ink-500">{task.projectName}</div>
                  </div>
                  <span className="badge bg-rose-100 text-rose-700">
                    {t('adminView.insightsDaysLate', { n: task.daysOverdue })}
                  </span>
                </li>
              ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
