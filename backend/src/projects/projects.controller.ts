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
import {
  WorkspaceRoleGuard,
  WorkspaceRoles,
} from '../common/guards/workspace-role.guard';
import { ProjectsService } from './projects.service';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';

@ApiBearerAuth()
@ApiTags('projects')
@UseGuards(WorkspaceRoleGuard)
@Controller('workspaces/:workspaceId/projects')
export class ProjectsController {
  constructor(private readonly svc: ProjectsService) {}

  @WorkspaceRoles('owner', 'member')
  @Post()
  create(@Param('workspaceId') wid: string, @Body() dto: CreateProjectDto) {
    return this.svc.create(wid, dto);
  }

  @WorkspaceRoles('owner', 'member', 'client')
  @Get()
  list(@Param('workspaceId') wid: string) {
    return this.svc.list(wid);
  }

  @WorkspaceRoles('owner', 'member', 'client')
  @Get(':projectId')
  detail(
    @Param('workspaceId') wid: string,
    @Param('projectId') pid: string,
  ) {
    return this.svc.getOrFail(wid, pid);
  }

  @WorkspaceRoles('owner', 'member')
  @Patch(':projectId')
  update(
    @Param('workspaceId') wid: string,
    @Param('projectId') pid: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.svc.update(wid, pid, dto);
  }

  @WorkspaceRoles('owner')
  @Delete(':projectId')
  archive(
    @Param('workspaceId') wid: string,
    @Param('projectId') pid: string,
  ) {
    return this.svc.archive(wid, pid);
  }
}
