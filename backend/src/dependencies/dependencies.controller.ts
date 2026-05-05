import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  WorkspaceRoleGuard,
  WorkspaceRoles,
} from '../common/guards/workspace-role.guard';
import { DependenciesService } from './dependencies.service';
import { CreateDependencyDto } from './dto/dependency.dto';

@ApiBearerAuth()
@ApiTags('dependencies')
@UseGuards(WorkspaceRoleGuard)
@Controller('workspaces/:workspaceId/projects/:projectId/dependencies')
export class DependenciesController {
  constructor(private readonly svc: DependenciesService) {}

  @WorkspaceRoles('owner', 'member')
  @Post()
  create(
    @Param('workspaceId') wid: string,
    @Param('projectId') pid: string,
    @Body() dto: CreateDependencyDto,
  ) {
    return this.svc.create(wid, pid, dto);
  }

  @WorkspaceRoles('owner', 'member', 'client')
  @Get()
  list(@Param('projectId') pid: string) {
    return this.svc.list(pid);
  }

  @WorkspaceRoles('owner', 'member')
  @Delete(':depId')
  remove(@Param('projectId') pid: string, @Param('depId') depId: string) {
    return this.svc.remove(pid, depId);
  }
}
