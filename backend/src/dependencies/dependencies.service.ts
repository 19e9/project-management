import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  TaskDependency,
  TaskDependencyDocument,
} from './schemas/task-dependency.schema';
import { CreateDependencyDto } from './dto/dependency.dto';

@Injectable()
export class DependenciesService {
  constructor(
    @InjectModel(TaskDependency.name)
    private readonly deps: Model<TaskDependencyDocument>,
  ) {}

  async create(workspaceId: string, projectId: string, dto: CreateDependencyDto) {
    if (dto.predecessorId === dto.successorId) {
      throw new BadRequestException({ code: 'TASK_DEPENDENCY_SELF' });
    }
    if (
      !Types.ObjectId.isValid(dto.predecessorId) ||
      !Types.ObjectId.isValid(dto.successorId)
    ) {
      throw new BadRequestException({ code: 'INVALID_TASK_ID' });
    }

    const pid = new Types.ObjectId(projectId);
    const pre = new Types.ObjectId(dto.predecessorId);
    const suc = new Types.ObjectId(dto.successorId);

    const exists = await this.deps.findOne({
      projectId: pid,
      predecessorId: pre,
      successorId: suc,
    });
    if (exists) throw new ConflictException({ code: 'DEPENDENCY_EXISTS' });

    const cyclePath = await this.findCyclePath(projectId, dto.predecessorId, dto.successorId);
    if (cyclePath) {
      throw new BadRequestException({
        code: 'TASK_DEPENDENCY_CYCLE',
        message: 'This dependency would create a cycle',
        details: { path: cyclePath },
      });
    }

    const created = await this.deps.create({
      workspaceId: new Types.ObjectId(workspaceId),
      projectId: pid,
      predecessorId: pre,
      successorId: suc,
      type: dto.type ?? 'FS',
      lagDays: dto.lagDays ?? 0,
    });
    return this.shape(created.toObject());
  }

  async list(projectId: string) {
    const items = await this.deps
      .find({ projectId: new Types.ObjectId(projectId) })
      .lean();
    return items.map((d) => this.shape(d));
  }

  async remove(projectId: string, depId: string) {
    if (!Types.ObjectId.isValid(depId)) {
      throw new NotFoundException({ code: 'DEPENDENCY_NOT_FOUND' });
    }
    const r = await this.deps.deleteOne({
      _id: new Types.ObjectId(depId),
      projectId: new Types.ObjectId(projectId),
    });
    if (!r.deletedCount) {
      throw new NotFoundException({ code: 'DEPENDENCY_NOT_FOUND' });
    }
    return { ok: true };
  }

  private async findCyclePath(
    projectId: string,
    predecessorId: string,
    successorId: string,
  ): Promise<string[] | null> {
    const all = await this.deps
      .find({ projectId: new Types.ObjectId(projectId) })
      .select('predecessorId successorId')
      .lean();
    const adj = new Map<string, string[]>();
    for (const e of all) {
      const p = String(e.predecessorId);
      const s = String(e.successorId);
      if (!adj.has(p)) adj.set(p, []);
      adj.get(p)!.push(s);
    }
    const stack: { node: string; path: string[] }[] = [
      { node: successorId, path: [successorId] },
    ];
    const seen = new Set<string>();
    while (stack.length) {
      const { node, path } = stack.pop()!;
      if (node === predecessorId) {
        return [...path, predecessorId];
      }
      if (seen.has(node)) continue;
      seen.add(node);
      for (const n of adj.get(node) ?? []) {
        stack.push({ node: n, path: [...path, n] });
      }
    }
    return null;
  }

  private shape(d: any) {
    return {
      id: String(d._id),
      workspaceId: String(d.workspaceId),
      projectId: String(d.projectId),
      predecessorId: String(d.predecessorId),
      successorId: String(d.successorId),
      type: d.type,
      lagDays: d.lagDays,
      createdAt: d.createdAt,
    };
  }
}
