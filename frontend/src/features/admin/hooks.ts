import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api-client';

export interface AdminOverview {
  users: { total: number; active: number; newInWindow: number; changePct: number };
  workspaces: {
    total: number;
    active: number;
    suspended: number;
    newInWindow: number;
    changePct: number;
  };
  projects: {
    total: number;
    active: number;
    archived: number;
    newInWindow: number;
    changePct: number;
  };
  tasks: {
    total: number;
    newInWindow: number;
    changePct: number;
    completed: number;
    inProgress: number;
    blocked: number;
    notStarted: number;
    cancelled: number;
    overdue: number;
    completionPct: number;
  };
  plans: { free: number; pro: number; enterprise: number };
  generatedAt: string;
}

export interface GrowthPoint {
  date: string;
  users: number;
  workspaces: number;
  projects: number;
}

export interface StatusDistribution {
  not_started: number;
  in_progress: number;
  blocked: number;
  done: number;
  cancelled: number;
}

export interface RoleDistribution {
  owner: number;
  member: number;
  client: number;
  platform_admin: number;
}

export interface AdminWorkspaceRow {
  id: string;
  name: string;
  plan: 'free' | 'pro' | 'enterprise';
  status: 'active' | 'suspended';
  owner: { id: string; displayName: string; email: string } | null;
  memberCount: number;
  projectCount: number;
  taskCount: number;
  lastActivityAt: string | null;
  createdAt: string;
}

export interface AdminUserRow {
  id: string;
  email: string;
  displayName: string;
  platformRole: 'platform_admin' | 'user';
  isActive: boolean;
  authProviders: string[];
  avatarUrl: string | null;
  workspaceMemberships: number;
  createdAt: string;
  lastLoginAt: string | null;
  subscriptionTier: 'free' | 'pro' | 'enterprise';
  subscriptionLabel: string;
}

export type ActivityKind =
  | 'user_joined'
  | 'workspace_created'
  | 'project_created'
  | 'task_completed'
  | 'task_updated';

export interface ActivityEvent {
  id: string;
  kind: ActivityKind;
  at: string;
  actor?: { id: string; displayName: string };
  workspace?: { id: string; name: string };
  target?: { id: string; label: string };
}

export interface OverloadedUser {
  userId: string;
  displayName: string;
  email: string;
  activeTaskCount: number;
  allocationPct: number;
}

export interface OverdueTaskRow {
  taskId: string;
  title: string;
  projectId: string;
  projectName: string;
  endDate: string;
  daysOverdue: number;
  priority: string;
  assigneeIds: string[];
}

export interface SystemWarning {
  id: string;
  level: 'info' | 'warning' | 'critical';
  title: string;
  body: string;
}

export interface AdminInsights {
  overloadedUsers: OverloadedUser[];
  overdueTasks: OverdueTaskRow[];
  warnings: SystemWarning[];
}

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
export interface AdminPlanDefaultRow {
  plan: 'free' | 'pro' | 'enterprise';
  maxMembers: number;
  maxProjects: number;
  ganttEnabled: boolean;
  cpmEnabled: boolean;
  auditLogEnabled: boolean;
}

export interface AdminPlatformSettings {
  generatedAt: string;
  environment: string;
  release: { version: string };
  product: {
    displayName: string;
    supportEmail: string;
    openRegistration: boolean;
    maintenanceMode: boolean;
    defaultNewWorkspacePlan: 'free' | 'pro' | 'enterprise';
    billingProSeatUsdMonthly: number;
  };
  api: {
    port: number;
    corsOrigins: string[];
    publicBaseUrl: string;
    globalPrefix: string;
    swaggerPath: string;
  };
  httpSecurity: {
    helmetContentSecurityPolicy: boolean;
    corsCredentialsEnabled: boolean;
  };
  validation: {
    transformEnabled: boolean;
    stripUnknownFields: boolean;
    forbidNonWhitelistedBody: boolean;
  };
  rateLimit: { windowMs: number; maxRequests: number };
  auth: {
    accessTokenTtlSeconds: number;
    refreshTokenTtlSeconds: number;
    googleOAuthConfigured: boolean;
    googleCallbackUrl: string;
  };
  database: {
    readyState: number;
    connected: boolean;
    mongoHostSummary: string;
  };
  inventory: {
    users: number;
    workspaces: number;
    projects: number;
    tasks: number;
    platformAdmins: number;
  };
  planDefaults: AdminPlanDefaultRow[];
  notes: string[];
}

const REFRESH_INTERVAL = 60_000;

export function useAdminOverview() {
  return useQuery({
    queryKey: ['admin', 'overview'],
    queryFn: async () => (await api.get<AdminOverview>('/admin/stats/overview')).data,
    refetchInterval: REFRESH_INTERVAL,
  });
}

export function useAdminGrowth(days = 30) {
  return useQuery({
    queryKey: ['admin', 'growth', days],
    queryFn: async () =>
      (await api.get<GrowthPoint[]>(`/admin/stats/growth?days=${days}`)).data,
    refetchInterval: REFRESH_INTERVAL,
  });
}

export function useTasksByStatus() {
  return useQuery({
    queryKey: ['admin', 'tasks-by-status'],
    queryFn: async () =>
      (await api.get<StatusDistribution>('/admin/stats/tasks-by-status')).data,
    refetchInterval: REFRESH_INTERVAL,
  });
}

export function useRoleDistribution() {
  return useQuery({
    queryKey: ['admin', 'role-distribution'],
    queryFn: async () =>
      (await api.get<RoleDistribution>('/admin/stats/role-distribution')).data,
    refetchInterval: REFRESH_INTERVAL,
  });
}

