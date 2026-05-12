import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

type Tone = 'brand' | 'success' | 'warning' | 'danger' | 'info';

const toneRing: Record<string, string> = {
  info: 'ring-blue-100 bg-blue-50/60',
  brand: 'ring-brand-100 bg-brand-50/40',
  success: 'ring-emerald-100 bg-emerald-50/50',
  warning: 'ring-amber-100 bg-amber-50/50',
  danger: 'ring-rose-100 bg-rose-50/50',
};

export function StatCard({
  label,
  value,
  delta,
  tone = 'brand',
  icon,
  hint,
}: {
  label: string;
  value: ReactNode;
  delta?: number;
  tone?: Tone;
  icon?: ReactNode;
  hint?: string;
}) {
  const ring = toneRing[tone] ?? toneRing.brand;
  return (
    <div className={`rounded-2xl border border-ink-200 p-4 shadow-card ring-1 ring-inset ${ring}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-500">{label}</p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-ink-900">{value}</p>
          {delta !== undefined && (
            <p className="mt-1 text-xs font-medium text-emerald-700">▲ {delta}%</p>
          )}
          {hint && <p className="mt-2 text-xs text-ink-500">{hint}</p>}
        </div>
        {icon && (
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-ink-600 shadow-sm ring-1 ring-ink-100">
            {icon}
          </span>
        )}
      </div>
    </div>
  );
}
