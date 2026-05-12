import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UsersService } from '../users/users.service';
import {
  Workspace,
  WorkspaceDocument,
  PLAN_DEFAULTS,
} from './schemas/workspace.schema';
import {
  WorkspaceMember,
  WorkspaceMemberDocument,
} from './schemas/workspace-member.schema';
import {
  CreateWorkspaceDto,
  UpdateWorkspaceDto,
  InviteMemberDto,
  UpdateMemberRoleDto,
} from './dto/workspace.dto';
import { BillingService } from '../billing/billing.service';

export interface WorkspaceMemberListItem {
  id: string;
  userId: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  role: 'owner' | 'member' | 'client';
  status: 'invited' | 'active' | 'removed';
}

interface WorkspaceActor {
  userId: string;
  workspaceRole?: 'owner' | 'member' | 'client';
  platformOverride?: boolean;
}

@Injectable()
export class WorkspacesService {
  constructor(
    @InjectModel(Workspace.name)
    private readonly workspaces: Model<WorkspaceDocument>,
    @InjectModel(WorkspaceMember.name)
    private readonly members: Model<WorkspaceMemberDocument>,
    private readonly users: UsersService,
    private readonly cfg: ConfigService,
    private readonly billing: BillingService,
  ) {}

  async create(ownerUserId: string, dto: CreateWorkspaceDto) {
    const ownerId = new Types.ObjectId(ownerUserId);
    const plan =
      this.cfg.get<'free' | 'pro' | 'enterprise'>('DEFAULT_NEW_WORKSPACE_PLAN') ?? 'free';
    const snap = await this.billing.getDefaultPlanForTier(plan);
    const workspace = await this.workspaces.create({
      name: dto.name,
      ownerId,
      plan,
      subscriptionPlanId: snap ? new Types.ObjectId(snap.id) : undefined,
      entitlements: snap?.entitlements ?? PLAN_DEFAULTS[plan],
    });
    await this.members.create({
      workspaceId: workspace._id,
      userId: ownerId,
      role: 'owner',
      status: 'active',
    });
    await this.billing.recordSeatEvent({
      workspaceId: String(workspace._id),
      userId: ownerUserId,
      role: 'owner',
      action: 'added',
      billableAfter: true,
    });
    return this.shape(workspace);
  }

  async listForUser(userId: string) {
    const memberships = await this.members
      .find({ userId: new Types.ObjectId(userId), status: 'active' })
      .lean();
    if (!memberships.length) return [];
    const workspaces = await this.workspaces
      .find({ _id: { $in: memberships.map((m) => m.workspaceId) }, status: 'active' })
      .lean();
    const roleByWs = new Map(
      memberships.map((m) => [String(m.workspaceId), m.role]),
    );
    return workspaces.map((w) => ({
      ...this.shape(w),
      role: roleByWs.get(String(w._id)),
    }));
  }

  async getOrFail(workspaceId: string) {
    if (!Types.ObjectId.isValid(workspaceId)) {
      throw new NotFoundException({ code: 'WORKSPACE_NOT_FOUND' });
    }
    const w = await this.workspaces.findById(workspaceId).lean();
    if (!w) throw new NotFoundException({ code: 'WORKSPACE_NOT_FOUND' });
    return this.shape(w);
  }

  async update(workspaceId: string, dto: UpdateWorkspaceDto) {
    const w = await this.workspaces
      .findByIdAndUpdate(workspaceId, dto, { new: true })
      .lean();
    if (!w) throw new NotFoundException({ code: 'WORKSPACE_NOT_FOUND' });
    return this.shape(w);
  }

  async archive(workspaceId: string) {
    const w = await this.workspaces
      .findByIdAndUpdate(workspaceId, { status: 'suspended' }, { new: true })
      .lean();
    if (!w) throw new NotFoundException({ code: 'WORKSPACE_NOT_FOUND' });
    return { ok: true };
  }

  async listMembers(workspaceId: string): Promise<WorkspaceMemberListItem[]> {
    const rows = await this.members
      .find({ workspaceId: new Types.ObjectId(workspaceId), status: 'active' })
      .populate({
        path: 'userId',
        select: 'email displayName avatarUrl',
      })
      .lean();

    return rows.map((m) => {
      const u = m.userId as unknown as {
        _id: Types.ObjectId;
        email: string;
        displayName: string;
        avatarUrl?: string;
      };
      return {
        id: String(m._id),
        userId: String(u._id),
        email: u.email,
        displayName: u.displayName,
        avatarUrl: u.avatarUrl,
        role: m.role,
        status: m.status,
      };
    });
  }

