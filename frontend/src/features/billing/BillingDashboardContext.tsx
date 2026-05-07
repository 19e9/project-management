import { createContext, useContext, type ReactNode } from 'react';
import type { UseQueryResult } from '@tanstack/react-query';
import { useAdminBilling, type AdminBillingDashboard } from '../admin/hooks';

const BillingDashboardContext = createContext<UseQueryResult<
  AdminBillingDashboard,
  Error
> | null>(null);

export function BillingDashboardProvider({ children }: { children: ReactNode }) {
  const q = useAdminBilling({ limit: 250, q: '' });
  return (
    <BillingDashboardContext.Provider value={q}>{children}</BillingDashboardContext.Provider>
  );
}

export function useBillingDashboard() {
  const ctx = useContext(BillingDashboardContext);
  if (!ctx) {
    throw new Error('useBillingDashboard must be used within BillingDashboardProvider');
  }
  return ctx;
}
