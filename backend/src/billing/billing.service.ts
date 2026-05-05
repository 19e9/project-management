import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  SubscriptionPlan,
  SubscriptionPlanDocument,
} from './schemas/subscription-plan.schema';
import { Invoice, InvoiceDocument } from './schemas/invoice.schema';
import { Payment, PaymentDocument } from './schemas/payment.schema';
import { Refund, RefundDocument } from './schemas/refund.schema';
import {
  EnterpriseContract,
  EnterpriseContractDocument,
} from './schemas/enterprise-contract.schema';
import {
  PlanChangeLog,
  PlanChangeLogDocument,
} from './schemas/plan-change-log.schema';
import { SeatEvent, SeatEventDocument } from './schemas/seat-event.schema';
import { Workspace, WorkspaceDocument } from '../workspaces/schemas/workspace.schema';
import {
  WorkspaceMember,
  WorkspaceMemberDocument,
} from '../workspaces/schemas/workspace-member.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import type {
  AdminBillingDashboard,
  AdminBillingAlert,
  AdminBillingWorkspaceRow,
  AdminEnterpriseContractRow,
  AdminInvoiceRow,
  AdminMrrBreakdown,
  AdminPaymentRow,
  AdminRefundRow,
  AdminSubscriptionPlanRow,
  AdminWorkspaceBillingDetail,
  AdminWorkspaceRevenueBar,
  AdminBillingTimePoint,
} from './billing.types';

const DAY = 86_400_000;

type SeatAction = 'added' | 'removed' | 'role_changed' | 'reactivated';

@Injectable()
export class BillingService implements OnModuleInit {
  constructor(
    private readonly cfg: ConfigService,
    @InjectModel(SubscriptionPlan.name)
    private readonly plans: Model<SubscriptionPlanDocument>,
    @InjectModel(Invoice.name) private readonly invoices: Model<InvoiceDocument>,
    @InjectModel(Payment.name) private readonly payments: Model<PaymentDocument>,
    @InjectModel(Refund.name) private readonly refunds: Model<RefundDocument>,
    @InjectModel(EnterpriseContract.name)
    private readonly contracts: Model<EnterpriseContractDocument>,
    @InjectModel(PlanChangeLog.name)
    private readonly planLogs: Model<PlanChangeLogDocument>,
    @InjectModel(SeatEvent.name) private readonly seatEvents: Model<SeatEventDocument>,
    @InjectModel(Workspace.name) private readonly workspaces: Model<WorkspaceDocument>,
    @InjectModel(WorkspaceMember.name) private readonly members: Model<WorkspaceMemberDocument>,
    @InjectModel(User.name) private readonly users: Model<UserDocument>,
  ) {}

  async onModuleInit() {
    await this.ensureDefaultPlans();
    await this.reconcileWorkspaceSubscriptionPlans();
  }

  listPrice(): number {
    return this.cfg.get<number>('BILLING_PRO_SEAT_USD_MONTHLY') ?? 12;
  }

  async ensureDefaultPlans() {
    const defs = [
      {
        key: 'free-default',
        displayName: 'Free',
        tier: 'free' as const,
        pricePerSeatMonthlyUsd: 0,
        maxMembers: 10,
        maxProjects: 3,
        storageLimitMb: 2048,
        ganttEnabled: true,
        cpmEnabled: false,
        auditLogEnabled: false,
        isDefaultForTier: true,
        sortOrder: 0,
      },
      {
        key: 'pro-default',
        displayName: 'Pro',
        tier: 'pro' as const,
        pricePerSeatMonthlyUsd: this.listPrice(),
        maxMembers: 50,
        maxProjects: 50,
        storageLimitMb: 51_200,
        ganttEnabled: true,
        cpmEnabled: true,
        auditLogEnabled: false,
        isDefaultForTier: true,
        sortOrder: 1,
      },
      {
        key: 'enterprise-default',
        displayName: 'Enterprise',
        tier: 'enterprise' as const,
        pricePerSeatMonthlyUsd: 0,
        maxMembers: 100_000,
        maxProjects: 100_000,
        storageLimitMb: 1_048_576,
        ganttEnabled: true,
        cpmEnabled: true,
        auditLogEnabled: true,
        isDefaultForTier: true,
        sortOrder: 2,
      },
    ];
    for (const d of defs) {
      const { pricePerSeatMonthlyUsd, ...rest } = d as any;
      await this.plans.updateOne(
        { key: d.key },
        {
          $set: {
            displayName: rest.displayName,
            tier: rest.tier,
            pricePerSeatMonthlyUsd:
              d.key === 'pro-default' ? this.listPrice() : pricePerSeatMonthlyUsd ?? 0,
            maxMembers: rest.maxMembers,
            maxProjects: rest.maxProjects,
            storageLimitMb: rest.storageLimitMb,
            ganttEnabled: rest.ganttEnabled,
            cpmEnabled: rest.cpmEnabled,
            auditLogEnabled: rest.auditLogEnabled,
            isActive: true,
            isDefaultForTier: rest.isDefaultForTier,
            sortOrder: rest.sortOrder,
          },
          $setOnInsert: { key: d.key },
        },
        { upsert: true },
      );
    }
  }

