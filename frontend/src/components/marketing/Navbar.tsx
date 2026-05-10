import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Logo } from '../ui/Logo';
import { IconArrowRight } from '../ui/Icons';

const links = [
  { label: 'Features', to: '/#features' },
  { label: 'How it works', to: '/#how' },
  { label: 'Pricing', to: '/#pricing' },
  { label: 'Customers', to: '/#proof' },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 ease-out-quint ${
        scrolled
          ? 'border-b border-ink-200/70 bg-white/80 backdrop-blur-md'
          : 'border-b border-transparent bg-white/0'
      }`}
    >
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <Logo />
          <nav className="hidden items-center gap-1 lg:flex">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className="rounded-full px-3 py-1.5 text-sm font-medium text-ink-600 transition hover:bg-ink-100 hover:text-ink-900"
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          <Link to="/login" className="btn-ghost">
            Sign in
          </Link>
          <Link to="/register" className="btn-brand">
            Start free
            <IconArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <button
          type="button"
          aria-label="Toggle menu"
          className="grid h-10 w-10 place-items-center rounded-xl border border-ink-200 bg-white lg:hidden"
          onClick={() => setOpen((o) => !o)}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5">
            {open ? (
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </div>

      {open && (
        <div className="border-t border-ink-200/70 bg-white/95 backdrop-blur-md lg:hidden">
          <div className="container space-y-1 py-4">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="block rounded-xl px-3 py-2.5 text-sm font-medium text-ink-700 hover:bg-ink-100"
              >
                {l.label}
              </Link>
            ))}
            <div className="grid gap-2 pt-3">
              <Link to="/login" onClick={() => setOpen(false)} className="btn-secondary w-full">
                Sign in
              </Link>
              <Link to="/register" onClick={() => setOpen(false)} className="btn-brand w-full">
                Start free
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
