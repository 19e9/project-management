import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, PipelineStage, Types } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Workspace, WorkspaceDocument } from '../workspaces/schemas/workspace.schema';
import {
  WorkspaceMember,
  WorkspaceMemberDocument,
} from '../workspaces/schemas/workspace-member.schema';
import { Project, ProjectDocument } from '../projects/schemas/project.schema';
import { Task, TaskDocument } from '../tasks/schemas/task.schema';
import {
  ResourceAllocation,
  ResourceAllocationDocument,
} from '../resources/schemas/resource-allocation.schema';
import { PLAN_DEFAULTS } from '../workspaces/schemas/workspace.schema';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

interface ChangeKpi {
  total: number;
  newInWindow: number;
  changePct: number;
}

export interface AdminOverview {
  users: ChangeKpi & { active: number };
  workspaces: ChangeKpi & { active: number; suspended: number };
  projects: ChangeKpi & { active: number; archived: number };
  tasks: ChangeKpi & {
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

@Injectable()
export class AdminService {
  constructor(
    @InjectConnection() private readonly conn: Connection,
    private readonly cfg: ConfigService,
    @InjectModel(User.name) private readonly users: Model<UserDocument>,
    @InjectModel(Workspace.name) private readonly workspaces: Model<WorkspaceDocument>,
    @InjectModel(WorkspaceMember.name)
    private readonly members: Model<WorkspaceMemberDocument>,
    @InjectModel(Project.name) private readonly projects: Model<ProjectDocument>,
    @InjectModel(Task.name) private readonly tasks: Model<TaskDocument>,
    @InjectModel(ResourceAllocation.name)
    private readonly allocations: Model<ResourceAllocationDocument>,
  ) {}

  async overview(): Promise<AdminOverview> {
    const now = new Date();
    const since = new Date(+now - 30 * MS_PER_DAY);
    const prevSince = new Date(+now - 60 * MS_PER_DAY);

    const [
      uTotal,
      uActive,
      uNew,
      uPrev,
      wTotal,
      wActive,
      wSuspended,
      wNew,
      wPrev,
      planAgg,
      pTotal,
      pActive,
      pArchived,
      pNew,
      pPrev,
      tTotal,
      tNew,
      tPrev,
      tStatusAgg,
      tOverdue,
    ] = await Promise.all([
      this.users.countDocuments({}),
      this.users.countDocuments({ isActive: true }),
      this.users.countDocuments({ createdAt: { $gte: since } }),
      this.users.countDocuments({ createdAt: { $gte: prevSince, $lt: since } }),

      this.workspaces.countDocuments({}),
      this.workspaces.countDocuments({ status: 'active' }),
      this.workspaces.countDocuments({ status: 'suspended' }),
      this.workspaces.countDocuments({ createdAt: { $gte: since } }),
      this.workspaces.countDocuments({ createdAt: { $gte: prevSince, $lt: since } }),

      this.workspaces.aggregate<{ _id: string; count: number }>([
        { $group: { _id: '$plan', count: { $sum: 1 } } },
      ]),

      this.projects.countDocuments({}),
      this.projects.countDocuments({ status: 'active' }),
      this.projects.countDocuments({ status: 'archived' }),
      this.projects.countDocuments({ createdAt: { $gte: since } }),
      this.projects.countDocuments({ createdAt: { $gte: prevSince, $lt: since } }),

      this.tasks.countDocuments({}),
      this.tasks.countDocuments({ createdAt: { $gte: since } }),
      this.tasks.countDocuments({ createdAt: { $gte: prevSince, $lt: since } }),

      this.tasks.aggregate<{ _id: string; count: number }>([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),

      this.tasks.countDocuments({
        status: { $nin: ['done', 'cancelled'] },
        endDate: { $lt: now },
      }),
    ]);

    const status = mapStatusAgg(tStatusAgg);
    const denom = tTotal - status.cancelled || 1;
    const completionPct = Math.round((status.done / denom) * 1000) / 10;

    const planMap = new Map(planAgg.map((p) => [p._id, p.count]));

    return {
      users: {
        total: uTotal,
        active: uActive,
        newInWindow: uNew,
        changePct: pctChange(uNew, uPrev),
      },
      workspaces: {
        total: wTotal,
        active: wActive,
        suspended: wSuspended,
        newInWindow: wNew,
        changePct: pctChange(wNew, wPrev),
      },
      projects: {
        total: pTotal,
        active: pActive,
        archived: pArchived,
        newInWindow: pNew,
        changePct: pctChange(pNew, pPrev),
      },
      tasks: {
        total: tTotal,
        newInWindow: tNew,
        changePct: pctChange(tNew, tPrev),
        completed: status.done,
        inProgress: status.in_progress,
        blocked: status.blocked,
        notStarted: status.not_started,
        cancelled: status.cancelled,
        overdue: tOverdue,
        completionPct,
      },
      plans: {
        free: planMap.get('free') ?? 0,
        pro: planMap.get('pro') ?? 0,
        enterprise: planMap.get('enterprise') ?? 0,
      },
      generatedAt: now.toISOString(),
    };
  }

  async growth(days: number): Promise<GrowthPoint[]> {
    const safeDays = Math.max(7, Math.min(90, Math.floor(days || 30)));
    const since = new Date(Date.now() - safeDays * MS_PER_DAY);

    const dailyAgg = (model: Model<any>): PipelineStage[] => [
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
    ];

    const [u, w, p] = await Promise.all([
      this.users.aggregate<{ _id: string; count: number }>(dailyAgg(this.users)),
      this.workspaces.aggregate<{ _id: string; count: number }>(dailyAgg(this.workspaces)),
      this.projects.aggregate<{ _id: string; count: number }>(dailyAgg(this.projects)),
    ]);

    const map = new Map<string, GrowthPoint>();
    for (let i = 0; i <= safeDays; i++) {
      const d = new Date(+since + i * MS_PER_DAY).toISOString().slice(0, 10);
      map.set(d, { date: d, users: 0, workspaces: 0, projects: 0 });
    }
    for (const r of u) if (map.has(r._id)) map.get(r._id)!.users = r.count;
    for (const r of w) if (map.has(r._id)) map.get(r._id)!.workspaces = r.count;
    for (const r of p) if (map.has(r._id)) map.get(r._id)!.projects = r.count;
    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  }

  async tasksByStatus(): Promise<StatusDistribution> {
    const agg = await this.tasks.aggregate<{ _id: string; count: number }>([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    return mapStatusAgg(agg);
  }

  async roleDistribution(): Promise<RoleDistribution> {
    const [memberAgg, adminCount] = await Promise.all([
      this.members.aggregate<{ _id: string; count: number }>([
        { $match: { status: 'active' } },
        { $group: { _id: '$role', count: { $sum: 1 } } },
      ]),
      this.users.countDocuments({ platformRole: 'platform_admin' }),
    ]);
    const map = new Map(memberAgg.map((r) => [r._id, r.count]));
    return {
      owner: map.get('owner') ?? 0,
      member: map.get('member') ?? 0,
      client: map.get('client') ?? 0,
      platform_admin: adminCount,
    };
  }

  async workspacesTable(opts: { limit?: number; q?: string }): Promise<{
    items: AdminWorkspaceRow[];
  }> {
    const limit = Math.max(1, Math.min(100, opts.limit ?? 25));
    const filter: any = {};
    if (opts.q && opts.q.trim()) {
      filter.name = { $regex: opts.q.trim(), $options: 'i' };
    }
    const wsList = await this.workspaces
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    if (wsList.length === 0) return { items: [] };

    const wsIds = wsList.map((w) => w._id);
    const ownerIds = wsList.map((w) => w.ownerId).filter(Boolean);

    const [members, projects, tasks, owners] = await Promise.all([
      this.members.aggregate<{ _id: Types.ObjectId; count: number }>([
        { $match: { workspaceId: { $in: wsIds }, status: 'active' } },
        { $group: { _id: '$workspaceId', count: { $sum: 1 } } },
      ]),
      this.projects.aggregate<{ _id: Types.ObjectId; count: number }>([
        { $match: { workspaceId: { $in: wsIds } } },
        { $group: { _id: '$workspaceId', count: { $sum: 1 } } },
      ]),
      this.tasks.aggregate<{
        _id: Types.ObjectId;
        count: number;
        lastActivity: Date;
      }>([
        { $match: { workspaceId: { $in: wsIds } } },
        {
          $group: {
            _id: '$workspaceId',
            count: { $sum: 1 },
            lastActivity: { $max: '$updatedAt' },
          },
        },
      ]),
      this.users.find({ _id: { $in: ownerIds } }).select('displayName email').lean(),
    ]);

    const memMap = new Map(members.map((m) => [String(m._id), m.count]));
    const projMap = new Map(projects.map((p) => [String(p._id), p.count]));
    const taskMap = new Map(
      tasks.map((t) => [String(t._id), { count: t.count, lastActivity: t.lastActivity }]),
    );
    const ownerMap = new Map(
      owners.map((o) => [String(o._id), { displayName: o.displayName, email: o.email }]),
    );

    const items: AdminWorkspaceRow[] = wsList.map((w) => {
      const taskInfo = taskMap.get(String(w._id));
      const ownerInfo = ownerMap.get(String(w.ownerId));
      return {
        id: String(w._id),
        name: w.name,
        plan: w.plan,
        status: w.status,
        owner: ownerInfo
          ? { id: String(w.ownerId), displayName: ownerInfo.displayName, email: ownerInfo.email }
          : null,
        memberCount: memMap.get(String(w._id)) ?? 0,
        projectCount: projMap.get(String(w._id)) ?? 0,
        taskCount: taskInfo?.count ?? 0,
        lastActivityAt: taskInfo?.lastActivity?.toISOString() ?? null,
        createdAt: (w as any).createdAt?.toISOString?.() ?? null,
      };
    });
    return { items };
  }

  async usersTable(opts: { limit?: number; q?: string }): Promise<{ items: AdminUserRow[] }> {
    const limit = Math.max(1, Math.min(200, opts.limit ?? 100));
    const filter: Record<string, unknown> = {};
    const q = opts.q?.trim();
    if (q) {
      const esc = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [{ email: { $regex: esc, $options: 'i' } }, { displayName: { $regex: esc, $options: 'i' } }];
    }

    const userList = await this.users
      .find(filter)
      .select('email displayName platformRole isActive authProviders avatarUrl createdAt')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    if (userList.length === 0) return { items: [] };

    const userIds = userList.map((u) => u._id);
    const counts = await this.members.aggregate<{ _id: Types.ObjectId; count: number }>([
      { $match: { userId: { $in: userIds }, status: 'active' } },
      { $group: { _id: '$userId', count: { $sum: 1 } } },
    ]);
    const countMap = new Map(counts.map((c) => [String(c._id), c.count]));

    const items: AdminUserRow[] = userList.map((u) => ({
      id: String(u._id),
      email: u.email,
      displayName: u.displayName,
      platformRole: u.platformRole,
      isActive: u.isActive,
      authProviders: u.authProviders ?? ['local'],
      avatarUrl: u.avatarUrl ?? null,
      workspaceMemberships: countMap.get(String(u._id)) ?? 0,
      createdAt: (u as { createdAt?: Date }).createdAt?.toISOString?.() ?? new Date().toISOString(),
    }));
    return { items };
  }

  async platformSettings(): Promise<AdminPlatformSettings> {
    const googleId = this.cfg.get<string>('GOOGLE_CLIENT_ID')?.trim() ?? '';
    const googleSecret = this.cfg.get<string>('GOOGLE_CLIENT_SECRET')?.trim() ?? '';
    const googleOAuthConfigured =
      googleId.length > 0 &&
      googleSecret.length > 0 &&
      googleId !== '__google_oauth_disabled__' &&
      googleSecret !== '__google_oauth_disabled__';

    const corsRaw = this.cfg.get<string>('CORS_ORIGIN') ?? 'http://localhost:5173';
    const corsOrigins = corsRaw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const planDefaults: AdminPlanDefaultRow[] = (['free', 'pro', 'enterprise'] as const).map(
      (plan) => ({
        plan,
        ...PLAN_DEFAULTS[plan],
      }),
    );

    const port = this.cfg.get<number>('PORT') ?? 3000;
    const configuredApiBase = (this.cfg.get<string>('API_PUBLIC_BASE_URL') ?? '').trim().replace(/\/$/, '');
    const publicBaseUrl =
      configuredApiBase ||
      `http://127.0.0.1:${port}/api/v1`;

    const mongoUri = this.cfg.get<string>('MONGODB_URI') ?? '';

    const [
      users,
      workspaceCount,
      projects,
      tasks,
      platformAdmins,
    ] = await Promise.all([
      this.users.countDocuments({}),
      this.workspaces.countDocuments({}),
      this.projects.countDocuments({}),
      this.tasks.countDocuments({}),
      this.users.countDocuments({ platformRole: 'platform_admin' }),
    ]);

    return {
      generatedAt: new Date().toISOString(),
      environment: this.cfg.get<string>('NODE_ENV') ?? 'development',
      release: {
        version: (this.cfg.get<string>('APP_VERSION') ?? '').trim() || '—',
      },
      product: {
        displayName: this.cfg.get<string>('PLATFORM_DISPLAY_NAME') ?? 'PlanForge PM',
        supportEmail: (this.cfg.get<string>('SUPPORT_EMAIL') ?? '').trim(),
        openRegistration: this.cfg.get<boolean>('OPEN_REGISTRATION') ?? true,
        maintenanceMode: this.cfg.get<boolean>('MAINTENANCE_MODE') ?? false,
        defaultNewWorkspacePlan:
          this.cfg.get<'free' | 'pro' | 'enterprise'>('DEFAULT_NEW_WORKSPACE_PLAN') ?? 'free',
        billingProSeatUsdMonthly: this.cfg.get<number>('BILLING_PRO_SEAT_USD_MONTHLY') ?? 12,
      },
      api: {
        port,
        corsOrigins,
        publicBaseUrl,
        globalPrefix: 'api/v1',
        swaggerPath: 'api/docs',
      },
      httpSecurity: {
        helmetContentSecurityPolicy: true,
        corsCredentialsEnabled: true,
      },
      validation: {
        transformEnabled: true,
        stripUnknownFields: true,
        forbidNonWhitelistedBody: false,
      },
      rateLimit: { windowMs: 60_000, maxRequests: 200 },
      auth: {
        accessTokenTtlSeconds: this.cfg.get<number>('JWT_ACCESS_EXPIRES_IN') ?? 900,
        refreshTokenTtlSeconds: this.cfg.get<number>('JWT_REFRESH_EXPIRES_IN') ?? 2_592_000,
        googleOAuthConfigured,
        googleCallbackUrl: this.cfg.get<string>('GOOGLE_CALLBACK_URL') ?? '',
      },
      database: {
        readyState: this.conn.readyState,
        connected: this.conn.readyState === 1,
        mongoHostSummary: mongoHostsSummary(mongoUri),
      },
      inventory: {
        users,
        workspaces: workspaceCount,
        projects,
        tasks,
        platformAdmins,
      },
      planDefaults,
      notes: [
        'Secrets, JWT keys, and full MongoDB URIs are never returned from this endpoint.',
        'Change values via environment variables (see configuration schema) and restart the API.',
        'OPEN_REGISTRATION=false closes local email/password sign-up (403). MAINTENANCE_MODE=true blocks new sign-ups (503).',
        'DEFAULT_NEW_WORKSPACE_PLAN applies when a user creates a workspace; entitlements follow PLAN_DEFAULTS for that tier.',
        'BILLING_PRO_SEAT_USD_MONTHLY drives admin billing MRR estimates and public pricing alignment.',
      ],
    };
  }

  async activity(limit: number): Promise<ActivityEvent[]> {
    const safe = Math.max(5, Math.min(100, limit || 30));

    const [recentUsers, recentWs, recentProjects, recentTasks] = await Promise.all([
      this.users.find().sort({ createdAt: -1 }).limit(safe).select('_id displayName createdAt').lean(),
      this.workspaces
        .find()
        .sort({ createdAt: -1 })
        .limit(safe)
        .select('_id name ownerId createdAt')
        .lean(),
      this.projects
        .find()
        .sort({ createdAt: -1 })
        .limit(safe)
        .select('_id name workspaceId leadId createdAt')
        .lean(),
      this.tasks
        .find({ status: { $in: ['done', 'in_progress', 'blocked'] } })
        .sort({ updatedAt: -1 })
        .limit(safe)
        .select('_id title workspaceId projectId status updatedAt assigneeIds')
        .lean(),
    ]);

    // Resolve display names
    const userIdSet = new Set<string>();
    const wsIdSet = new Set<string>();
    recentWs.forEach((w) => userIdSet.add(String(w.ownerId)));
    recentProjects.forEach((p) => {
      wsIdSet.add(String(p.workspaceId));
      if (p.leadId) userIdSet.add(String(p.leadId));
    });
    recentTasks.forEach((t) => {
      wsIdSet.add(String(t.workspaceId));
      (t.assigneeIds ?? []).forEach((a) => userIdSet.add(String(a)));
    });

    const [userDocs, wsDocs] = await Promise.all([
      userIdSet.size
        ? this.users
            .find({ _id: { $in: Array.from(userIdSet).map((s) => new Types.ObjectId(s)) } })
            .select('_id displayName')
            .lean()
        : Promise.resolve([]),
      wsIdSet.size
        ? this.workspaces
            .find({ _id: { $in: Array.from(wsIdSet).map((s) => new Types.ObjectId(s)) } })
            .select('_id name')
            .lean()
        : Promise.resolve([]),
    ]);
    const uMap = new Map(userDocs.map((u) => [String(u._id), u.displayName]));
    const wMap = new Map(wsDocs.map((w) => [String(w._id), w.name]));

    const events: ActivityEvent[] = [];
    for (const u of recentUsers) {
      events.push({
        id: `u:${String(u._id)}`,
        kind: 'user_joined',
        at: (u as any).createdAt?.toISOString?.() ?? new Date().toISOString(),
        actor: { id: String(u._id), displayName: u.displayName },
      });
    }
    for (const w of recentWs) {
      events.push({
        id: `w:${String(w._id)}`,
        kind: 'workspace_created',
        at: (w as any).createdAt?.toISOString?.() ?? new Date().toISOString(),
        actor: { id: String(w.ownerId), displayName: uMap.get(String(w.ownerId)) ?? 'Unknown' },
        workspace: { id: String(w._id), name: w.name },
      });
    }
    for (const p of recentProjects) {
      events.push({
        id: `p:${String(p._id)}`,
        kind: 'project_created',
        at: (p as any).createdAt?.toISOString?.() ?? new Date().toISOString(),
        actor: p.leadId
          ? { id: String(p.leadId), displayName: uMap.get(String(p.leadId)) ?? 'Unknown' }
          : undefined,
        workspace: {
          id: String(p.workspaceId),
          name: wMap.get(String(p.workspaceId)) ?? 'Unknown',
        },
        target: { id: String(p._id), label: p.name },
      });
    }
    for (const t of recentTasks) {
      const firstAssignee = (t.assigneeIds ?? [])[0];
      events.push({
        id: `t:${String(t._id)}`,
        kind: t.status === 'done' ? 'task_completed' : 'task_updated',
        at: (t as any).updatedAt?.toISOString?.() ?? new Date().toISOString(),
        actor: firstAssignee
          ? {
              id: String(firstAssignee),
              displayName: uMap.get(String(firstAssignee)) ?? 'Unknown',
            }
          : undefined,
        workspace: {
          id: String(t.workspaceId),
          name: wMap.get(String(t.workspaceId)) ?? 'Unknown',
        },
        target: { id: String(t._id), label: t.title },
      });
    }

    return events.sort((a, b) => b.at.localeCompare(a.at)).slice(0, safe);
  }

  async insights(): Promise<AdminInsights> {
    const now = new Date();

    // Overloaded users: count of active tasks per assignee
    const taskAgg = await this.tasks.aggregate<{
      _id: Types.ObjectId;
      activeTaskCount: number;
    }>([
      { $match: { status: { $in: ['not_started', 'in_progress', 'blocked'] } } },
      { $unwind: '$assigneeIds' },
      { $group: { _id: '$assigneeIds', activeTaskCount: { $sum: 1 } } },
      { $sort: { activeTaskCount: -1 } },
      { $limit: 25 },
    ]);

    // Allocation totals (units pct sum across active windows)
    const allocAgg = await this.allocations.aggregate<{
      _id: Types.ObjectId;
      avgUnits: number;
    }>([
      { $match: { endDate: { $gte: now } } },
      { $group: { _id: '$userId', avgUnits: { $avg: '$unitsPct' } } },
    ]);
    const allocMap = new Map(allocAgg.map((a) => [String(a._id), a.avgUnits]));

    const userIds = taskAgg.map((t) => t._id);
    const usersDocs = await this.users
      .find({ _id: { $in: userIds } })
      .select('_id displayName email')
      .lean();
    const uMap = new Map(usersDocs.map((u) => [String(u._id), u]));

    const overloadedUsers: OverloadedUser[] = taskAgg
      .map((t) => {
        const u = uMap.get(String(t._id));
        if (!u) return null;
        return {
          userId: String(t._id),
          displayName: u.displayName,
          email: u.email,
          activeTaskCount: t.activeTaskCount,
          allocationPct: Math.round(allocMap.get(String(t._id)) ?? 0),
        };
      })
      .filter((x): x is OverloadedUser => !!x)
      .filter((u) => u.activeTaskCount >= 5 || u.allocationPct >= 100)
      .slice(0, 8);

    // Overdue tasks
    const overdueDocs = await this.tasks
      .find({ status: { $nin: ['done', 'cancelled'] }, endDate: { $lt: now } })
      .sort({ endDate: 1 })
      .limit(15)
      .select('_id title projectId endDate priority assigneeIds')
      .lean();

    const projIds = Array.from(new Set(overdueDocs.map((t) => String(t.projectId))));
    const projects = projIds.length
      ? await this.projects
          .find({ _id: { $in: projIds.map((s) => new Types.ObjectId(s)) } })
          .select('_id name')
          .lean()
      : [];
    const projMap = new Map(projects.map((p) => [String(p._id), p.name]));

    const overdueTasks: OverdueTaskRow[] = overdueDocs.map((t) => ({
      taskId: String(t._id),
      title: t.title,
      projectId: String(t.projectId),
      projectName: projMap.get(String(t.projectId)) ?? 'Unknown',
      endDate: t.endDate.toISOString(),
      daysOverdue: Math.max(1, Math.floor((+now - +t.endDate) / MS_PER_DAY)),
      priority: t.priority,
      assigneeIds: (t.assigneeIds ?? []).map((a) => String(a)),
    }));

    const warnings: SystemWarning[] = [];
    if (overdueTasks.length > 10) {
      warnings.push({
        id: 'overdue-spike',
        level: 'warning',
        title: `${overdueTasks.length} tasks overdue across the platform`,
        body: 'Consider notifying workspace owners or running an automated reminder.',
      });
    }
    const blockedCount = await this.tasks.countDocuments({ status: 'blocked' });
    if (blockedCount > 5) {
      warnings.push({
        id: 'blocked-spike',
        level: 'warning',
        title: `${blockedCount} tasks are blocked`,
        body: 'Check critical paths — blocked predecessors can cascade to deadlines.',
      });
    }
    if (overloadedUsers.length > 0) {
      warnings.push({
        id: 'overload',
        level: overloadedUsers.length >= 4 ? 'critical' : 'warning',
        title: `${overloadedUsers.length} contributors are overloaded`,
        body: 'Rebalance allocations or extend timelines to keep delivery healthy.',
      });
    }
    if (warnings.length === 0) {
      warnings.push({
        id: 'all-clear',
        level: 'info',
        title: 'All systems healthy',
        body: 'No overdue spike, no overloaded users. Keep shipping.',
      });
    }

    return { overloadedUsers, overdueTasks, warnings };
  }
}

/** Host part of MongoDB URI only (no credentials). */
function mongoHostsSummary(uri: string): string {
  const s = uri.trim();
  if (!s) return '—';
  const at = s.lastIndexOf('@');
  const hostPart =
    at >= 0
      ? s.slice(at + 1).split('/')[0].split('?')[0]
      : s.replace(/^mongodb(\+srv)?:\/\//i, '').split('/')[0].split('?')[0];
  return hostPart || 'configured';
}

function mapStatusAgg(agg: { _id: string; count: number }[]): StatusDistribution {
  const m = new Map(agg.map((a) => [a._id, a.count]));
  return {
    not_started: m.get('not_started') ?? 0,
    in_progress: m.get('in_progress') ?? 0,
    blocked: m.get('blocked') ?? 0,
    done: m.get('done') ?? 0,
    cancelled: m.get('cancelled') ?? 0,
  };
}

function pctChange(curr: number, prev: number): number {
  if (prev === 0) return curr > 0 ? 100 : 0;
  return Math.round(((curr - prev) / prev) * 1000) / 10;
}
