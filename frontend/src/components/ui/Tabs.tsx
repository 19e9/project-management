import { cn } from '../../lib/cn';

interface TabItem {
  id: string;
  label: string;
  count?: number;
}

interface TabsProps {
  value: string;
  onChange: (id: string) => void;
  items: TabItem[];
  className?: string;
}

export function Tabs({ value, onChange, items, className }: TabsProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-1 rounded-lg bg-surface-2 p-1',
        className,
      )}
    >
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onChange(item.id)}
          className={cn(
            'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition',
            value === item.id
              ? 'bg-white text-fg shadow-soft'
              : 'text-muted hover:text-fg',
          )}
        >
          {item.label}
          {item.count !== undefined && (
            <span className="rounded-full bg-surface-3 px-1.5 py-0.5 text-[11px] leading-none">
              {item.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
