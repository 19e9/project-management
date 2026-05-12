import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Workspace, WorkspaceDocument } from '../workspaces/schemas/workspace.schema';
import {
  WorkspaceMember,
  WorkspaceMemberDocument,
} from '../workspaces/schemas/workspace-member.schema';
import { Project, ProjectDocument } from '../projects/schemas/project.schema';
import { Task, TaskDocument } from '../tasks/schemas/task.schema';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type MyRole = 'platform_admin' | 'owner' | 'admin' | 'member' | 'viewer' | 'client';

export interface WorkspaceSummary {
  id: string;
  name: string;
  plan: 'free' | 'pro' | 'enterprise';
  status: 'active' | 'suspended';
  role: 'owner' | 'admin' | 'member' | 'viewer' | 'client';
  memberCount: number;
  projectCount: number;
  activeTaskCount: number;
  completionPct: number;
  entitlements: {
    cpmEnabled: boolean;
    ganttEnabled: boolean;
    maxMembers: number;
    maxProjects: number;
  };
}

export interface UpcomingTask {
  id: string;
  title: string;
  endDate: string;
  priority: string;
  status: string;
  progressPct: number;
  projectId: string;
  projectName: string;
  workspaceId: string;
  workspaceName: string;
  daysUntilDue: number;
  isOverdue: boolean;
}

export interface ProjectSummary {
  id: string;
  name: string;
  workspaceId: string;
  workspaceName: string;
  status: string;
  taskCount: number;
  completionPct: number;
  overdueCount: number;
}

export interface MyTaskStats {
  total: number;
  inProgress: number;
  done: number;
  blocked: number;
  notStarted: number;
  overdue: number;
  upcomingSoon: number;
  completionPct: number;
}

export interface MeDashboardResponse {
  myRole: MyRole;
  workspaces: WorkspaceSummary[];
  taskStats: MyTaskStats;
  upcomingTasks: UpcomingTask[];
  myProjects: ProjectSummary[];
}

@Injectable()
export class MeDashboardService {
  constructor(
    @InjectModel(User.name) private readonly users: Model<UserDocument>,
    @InjectModel(Workspace.name) private readonly workspaces: Model<WorkspaceDocument>,
    @InjectModel(WorkspaceMember.name)
    private readonly members: Model<WorkspaceMemberDocument>,
    @InjectModel(Project.name) private readonly projects: Model<ProjectDocument>,
    @InjectModel(Task.name) private readonly tasks: Model<TaskDocument>,
  ) {}

