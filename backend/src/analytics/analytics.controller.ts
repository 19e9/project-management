import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  WorkspaceRoleGuard,
  WorkspaceRoles,
} from '../common/guards/workspace-role.guard';
import { AnalyticsService } from './analytics.service';

@ApiBearerAuth()
@ApiTags('analytics')
@UseGuards(WorkspaceRoleGuard)
@Controller('workspaces/:workspaceId/projects/:projectId/analytics')
export class AnalyticsController {
  constructor(private readonly svc: AnalyticsService) {}

  @WorkspaceRoles('owner', 'member', 'client')
  @Get('overview')
  overview(@Param('projectId') pid: string) {
    return this.svc.overview(pid);
  }

  @WorkspaceRoles('owner', 'member', 'client')
  @Get('burndown')
  burndown(@Param('projectId') pid: string) {
    return this.svc.burndown(pid);
  }
}
