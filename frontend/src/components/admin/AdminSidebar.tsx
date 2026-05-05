import { NavLink } from 'react-router-dom';
import { Logo } from '../ui/Logo';

const items = [
  {
    section: 'Insights',
    links: [
      { to: '/dashboard', label: 'Overview', icon: IconHome, end: true },
      { to: '/dashboard/activity', label: 'Activity', icon: IconActivity },
    ],
  },
  {
    section: 'Tenancy',
    links: [
      { to: '/dashboard/all-workspaces', label: 'Workspaces', icon: IconBox },
      { to: '/dashboard/users', label: 'Users', icon: IconPeople },
    ],
  },
  {
    section: 'Operations',
    links: [
      { to: '/dashboard/billing', label: 'Billing', icon: IconCreditCard },
      { to: '/dashboard/settings', label: 'Settings', icon: IconCog },
    ],
  },
];

export function AdminSidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col gap-6 bg-ink-950 px-3 py-5 text-ink-200">
      <div className="px-3">
        <Logo dark />
      </div>

      {/* Workspace selector mock */}
      <div className="mx-2 rounded-xl border border-white/10 bg-white/5 p-3">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-white/50">
          Admin context
        </div>
        <div className="mt-1 flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm font-semibold text-white">
            <span className="grid h-6 w-6 place-items-center rounded-md bg-brand-gradient text-[10px]">
              PF
            </span>
            Platform
          </span>
          <span className="badge bg-emerald-500/10 text-emerald-300 ring-1 ring-inset ring-emerald-500/30">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Healthy
          </span>
        </div>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-1 scrollbar-none">
        {items.map((g) => (
          <div key={g.section}>
            <div className="px-3 text-[10px] font-semibold uppercase tracking-wider text-white/40">
              {g.section}
            </div>
            <ul className="mt-2 space-y-0.5">
              {g.links.map(({ to, label, icon: Icon, end }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    end={end}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      `group flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition ${
                        isActive
                          ? 'bg-white/10 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]'
                          : 'text-white/70 hover:bg-white/5 hover:text-white'
                      }`
                    }
                  >
                    <Icon className="h-4 w-4 flex-none opacity-80 group-hover:opacity-100" />
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="mx-2 rounded-xl border border-white/10 bg-gradient-to-br from-brand-500/15 to-brand-500/0 p-4">
        <div className="text-xs font-semibold text-white">API status</div>
        <p className="mt-1 text-[11px] leading-relaxed text-white/60">
          Live data via <code className="text-white/80">/api/v1/admin</code>.
        </p>
        <a
          href="/api/docs"
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand-200 hover:text-white"
        >
          Open Swagger →
        </a>
      </div>
    </div>
  );
}

/* ---- inline icons ---- */
type IP = React.SVGProps<SVGSVGElement>;
const stroke = (p: IP) => ({
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  ...p,
});

function IconHome(p: IP) {
  return (
    <svg {...stroke(p)}>
      <path d="M3 11l9-7 9 7v9a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2v-9z" />
    </svg>
  );
}
function IconActivity(p: IP) {
  return (
    <svg {...stroke(p)}>
      <path d="M3 12h4l3-7 4 14 3-7h4" />
    </svg>
  );
}
function IconBox(p: IP) {
  return (
    <svg {...stroke(p)}>
      <path d="M3 7l9-4 9 4-9 4-9-4z" />
      <path d="M3 7v10l9 4 9-4V7" />
      <path d="M12 11v10" />
    </svg>
  );
}
function IconPeople(p: IP) {
  return (
    <svg {...stroke(p)}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 19c.5-3.2 3-5 6-5s5.5 1.8 6 5" />
      <circle cx="17" cy="9" r="2.4" />
      <path d="M15.5 14.5c2.5.4 4.4 2 5 4.5" />
    </svg>
  );
}
function IconCreditCard(p: IP) {
  return (
    <svg {...stroke(p)}>
      <rect x="2" y="6" width="20" height="13" rx="2" />
      <path d="M2 11h20M6 16h4" />
    </svg>
  );
}
function IconCog(p: IP) {
  return (
    <svg {...stroke(p)}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9A1.7 1.7 0 0 0 10 3.1V3a2 2 0 1 1 4 0v.1A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9c0 .7.4 1.3 1 1.5h.1a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </svg>
  );
}
