import {
  cloneElement,
  isValidElement,
  useEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import { cn } from '../../lib/cn';

interface Props {
  trigger: ReactElement;
  children: ReactNode;
  align?: 'left' | 'right';
  className?: string;
}

export function Dropdown({ trigger, children, align = 'right', className }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const triggerEl = isValidElement(trigger)
    ? cloneElement(trigger as ReactElement<{ onClick?: (e: React.MouseEvent) => void }>, {
        onClick: (e: React.MouseEvent) => {
          (trigger.props as { onClick?: (e: React.MouseEvent) => void }).onClick?.(e);
          setOpen((s) => !s);
        },
      })
    : null;

  return (
    <div ref={ref} className="relative inline-block">
      {triggerEl}
      {open && (
        <div
          role="menu"
          className={cn(
            'absolute z-30 mt-1 min-w-[200px] overflow-hidden rounded-xl border border-border bg-surface p-1 shadow-pop animate-slide-up',
            align === 'right' ? 'right-0' : 'left-0',
            className,
          )}
          onClick={(e) => {
            const target = e.target as HTMLElement;
            if (target.closest('[data-dropdown-item]')) setOpen(false);
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export function DropdownItem({
  children,
  onClick,
  danger,
  icon,
  shortcut,
}: {
  children: ReactNode;
  onClick?: () => void;
  danger?: boolean;
  icon?: ReactNode;
  shortcut?: string;
}) {
  return (
    <button
      type="button"
      data-dropdown-item
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm transition',
        danger ? 'text-danger hover:bg-danger/10' : 'text-fg hover:bg-surface-2',
      )}
      role="menuitem"
    >
      {icon && <span className="grid h-4 w-4 place-items-center text-muted">{icon}</span>}
      <span className="flex-1">{children}</span>
      {shortcut && <span className="kbd">{shortcut}</span>}
    </button>
  );
}

export function DropdownLabel({ children }: { children: ReactNode }) {
  return <div className="px-2.5 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-muted">{children}</div>;
}

export function DropdownSeparator() {
  return <div className="my-1 h-px bg-border" />;
}
