import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { marketingNavTo } from './marketingNavTarget';

export function isExternalHref(href: string): boolean {
  const h = href.trim();
  return /^https?:\/\//i.test(h) || h.startsWith('//');
}

/** Renders router links for internal paths and plain anchors for absolute URLs. */
export function MarketingLink({
  href,
  className,
  children,
  onClick,
}: {
  href: string;
  className?: string;
  children: ReactNode;
  onClick?: () => void;
}) {
  const h = href.trim();
  const handleClick = () => {
    onClick?.();
    const hash = h.startsWith('/#') ? h.slice(2) : h.startsWith('#') ? h.slice(1) : '';
    if (!hash) return;
    window.requestAnimationFrame(() => {
      document.getElementById(decodeURIComponent(hash))?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
  };
  if (!h || isExternalHref(h)) {
    return (
      <a href={h || '#'} className={className} onClick={handleClick} rel="noopener noreferrer">
        {children}
      </a>
    );
  }
  return (
    <Link to={marketingNavTo(h)} className={className} onClick={handleClick}>
      {children}
    </Link>
  );
}
