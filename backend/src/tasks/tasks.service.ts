import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { Task, TaskDocument } from './schemas/task.schema';
import { CreateTaskDto, ListTasksQueryDto, UpdateTaskDto } from './dto/task.dto';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

@Injectable()
export class TasksService {
  constructor(
    @InjectModel(Task.name) private readonly tasks: Model<TaskDocument>,
  ) {}

  async create(workspaceId: string, projectId: string, dto: CreateTaskDto) {
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

  async list(projectId: string, q: ListTasksQueryDto) {
    const filter: FilterQuery<TaskDocument> = {
      projectId: new Types.ObjectId(projectId),
    };
    if (q.status) filter.status = q.status;
    if (q.assigneeId)
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

  async tree(projectId: string) {
    const items = await this.tasks
      .find({ projectId: new Types.ObjectId(projectId) })
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

  async get(projectId: string, taskId: string) {
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
    return this.shape(t);
  }

  async update(projectId: string, taskId: string, dto: UpdateTaskDto) {
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
