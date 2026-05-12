import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

type Tone = 'success' | 'warning' | 'danger' | 'brand' | 'info' | 'neutral';

const tones: Record<Tone, string> = {
  neutral: 'bg-ink-100 text-ink-700 ring-ink-200',
  warning: 'bg-amber-50 text-amber-900 ring-amber-100',
  success: 'bg-emerald-50 text-emerald-900 ring-emerald-100',
  danger: 'bg-rose-50 text-rose-900 ring-rose-100',
  brand: 'bg-brand-50 text-brand-700 ring-brand-100',
  info: 'bg-sky-50 text-sky-900 ring-sky-100',
};

export function Badge({
  tone = 'neutral',
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset',
        tones[tone] ?? tones.neutral,
        className,
      )}
    >
      {children}
    </span>
  );
}
