import type { MouseEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

export function Logo({
  className = '',
  dark = false,
  scrollToTopOnClick = true,
}: {
  className?: string;
  dark?: boolean;
  /** Navigate to `/` with hash cleared when needed, scroll to document top */
  scrollToTopOnClick?: boolean;
}) {
  const navigate = useNavigate();
  const location = useLocation();

  function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    if (!scrollToTopOnClick) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (e.button !== 0) return;
    e.preventDefault();

    const onHome = location.pathname === '/';
    void navigate('/', { replace: onHome });

    const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
    requestAnimationFrame(() => {
      requestAnimationFrame(scrollTop);
    });
  }

  return (
    <Link to="/" className={`group inline-flex items-center gap-2 ${className}`} onClick={handleClick}>
      <span className="relative grid h-8 w-8 place-items-center overflow-hidden rounded-xl bg-brand-gradient text-white shadow-lift">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
          <path
            d="M5 5h6v6H5zM13 5h6v3h-6zM13 10h6v9h-6zM5 13h6v6H5z"
            fill="currentColor"
            opacity="0.95"
          />
        </svg>
        <span className="absolute inset-0 bg-noise opacity-60 mix-blend-overlay" />
      </span>
      <span
        className={`text-[15px] font-semibold tracking-tight ${
          dark ? 'text-white' : 'text-ink-900'
        }`}
      >
        PlanForge
      </span>
    </Link>
  );
}
