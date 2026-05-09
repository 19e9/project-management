import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

type Tone = 'brand' | 'success' | 'warning' | 'danger' | 'info';

interface StatCardProps {
  label: string;
  value: ReactNode;
  delta?: number;
  tone?: Tone;
  icon?: ReactNode;
  hint?: string;
}

export function StatCard({ label, value, delta, tone = 'brand', icon, hint }: StatCardProps) {
  return (
    <div className="card flex flex-col gap-3 p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
        {icon && (
          <span
            className={cn(
              'grid h-7 w-7 flex-none place-items-center rounded-md',
              tone === 'brand' && 'bg-brand/10 text-brand',
              tone === 'success' && 'bg-emerald-100 text-emerald-600',
              tone === 'warning' && 'bg-amber-100 text-amber-600',
              tone === 'danger' && 'bg-rose-100 text-rose-600',
              tone === 'info' && 'bg-sky-100 text-sky-600',
            )}
          >
            {icon}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-fg">{value}</p>
      {hint && <p className="text-xs text-muted">{hint}</p>}
      {delta !== undefined && (
        <p className={cn('text-xs font-medium', delta >= 0 ? 'text-emerald-600' : 'text-rose-600')}>
          {delta >= 0 ? '+' : ''}{delta}%
        </p>
      )}
    </div>
  );
}
