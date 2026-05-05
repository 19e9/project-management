import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './features/auth/AuthProvider';
import LandingPage from './pages/LandingPage';
import PricingPage from './pages/PricingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import OAuthCallbackPage from './pages/auth/OAuthCallbackPage';
import DashboardPage from './pages/DashboardPage';
import WorkspacesPage from './pages/WorkspacesPage';
import ProjectsPage from './pages/ProjectsPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import AppLayout from './layouts/AppLayout';
import AdminPlaceholderPage from './pages/admin/AdminPlaceholderPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminBillingPage from './pages/admin/AdminBillingPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';

function FullPageLoader() {
  return (
    <div className="grid h-screen place-items-center text-ink-500">
      <span className="inline-flex items-center gap-2 text-sm">
        <svg viewBox="0 0 24 24" className="h-4 w-4 animate-spin" fill="none" aria-hidden>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity=".3" strokeWidth="2.5" />
          <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
        Loading…
      </span>
    </div>
  );
}

function Protected({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <FullPageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PlatformAdminOnly({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <FullPageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.platformRole !== 'platform_admin') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function LegacyAppRedirect() {
  const { pathname, search } = useLocation();
  const to = pathname.replace(/^\/app/, '/dashboard') + search;
  return <Navigate to={to} replace />;
}

/** /admin/* → /dashboard/* (no /platform segment) */
function LegacyAdminRedirect() {
  const { pathname, search } = useLocation();
  let to: string;
  if (pathname === '/admin' || pathname === '/admin/') {
    to = '/dashboard';
  } else if (pathname.startsWith('/admin/')) {
    const rest = pathname.slice('/admin/'.length);
    const map: Record<string, string> = {
      activity: '/dashboard/activity',
      workspaces: '/dashboard/all-workspaces',
      users: '/dashboard/users',
      billing: '/dashboard/billing',
      settings: '/dashboard/settings',
    };
    to = map[rest] ?? '/dashboard';
  } else {
    to = '/dashboard';
  }
  return <Navigate to={to + search} replace />;
}

/** Old /dashboard/platform/* bookmarks → flat routes */
function LegacyDashboardPlatformRedirect() {
  const { pathname, search } = useLocation();
  const rest = pathname.replace(/^\/dashboard\/platform\/?/, '').replace(/\/$/, '');
  const map: Record<string, string> = {
    '': '/dashboard',
    activity: '/dashboard/activity',
    workspaces: '/dashboard/all-workspaces',
    users: '/dashboard/users',
    billing: '/dashboard/billing',
    settings: '/dashboard/settings',
  };
  const to = map[rest] ?? '/dashboard';
  return <Navigate to={to + search} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/auth/callback" element={<OAuthCallbackPage />} />

      <Route path="/app/*" element={<LegacyAppRedirect />} />
      <Route path="/admin/*" element={<LegacyAdminRedirect />} />
      <Route path="/dashboard/platform/*" element={<LegacyDashboardPlatformRedirect />} />

      <Route
        element={
          <Protected>
            <AppLayout />
          </Protected>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/dashboard/workspaces" element={<WorkspacesPage />} />
        <Route
          path="/dashboard/workspaces/:workspaceId/projects"
          element={<ProjectsPage />}
        />
        <Route
          path="/dashboard/workspaces/:workspaceId/projects/:projectId"
          element={<ProjectDetailPage />}
        />

        <Route
          path="/dashboard/activity"
          element={
            <PlatformAdminOnly>
              <AdminPlaceholderPage
                title="Activity log"
                hint="Full audit trail across users, workspaces, projects and tasks."
              />
            </PlatformAdminOnly>
          }
        />
        <Route
          path="/dashboard/all-workspaces"
          element={
            <PlatformAdminOnly>
              <AdminPlaceholderPage
                title="Platform workspaces"
                hint="Browse, search and manage every workspace on the platform."
              />
            </PlatformAdminOnly>
          }
        />
        <Route
          path="/dashboard/users"
          element={
            <PlatformAdminOnly>
              <AdminUsersPage />
            </PlatformAdminOnly>
          }
        />
        <Route
          path="/dashboard/billing"
          element={
            <PlatformAdminOnly>
              <AdminBillingPage />
            </PlatformAdminOnly>
          }
        />
        <Route
          path="/dashboard/settings"
          element={
            <PlatformAdminOnly>
              <AdminSettingsPage />
            </PlatformAdminOnly>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
