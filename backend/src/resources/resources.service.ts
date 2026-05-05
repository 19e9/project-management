import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  ResourceAllocation,
  ResourceAllocationDocument,
} from './schemas/resource-allocation.schema';
import { CreateAllocationDto, UpdateAllocationDto } from './dto/allocation.dto';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

@Injectable()
export class ResourcesService {
  constructor(
    @InjectModel(ResourceAllocation.name)
    private readonly allocations: Model<ResourceAllocationDocument>,
  ) {}

  async create(workspaceId: string, projectId: string, dto: CreateAllocationDto) {
    if (dto.endDate < dto.startDate) {
      throw new BadRequestException({ code: 'ALLOCATION_DATES_INVALID' });
    }
    const created = await this.allocations.create({
      workspaceId: new Types.ObjectId(workspaceId),
      projectId: new Types.ObjectId(projectId),
      taskId: new Types.ObjectId(dto.taskId),
      userId: new Types.ObjectId(dto.userId),
      startDate: dto.startDate,
      endDate: dto.endDate,
      unitsPct: dto.unitsPct,
      plannedHours: dto.plannedHours ?? 0,
    });
    return this.shape(created.toObject());
  }

  async list(projectId: string) {
    const items = await this.allocations
      .find({ projectId: new Types.ObjectId(projectId) })
      .sort({ startDate: 1 })
      .lean();
    return items.map((a) => this.shape(a));
  }

  async update(projectId: string, id: string, dto: UpdateAllocationDto) {
    const a = await this.allocations
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(id),
          projectId: new Types.ObjectId(projectId),
        },
        dto,
        { new: true },
      )
      .lean();
    if (!a) throw new NotFoundException({ code: 'ALLOCATION_NOT_FOUND' });
    return this.shape(a);
  }

  async remove(projectId: string, id: string) {
    const r = await this.allocations.deleteOne({
      _id: new Types.ObjectId(id),
      projectId: new Types.ObjectId(projectId),
    });
    if (!r.deletedCount) {
      throw new NotFoundException({ code: 'ALLOCATION_NOT_FOUND' });
    }
    return { ok: true };
  }

  /**
   * Resource histogram: for each user, daily total units (capped sum).
   * Buckets are emitted only for days with any allocation.
   */
  async histogram(projectId: string) {
    const items = await this.allocations
      .find({ projectId: new Types.ObjectId(projectId) })
      .lean();
    const map = new Map<string, number>(); // key: `${userId}|${YYYY-MM-DD}` -> unitsPct sum
    for (const a of items) {
      const start = new Date(a.startDate);
      const end = new Date(a.endDate);
      for (let d = +start; d <= +end; d += MS_PER_DAY) {
        const key = `${String(a.userId)}|${new Date(d).toISOString().slice(0, 10)}`;
        map.set(key, (map.get(key) ?? 0) + a.unitsPct);
      }
    }
    const buckets: { userId: string; date: string; unitsPct: number }[] = [];
    map.forEach((unitsPct, key) => {
      const [userId, date] = key.split('|');
      buckets.push({ userId, date, unitsPct });
    });
    buckets.sort(
      (a, b) =>
        a.userId.localeCompare(b.userId) || a.date.localeCompare(b.date),
    );
    return buckets;
  }

  private shape(a: any) {
    return {
      id: String(a._id),
      workspaceId: String(a.workspaceId),
      projectId: String(a.projectId),
      taskId: String(a.taskId),
      userId: String(a.userId),
      startDate: a.startDate,
      endDate: a.endDate,
      unitsPct: a.unitsPct,
      plannedHours: a.plannedHours,
      actualHours: a.actualHours,
    };
  }
}
