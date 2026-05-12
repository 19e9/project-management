import {
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  WorkspaceRoleGuard,
  WorkspaceRoles,
} from '../common/guards/workspace-role.guard';
import { CpmService } from './cpm.service';
import { WorkspacesService } from '../workspaces/workspaces.service';

@ApiBearerAuth()
@ApiTags('planning')
@UseGuards(WorkspaceRoleGuard)
@Controller('workspaces/:workspaceId/projects/:projectId/planning')
export class PlanningController {
  constructor(
    private readonly cpm: CpmService,
    private readonly workspaces: WorkspacesService,
  ) {}

  @WorkspaceRoles('owner', 'admin')
  @Get('cpm')
  async cpmGet(
    @Param('workspaceId') wid: string,
    @Param('projectId') pid: string,
  ) {
    await this.assertCpmAllowed(wid);
    return this.cpm.getCachedOrCompute(pid);
  }

  @WorkspaceRoles('owner', 'admin')
  @Post('cpm/recompute')
  async cpmRecompute(
    @Param('workspaceId') wid: string,
    @Param('projectId') pid: string,
  ) {
    await this.assertCpmAllowed(wid);
    return this.cpm.compute(pid);
  }

  private async assertCpmAllowed(workspaceId: string) {
    const ws = await this.workspaces.getOrFail(workspaceId);
    if (!ws.entitlements.cpmEnabled) {
      throw new ForbiddenException({
        code: 'PLAN_FEATURE_DISABLED',
        message: 'CPM/Network diagram is available on Pro plan and above.',
      });
    }
  }
}
