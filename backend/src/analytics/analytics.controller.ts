import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  WorkspaceRoleGuard,
  WorkspaceRoles,
} from '../common/guards/workspace-role.guard';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { AnalyticsService } from './analytics.service';

@ApiBearerAuth()
@ApiTags('analytics')
@UseGuards(WorkspaceRoleGuard)
@Controller('workspaces/:workspaceId/projects/:projectId/analytics')
export class AnalyticsController {
  constructor(private readonly svc: AnalyticsService) {}

  @WorkspaceRoles('owner', 'admin', 'member', 'viewer', 'client')
  @Get('overview')
  overview(@Param('projectId') pid: string, @CurrentUser() user: JwtPayload, @Req() req: any) {
    return this.svc.overview(pid, actorFromRequest(user, req));
  }

  @WorkspaceRoles('owner', 'admin', 'member', 'viewer', 'client')
  @Get('burndown')
  burndown(@Param('projectId') pid: string, @CurrentUser() user: JwtPayload, @Req() req: any) {
    return this.svc.burndown(pid, actorFromRequest(user, req));
  }
}

function actorFromRequest(user: JwtPayload, req: any) {
  return {
    userId: user.sub,
    workspaceRole: req.workspaceMember?.role,
    platformOverride: !!req.workspaceMember?.platformOverride,
  };
}