  async getDefaultPlanIdForTier(
    tier: 'free' | 'pro' | 'enterprise',
  ): Promise<Types.ObjectId | undefined> {
    await this.ensureDefaultPlans();
    const p = await this.plans
      .findOne({ tier, isDefaultForTier: true, isActive: true })
      .select('_id')
      .lean();
    return p?._id as Types.ObjectId | undefined;
  }

  /** Snapshot for workspace creation / reconciliation */
  async getDefaultPlanForTier(tier: 'free' | 'pro' | 'enterprise'): Promise<{
    id: string;
    tier: 'free' | 'pro' | 'enterprise';
    entitlements: {
      maxMembers: number;
      maxProjects: number;
      ganttEnabled: boolean;
      cpmEnabled: boolean;
      auditLogEnabled: boolean;
    };
  } | null> {
    await this.ensureDefaultPlans();
    const p = await this.plans
      .findOne({ tier, isDefaultForTier: true, isActive: true })
      .lean();
    if (!p) return null;
    return {
      id: String(p._id),
      tier: p.tier,
      entitlements: {
        maxMembers: p.maxMembers,
        maxProjects: p.maxProjects,
        ganttEnabled: p.ganttEnabled,
        cpmEnabled: p.cpmEnabled,
        auditLogEnabled: p.auditLogEnabled,
      },
    };
  }

  /** Attach default SubscriptionPlan + entitlements to legacy workspaces. */
  async reconcileWorkspaceSubscriptionPlans() {
    for (const tier of ['free', 'pro', 'enterprise'] as const) {
      const plan = await this.plans
        .findOne({ tier, isDefaultForTier: true, isActive: true })
        .lean();
      if (!plan) continue;
      await this.workspaces.updateMany(
        {
          plan: tier,
          $or: [
            { subscriptionPlanId: { $exists: false } },
            { subscriptionPlanId: null },
          ],
        },
        {
          $set: {
            subscriptionPlanId: plan._id,
            entitlements: {
              maxMembers: plan.maxMembers,
              maxProjects: plan.maxProjects,
              ganttEnabled: plan.ganttEnabled,
              cpmEnabled: plan.cpmEnabled,
              auditLogEnabled: plan.auditLogEnabled,
            },
          },
        },
      );
    }
  }

  async recordSeatEvent(opts: {
    workspaceId: string;
    userId: string;
    role: 'owner' | 'member' | 'client';
    action: SeatAction;
    billableAfter: boolean;
    at?: Date;
  }) {
    await this.seatEvents.create({
      workspaceId: new Types.ObjectId(opts.workspaceId),
      userId: new Types.ObjectId(opts.userId),
      role: opts.role,
      action: opts.action,
      billableAfter: opts.billableAfter,
      occurredAt: opts.at ?? new Date(),
    });
  }

  private estimateMrrSync(
    ws: any,
    billableSeats: number,
    planById: Map<string, any>,
    contract?: { monthlyAmountUsd: number } | null,
  ): { mrr: number; contractUsd: number | null } {
    const contractUsd = contract?.monthlyAmountUsd ?? null;

    let plan = ws.subscriptionPlanId
      ? planById.get(String(ws.subscriptionPlanId))
      : undefined;
    if (!plan) {
      plan = [...planById.values()].find((p:any) => p.tier === ws.plan && p.isDefaultForTier);
    }
    const price = plan?.pricePerSeatMonthlyUsd ?? (ws.plan === 'pro' ? this.listPrice() : 0);

    if (ws.plan === 'enterprise') {
      if (contractUsd != null && contractUsd > 0) {
        return { mrr: contractUsd, contractUsd };
      }
      return { mrr: 0, contractUsd: contractUsd ?? null };
    }
    if (ws.plan === 'pro' && ws.status === 'active') {
      return { mrr: Math.round(billableSeats * price * 100) / 100, contractUsd: null };
    }
    return { mrr: 0, contractUsd: null };
  }

