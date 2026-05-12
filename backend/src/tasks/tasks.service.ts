import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { Project, ProjectDocument } from '../projects/schemas/project.schema';
import { Task, TaskDocument } from './schemas/task.schema';
import { CreateTaskDto, ListTasksQueryDto, UpdateTaskDto } from './dto/task.dto';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const ASSIGNEE_UPDATE_FIELDS = new Set(['status', 'progressPct']);

interface TaskUpdateActor {
  userId: string;
  workspaceRole?: 'owner' | 'member' | 'client';
  platformOverride?: boolean;
}

@Injectable()
export class TasksService {
  constructor(
    @InjectModel(Project.name) private readonly projects: Model<ProjectDocument>,
    @InjectModel(Task.name) private readonly tasks: Model<TaskDocument>,
  ) {}

  async create(workspaceId: string, projectId: string, dto: CreateTaskDto) {
    if (!Types.ObjectId.isValid(projectId)) {
      throw new NotFoundException({ code: 'PROJECT_NOT_FOUND' });
    }
    const project = await this.projects
      .findOne({
        _id: new Types.ObjectId(projectId),
        workspaceId: new Types.ObjectId(workspaceId),
      })
      .select('_id')
      .lean();
    if (!project) {
      throw new NotFoundException({ code: 'PROJECT_NOT_FOUND' });
    }

    if (dto.endDate < dto.startDate) {
      throw new BadRequestException({ code: 'TASK_DATES_INVALID' });
    }
    const calc = Math.max(
      1,
      Math.ceil((+dto.endDate - +dto.startDate) / MS_PER_DAY) || 1,
    );
    const created = await this.tasks.create({
      workspaceId: new Types.ObjectId(workspaceId),
      projectId: new Types.ObjectId(projectId),
      title: dto.title,
      description: dto.description,
      parentTaskId: dto.parentTaskId
        ? new Types.ObjectId(dto.parentTaskId)
        : null,
      wbsCode: dto.wbsCode,
      startDate: dto.startDate,
      endDate: dto.endDate,
      durationDays: dto.durationDays ?? calc,
      priority: dto.priority ?? 'medium',
      status: dto.status ?? 'not_started',
      assigneeIds: (dto.assigneeIds ?? []).map((id) => new Types.ObjectId(id)),
      progressPct: dto.progressPct ?? 0,
      sortOrder: dto.sortOrder ?? 0,
    });
    return this.shape(created.toObject());
  }

  async list(projectId: string, q: ListTasksQueryDto, actor?: TaskUpdateActor) {
    const filter: FilterQuery<TaskDocument> = {
      projectId: new Types.ObjectId(projectId),
    };
    if (!this.canSeeAllTasks(actor)) {
      filter.assigneeIds = new Types.ObjectId(actor!.userId) as never;
    }
    if (q.status) filter.status = q.status;
    if (q.assigneeId && this.canSeeAllTasks(actor))
      filter.assigneeIds = new Types.ObjectId(q.assigneeId) as never;
    if (q.parentTaskId === 'null') filter.parentTaskId = null;
    else if (q.parentTaskId)
      filter.parentTaskId = new Types.ObjectId(q.parentTaskId);

    const items = await this.tasks
      .find(filter)
      .sort({ sortOrder: 1, startDate: 1 })
      .lean();
    return items.map((i) => this.shape(i));
  }

  async tree(projectId: string, actor?: TaskUpdateActor) {
    const filter: FilterQuery<TaskDocument> = {
      projectId: new Types.ObjectId(projectId),
    };
    if (!this.canSeeAllTasks(actor)) {
      filter.assigneeIds = new Types.ObjectId(actor!.userId) as never;
    }
    const items = await this.tasks
      .find(filter)
      .sort({ wbsCode: 1, sortOrder: 1, startDate: 1 })
      .lean();
    const byParent = new Map<string | null, any[]>();
    for (const t of items) {
      const key = t.parentTaskId ? String(t.parentTaskId) : null;
      if (!byParent.has(key)) byParent.set(key, []);
      byParent.get(key)!.push({ ...this.shape(t), children: [] });
    }
    const attach = (node: any) => {
      node.children = byParent.get(node.id) ?? [];
      node.children.forEach(attach);
    };
    const roots = byParent.get(null) ?? [];
    roots.forEach(attach);
    return roots;
  }