export function useAdminWorkspaces(q = '') {
  return useQuery({
    queryKey: ['admin', 'workspaces', q],
    queryFn: async () =>
      (
        await api.get<{ items: AdminWorkspaceRow[] }>(
          `/admin/workspaces?limit=25${q ? `&q=${encodeURIComponent(q)}` : ''}`,
        )
      ).data,
  });
}

export function useAdminUsers(q = '', limit = 100) {
  return useQuery({
    queryKey: ['admin', 'users', q, limit],
    queryFn: async () =>
      (
        await api.get<{ items: AdminUserRow[] }>(
          `/admin/users?limit=${limit}${q ? `&q=${encodeURIComponent(q)}` : ''}`,
        )
      ).data,
  });
}

export type PatchAdminUserBody = Partial<{
  displayName: string;
  email: string;
  timezone: string;
  platformRole: 'platform_admin' | 'user';
  isActive: boolean;
}>;

export function usePatchAdminUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: { userId: string; body: PatchAdminUserBody }) => {
      const { data } = await api.patch<AdminUserRow>(`/admin/users/${p.userId}`, p.body);
      return data;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });
}

export function useSoftDeleteAdminUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      await api.delete(`/admin/users/${userId}`);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });
}

export function useAdminResetPassword() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: { userId: string; newPassword: string }) => {
      await api.post(`/admin/users/${p.userId}/reset-password`, {
        newPassword: p.newPassword,
      });
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });
}

export function useAdminRevokeSessions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      await api.post(`/admin/users/${userId}/revoke-sessions`);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });
}

export function useAdminPlatformSettings() {
  return useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: async () => (await api.get<AdminPlatformSettings>('/admin/settings')).data,
    refetchInterval: REFRESH_INTERVAL,
  });
}

export function useAdminBilling(opts: { limit?: number; q?: string } = {}) {
  const limit = opts.limit ?? 100;
  const q = opts.q ?? '';
  return useQuery({
    queryKey: ['admin', 'billing', limit, q],
    queryFn: async () =>
      (
        await api.get<AdminBillingDashboard>(
          `/admin/billing?limit=${limit}${q ? `&q=${encodeURIComponent(q)}` : ''}`,
        )
      ).data,
    refetchInterval: REFRESH_INTERVAL,
  });
}

export function useAdminWorkspaceBillingDetail(workspaceId: string | null) {
  return useQuery({
    queryKey: ['admin', 'billing', 'workspace', workspaceId],
    queryFn: async () =>
      (await api.get<AdminWorkspaceBillingDetail>(`/admin/billing/workspaces/${workspaceId}`)).data,
    enabled: Boolean(workspaceId),
  });
}

export async function downloadAdminBillingCsv(kind: 'invoices' | 'payments' | 'monthly-report') {
  const path =
    kind === 'invoices'
      ? '/admin/billing/export/invoices'
      : kind === 'payments'
        ? '/admin/billing/export/payments'
        : '/admin/billing/export/monthly-report';
  const res = await api.get(path, { responseType: 'blob' });
  const blob = res.data as Blob;
  const dispo = res.headers['content-disposition'] as string | undefined;
  const nameMatch = dispo?.match(/filename="([^"]+)"/);
  const filename = nameMatch?.[1] ?? `${kind}.csv`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function openInvoiceHtmlTab(invoiceId: string) {
  const res = await api.get(`/admin/billing/invoices/${invoiceId}/html`, { responseType: 'blob' });
  const blob = new Blob([res.data as BlobPart], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank', 'noopener,noreferrer');
  setTimeout(() => URL.revokeObjectURL(url), 120_000);
}

export function useAssignWorkspacePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: { workspaceId: string; subscriptionPlanId: string }) => {
      await api.post(`/admin/billing/workspaces/${p.workspaceId}/plan`, {
        subscriptionPlanId: p.subscriptionPlanId,
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'billing'] });
      void qc.invalidateQueries({ queryKey: ['admin', 'billing', 'workspace'] });
    },
  });
}

export function useUpsertEnterpriseContract() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: {
      workspaceId: string;
      monthlyAmountUsd: number;
      contractStart: string;
      contractEnd?: string;
      trialEndsAt?: string;
      notes?: string;
      manualInvoiceUrls?: string[];
    }) => {
      const { workspaceId, ...body } = p;
      await api.post(`/admin/billing/workspaces/${workspaceId}/enterprise-contract`, body);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'billing'] });
      void qc.invalidateQueries({ queryKey: ['admin', 'billing', 'workspace'] });
    },
  });
}

export function useCreateSubscriptionPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Partial<AdminSubscriptionPlanRow> & { key: string; displayName: string; tier: 'free' | 'pro' | 'enterprise' }) => {
      await api.post('/admin/billing/plans', body);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['admin', 'billing'] }),
  });
}

export function useUpdateSubscriptionPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: { id: string; patch: Partial<AdminSubscriptionPlanRow> }) => {
      await api.patch(`/admin/billing/plans/${p.id}`, p.patch);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['admin', 'billing'] }),
  });
}

export function useDeactivateSubscriptionPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/admin/billing/plans/${id}/deactivate`);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['admin', 'billing'] }),
  });
}

export function useAdminActivity(limit = 30) {
  return useQuery({
    queryKey: ['admin', 'activity', limit],
    queryFn: async () =>
      (await api.get<ActivityEvent[]>(`/admin/activity?limit=${limit}`)).data,
    refetchInterval: REFRESH_INTERVAL,
  });
}

export function useAdminInsights() {
  return useQuery({
    queryKey: ['admin', 'insights'],
    queryFn: async () => (await api.get<AdminInsights>('/admin/insights')).data,
    refetchInterval: REFRESH_INTERVAL,
  });
}
