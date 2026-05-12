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
import { ResourcesService } from './resources.service';
import { CreateAllocationDto, UpdateAllocationDto } from './dto/allocation.dto';

@ApiBearerAuth()
@ApiTags('resources')
@UseGuards(WorkspaceRoleGuard)
@Controller('workspaces/:workspaceId/projects/:projectId')
export class ResourcesController {
  constructor(private readonly svc: ResourcesService) {}

  @WorkspaceRoles('owner')
  @Post('allocations')
  create(
    @Param('workspaceId') wid: string,
    @Param('projectId') pid: string,
    @Body() dto: CreateAllocationDto,
  ) {
    return this.svc.create(wid, pid, dto);
  }

  @WorkspaceRoles('owner')
  @Get('allocations')
  list(@Param('projectId') pid: string) {
    return this.svc.list(pid);
  }

  @WorkspaceRoles('owner')
  @Patch('allocations/:id')
  update(
    @Param('projectId') pid: string,
    @Param('id') id: string,
    @Body() dto: UpdateAllocationDto,
  ) {
    return this.svc.update(pid, id, dto);
  }

  @WorkspaceRoles('owner')
  @Delete('allocations/:id')
  remove(
    @Param('projectId') pid: string,
    @Param('id') id: string,
  ) {
    return this.svc.remove(pid, id);
  }

  @WorkspaceRoles('owner')
  @Get('resources/histogram')
  histogram(@Param('projectId') pid: string) {
    return this.svc.histogram(pid);
  }
}
