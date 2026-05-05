import { Sparkline } from './charts/Sparkline';

interface Props {
  label: string;
  value: string | number;
  hint?: string;
  changePct?: number;
  changeWindow?: string;
  series?: number[];
  accent?: 'brand' | 'cyan' | 'emerald' | 'amber' | 'rose';
  icon?: React.ReactNode;
}

const ACCENT: Record<NonNullable<Props['accent']>, { stroke: string; fill: string; chip: string }> =
  {
    brand: {
      stroke: '#4f46e5',
      fill: 'rgba(99,102,241,0.18)',
      chip: 'bg-brand-50 text-brand-700 ring-brand-100',
    },
    cyan: {
      stroke: '#0891b2',
      fill: 'rgba(6,182,212,0.18)',
      chip: 'bg-cyan-50 text-cyan-700 ring-cyan-100',
    },
    emerald: {
      stroke: '#059669',
      fill: 'rgba(16,185,129,0.18)',
      chip: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    },
    amber: {
      stroke: '#d97706',
      fill: 'rgba(245,158,11,0.18)',
      chip: 'bg-amber-50 text-amber-700 ring-amber-100',
    },
    rose: {
      stroke: '#e11d48',
      fill: 'rgba(244,63,94,0.18)',
      chip: 'bg-rose-50 text-rose-700 ring-rose-100',
    },
  };

export function StatsCard({
  label,
  value,
  hint,
  changePct,
  changeWindow = '30d',
  series,
  accent = 'brand',
  icon,
}: Props) {
  const a = ACCENT[accent];
  const positive = (changePct ?? 0) >= 0;
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">
            {label}
          </div>
          <div className="mt-1 text-3xl font-bold tracking-tight text-ink-900">
            {value}
          </div>
          {hint && <div className="mt-0.5 text-[12px] text-ink-500">{hint}</div>}
        </div>
        <div
          className={`grid h-9 w-9 flex-none place-items-center rounded-xl ring-1 ring-inset ${a.chip}`}
        >
          {icon}
        </div>
      </div>

      <div className="mt-4 flex items-end justify-between gap-3">
        <div>
          {typeof changePct === 'number' && (
            <span
              className={`badge ring-1 ring-inset ${
                positive
                  ? 'bg-emerald-50 text-emerald-700 ring-emerald-100'
                  : 'bg-rose-50 text-rose-700 ring-rose-100'
              }`}
            >
              <svg viewBox="0 0 24 24" className={`h-3 w-3 ${positive ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M6 14l6-6 6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {Math.abs(changePct).toFixed(1)}%
              <span className="text-ink-500">vs {changeWindow}</span>
            </span>
          )}
        </div>
        <Sparkline
          data={series ?? []}
          stroke={a.stroke}
          fill={a.fill}
          width={120}
          height={36}
          className="h-9 w-28"
        />
      </div>
    </div>
  );
}
