import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

interface Props {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
  as?: 'div' | 'section' | 'article';
}

export function Card({ children, className, interactive, as: As = 'div' }: Props) {
  return (
    <As className={cn('card', interactive && 'card-hover cursor-pointer', className)}>{children}</As>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn('flex items-start justify-between gap-3 border-b border-border px-5 py-4', className)}
    >
      <div>
        <h3 className="text-sm font-semibold text-fg">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}

export function CardBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('px-5 py-4', className)}>{children}</div>;
}
