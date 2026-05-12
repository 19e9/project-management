import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  WorkspaceRoleGuard,
  WorkspaceRoles,
} from '../common/guards/workspace-role.guard';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { DependenciesService } from './dependencies.service';
import { CreateDependencyDto } from './dto/dependency.dto';

@ApiBearerAuth()
@ApiTags('dependencies')
@UseGuards(WorkspaceRoleGuard)
@Controller('workspaces/:workspaceId/projects/:projectId/dependencies')
export class DependenciesController {
  constructor(private readonly svc: DependenciesService) {}

  @WorkspaceRoles('owner', 'admin')
  @Post()
  create(
    @Param('workspaceId') wid: string,
    @Param('projectId') pid: string,
    @Body() dto: CreateDependencyDto,
  ) {
    return this.svc.create(wid, pid, dto);
  }

  @WorkspaceRoles('owner', 'admin', 'member', 'viewer', 'client')
  @Get()
  list(@Param('projectId') pid: string, @CurrentUser() user: JwtPayload, @Req() req: any) {
    return this.svc.list(pid, actorFromRequest(user, req));
  }

  @WorkspaceRoles('owner', 'admin')
  @Delete(':depId')
  remove(@Param('projectId') pid: string, @Param('depId') depId: string) {
    return this.svc.remove(pid, depId);
  }
}

function actorFromRequest(user: JwtPayload, req: any) {
  return {
    userId: user.sub,
    workspaceRole: req.workspaceMember?.role,
    platformOverride: !!req.workspaceMember?.platformOverride,
  };
}
