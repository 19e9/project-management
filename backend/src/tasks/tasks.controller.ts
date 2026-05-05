import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  WorkspaceRoleGuard,
  WorkspaceRoles,
} from '../common/guards/workspace-role.guard';
import { TasksService } from './tasks.service';
import { CreateTaskDto, ListTasksQueryDto, UpdateTaskDto } from './dto/task.dto';

@ApiBearerAuth()
@ApiTags('tasks')
@UseGuards(WorkspaceRoleGuard)
@Controller('workspaces/:workspaceId/projects/:projectId/tasks')
export class TasksController {
  constructor(private readonly svc: TasksService) {}

  @WorkspaceRoles('owner', 'member')
  @Post()
  create(
    @Param('workspaceId') wid: string,
    @Param('projectId') pid: string,
    @Body() dto: CreateTaskDto,
  ) {
    return this.svc.create(wid, pid, dto);
  }

  @WorkspaceRoles('owner', 'member', 'client')
  @Get()
  list(
    @Param('projectId') pid: string,
    @Query() q: ListTasksQueryDto,
  ) {
    return this.svc.list(pid, q);
  }

  @WorkspaceRoles('owner', 'member', 'client')
  @Get('tree')
  tree(@Param('projectId') pid: string) {
    return this.svc.tree(pid);
  }

  @WorkspaceRoles('owner', 'member', 'client')
  @Get(':taskId')
  detail(
    @Param('projectId') pid: string,
    @Param('taskId') tid: string,
  ) {
    return this.svc.get(pid, tid);
  }

  @WorkspaceRoles('owner', 'member')
  @Patch(':taskId')
  update(
    @Param('projectId') pid: string,
    @Param('taskId') tid: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.svc.update(pid, tid, dto);
  }

  @WorkspaceRoles('owner', 'member')
  @Delete(':taskId')
  remove(
    @Param('projectId') pid: string,
    @Param('taskId') tid: string,
  ) {
    return this.svc.remove(pid, tid);
  }
}
