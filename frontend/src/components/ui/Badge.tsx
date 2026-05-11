import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

const tones: Record<string, string> = {
  neutral: 'bg-ink-100 text-ink-700 ring-ink-200',
  warning: 'bg-amber-50 text-amber-900 ring-amber-100',
  success: 'bg-emerald-50 text-emerald-900 ring-emerald-100',
};

export function Badge({
  tone = 'neutral',
  className,
  children,
}: {
  tone?: keyof typeof tones;
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