  async get(projectId: string, taskId: string, actor?: TaskUpdateActor) {
    if (!Types.ObjectId.isValid(taskId)) {
      throw new NotFoundException({ code: 'TASK_NOT_FOUND' });
    }
    const t = await this.tasks
      .findOne({
        _id: new Types.ObjectId(taskId),
        projectId: new Types.ObjectId(projectId),
      })
      .lean();
    if (!t) throw new NotFoundException({ code: 'TASK_NOT_FOUND' });
    if (!this.canSeeAllTasks(actor) && !(t.assigneeIds ?? []).some((id: Types.ObjectId) => String(id) === actor?.userId)) {
      throw new NotFoundException({ code: 'TASK_NOT_FOUND' });
    }
    return this.shape(t);
  }

  async update(projectId: string, taskId: string, dto: UpdateTaskDto, actor?: TaskUpdateActor) {
    if (!Types.ObjectId.isValid(taskId)) {
      throw new NotFoundException({ code: 'TASK_NOT_FOUND' });
    }
    const existing = await this.tasks
      .findOne({
        _id: new Types.ObjectId(taskId),
        projectId: new Types.ObjectId(projectId),
      })
      .select('assigneeIds')
      .lean();
    if (!existing) throw new NotFoundException({ code: 'TASK_NOT_FOUND' });

    const canFullyEdit =
      actor?.platformOverride ||
      actor?.workspaceRole === 'owner';
    if (actor?.workspaceRole === 'client' && !canFullyEdit) {
      throw new ForbiddenException({
        code: 'TASK_UPDATE_NOT_ALLOWED',
        message: 'Clients can view project progress but cannot update tasks.',
      });
    }
    if (!canFullyEdit) {
      const assigned = (existing.assigneeIds ?? []).some((id: Types.ObjectId) => String(id) === actor?.userId);
      const requested = Object.keys(dto);
      const onlyWorkFields = requested.every((field) => ASSIGNEE_UPDATE_FIELDS.has(field));
      if (!assigned || !onlyWorkFields) {
        throw new ForbiddenException({
          code: 'TASK_UPDATE_NOT_ALLOWED',
          message: 'Assigned users can only update status and progress.',
        });
      }
    }

    const updates: any = { ...dto };
    if (dto.parentTaskId === null) updates.parentTaskId = null;
    else if (typeof dto.parentTaskId === 'string')
      updates.parentTaskId = new Types.ObjectId(dto.parentTaskId);
    if (dto.assigneeIds)
      updates.assigneeIds = dto.assigneeIds.map((id) => new Types.ObjectId(id));
    if (dto.startDate && dto.endDate && dto.endDate < dto.startDate) {
      throw new BadRequestException({ code: 'TASK_DATES_INVALID' });
    }
    const t = await this.tasks
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(taskId),
          projectId: new Types.ObjectId(projectId),
        },
        updates,
        { new: true },
      )
      .lean();
    if (!t) throw new NotFoundException({ code: 'TASK_NOT_FOUND' });
    return this.shape(t);
  }

  async remove(projectId: string, taskId: string) {
    const r = await this.tasks.deleteOne({
      _id: new Types.ObjectId(taskId),
      projectId: new Types.ObjectId(projectId),
    });
    if (!r.deletedCount) {
      throw new NotFoundException({ code: 'TASK_NOT_FOUND' });
    }
    return { ok: true };
  }

  private canSeeAllTasks(actor?: TaskUpdateActor) {
    return actor?.platformOverride || actor?.workspaceRole === 'owner' || actor?.workspaceRole === 'client';
  }

  shape(t: any) {
    return {
      id: String(t._id),
      workspaceId: String(t.workspaceId),
      projectId: String(t.projectId),
      parentTaskId: t.parentTaskId ? String(t.parentTaskId) : null,
      title: t.title,
      description: t.description ?? null,
      wbsCode: t.wbsCode ?? null,
      startDate: t.startDate,
      endDate: t.endDate,
      durationDays: t.durationDays,
      status: t.status,
      priority: t.priority,
      assigneeIds: (t.assigneeIds ?? []).map((id: Types.ObjectId) => String(id)),
      progressPct: t.progressPct,
      sortOrder: t.sortOrder,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    };
  }
}
