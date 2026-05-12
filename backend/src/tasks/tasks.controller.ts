import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  WorkspaceRoleGuard,
  WorkspaceRoles,
} from '../common/guards/workspace-role.guard';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { TasksService } from './tasks.service';
import { CreateTaskDto, ListTasksQueryDto, UpdateTaskDto } from './dto/task.dto';

@ApiBearerAuth()
@ApiTags('tasks')
@UseGuards(WorkspaceRoleGuard)
@Controller('workspaces/:workspaceId/projects/:projectId/tasks')
export class TasksController {
  constructor(private readonly svc: TasksService) {}

  @WorkspaceRoles('owner')
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
    @CurrentUser() user: JwtPayload,
    @Req() req: any,
  ) {
    return this.svc.list(pid, q, actorFromRequest(user, req));
  }

  @WorkspaceRoles('owner', 'member', 'client')
  @Get('tree')
  tree(@Param('projectId') pid: string, @CurrentUser() user: JwtPayload, @Req() req: any) {
    return this.svc.tree(pid, actorFromRequest(user, req));
  }

  @WorkspaceRoles('owner', 'member', 'client')
  @Get(':taskId')
  detail(
    @Param('projectId') pid: string,
    @Param('taskId') tid: string,
    @CurrentUser() user: JwtPayload,
    @Req() req: any,
  ) {
    return this.svc.get(pid, tid, actorFromRequest(user, req));
  }

  @WorkspaceRoles('owner', 'member', 'client')
  @Patch(':taskId')
  update(
    @Param('projectId') pid: string,
    @Param('taskId') tid: string,
    @Body() dto: UpdateTaskDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: any,
  ) {
    return this.svc.update(pid, tid, dto, actorFromRequest(user, req));
  }

  @WorkspaceRoles('owner')
  @Delete(':taskId')
  remove(
    @Param('projectId') pid: string,
    @Param('taskId') tid: string,
  ) {
    return this.svc.remove(pid, tid);
  }
}

function actorFromRequest(user: JwtPayload, req: any) {
  return {
    userId: user.sub,
    workspaceRole: req.workspaceMember?.role,
    platformOverride: !!req.workspaceMember?.platformOverride,
  };
}
