import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

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
  if (!h || isExternalHref(h)) {
    return (
      <a href={h || '#'} className={className} onClick={onClick} rel="noopener noreferrer">
        {children}
      </a>
    );
  }
  return (
    <Link to={h} className={className} onClick={onClick}>
      {children}
    </Link>
  );
}
