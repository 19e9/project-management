import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { AdminSidebar } from './AdminSidebar';
import { AdminTopBar } from './AdminTopBar';

export default function AdminLayout() {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const loc = useLocation();
  const generatedAt = (qc.getQueryData(['admin', 'overview']) as any)?.generatedAt as
    | string
    | undefined;

  async function refresh() {
    setRefreshing(true);
    try {
      await qc.invalidateQueries({ queryKey: ['admin'] });
      // Allow UI to settle before unspinning the icon.
      await new Promise((r) => setTimeout(r, 350));
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div className="min-h-screen bg-ink-50/40">
      {/* Sidebar — desktop */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 lg:block">
        <AdminSidebar />
      </aside>

      {/* Sidebar — mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-30 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-ink-950/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-72 shadow-2xl">
            <AdminSidebar onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}

      <div className="lg:pl-64">
        <AdminTopBar
          onMenu={() => setOpen(true)}
          onRefresh={refresh}
          refreshing={refreshing}
          generatedAt={generatedAt}
        />
        <main key={loc.pathname} className="container max-w-none px-4 py-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
