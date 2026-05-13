import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
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
import { ProjectsService } from './projects.service';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';

@ApiBearerAuth()
@ApiTags('projects')
@UseGuards(WorkspaceRoleGuard)
@Controller('workspaces/:workspaceId/projects')
export class ProjectsController {
  constructor(private readonly svc: ProjectsService) {}

  @WorkspaceRoles('owner', 'admin')
  @Post()
  create(
    @Param('workspaceId') wid: string,
    @Body() dto: CreateProjectDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: any,
  ) {
    return this.svc.create(wid, dto, actorFromRequest(user, req));
  }

  @WorkspaceRoles('owner', 'admin', 'member', 'viewer', 'client')
  @Get()
  list(@Param('workspaceId') wid: string, @CurrentUser() user: JwtPayload, @Req() req: any) {
    return this.svc.list(wid, actorFromRequest(user, req));
  }

  @WorkspaceRoles('owner', 'admin', 'member', 'viewer', 'client')
  @Get(':projectId')
  detail(
    @Param('workspaceId') wid: string,
    @Param('projectId') pid: string,
    @CurrentUser() user: JwtPayload,
    @Req() req: any,
  ) {
    return this.svc.getOrFail(wid, pid, actorFromRequest(user, req));
  }

  @WorkspaceRoles('owner', 'admin')
  @Patch(':projectId')
  update(
    @Param('workspaceId') wid: string,
    @Param('projectId') pid: string,
    @Body() dto: UpdateProjectDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: any,
  ) {
    return this.svc.update(wid, pid, dto, actorFromRequest(user, req));
  }

  @WorkspaceRoles('owner', 'admin')
  @Delete(':projectId/members/:userId')
  removeProjectMember(
    @Param('workspaceId') wid: string,
    @Param('projectId') pid: string,
    @Param('userId') targetUserId: string,
    @CurrentUser() user: JwtPayload,
    @Req() req: any,
  ) {
    return this.svc.removeProjectMember(wid, pid, targetUserId, actorFromRequest(user, req));
  }

  @WorkspaceRoles('owner', 'admin')
  @Delete(':projectId')
  archive(
    @Param('workspaceId') wid: string,
    @Param('projectId') pid: string,
    @CurrentUser() user: JwtPayload,
    @Req() req: any,
  ) {
    return this.svc.archive(wid, pid, actorFromRequest(user, req));
  }
}

function actorFromRequest(user: JwtPayload, req: any) {
  return {
    userId: user.sub,
    workspaceRole: req.workspaceMember?.role,
    platformOverride: !!req.workspaceMember?.platformOverride,
  };
}
