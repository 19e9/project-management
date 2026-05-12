import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthProvider';
import { useMyDashboard } from '../features/dashboard/hooks';
import { Logo } from '../components/ui/Logo';

export default function AppLayout() {
  const { user, signOut } = useAuth();
  const nav = useNavigate();
  const location = useLocation();
  const { workspaceId } = useParams();
  const dash = useMyDashboard();
  const myRole = dash.data?.myRole;
  const isAdmin = user?.platformRole === 'platform_admin';
  const [menuOpen, setMenuOpen] = useState(false);
  const currentWorkspaceId =
    workspaceId ??
    location.pathname.match(/\/dashboard\/workspaces\/([^/]+)/)?.[1] ??
    dash.data?.workspaces[0]?.id;

  const links = buildNavLinks({ isAdmin, myRole, workspaceId: currentWorkspaceId });

  return (
    <div className="min-h-screen bg-ink-50/40">
      {/* Top header */}
      <header className="sticky top-0 z-20 border-b border-ink-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between gap-4 px-4 sm:px-6">
          {/* Logo */}
          <div className="flex items-center gap-6">
            <Logo />
            <nav className="hidden max-w-[min(64rem,calc(100vw-22rem))] items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none md:flex">
              {links.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  end={l.end}
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition ${
                      isActive
                        ? 'bg-ink-900 text-white shadow-soft'
                        : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900'
                    }`
                  }
                >
                  {l.icon && <l.icon className="h-3.5 w-3.5" />}
                  {l.label}
                  {l.badge && (
                    <span className="ml-0.5 rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-semibold leading-none">
                      {l.badge}
                    </span>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Right cluster */}
          <div className="flex items-center gap-2">
            {/* Role chip */}
            <RoleChip role={myRole} platformAdmin={isAdmin} />

            {/* Notification bell */}
            <button
              type="button"
              aria-label="Notifications"
              className="relative hidden h-9 w-9 items-center justify-center rounded-xl border border-ink-200 bg-white text-ink-600 hover:bg-ink-50 sm:grid"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M6 8a6 6 0 1 1 12 0v5l1.5 3h-15L6 13V8z" />
                <path d="M10 19a2 2 0 0 0 4 0" />
              </svg>
              {(dash.data?.taskStats.overdue ?? 0) > 0 && (
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
              )}
            </button>

            {/* User */}
            <div className="hidden h-9 items-center gap-2 rounded-xl border border-ink-200 bg-white px-2 sm:flex">
              <span
                className="grid h-6 w-6 flex-none place-items-center rounded-lg bg-brand-gradient text-[10px] font-semibold text-white"
                aria-hidden
              >
                {(user?.displayName ?? '?')
                  .split(' ')
                  .map((s) => s[0])
                  .slice(0, 2)
                  .join('')}
              </span>
              <span className="hidden max-w-[120px] truncate text-sm font-medium text-ink-900 lg:block">
                {user?.displayName}
              </span>
            </div>

            <button
              type="button"
              onClick={async () => { await signOut(); nav('/login'); }}
              className="btn-secondary h-9 px-3 text-xs"
            >
              Sign out
            </button>

            {/* Mobile menu toggle */}
            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setMenuOpen((o) => !o)}
              className="grid h-9 w-9 place-items-center rounded-xl border border-ink-200 bg-white md:hidden"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5">
                {menuOpen
                  ? <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                  : <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                }
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {menuOpen && (
          <div className="border-t border-ink-200 bg-white px-4 pb-4 pt-2 md:hidden">
            <nav className="space-y-1">
              {links.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  end={l.end}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `block rounded-xl px-3 py-2 text-sm font-medium ${
                      isActive ? 'bg-ink-900 text-white' : 'text-ink-700 hover:bg-ink-100'
                    }`
                  }
                >
                  {l.label}
                </NavLink>
              ))}
            </nav>
          </div>
        )}
      </header>

      {/* Content */}
      <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:py-8">
        <Outlet />
      </main>
    </div>
  );
}

/* ── Role chip ─────────────────────────────────────────── */
function RoleChip({ role, platformAdmin }: { role?: string; platformAdmin: boolean }) {
  if (platformAdmin)
    return (
      <span className="">
        <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
      </span>
    );
  if (role === 'owner')
    return (
      <span className="hidden items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 ring-1 ring-inset ring-amber-100 sm:inline-flex">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        Workspace owner
      </span>
    );
  if (role === 'member')
    return (
      <span className="hidden items-center gap-1.5 rounded-full bg-cyan-50 px-2.5 py-1 text-[11px] font-semibold text-cyan-700 ring-1 ring-inset ring-cyan-100 sm:inline-flex">
        <span className="h-1.5 w-1.5 rounded-full bg-cyan-500" />
        Member
      </span>
    );
  if (role === 'client')
    return (
      <span className="hidden items-center gap-1.5 rounded-full bg-ink-100 px-2.5 py-1 text-[11px] font-semibold text-ink-600 sm:inline-flex">
        <span className="h-1.5 w-1.5 rounded-full bg-ink-400" />
        Client
      </span>
    );
  return null;
}

/* ── Nav link builder ──────────────────────────────────── */
interface NavItem {
  to: string;
  label: string;
  end?: boolean;
  badge?: string;
  icon?: React.FC<React.SVGProps<SVGSVGElement>>;
}

function buildNavLinks({
  isAdmin,
  myRole,
  workspaceId,
}: {
  isAdmin: boolean;
  myRole?: string;
  workspaceId?: string;
}): NavItem[] {
  if (isAdmin) {
    return [
      { to: '/dashboard', label: 'Dashboard', end: true, icon: IconGrid },
      { to: '/dashboard/workspaces', label: 'Workspaces', end: true, icon: IconBox },
      { to: '/dashboard/activity', label: 'Activity', icon: IconActivity },
      {
        to: '/dashboard/all-workspaces',
        label: 'All workspaces',
        icon: IconLayers,
      },
      { to: '/dashboard/users', label: 'Users', icon: IconPeople },
      { to: '/dashboard/billing', label: 'Billing', icon: IconCreditCard },
      { to: '/dashboard/settings', label: 'Settings', icon: IconCog },
    ];
  }
  if (myRole === 'owner') {
    return [
      { to: '/dashboard', label: 'Dashboard', end: true, icon: IconGrid },
      { to: '/dashboard/workspaces', label: 'Workspaces', end: true, icon: IconBox },
      ...(workspaceId
        ? [{ to: `/dashboard/workspaces/${workspaceId}/projects`, label: 'Projects', icon: IconLayers }]
        : []),
    ];
  }
  if (myRole === 'member') {
    return [
      { to: '/dashboard', label: 'My tasks', end: true, icon: IconCheck },
      { to: '/dashboard/workspaces', label: 'Workspaces', end: true, icon: IconBox },
      ...(workspaceId
        ? [{ to: `/dashboard/workspaces/${workspaceId}/projects`, label: 'Projects', icon: IconLayers }]
        : []),
    ];
  }
  // client
  return [
    { to: '/dashboard', label: 'Overview', end: true, icon: IconGrid },
    workspaceId
      ? { to: `/dashboard/workspaces/${workspaceId}/projects`, label: 'Projects', icon: IconLayers }
      : { to: '/dashboard/workspaces', label: 'Projects', end: true, icon: IconLayers },
  ];
}

/* ── Micro icons ────────────────────────────────────────── */
type IP = React.SVGProps<SVGSVGElement>;
const mkIcon =
  (path: React.ReactNode) =>
  (p: IP) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...p}
    >
      {path}
    </svg>
  );

const IconGrid = mkIcon(
  <>
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </>,
);
const IconBox = mkIcon(
  <>
    <path d="M3 7l9-4 9 4-9 4-9-4z" />
    <path d="M3 7v10l9 4 9-4V7" />
  </>,
);
const IconLayers = mkIcon(
  <>
    <path d="M12 3l9 4.5-9 4.5-9-4.5L12 3z" />
    <path d="M3 12l9 4.5L21 12" />
  </>,
);
const IconCheck = mkIcon(<path d="M5 12.5l4 4L19 7" />);
const IconActivity = mkIcon(<path d="M3 12h4l3-7 4 14 3-7h4" />);
const IconPeople = mkIcon(
  <>
    <circle cx="9" cy="8" r="3" />
    <path d="M3 19c.5-3.2 3-5 6-5s5.5 1.8 6 5" />
    <circle cx="17" cy="9" r="2.4" />
    <path d="M15.5 14.5c2.5.4 4.4 2 5 4.5" />
  </>,
);
const IconCreditCard = mkIcon(
  <>
    <rect x="2" y="6" width="20" height="13" rx="2" />
    <path d="M2 11h20M6 16h4" />
  </>,
);
const IconCog = mkIcon(
  <>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9A1.7 1.7 0 0 0 10 3.1V3a2 2 0 1 1 4 0v.1A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9c0 .7.4 1.3 1 1.5h.1a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
  </>,
);
