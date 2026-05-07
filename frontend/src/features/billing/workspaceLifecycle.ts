import type { AdminBillingWorkspaceRow, AdminPaymentRow } from '../admin/hooks';

/** UI lifecycle aligned with enterprise ops views (backend supplies subset). */
export type SubscriptionLifecycle =
  | 'active'
  | 'trialing'
  | 'paused'
  | 'canceled'
  | 'past_due'
  | 'unpaid'
  | 'grace_period'
  | 'scheduled_cancel';

export function deriveWorkspaceLifecycle(
  w: AdminBillingWorkspaceRow,
  failedForWorkspace: AdminPaymentRow[],
): SubscriptionLifecycle {
  if (w.status === 'suspended') return 'paused';

  const trialEnd = w.trialEndsAt ? new Date(w.trialEndsAt).getTime() : null;
  const inTrial = trialEnd != null && trialEnd > Date.now();

  const retryPending = failedForWorkspace.some(
    (p) =>
      p.status?.toLowerCase().includes('fail') ||
      p.status?.toLowerCase().includes('retry') ||
      Boolean(p.nextRetryAt),
  );

  if (retryPending && (w.plan === 'pro' || w.plan === 'enterprise')) {
    return 'past_due';
  }

  if (inTrial) return 'trialing';

  // Ledger does not yet expose cancel-at-period-end; reserved for future mapping.
  return 'active';
}

export function lifecycleLabel(s: SubscriptionLifecycle): string {
  const map: Record<SubscriptionLifecycle, string> = {
    active: 'Active',
    trialing: 'Trialing',
    paused: 'Paused',
    canceled: 'Canceled',
    past_due: 'Past due',
    unpaid: 'Unpaid',
    grace_period: 'Grace period',
    scheduled_cancel: 'Scheduled cancel',
  };
  return map[s];
}
