import { Link } from 'react-router-dom';
import { Logo } from '../ui/Logo';

const cols = [
  {
    title: 'Product',
    links: [
      { label: 'Features', to: '/#features' },
      { label: 'How it works', to: '/#how' },
      { label: 'Pricing', to: '/#pricing' },
      { label: 'Roadmap', to: '#' },
      { label: 'Changelog', to: '#' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', to: '#' },
      { label: 'Customers', to: '/#proof' },
      { label: 'Careers', to: '#' },
      { label: 'Contact', to: '#' },
      { label: 'Press kit', to: '#' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Documentation', to: '#' },
      { label: 'API reference', to: '#' },
      { label: 'Templates', to: '#' },
      { label: 'Guides', to: '#' },
      { label: 'Status', to: '#' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy', to: '#' },
      { label: 'Terms', to: '#' },
      { label: 'Security', to: '#' },
      { label: 'DPA', to: '#' },
      { label: 'Cookies', to: '#' },
    ],
  },
];

export function Footer() {
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
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-400">
              Plan, schedule and ship faster. PlanForge brings Gantt, WBS and the Critical Path
              Method into one calm, modern workspace.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <Link to="/register" className="btn-brand">
                Start free
              </Link>
              <Link
                to="/#pricing"
                className="btn px-4 py-2 text-sm text-ink-200 hover:text-white"
              >
                See pricing →
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 md:col-span-8 md:grid-cols-4">
            {cols.map((c) => (
              <div key={c.title}>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-500">
                  {c.title}
                </h4>
                <ul className="mt-4 space-y-2.5 text-sm">
                  {c.links.map((l) => (
                    <li key={l.label}>
                      <Link
                        to={l.to}
                        className="text-ink-300 transition hover:text-white"
                      >
                        {l.label}
                      </Link>
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
