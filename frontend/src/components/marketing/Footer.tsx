import { Link } from 'react-router-dom';
import { Logo } from '../ui/Logo';
import { usePublicSiteFooter } from '../../features/cms/hooks';
import { MarketingLink } from './MarketingLink';

export function Footer() {
  const q = usePublicSiteFooter();
  const cols = q.data?.columns ?? [];

  return (
    <footer className="relative overflow-hidden bg-ink-950 text-ink-300">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-500/60 to-transparent"
        aria-hidden
      />
      <div className="container py-16 md:py-20">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-4">
            <Logo dark />
            {q.isLoading ? (
              <>
                <div className="mt-4 skeleton h-4 w-full max-w-sm bg-white/10" />
                <div className="mt-2 skeleton h-4 w-full max-w-xs bg-white/10" />
                <div className="mt-6 flex gap-3">
                  <div className="skeleton h-10 w-28 rounded-lg bg-white/10" />
                  <div className="skeleton h-10 w-32 rounded-lg bg-white/10" />
                </div>
              </>
            ) : (
              <>
                <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-400">
                  {q.data?.footerTagline ?? ''}
                </p>
                <div className="mt-6 flex items-center gap-3">
                  <Link to="/register" className="btn-brand">
                    Start free
                  </Link>
                  <MarketingLink
                    href={q.data?.secondaryCtaHref ?? '#'}
                    className="btn px-4 py-2 text-sm text-ink-200 hover:text-white"
                  >
                    {q.data?.secondaryCtaLabel ?? ''}
                  </MarketingLink>
                </div>
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-8 md:col-span-8 md:grid-cols-4">
            {q.isLoading &&
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i}>
                  <div className="skeleton h-3 w-24 bg-white/10" />
                  <ul className="mt-4 space-y-2.5">
                    {Array.from({ length: 4 }).map((__, j) => (
                      <li key={j}>
                        <div className="skeleton h-4 w-full max-w-[140px] bg-white/10" />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            {!q.isLoading &&
              cols.map((c, ci) => (
                <div key={`${ci}-${c.title}`}>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-500">
                    {c.title}
                  </h4>
                  <ul className="mt-4 space-y-2.5 text-sm">
                    {c.links.map((l) => (
                      <li key={`${c.title}:${l.label}:${l.href}`}>
                        <MarketingLink
                          href={l.href}
                          className="text-ink-300 transition hover:text-white"
                        >
                          {l.label}
                        </MarketingLink>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
          </div>
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-6 text-xs text-ink-500 md:flex-row md:items-center">
          <span>© {new Date().getFullYear()} PlanForge Labs, Inc. All rights reserved.</span>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse-soft" />
            All systems operational
          </div>
        </div>
      </div>
    </footer>
  );
}
