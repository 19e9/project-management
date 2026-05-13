import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Logo } from '../ui/Logo';
import { IconArrowRight } from '../ui/Icons';
import { LanguageSwitcher } from '../ui/LanguageSwitcher';
import { usePublicSiteFooter, usePublicSiteNav } from '../../features/cms/hooks';
import { isExternalHref } from './MarketingLink';
import { useT } from '../../i18n/I18nProvider';

type NavItem = { label: string; href: string; key: string };

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const footerQ = usePublicSiteFooter();
  const navQ = usePublicSiteNav();
  const t = useT();

  const links: NavItem[] = useMemo(() => {
    const top =
      footerQ.data?.topNavLinks?.map((l, i) => ({
        label: translateTopNavLabel(l.label, t),
        href: l.href,
        key: `top:${l.href}:${i}`,
      })) ?? [];
    const cms =
      navQ.data?.nav?.map((n) => ({
        label: n.title,
        href: `/${n.slug}`,
        key: `page:${n.slug}`,
      })) ?? [];
    return [...top, ...cms];
  }, [footerQ.data, navQ.data, t]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navClassDesktop =
    'rounded-full px-3 py-1.5 text-sm font-medium text-ink-600 transition hover:bg-ink-100 hover:text-ink-900';

  const navClassMobile = 'block rounded-xl px-3 py-2.5 text-sm font-medium text-ink-700 hover:bg-ink-100';

  function scrollToHash(href: string) {
    const hash = href.startsWith('/#') ? href.slice(2) : href.startsWith('#') ? href.slice(1) : '';
    if (!hash) return;
    window.requestAnimationFrame(() => {
      document.getElementById(decodeURIComponent(hash))?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
  }

  function renderNavLink(item: NavItem, variant: 'desktop' | 'mobile') {
    const cls = variant === 'desktop' ? navClassDesktop : navClassMobile;
    const close = () => {
      setOpen(false);
      scrollToHash(item.href);
    };
    if (isExternalHref(item.href)) {
      return (
        <a key={item.key} href={item.href} className={cls} onClick={close}>
          {item.label}
        </a>
      );
    }
    return (
      <NavLink
        key={item.key}
        to={item.href}
        className={({ isActive }) =>
          `${cls}${isActive ? ' bg-ink-100 text-ink-900' : ''}`
        }
        onClick={close}
      >
        {item.label}
      </NavLink>
    );
  }

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
            {links.map((l) => renderNavLink(l, 'desktop'))}
          </nav>
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          <LanguageSwitcher compact />
          <Link to="/login" className="btn-ghost">
            {t('marketing.signIn')}
          </Link>
          <Link to="/register" className="btn-brand">
            {t('marketing.startFree')}
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
            {links.map((l) => renderNavLink(l, 'mobile'))}
            <div className="grid gap-2 pt-3">
              <LanguageSwitcher />
              <Link to="/login" onClick={() => setOpen(false)} className="btn-secondary w-full">
                {t('marketing.signIn')}
              </Link>
              <Link to="/register" onClick={() => setOpen(false)} className="btn-brand w-full">
                {t('marketing.startFree')}
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function translateTopNavLabel(label: string, t: (key: string) => string) {
  const key = label.trim().toLowerCase();
  if (key === 'features') return t('marketing.navFeatures');
  if (key === 'how it works') return t('marketing.navHow');
  if (key === 'pricing') return t('marketing.navPricing');
  if (key === 'customers') return t('marketing.navCustomers');
  return label;
}