  async getAdminDashboard(opts: {
    workspaceLimit: number;
    workspaceSearch?: string;
  }): Promise<AdminBillingDashboard> {
    await this.ensureDefaultPlans();
    const now = new Date();
    const generatedAt = now.toISOString();
    const windowDays = 30;
    const since = new Date(+now - windowDays * DAY);
    const prevStart = new Date(+now - 2 * windowDays * DAY);
    const prevEnd = since;

    const listPrice = this.listPrice();
    const [planFree, planPro, planEnt] = await Promise.all([
      this.workspaces.countDocuments({ plan: 'free' }),
      this.workspaces.countDocuments({ plan: 'pro' }),
      this.workspaces.countDocuments({ plan: 'enterprise' }),
    ]);

    const wsFilter: Record<string, unknown> = {};
    const q = opts.workspaceSearch?.trim();
    if (q) wsFilter.name = { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };

    const limit = Math.max(1, Math.min(200, opts.workspaceLimit));
    const wsList = await this.workspaces
      .find(wsFilter)
      .sort({ updatedAt: -1 })
      .limit(limit)
      .lean();

    const allPlanDocs = await this.plans.find({}).lean();
    const planById = new Map(allPlanDocs.map((p) => [String(p._id), p]));

    const wsIds = wsList.map((w) => w._id);
    const seatRows =
      wsIds.length === 0
        ? []
        : await this.members.aggregate<{
            _id: Types.ObjectId;
            billable: number;
            clients: number;
          }>([
            { $match: { workspaceId: { $in: wsIds }, status: 'active' } },
            {
              $group: {
                _id: '$workspaceId',
                billable: {
                  $sum: {
                    $cond: [{ $in: ['$role', ['owner', 'member']] }, 1, 0],
                  },
                },
                clients: {
                  $sum: { $cond: [{ $eq: ['$role', 'client'] }, 1, 0] },
                },
              },
            },
          ]);
    const seatMap = new Map(
      seatRows.map((r) => [String(r._id), { billable: r.billable, clients: r.clients }]),
    );

    const ownerIds = wsList.map((w) => w.ownerId).filter(Boolean);
    const owners =
      ownerIds.length === 0
        ? []
        : await this.users.find({ _id: { $in: ownerIds } }).select('displayName email').lean();
    const ownerMap = new Map(
      owners.map((o) => [String(o._id), { displayName: o.displayName, email: o.email }]),
    );

    const payments60 = await this.payments
      .find({
        status: 'succeeded',
        $or: [
          { settledAt: { $gte: prevStart } },
          { settledAt: { $exists: false }, createdAt: { $gte: prevStart } },
        ],
      })
      .select('workspaceId amountUsd settledAt createdAt')
      .lean();

    const revenueByWs = new Map<string, { cur: number; prev: number }>();
    for (const p of payments60) {
      const id = String(p.workspaceId);
      const t = p.settledAt ?? (p as unknown as { createdAt: Date }).createdAt;
      const amt = p.amountUsd;
      if (!revenueByWs.has(id)) revenueByWs.set(id, { cur: 0, prev: 0 });
      const b = revenueByWs.get(id)!;
      if (t >= since) b.cur += amt;
      else if (t >= prevStart && t < prevEnd) b.prev += amt;
    }

    /** All workspaces for platform MRR */
    const allWs = await this.workspaces.find({}).lean();
    const allIds = allWs.map((w) => w._id);
    const allSeats =
      allIds.length === 0
        ? []
        : await this.members.aggregate<{
            _id: Types.ObjectId;
            billable: number;
          }>([
            { $match: { workspaceId: { $in: allIds }, status: 'active' } },
            {
              $group: {
                _id: '$workspaceId',
                billable: {
                  $sum: {
                    $cond: [{ $in: ['$role', ['owner', 'member']] }, 1, 0],
                  },
                },
              },
            },
          ]);
    const allSeatMap = new Map(allSeats.map((s) => [String(s._id), s.billable]));

    let mrrTotal = 0;
    let payingSeats = 0;
    const mrrByWorkspace = new Map<string, number>();

    const contractList = await this.contracts.find({}).lean();
    const contractByWs = new Map(contractList.map((c) => [String(c.workspaceId), c]));

    for (const w of allWs) {
      const b = allSeatMap.get(String(w._id)) ?? 0;
      const c = contractByWs.get(String(w._id));
      const { mrr } = this.estimateMrrSync(w, b, planById, c);
      mrrByWorkspace.set(String(w._id), mrr);
      mrrTotal += mrr;
      if (w.plan === 'pro' && w.status === 'active') payingSeats += b;
    }
    mrrTotal = Math.round(mrrTotal * 100) / 100;

    const workspaces: AdminBillingWorkspaceRow[] = [];
    for (const w of wsList) {
      const seats = seatMap.get(String(w._id)) ?? { billable: 0, clients: 0 };
      const c = contractByWs.get(String(w._id));
      const { mrr, contractUsd } = this.estimateMrrSync(w, seats.billable, planById, c);
      const rev = revenueByWs.get(String(w._id)) ?? { cur: 0, prev: 0 };
      let growth: number | null = null;
      if (rev.prev > 0) growth = Math.round(((rev.cur - rev.prev) / rev.prev) * 1000) / 10;
      else if (rev.cur > 0) growth = 100;
      const trend: 'up' | 'down' | 'flat' =
        growth == null || growth === 0 ? 'flat' : growth > 0 ? 'up' : 'down';

      const sub = w.subscriptionPlanId ? planById.get(String(w.subscriptionPlanId)) : null;
      const ownerInfo = ownerMap.get(String(w.ownerId));

      workspaces.push({
        id: String(w._id),
        name: w.name,
        plan: w.plan,
        status: w.status,
        subscriptionPlanKey: sub?.key ?? null,
        owner: ownerInfo
          ? {
              id: String(w.ownerId),
              displayName: ownerInfo.displayName,
              email: ownerInfo.email,
            }
          : null,
        billableSeats: seats.billable,
        clientSeats: seats.clients,
        mrrUsd: mrr,
        enterpriseContractUsd: contractUsd,
        revenueGrowthPct: growth,
        revenueLast30dUsd: Math.round(rev.cur * 100) / 100,
        revenuePrev30dUsd: Math.round(rev.prev * 100) / 100,
        trend,
        trialEndsAt: (w as any).trialEndsAt?.toISOString?.() ?? null,
        createdAt: (w as any).createdAt?.toISOString?.() ?? generatedAt,
      });
    }

    const invoicesDocs = await this.invoices
      .find({})
      .sort({ issuedAt: -1 })
      .limit(80)
      .lean();

    const invoiceTrendDocs = await this.invoices
      .find({ issuedAt: { $gte: new Date(+now - 32 * DAY) } })
      .select('issuedAt amountDueFinalUsd status')
      .lean();
    const wsNameMap = new Map(allWs.map((x) => [String(x._id), x.name]));
    const invoices: AdminInvoiceRow[] = invoicesDocs.map((inv) => ({
      id: String(inv._id),
      invoiceNumber: inv.invoiceNumber,
      workspaceId: String(inv.workspaceId),
      workspaceName: wsNameMap.get(String(inv.workspaceId)) ?? '—',
      status: inv.status,
      amountDueFinalUsd: inv.amountDueFinalUsd,
      issuedAt: inv.issuedAt.toISOString(),
      dueAt: inv.dueAt.toISOString(),
      paidAt: inv.paidAt?.toISOString() ?? null,
      source: inv.source,
    }));

    const paymentsDocs = await this.payments.find({}).sort({ createdAt: -1 }).limit(100).lean();
    const mapPayRow = (pay: any): AdminPaymentRow => ({
      id: String(pay._id),
      workspaceId: String(pay.workspaceId),
      workspaceName: wsNameMap.get(String(pay.workspaceId)) ?? '—',
      invoiceId: pay.invoiceId ? String(pay.invoiceId) : null,
      amountUsd: pay.amountUsd,
      status: pay.status,
      method: pay.method,
      failureMessage: pay.failureMessage ?? null,
      attemptCount: pay.attemptCount,
      nextRetryAt: pay.nextRetryAt?.toISOString() ?? null,
      createdAt: pay.createdAt?.toISOString?.() ?? generatedAt,
      settledAt: pay.settledAt?.toISOString() ?? null,
    });
    const payments: AdminPaymentRow[] = paymentsDocs.map(mapPayRow);
    const failedPayments: AdminPaymentRow[] = paymentsDocs
      .filter(
        (pay) =>
          pay.status === 'failed' ||
          (pay.status === 'pending' && pay.nextRetryAt != null),
      )
      .map(mapPayRow);

    const refundsDocs = await this.refunds.find({}).sort({ createdAt: -1 }).limit(40).lean();
    const refunds: AdminRefundRow[] = refundsDocs.map((r) => ({
      id: String(r._id),
      paymentId: String(r.paymentId),
      workspaceId: String(r.workspaceId),
      amountUsd: r.amountUsd,
      status: r.status,
      reason: r.reason ?? null,
      createdAt: (r as any).createdAt?.toISOString?.() ?? generatedAt,
    }));

    const planRows: AdminSubscriptionPlanRow[] = allPlanDocs
      .sort((a, b) => a.sortOrder - b.sortOrder || a.displayName.localeCompare(b.displayName))
      .map((p) => ({
        id: String(p._id),
        key: p.key,
        displayName: p.displayName,
        tier: p.tier,
        pricePerSeatMonthlyUsd: p.pricePerSeatMonthlyUsd,
        maxMembers: p.maxMembers,
        maxProjects: p.maxProjects,
        storageLimitMb: p.storageLimitMb,
        ganttEnabled: p.ganttEnabled,
        cpmEnabled: p.cpmEnabled,
        auditLogEnabled: p.auditLogEnabled,
        isActive: p.isActive,
        isDefaultForTier: p.isDefaultForTier,
        sortOrder: p.sortOrder,
      }));

    const contractDocs = await this.contracts.find({}).lean();
    const enterpriseContracts: AdminEnterpriseContractRow[] = contractDocs.map((c) => ({
      id: String(c._id),
      workspaceId: String(c.workspaceId),
      workspaceName: wsNameMap.get(String(c.workspaceId)) ?? '—',
      monthlyAmountUsd: c.monthlyAmountUsd,
      contractStart: c.contractStart.toISOString(),
      contractEnd: c.contractEnd?.toISOString() ?? null,
      trialEndsAt: c.trialEndsAt?.toISOString() ?? null,
      notes: c.notes ?? null,
      manualInvoiceUrls: c.manualInvoiceUrls ?? [],
    }));

    /** MRR breakdown from plan-change logs */
    const logs = await this.planLogs.find({ changedAt: { $gte: since } }).lean();
    let newMrrUsd = 0;
    let expansionMrrUsd = 0;
    let churnedMrrUsd = 0;
    for (const log of logs) {
      const delta = (log.estimatedMrrAfterUsd ?? 0) - (log.estimatedMrrBeforeUsd ?? 0);
      if (delta > 0.005) expansionMrrUsd += delta;
      else if (delta < -0.005) churnedMrrUsd += -delta;
    }

    const firstPay = await this.payments.aggregate<{
      _id: Types.ObjectId;
      firstAt: Date;
    }>([
      { $match: { status: 'succeeded' } },
      { $addFields: { sortDate: { $ifNull: ['$settledAt', '$createdAt'] } } },
      { $sort: { sortDate: 1 } },
      { $group: { _id: '$workspaceId', firstAt: { $first: '$sortDate' } } },
      { $match: { firstAt: { $gte: since } } },
    ]);
    for (const fp of firstPay) {
      newMrrUsd += mrrByWorkspace.get(String(fp._id)) ?? 0;
    }

    const payingAccountCount = allWs.filter(
      (w) => (mrrByWorkspace.get(String(w._id)) ?? 0) > 0.01,
    ).length;
    const arpuUsd =
      payingAccountCount > 0 ? Math.round((mrrTotal / payingAccountCount) * 100) / 100 : 0;
    const downgraded = await this.planLogs.countDocuments({
      changedAt: { $gte: since },
      toTier: 'free',
      fromTier: { $in: ['pro', 'enterprise'] },
    });
    const activePayingStart = Math.max(1, payingAccountCount + downgraded);
    const churnRateMonthlyPct =
      Math.round((downgraded / activePayingStart) * 1000) / 10;
    const ltvEstimateUsd =
      churnRateMonthlyPct > 0.1
        ? Math.round((arpuUsd / (churnRateMonthlyPct / 100)) * 100) / 100
        : Math.round(arpuUsd * 24 * 100) / 100;

    const breakdown: AdminMrrBreakdown = {
      newMrrUsd: Math.round(newMrrUsd * 100) / 100,
      expansionMrrUsd: Math.round(expansionMrrUsd * 100) / 100,
      churnedMrrUsd: Math.round(churnedMrrUsd * 100) / 100,
      netMrrChangeUsd:
        Math.round((newMrrUsd + expansionMrrUsd - churnedMrrUsd) * 100) / 100,
      arpuUsd,
      ltvEstimateUsd,
      churnRateMonthlyPct,
      payingAccountCount,
      windowDays,
    };

    /** 30-day trend */
    const mrrTrend: AdminBillingTimePoint[] = [];
    for (let i = 29; i >= 0; i--) {
      const d0 = new Date(+now - i * DAY);
      const d1 = new Date(+d0 + DAY);
      const dayLabel = d0.toISOString().slice(0, 10);
      let paymentCashUsd = 0;
      let invoiceIssuedUsd = 0;
      for (const p of payments60) {
        const t = p.settledAt ?? (p as unknown as { createdAt: Date }).createdAt;
        if (t >= d0 && t < d1) paymentCashUsd += p.amountUsd;
      }
      for (const inv of invoiceTrendDocs) {
        if (inv.issuedAt >= d0 && inv.issuedAt < d1 && inv.status !== 'void') {
          invoiceIssuedUsd += inv.amountDueFinalUsd;
        }
      }
      mrrTrend.push({
        date: dayLabel,
        paymentCashUsd: Math.round(paymentCashUsd * 100) / 100,
        invoiceIssuedUsd: Math.round(invoiceIssuedUsd * 100) / 100,
      });
    }

    const revenueByWorkspace: AdminWorkspaceRevenueBar[] = Array.from(revenueByWs.entries())
      .map(([workspaceId, v]) => ({
        workspaceId,
        name: wsNameMap.get(workspaceId) ?? workspaceId,
        revenue30dUsd: Math.round(v.cur * 100) / 100,
      }))
      .sort((a, b) => b.revenue30dUsd - a.revenue30dUsd)
      .slice(0, 12);

    const alerts: AdminBillingAlert[] = [];
    for (const p of failedPayments.slice(0, 20)) {
      alerts.push({
        id: `pay-fail-${p.id}`,
        level: 'critical',
        title: `Ödeme başarısız · ${p.workspaceName}`,
        body: p.failureMessage ?? `${p.attemptCount} deneme`,
        workspaceId: p.workspaceId,
      });
    }
    const overdueInv = invoicesDocs.filter(
      (i) => i.status === 'open' && i.dueAt < now,
    );
    for (const i of overdueInv.slice(0, 15)) {
      alerts.push({
        id: `inv-overdue-${String(i._id)}`,
        level: 'warning',
        title: `Fatura gecikti · ${i.invoiceNumber}`,
        body: `${wsNameMap.get(String(i.workspaceId))}`,
        workspaceId: String(i.workspaceId),
      });
    }
    const trialSoon = await this.contracts
      .find({
        trialEndsAt: { $gte: now, $lte: new Date(+now + 7 * DAY) },
      })
      .limit(10)
      .lean();
    for (const c of trialSoon) {
      alerts.push({
        id: `trial-${String(c._id)}`,
        level: 'info',
        title: 'Deneme süresi bitiyor',
        body: `${wsNameMap.get(String(c.workspaceId))} · ${c.trialEndsAt?.toISOString().slice(0, 10)}`,
        workspaceId: String(c.workspaceId),
      });
    }
    for (const w of workspaces) {
      if (w.mrrUsd > 10 && w.trend === 'down' && (w.revenueGrowthPct ?? 0) < -15) {
        alerts.push({
          id: `churn-risk-${w.id}`,
          level: 'warning',
          title: `Gelir düşüş riski · ${w.name}`,
          body: `30g ödemeler %${w.revenueGrowthPct} değişti`,
          workspaceId: w.id,
        });
      }
    }

    return {
      generatedAt,
      currency: 'USD',
      ledgerEnabled: true,
      disclaimer:
        'Ledger faturalar, ödemeler ve Enterprise sözleşmelerle beslenir. Sağlayıcı entegrasyonu (Stripe vb.) sonradan ödeme kayıtlarına bağlanabilir.',
      mrrTotalUsd: mrrTotal,
      arrTotalUsd: Math.round(mrrTotal * 12 * 100) / 100,
      payingSeatCount: payingSeats,
      proSeatListUsd: listPrice,
      breakdown,
      planDistribution: { free: planFree, pro: planPro, enterprise: planEnt },
      workspaces,
      invoices,
      payments,
      refunds,
      failedPayments,
      plans: planRows,
      enterpriseContracts,
      alerts,
      mrrTrend,
      revenueByWorkspace,
    };
  }