  async compute(userId: string): Promise<MeDashboardResponse> {
    const uid = new Types.ObjectId(userId);
    const now = new Date();
    const in7d = new Date(+now + 7 * MS_PER_DAY);

    const user = await this.users.findById(uid).select('platformRole').lean();
    if (!user) {
      return this.empty('viewer');
    }

    const myMemberships = await this.members
      .find({ userId: uid, status: 'active' })
      .lean();

    // Determine effective role
    const myRole = this.resolveRole(user.platformRole, myMemberships);

    if (myMemberships.length === 0) {
      return { ...this.empty(myRole), myRole };
    }

    const wsIds = myMemberships.map((m) => m.workspaceId);

    // ── Workspaces ──────────────────────────────────────────
    const wsList = await this.workspaces
      .find({ _id: { $in: wsIds }, status: 'active' })
      .lean();
    const activeWsIds = wsList.map((w) => w._id);
    if (activeWsIds.length === 0) {
      return { ...this.empty(myRole), myRole };
    }
    const activeProjectIds = await this.projects.distinct('_id', {
      workspaceId: { $in: activeWsIds },
      status: 'active',
    });

    const [memberCounts, projectCounts, taskStatusAgg] = await Promise.all([
      this.members.aggregate<{ _id: Types.ObjectId; count: number }>([
        { $match: { workspaceId: { $in: activeWsIds }, status: 'active' } },
        { $group: { _id: '$workspaceId', count: { $sum: 1 } } },
      ]),
      this.projects.aggregate<{ _id: Types.ObjectId; count: number; active: number }>([
        { $match: { workspaceId: { $in: activeWsIds }, status: 'active' } },
        {
          $group: {
            _id: '$workspaceId',
            count: { $sum: 1 },
            active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
          },
        },
      ]),
      this.tasks.aggregate<{
        _id: Types.ObjectId;
        active: number;
        done: number;
        total: number;
      }>([
        { $match: { workspaceId: { $in: activeWsIds } } },
        {
          $lookup: {
            from: 'projects',
            localField: 'projectId',
            foreignField: '_id',
            as: 'project',
          },
        },
        { $unwind: '$project' },
        { $match: { 'project.status': 'active' } },
        {
          $group: {
            _id: '$workspaceId',
            total: { $sum: 1 },
            done: { $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] } },
            active: {
              $sum: {
                $cond: [{ $in: ['$status', ['in_progress', 'blocked', 'not_started']] }, 1, 0],
              },
            },
          },
        },
      ]),
    ]);

    const memMap = new Map(memberCounts.map((m) => [String(m._id), m.count]));
    const projMap = new Map(projectCounts.map((p) => [String(p._id), p]));
    const tMap = new Map(taskStatusAgg.map((t) => [String(t._id), t]));
    const roleMap = new Map(myMemberships.map((m) => [String(m.workspaceId), m.role]));
    const activeWsIdSet = new Set(activeWsIds.map((id) => String(id)));
    const broadProjectWsIds = myMemberships
      .filter(
        (m) =>
          activeWsIdSet.has(String(m.workspaceId)) &&
          (
            user.platformRole === 'platform_admin' ||
            m.role === 'owner' ||
            m.role === 'admin' ||
            m.role === 'member' ||
            m.role === 'viewer' ||
            m.role === 'client'
          ),
      )
      .map((m) => m.workspaceId);
    const assignedOnlyWsIds: Types.ObjectId[] = [];

    const workspaces: WorkspaceSummary[] = wsList.map((w) => {
      const ti = tMap.get(String(w._id));
      const denom = ti?.total ? ti.total - 0 : 1;
      return {
        id: String(w._id),
        name: w.name,
        plan: w.plan,
        status: w.status,
        role: (roleMap.get(String(w._id)) ?? 'viewer') as 'owner' | 'admin' | 'member' | 'viewer' | 'client',
        memberCount: memMap.get(String(w._id)) ?? 0,
        projectCount: projMap.get(String(w._id))?.count ?? 0,
        activeTaskCount: ti?.active ?? 0,
        completionPct:
          ti && ti.total > 0 ? Math.round((ti.done / ti.total) * 1000) / 10 : 0,
        entitlements: {
          cpmEnabled: w.entitlements?.cpmEnabled ?? false,
          ganttEnabled: w.entitlements?.ganttEnabled ?? true,
          maxMembers: w.entitlements?.maxMembers ?? 10,
          maxProjects: w.entitlements?.maxProjects ?? 3,
        },
      };
    });

    // ── My task stats ────────────────────────────────────────
    const [myTaskAgg, myOverdue, myUpcomingSoon] = await Promise.all([
      this.tasks.aggregate<{ _id: string; count: number }>([
        { $match: { assigneeIds: uid, workspaceId: { $in: activeWsIds }, projectId: { $in: activeProjectIds } } },
        {
          $lookup: {
            from: 'projects',
            localField: 'projectId',
            foreignField: '_id',
            as: 'project',
          },
        },
        { $unwind: '$project' },
        { $match: { 'project.status': 'active' } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      this.tasks.countDocuments({
        assigneeIds: uid,
        workspaceId: { $in: activeWsIds },
        projectId: { $in: activeProjectIds },
        status: { $nin: ['done', 'cancelled'] },
        endDate: { $lt: now },
      }),
      this.tasks.countDocuments({
        assigneeIds: uid,
        workspaceId: { $in: activeWsIds },
        projectId: { $in: activeProjectIds },
        status: { $nin: ['done', 'cancelled'] },
        endDate: { $gte: now, $lte: in7d },
      }),
    ]);

    const sm = new Map(myTaskAgg.map((a) => [a._id, a.count]));
    const done = sm.get('done') ?? 0;
    const inProgress = sm.get('in_progress') ?? 0;
    const blocked = sm.get('blocked') ?? 0;
    const notStarted = sm.get('not_started') ?? 0;
    const cancelled = sm.get('cancelled') ?? 0;
    const total = done + inProgress + blocked + notStarted + cancelled;
    const denom = total - cancelled || 1;

    const taskStats: MyTaskStats = {
      total,
      inProgress,
      done,
      blocked,
      notStarted,
      overdue: myOverdue,
      upcomingSoon: myUpcomingSoon,
      completionPct: Math.round((done / denom) * 1000) / 10,
    };

    // ── Upcoming tasks ───────────────────────────────────────
    const rawUpcoming = await this.tasks
      .find({
        assigneeIds: uid,
        workspaceId: { $in: activeWsIds },
        projectId: { $in: activeProjectIds },
        status: { $nin: ['done', 'cancelled'] },
        endDate: { $gte: now },
      })
      .sort({ endDate: 1 })
      .limit(20)
      .lean();

    const overdueRaw = await this.tasks
      .find({
        assigneeIds: uid,
        workspaceId: { $in: activeWsIds },
        projectId: { $in: activeProjectIds },
        status: { $nin: ['done', 'cancelled'] },
        endDate: { $lt: now },
      })
      .sort({ endDate: 1 })
      .limit(10)
      .lean();

    const allUpcomingRaw = [...overdueRaw, ...rawUpcoming].slice(0, 20);

    const projIds = Array.from(
      new Set(allUpcomingRaw.map((t) => String(t.projectId))),
    );
    const wsIdsForProj = Array.from(
      new Set(allUpcomingRaw.map((t) => String(t.workspaceId))),
    );

    const [projDocs, wsDocs] = await Promise.all([
      projIds.length
        ? this.projects
            .find({ _id: { $in: projIds.map((s) => new Types.ObjectId(s)) } })
            .select('_id name')
            .lean()
        : Promise.resolve([]),
      this.workspaces
        .find({ _id: { $in: wsIdsForProj.map((s) => new Types.ObjectId(s)) } })
        .select('_id name')
        .lean(),
    ]);
    const pMap = new Map(projDocs.map((p) => [String(p._id), p.name]));
    const wMapSmall = new Map(wsDocs.map((w) => [String(w._id), w.name]));

    const upcomingTasks: UpcomingTask[] = allUpcomingRaw.map((t) => {
      const diffMs = +new Date(t.endDate) - +now;
      const daysUntilDue = Math.ceil(diffMs / MS_PER_DAY);
      return {
        id: String(t._id),
        title: t.title,
        endDate: t.endDate instanceof Date ? t.endDate.toISOString() : String(t.endDate),
        priority: t.priority,
        status: t.status,
        progressPct: t.progressPct ?? 0,
        projectId: String(t.projectId),
        projectName: pMap.get(String(t.projectId)) ?? 'Unknown',
        workspaceId: String(t.workspaceId),
        workspaceName: wMapSmall.get(String(t.workspaceId)) ?? 'Unknown',
        daysUntilDue,
        isOverdue: daysUntilDue < 0,
      };
    });

    // ── My projects ──────────────────────────────────────────
    const myProjectFilter: any = { status: 'active' };
    const projectVisibility: any[] = [];
    if (broadProjectWsIds.length > 0) {
      projectVisibility.push({ workspaceId: { $in: broadProjectWsIds } });
    }
    if (assignedOnlyWsIds.length > 0) {
      const assignedProjectIds = await this.tasks.distinct('projectId', {
        assigneeIds: uid,
        workspaceId: { $in: assignedOnlyWsIds },
        projectId: { $in: activeProjectIds },
      });
      projectVisibility.push({ _id: { $in: assignedProjectIds } });
    }
    if (projectVisibility.length === 0) {
      myProjectFilter._id = { $in: [] };
    } else if (projectVisibility.length === 1) {
      Object.assign(myProjectFilter, projectVisibility[0]);
    } else {
      myProjectFilter.$or = projectVisibility;
    }

    const myProjectDocs = await this.projects
      .find(myProjectFilter)
      .sort({ createdAt: -1 })
      .limit(12)
      .lean();

    const myProjIds = myProjectDocs.map((p) => p._id);
    const broadProjectIdSet = new Set(
      myProjectDocs
        .filter((p) => broadProjectWsIds.some((wsId) => String(wsId) === String(p.workspaceId)))
        .map((p) => String(p._id)),
    );
    const projTaskAgg = await this.tasks.aggregate<{
      _id: Types.ObjectId;
      total: number;
      done: number;
      overdue: number;
    }>([
      {
        $match: {
          projectId: { $in: myProjIds },
          $or: [
            { projectId: { $in: [...broadProjectIdSet].map((id) => new Types.ObjectId(id)) } },
            { assigneeIds: uid },
          ],
        },
      },
      {
        $group: {
          _id: '$projectId',
          total: { $sum: 1 },
          done: { $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] } },
          overdue: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $not: [{ $in: ['$status', ['done', 'cancelled']] }] },
                    { $lt: ['$endDate', now] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);
    const ptMap = new Map(projTaskAgg.map((p) => [String(p._id), p]));
    const wsMapFull = new Map(wsList.map((w) => [String(w._id), w.name]));

    const myProjects: ProjectSummary[] = myProjectDocs.map((p) => {
      const pt = ptMap.get(String(p._id));
      const denom2 = pt?.total || 1;
      return {
        id: String(p._id),
        name: p.name,
        workspaceId: String(p.workspaceId),
        workspaceName: wsMapFull.get(String(p.workspaceId)) ?? 'Unknown',
        status: p.status,
        taskCount: pt?.total ?? 0,
        completionPct: pt ? Math.round((pt.done / denom2) * 1000) / 10 : 0,
        overdueCount: pt?.overdue ?? 0,
      };
    });

    return { myRole, workspaces, taskStats, upcomingTasks, myProjects };
  }

  private resolveRole(
    platformRole: string,
    memberships: { role: string }[],
  ): MyRole {
    if (platformRole === 'platform_admin') return 'platform_admin';
    const roles = memberships.map((m) => m.role);
    if (roles.includes('owner')) return 'owner';
    if (roles.includes('admin')) return 'admin';
    if (roles.includes('member')) return 'member';
    if (roles.includes('viewer')) return 'viewer';
    return 'client';
  }

  private empty(myRole: MyRole): MeDashboardResponse {
    return {
      myRole,
      workspaces: [],
      taskStats: {
        total: 0, inProgress: 0, done: 0, blocked: 0,
        notStarted: 0, overdue: 0, upcomingSoon: 0, completionPct: 0,
      },
      upcomingTasks: [],
      myProjects: [],
    };
  }
}
