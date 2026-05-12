import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  WorkspaceMember,
  WorkspaceMemberDocument,
} from '../../workspaces/schemas/workspace-member.schema';

export type WsRole = 'owner' | 'admin' | 'member' | 'viewer' | 'client';
export const WORKSPACE_ROLES_KEY = 'workspaceRoles';
export const WorkspaceRoles = (...roles: WsRole[]) =>
  SetMetadata(WORKSPACE_ROLES_KEY, roles);

@Injectable()
export class WorkspaceRoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @InjectModel(WorkspaceMember.name)
    private readonly members: Model<WorkspaceMemberDocument>,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const allowed =
      this.reflector.getAllAndOverride<WsRole[]>(WORKSPACE_ROLES_KEY, [
        ctx.getHandler(),
        ctx.getClass(),
      ]) ?? (['owner', 'admin', 'member'] as WsRole[]);

    const req = ctx.switchToHttp().getRequest();
    const userId: string | undefined = req.user?.sub;
    const workspaceId: string | undefined = req.params?.workspaceId;
    if (!userId || !workspaceId) {
      throw new ForbiddenException({ code: 'FORBIDDEN' });
    }
    if (!Types.ObjectId.isValid(workspaceId)) {
      throw new ForbiddenException({ code: 'INVALID_WORKSPACE' });
    }
    if (req.user?.platformRole === 'platform_admin' && allowed.includes('owner')) {
      req.workspaceMember = {
        workspaceId: new Types.ObjectId(workspaceId),
        userId: new Types.ObjectId(userId),
        role: 'owner',
        status: 'active',
        platformOverride: true,
      };
      return true;
    }
    const member = await this.members
      .findOne({
        workspaceId: new Types.ObjectId(workspaceId),
        userId: new Types.ObjectId(userId),
        status: 'active',
      })
      .lean();

    if (!member || !allowed.includes(member.role as WsRole)) {
      throw new ForbiddenException({
        code: 'INSUFFICIENT_WORKSPACE_ROLE',
        message: 'Insufficient workspace role',
      });
    }
    req.workspaceMember = member;
    return true;
  }
}
