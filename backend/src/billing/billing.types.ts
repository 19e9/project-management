/** Admin billing dashboard — shared contract for GET /admin/billing */

export interface AdminBillingAlert {
  id: string;
  level: 'info' | 'warning' | 'critical';
  title: string;
  body: string;
  workspaceId?: string;
}

export interface AdminMrrBreakdown {
  newMrrUsd: number;
  expansionMrrUsd: number;
  churnedMrrUsd: number;
  /** Logo MRR (renewing base) — total - new - expansion + churn approximation */
  netMrrChangeUsd: number;
  arpuUsd: number;
  ltvEstimateUsd: number;
  churnRateMonthlyPct: number;
  payingAccountCount: number;
  windowDays: number;
}

export interface AdminBillingWorkspaceRow {
  id: string;
  name: string;
  plan: 'free' | 'pro' | 'enterprise';
  status: 'active' | 'suspended';
  subscriptionPlanKey: string | null;
  owner: { id: string; displayName: string; email: string } | null;
  billableSeats: number;
  clientSeats: number;
  mrrUsd: number;
  enterpriseContractUsd: number | null;
  /** vs previous 30d revenue (payments) */
  revenueGrowthPct: number | null;
  revenueLast30dUsd: number;
  revenuePrev30dUsd: number;
  trend: 'up' | 'down' | 'flat';
  trialEndsAt: string | null;
  createdAt: string;
}

export interface AdminInvoiceRow {
  id: string;
  invoiceNumber: string;
  workspaceId: string;
  workspaceName: string;
  status: string;
  amountDueFinalUsd: number;
  issuedAt: string;
  dueAt: string;
  paidAt: string | null;
  source: string;
}

export interface AdminPaymentRow {
  id: string;
  workspaceId: string;
  workspaceName: string;
  invoiceId: string | null;
  amountUsd: number;
  status: string;
  method: string;
  failureMessage: string | null;
  attemptCount: number;
  nextRetryAt: string | null;
  createdAt: string;
  settledAt: string | null;
}

export interface AdminRefundRow {
  id: string;
  paymentId: string;
  workspaceId: string;
  amountUsd: number;
  status: string;
  reason: string | null;
  createdAt: string;
}

export interface AdminSubscriptionPlanRow {
  id: string;
  key: string;
  displayName: string;
  tier: 'free' | 'pro' | 'enterprise';
  pricePerSeatMonthlyUsd: number;
  maxMembers: number;
  maxProjects: number;
  storageLimitMb: number;
  ganttEnabled: boolean;
  cpmEnabled: boolean;
  auditLogEnabled: boolean;
  isActive: boolean;
  isDefaultForTier: boolean;
  sortOrder: number;
  marketingDescription: string;
  annualDiscountPercent: number;
  isHighlighted: boolean;
  ctaLabel: string;
  ctaHref: string;
  useCustomPricing: boolean;
  customPriceLabel: string;
  marketingBullets: string[];
}

/** Active plans exposed to the marketing site (no auth). */
export interface PublicPricingPlan {
  id: string;
  key: string;
  displayName: string;
  tier: 'free' | 'pro' | 'enterprise';
  sortOrder: number;
  isHighlighted: boolean;
  marketingDescription: string;
  pricing: {
    model: 'free' | 'per_seat' | 'custom';
    /** Monthly seat price when billed monthly (USD) */
    seatPriceMonthlyUsd: number;
    /** Equivalent $/seat/month when billed annually after discount */
    seatPriceEffectiveMonthlyAnnualUsd: number;
    annualDiscountPercent: number;
    /** Shown when model === custom */
    customLabel: string | null;
  };
  limits: {
    maxMembers: number;
    maxProjects: number;
    storageMb: number;
  };
  features: {
    gantt: boolean;
    cpm: boolean;
    auditLog: boolean;
  };
  /** Lines with checkmarks on the pricing card */
  bullets: string[];
  cta: { label: string; href: string };
}

export interface PublicPricingResponse {
  currency: string;
  generatedAt: string;
  /** Largest annual discount among numeric plans — for the billing toggle badge */
  maxAnnualDiscountPercent: number;
  plans: PublicPricingPlan[];
}

export interface AdminEnterpriseContractRow {
  id: string;
  workspaceId: string;
  workspaceName: string;
  monthlyAmountUsd: number;
  contractStart: string;
  contractEnd: string | null;
  trialEndsAt: string | null;
  notes: string | null;
  manualInvoiceUrls: string[];
}

export interface AdminBillingTimePoint {
  date: string;
  paymentCashUsd: number;
  invoiceIssuedUsd: number;
}

export interface AdminWorkspaceRevenueBar {
  workspaceId: string;
  name: string;
  revenue30dUsd: number;
}

export interface AdminWorkspaceBillingDetail {
  workspace: {
    id: string;
    name: string;
    plan: string;
    status: string;
    subscriptionPlanId: string | null;
    subscriptionPlanKey: string | null;
    trialEndsAt: string | null;
  };
  invoices: AdminInvoiceRow[];
  payments: AdminPaymentRow[];
  refunds: AdminRefundRow[];
  planChanges: Array<{
    id: string;
    fromPlanKey: string;
    toPlanKey: string;
    fromTier?: string;
    toTier?: string;
    changedAt: string;
    reason: string | null;
  }>;
  seatEvents: Array<{
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    role: string;
    action: string;
    billableAfter: boolean;
    occurredAt: string;
  }>;
  contract: AdminEnterpriseContractRow | null;
}

export interface AdminBillingDashboard {
  generatedAt: string;
  currency: string;
  ledgerEnabled: true;
  disclaimer: string;
  /** Total accrual-style MRR (Pro seats + Enterprise contracts). */
  mrrTotalUsd: number;
  arrTotalUsd: number;
  payingSeatCount: number;
  proSeatListUsd: number;
  breakdown: AdminMrrBreakdown;
  planDistribution: { free: number; pro: number; enterprise: number };
  workspaces: AdminBillingWorkspaceRow[];
  invoices: AdminInvoiceRow[];
  payments: AdminPaymentRow[];
  refunds: AdminRefundRow[];
  failedPayments: AdminPaymentRow[];
  plans: AdminSubscriptionPlanRow[];
  enterpriseContracts: AdminEnterpriseContractRow[];
  alerts: AdminBillingAlert[];
  mrrTrend: AdminBillingTimePoint[];
  revenueByWorkspace: AdminWorkspaceRevenueBar[];
}
