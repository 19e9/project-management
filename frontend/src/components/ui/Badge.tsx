import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

type Tone = 'success' | 'warning' | 'danger' | 'brand' | 'info' | 'neutral';

export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        tone === 'success' && 'bg-emerald-100 text-emerald-700',
        tone === 'warning' && 'bg-amber-100 text-amber-700',
        tone === 'danger' && 'bg-rose-100 text-rose-700',
        tone === 'brand' && 'bg-brand/10 text-brand',
        tone === 'info' && 'bg-sky-100 text-sky-700',
        tone === 'neutral' && 'bg-surface-3 text-muted',
      )}
    >
      {children}
    </span>
  );
}