  async inviteMember(workspaceId: string, dto: InviteMemberDto) {
    const ws = await this.workspaces.findById(workspaceId);
    if (!ws) throw new NotFoundException({ code: 'WORKSPACE_NOT_FOUND' });

    const activeCount = await this.members.countDocuments({
      workspaceId: ws._id,
      status: 'active',
    });
    if (activeCount >= ws.entitlements.maxMembers) {
      throw new BadRequestException({
        code: 'PLAN_LIMIT',
        message: 'Member limit reached for current plan',
      });
    }

    const user = await this.users.findByEmail(dto.email);
    if (!user) {
      throw new BadRequestException({
        code: 'INVITE_USER_NOT_FOUND',
        message: 'User must register first; magic-link invites can be added later.',
      });
    }
    const exists = await this.members.findOne({
      workspaceId: ws._id,
      userId: user._id,
    });
    const billableAfter = dto.role === 'owner' || dto.role === 'member';
    if (exists) {
      const prevBillable = exists.role === 'owner' || exists.role === 'member';
      const prevRole = exists.role;
      exists.role = dto.role;
      exists.status = 'active';
      await exists.save();
      if (prevBillable !== billableAfter || prevRole !== dto.role) {
        await this.billing.recordSeatEvent({
          workspaceId,
          userId: String(user._id),
          role: dto.role,
          action: prevRole === dto.role ? 'added' : 'role_changed',
          billableAfter,
        });
      }
      return exists.toObject();
    }
    const row = await this.members.create({
      workspaceId: ws._id,
      userId: user._id,
      role: dto.role,
      status: 'active',
    });
    await this.billing.recordSeatEvent({
      workspaceId,
      userId: String(user._id),
      role: dto.role,
      action: 'added',
      billableAfter,
    });
    return row.toObject();
  }

  async updateMemberRole(
    workspaceId: string,
    targetUserId: string,
    dto: UpdateMemberRoleDto,
    actor?: WorkspaceActor,
  ) {
    await this.assertPrimaryOwnerCanBeChanged(workspaceId, targetUserId, actor);
    const m = await this.members.findOne({
      workspaceId: new Types.ObjectId(workspaceId),
      userId: new Types.ObjectId(targetUserId),
    });
    if (!m) throw new NotFoundException({ code: 'MEMBER_NOT_FOUND' });
    const oldRole = m.role;
    const oldBillable = oldRole === 'owner' || oldRole === 'member';
    m.role = dto.role;
    await m.save();
    const newBillable = dto.role === 'owner' || dto.role === 'member';
    if (oldBillable !== newBillable || oldRole !== dto.role) {
      await this.billing.recordSeatEvent({
        workspaceId,
        userId: targetUserId,
        role: dto.role,
        action: 'role_changed',
        billableAfter: newBillable,
      });
    }
    return m.toObject();
  }

  async removeMember(workspaceId: string, targetUserId: string, actor?: WorkspaceActor) {
    await this.assertPrimaryOwnerCanBeChanged(workspaceId, targetUserId, actor);
    const m = await this.members.findOne({
      workspaceId: new Types.ObjectId(workspaceId),
      userId: new Types.ObjectId(targetUserId),
      status: 'active',
    });
    if (!m) throw new NotFoundException({ code: 'MEMBER_NOT_FOUND' });
    const wasBillable = m.role === 'owner' || m.role === 'member';
    const role = m.role;
    m.status = 'removed';
    await m.save();
    if (wasBillable) {
      await this.billing.recordSeatEvent({
        workspaceId,
        userId: targetUserId,
        role,
        action: 'removed',
        billableAfter: false,
      });
    }
    return { ok: true };
  }

  private async assertPrimaryOwnerCanBeChanged(
    workspaceId: string,
    targetUserId: string,
    actor?: WorkspaceActor,
  ) {
    const workspace = await this.workspaces
      .findById(workspaceId)
      .select('ownerId')
      .lean();
    if (!workspace) throw new NotFoundException({ code: 'WORKSPACE_NOT_FOUND' });
    if (String(workspace.ownerId) === targetUserId && !actor?.platformOverride) {
      throw new ForbiddenException({
        code: 'PRIMARY_OWNER_LOCKED',
        message: 'The current workspace owner role can only be changed by a platform admin.',
      });
    }
  }

  private shape(w: any) {
    return {
      id: String(w._id),
      name: w.name,
      ownerId: String(w.ownerId),
      plan: w.plan,
      status: w.status,
      entitlements: w.entitlements,
      createdAt: w.createdAt,
    };
  }
}