  async getWorkspaceDetail(workspaceId: string): Promise<AdminWorkspaceBillingDetail> {
    if (!Types.ObjectId.isValid(workspaceId)) throw new NotFoundException();
    const w = await this.workspaces.findById(workspaceId).lean();
    if (!w) throw new NotFoundException();

    const sub = w.subscriptionPlanId
      ? await this.plans.findById(w.subscriptionPlanId).lean()
      : null;

    const invs = await this.invoices
      .find({ workspaceId: w._id })
      .sort({ issuedAt: -1 })
      .limit(50)
      .lean();
    const pays = await this.payments
      .find({ workspaceId: w._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    const refs = await this.refunds
      .find({ workspaceId: w._id })
      .sort({ createdAt: -1 })
      .limit(25)
      .lean();
    const logs = await this.planLogs
      .find({ workspaceId: w._id })
      .sort({ changedAt: -1 })
      .limit(30)
      .lean();
    const seats = await this.seatEvents
      .find({ workspaceId: w._id })
      .sort({ occurredAt: -1 })
      .limit(60)
      .lean();

    const userIds = [...new Set(seats.map((s) => String(s.userId)))];
    const udocs =
      userIds.length > 0
        ? await this.users.find({ _id: { $in: userIds.map((id) => new Types.ObjectId(id)) } }).lean()
        : [];
    const umap = new Map(udocs.map((u) => [String(u._id), u]));

    const contract = await this.contracts.findOne({ workspaceId: w._id }).lean();
    const contractRow: AdminEnterpriseContractRow | null = contract
      ? {
          id: String(contract._id),
          workspaceId: String(contract.workspaceId),
          workspaceName: w.name,
          monthlyAmountUsd: contract.monthlyAmountUsd,
          contractStart: contract.contractStart.toISOString(),
          contractEnd: contract.contractEnd?.toISOString() ?? null,
          trialEndsAt: contract.trialEndsAt?.toISOString() ?? null,
          notes: contract.notes ?? null,
          manualInvoiceUrls: contract.manualInvoiceUrls ?? [],
        }
      : null;

    const mapInv = (inv: any): AdminInvoiceRow => ({
      id: String(inv._id),
      invoiceNumber: inv.invoiceNumber,
      workspaceId: String(inv.workspaceId),
      workspaceName: w.name,
      status: inv.status,
      amountDueFinalUsd: inv.amountDueFinalUsd,
      issuedAt: inv.issuedAt.toISOString(),
      dueAt: inv.dueAt.toISOString(),
      paidAt: inv.paidAt?.toISOString() ?? null,
      source: inv.source,
    });
    const mapPay = (pay: any): AdminPaymentRow => ({
      id: String(pay._id),
      workspaceId: String(pay.workspaceId),
      workspaceName: w.name,
      invoiceId: pay.invoiceId ? String(pay.invoiceId) : null,
      amountUsd: pay.amountUsd,
      status: pay.status,
      method: pay.method,
      failureMessage: pay.failureMessage ?? null,
      attemptCount: pay.attemptCount,
      nextRetryAt: pay.nextRetryAt?.toISOString() ?? null,
      createdAt: pay.createdAt?.toISOString() ?? new Date().toISOString(),
      settledAt: pay.settledAt?.toISOString() ?? null,
    });

    return {
      workspace: {
        id: String(w._id),
        name: w.name,
        plan: w.plan,
        status: w.status,
        subscriptionPlanId: w.subscriptionPlanId ? String(w.subscriptionPlanId) : null,
        subscriptionPlanKey: sub?.key ?? null,
        trialEndsAt: (w as any).trialEndsAt?.toISOString?.() ?? null,
      },
      invoices: invs.map(mapInv),
      payments: pays.map(mapPay),
      refunds: refs.map((r) => ({
        id: String(r._id),
        paymentId: String(r.paymentId),
        workspaceId: String(r.workspaceId),
        amountUsd: r.amountUsd,
        status: r.status,
        reason: r.reason ?? null,
        createdAt: (r as any).createdAt?.toISOString() ?? new Date().toISOString(),
      })),
      planChanges: logs.map((l) => ({
        id: String(l._id),
        fromPlanKey: l.fromPlanKey,
        toPlanKey: l.toPlanKey,
        fromTier: l.fromTier,
        toTier: l.toTier,
        changedAt: l.changedAt.toISOString(),
        reason: l.reason ?? null,
      })),
      seatEvents: seats.map((s) => {
        const u = umap.get(String(s.userId));
        return {
          id: String(s._id),
          userId: String(s.userId),
          userName: u?.displayName ?? '—',
          userEmail: u?.email ?? '—',
          role: s.role,
          action: s.action,
          billableAfter: s.billableAfter,
          occurredAt: s.occurredAt.toISOString(),
        };
      }),
      contract: contractRow,
    };
  }

  async assignWorkspacePlan(
    workspaceId: string,
    subscriptionPlanId: string,
    actorUserId?: string,
    reason?: string,
  ) {
    if (!Types.ObjectId.isValid(workspaceId) || !Types.ObjectId.isValid(subscriptionPlanId)) {
      throw new BadRequestException('Invalid id');
    }
    const ws = await this.workspaces.findById(workspaceId);
    const plan = await this.plans.findById(subscriptionPlanId);
    if (!ws || !plan) throw new NotFoundException();

    const seats = await this.members.countDocuments({
      workspaceId: ws._id,
      status: 'active',
      role: { $in: ['owner', 'member'] },
    });
    const allPlanDocs = await this.plans.find({}).lean();
    const planById = new Map(allPlanDocs.map((p) => [String(p._id), p]));
    const cdoc = await this.contracts.findOne({ workspaceId: ws._id }).lean();
    const beforeMrr = this.estimateMrrSync(ws, seats, planById, cdoc).mrr;

    const oldPlanDoc = ws.subscriptionPlanId
      ? await this.plans.findById(ws.subscriptionPlanId).lean()
      : await this.plans.findOne({ tier: ws.plan, isDefaultForTier: true }).lean();
    const oldKey = oldPlanDoc?.key ?? ws.plan;
    const oldTier = ws.plan;

    ws.plan = plan.tier;
    ws.subscriptionPlanId = plan._id as Types.ObjectId;
    ws.entitlements = {
      maxMembers: plan.maxMembers,
      maxProjects: plan.maxProjects,
      ganttEnabled: plan.ganttEnabled,
      cpmEnabled: plan.cpmEnabled,
      auditLogEnabled: plan.auditLogEnabled,
    } as any;
    await ws.save();

    const afterMrr = this.estimateMrrSync(ws, seats, planById, cdoc).mrr;

    await this.planLogs.create({
      workspaceId: ws._id,
      fromPlanKey: oldKey,
      toPlanKey: plan.key,
      fromTier: oldTier,
      toTier: plan.tier,
      actorUserId: actorUserId ? new Types.ObjectId(actorUserId) : undefined,
      reason,
      estimatedMrrBeforeUsd: beforeMrr,
      estimatedMrrAfterUsd: afterMrr,
      changedAt: new Date(),
    });

    return { ok: true, workspaceId: String(ws._id), planKey: plan.key };
  }

  async createSubscriptionPlan(body: Partial<SubscriptionPlan> & { key: string; displayName: string; tier: 'free' | 'pro' | 'enterprise' }) {
    if (await this.plans.findOne({ key: body.key })) {
      throw new ConflictException(`Plan key exists: ${body.key}`);
    }
    const doc: any = await this.plans.create({
      key: body.key,
      displayName: body.displayName,
      tier: body.tier,
      pricePerSeatMonthlyUsd: body.pricePerSeatMonthlyUsd ?? 0,
      maxMembers: body.maxMembers ?? 10,
      maxProjects: body.maxProjects ?? 3,
      storageLimitMb: body.storageLimitMb ?? 5120,
      ganttEnabled: body.ganttEnabled ?? true,
      cpmEnabled: body.cpmEnabled ?? false,
      auditLogEnabled: body.auditLogEnabled ?? false,
      isActive: body.isActive ?? true,
      isDefaultForTier: body.isDefaultForTier ?? false,
      sortOrder: body.sortOrder ?? 99,
    });
    if (body.isDefaultForTier) {
      await this.plans.updateMany(
        { tier: body.tier, _id: { $ne: doc._id } },
        { $set: { isDefaultForTier: false } },
      );
    }
    return doc.toObject();
  }

  async updateSubscriptionPlan(id: string, patch: Partial<SubscriptionPlan>) {
    let doc = await this.plans.findByIdAndUpdate(id, patch, { new: true });
    if (!doc) throw new NotFoundException();
    if (patch.isDefaultForTier) {
      await this.plans.updateMany(
        { tier: doc.tier, _id: { $ne: doc._id } },
        { $set: { isDefaultForTier: false } },
      );
    }
    if (doc.key === 'pro-default') {
      doc = await this.plans.findByIdAndUpdate(
        doc._id,
        { $set: { pricePerSeatMonthlyUsd: this.listPrice() } },
        { new: true },
      );
    }
    return doc!.toObject();
  }

  async deactivateSubscriptionPlan(id: string) {
    const doc = await this.plans.findByIdAndUpdate(
      id,
      { $set: { isActive: false, isDefaultForTier: false } },
      { new: true },
    );
    if (!doc) throw new NotFoundException();
    return { ok: true };
  }

  async upsertEnterpriseContract(
    workspaceId: string,
    body: {
      monthlyAmountUsd: number;
      contractStart: string;
      contractEnd?: string;
      trialEndsAt?: string;
      notes?: string;
      manualInvoiceUrls?: string[];
    },
  ) {
    if (!Types.ObjectId.isValid(workspaceId)) throw new BadRequestException();
    const ws = await this.workspaces.findById(workspaceId);
    if (!ws) throw new NotFoundException();

    await this.contracts.findOneAndUpdate(
      { workspaceId: ws._id },
      {
        $set: {
          monthlyAmountUsd: body.monthlyAmountUsd,
          contractStart: new Date(body.contractStart),
          contractEnd: body.contractEnd ? new Date(body.contractEnd) : undefined,
          trialEndsAt: body.trialEndsAt ? new Date(body.trialEndsAt) : undefined,
          notes: body.notes,
          manualInvoiceUrls: body.manualInvoiceUrls ?? [],
        },
      },
      { upsert: true, new: true },
    );

    if (ws.plan !== 'enterprise') {
      const entPlan = await this.plans.findOne({
        tier: 'enterprise',
        isDefaultForTier: true,
        isActive: true,
      });
      if (entPlan) {
        await this.assignWorkspacePlan(workspaceId, String(entPlan._id), undefined, 'Enterprise contract');
      }
    }

    return { ok: true };
  }

  async buildInvoicesCsv(): Promise<string> {
    const rows = await this.invoices.find({}).sort({ issuedAt: -1 }).limit(2000).lean();
    const ws = await this.workspaces.find({}).lean();
    const wm = new Map(ws.map((w) => [String(w._id), w.name]));
    const head =
      'invoiceNumber,workspaceId,workspaceName,status,amountUsd,issuedAt,dueAt,paidAt,source\n';
    const body =
      rows
        .map((r) =>
          [
            r.invoiceNumber,
            String(r.workspaceId),
            wm.get(String(r.workspaceId)) ?? '',
            r.status,
            r.amountDueFinalUsd,
            r.issuedAt.toISOString(),
            r.dueAt.toISOString(),
            r.paidAt?.toISOString() ?? '',
            r.source,
          ].join(','),
        )
        .join('\n') + '\n';
    return head + body;
  }

  async buildPaymentsCsv(): Promise<string> {
    const rows = await this.payments.find({}).sort({ createdAt: -1 }).limit(2000).lean();
    const ws = await this.workspaces.find({}).lean();
    const wm = new Map(ws.map((w) => [String(w._id), w.name]));
    const head =
      'id,workspaceId,workspaceName,invoiceId,amountUsd,status,method,failureMessage,attemptCount,createdAt,settledAt\n';
    const body =
      rows
        .map((r) =>
          [
            String(r._id),
            String(r.workspaceId),
            wm.get(String(r.workspaceId)) ?? '',
            r.invoiceId ? String(r.invoiceId) : '',
            r.amountUsd,
            r.status,
            r.method,
            (r.failureMessage ?? '').replace(/,/g, ';'),
            r.attemptCount,
            (r as any).createdAt?.toISOString?.() ?? '',
            r.settledAt?.toISOString() ?? '',
          ].join(','),
        )
        .join('\n') + '\n';
    return head + body;
  }

  async listPlansAdmin(): Promise<AdminSubscriptionPlanRow[]> {
    await this.ensureDefaultPlans();
    const allPlanDocs = await this.plans.find({}).sort({ sortOrder: 1, key: 1 }).lean();
    return allPlanDocs.map((p) => ({
      id: String(p._id),
      key: p.key,
      displayName: p.displayName,
      tier: p.tier,
      pricePerSeatMonthlyUsd: p.pricePerSeatMonthlyUsd,
      maxMembers: p.maxMembers,
      maxProjects: p.maxProjects,
      storageLimitMb: p.storageLimitMb,
      ganttEnabled: p.ganttEnabled,
      cpmEnabled: p.cpmEnabled,
      auditLogEnabled: p.auditLogEnabled,
      isActive: p.isActive,
      isDefaultForTier: p.isDefaultForTier,
      sortOrder: p.sortOrder,
    }));
  }

  async buildMonthlyReportCsv(): Promise<string> {
    const d = await this.getAdminDashboard({ workspaceLimit: 1 });
    const rows = [
      'metric,value',
      `generatedAt,${d.generatedAt}`,
      `mrrTotalUsd,${d.mrrTotalUsd}`,
      `arrTotalUsd,${d.arrTotalUsd}`,
      `newMrrUsd,${d.breakdown.newMrrUsd}`,
      `expansionMrrUsd,${d.breakdown.expansionMrrUsd}`,
      `churnedMrrUsd,${d.breakdown.churnedMrrUsd}`,
      `arpuUsd,${d.breakdown.arpuUsd}`,
      `ltvEstimateUsd,${d.breakdown.ltvEstimateUsd}`,
      `churnRateMonthlyPct,${d.breakdown.churnRateMonthlyPct}`,
      `payingAccounts,${d.breakdown.payingAccountCount}`,
      `invoiceCountListed,${d.invoices.length}`,
      `openInvoices,${d.invoices.filter((i) => i.status === 'open').length}`,
      `failedPaymentSignals,${d.failedPayments.length}`,
    ];
    return rows.join('\n') + '\n';
  }

  /** Generate simple HTML invoice for print / save-as-PDF */
  async getInvoiceHtml(id: string): Promise<string> {
    const inv = await this.invoices.findById(id).lean();
    if (!inv) throw new NotFoundException();
    const ws = await this.workspaces.findById(inv.workspaceId).lean();
    const lines = (inv.lineItems ?? [])
      .map(
        (l) =>
          `<tr><td>${l.description}</td><td>${l.quantity}</td><td>$${l.unitAmountUsd}</td></tr>`,
      )
      .join('');
    return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${inv.invoiceNumber}</title></head><body>
<h1>${inv.invoiceNumber}</h1><p>${ws?.name ?? ''}</p>
<table border="1"><thead><tr><th>Item</th><th>Qty</th><th>Unit</th></tr></thead><tbody>${lines}</tbody></table>
<p><strong>Total due:</strong> $${inv.amountDueFinalUsd}</p>
</body></html>`;
  }
}
