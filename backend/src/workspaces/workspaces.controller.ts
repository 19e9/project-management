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
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import {
  WorkspaceRoleGuard,
  WorkspaceRoles,
} from '../common/guards/workspace-role.guard';
import { WorkspacesService, type WorkspaceMemberListItem } from './workspaces.service';
import {
  CreateWorkspaceDto,
  UpdateWorkspaceDto,
  InviteMemberDto,
  UpdateMemberRoleDto,
} from './dto/workspace.dto';
@ApiTags('workspaces')
@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly svc: WorkspacesService) {}

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateWorkspaceDto) {
    return this.svc.create(user.sub, dto);
  }

  @Get()
  list(@CurrentUser() user: JwtPayload) {
    return this.svc.listForUser(user.sub);
  }

  @UseGuards(WorkspaceRoleGuard)
  @WorkspaceRoles('owner', 'admin', 'member', 'viewer', 'client')
  @Get(':workspaceId')
  detail(@Param('workspaceId') id: string) {
    return this.svc.getOrFail(id);
  }

  @UseGuards(WorkspaceRoleGuard)
  @WorkspaceRoles('owner')
  @Patch(':workspaceId')
  update(@Param('workspaceId') id: string, @Body() dto: UpdateWorkspaceDto) {
    return this.svc.update(id, dto);
  }

  @UseGuards(WorkspaceRoleGuard)
  @WorkspaceRoles('owner')
  @Delete(':workspaceId')
  archive(@Param('workspaceId') id: string) {
    return this.svc.archive(id);
  }

  @UseGuards(WorkspaceRoleGuard)
  @WorkspaceRoles('owner', 'admin', 'member', 'viewer', 'client')
  @Get(':workspaceId/members')
  listMembers(@Param('workspaceId') id: string): Promise<WorkspaceMemberListItem[]> {
    return this.svc.listMembers(id);
  }

  @UseGuards(WorkspaceRoleGuard)
  @WorkspaceRoles('owner', 'admin')
  @Post(':workspaceId/invites')
  invite(@Param('workspaceId') id: string, @Body() dto: InviteMemberDto, @CurrentUser() user: JwtPayload, @Req() req: any) {
    return this.svc.inviteMember(id, dto, actorFromRequest(user, req));
  }

  @UseGuards(WorkspaceRoleGuard)
  @WorkspaceRoles('owner', 'admin')
  @Patch(':workspaceId/members/:userId')
  updateRole(
    @Param('workspaceId') id: string,
    @Param('userId') userId: string,
    @Body() dto: UpdateMemberRoleDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: any,
  ) {
    return this.svc.updateMemberRole(id, userId, dto, actorFromRequest(user, req));
  }

  @UseGuards(WorkspaceRoleGuard)
  @WorkspaceRoles('owner', 'admin')
  @Delete(':workspaceId/members/:userId')
  remove(@Param('workspaceId') id: string, @Param('userId') userId: string, @CurrentUser() user: JwtPayload, @Req() req: any) {
    return this.svc.removeMember(id, userId, actorFromRequest(user, req));
  }
}

function actorFromRequest(user: JwtPayload, req: any) {
  return {
    userId: user.sub,
    workspaceRole: req.workspaceMember?.role,
    platformOverride: !!req.workspaceMember?.platformOverride,
  };
}
