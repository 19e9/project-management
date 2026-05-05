import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
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
  @WorkspaceRoles('owner', 'member', 'client')
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
  @WorkspaceRoles('owner', 'member', 'client')
  @Get(':workspaceId/members')
  listMembers(@Param('workspaceId') id: string): Promise<WorkspaceMemberListItem[]> {
    return this.svc.listMembers(id);
  }

  @UseGuards(WorkspaceRoleGuard)
  @WorkspaceRoles('owner')
  @Post(':workspaceId/invites')
  invite(@Param('workspaceId') id: string, @Body() dto: InviteMemberDto) {
    return this.svc.inviteMember(id, dto);
  }

  @UseGuards(WorkspaceRoleGuard)
  @WorkspaceRoles('owner')
  @Patch(':workspaceId/members/:userId')
  updateRole(
    @Param('workspaceId') id: string,
    @Param('userId') userId: string,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    return this.svc.updateMemberRole(id, userId, dto);
  }

  @UseGuards(WorkspaceRoleGuard)
  @WorkspaceRoles('owner')
  @Delete(':workspaceId/members/:userId')
  remove(@Param('workspaceId') id: string, @Param('userId') userId: string) {
    return this.svc.removeMember(id, userId);
  }
}
