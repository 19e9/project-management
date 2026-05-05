import { cn } from '../../lib/cn';

interface Props {
  name: string;
  src?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE = {
  sm: 'h-6 w-6 text-[10px]',
  md: 'h-8 w-8 text-xs',
  lg: 'h-10 w-10 text-sm',
};

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? '')
    .join('');
}

export function Avatar({ name, src, size = 'md', className }: Props) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn('rounded-full object-cover ring-1 ring-border', SIZE[size], className)}
      />
    );
  }
  return (
    <span
      aria-label={name}
      className={cn(
        'inline-grid place-items-center rounded-full bg-brand/15 font-semibold text-brand',
        SIZE[size],
        className,
      )}
    >
      {initialsOf(name) || '?'}
    </span>
  );
}
