import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Task, TaskDocument } from '../tasks/schemas/task.schema';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(Task.name) private readonly tasks: Model<TaskDocument>,
  ) {}

  async overview(projectId: string) {
    const pid = new Types.ObjectId(projectId);
    const items = await this.tasks
      .find({ projectId: pid })
      .select('status progressPct startDate endDate')
      .lean();

    const total = items.length;
    if (total === 0) {
      return {
        total: 0,
        completed: 0,
        inProgress: 0,
        blocked: 0,
        notStarted: 0,
        cancelled: 0,
        completionPct: 0,
        averageProgress: 0,
      };
    }

    const completed = items.filter((t) => t.status === 'done').length;
    const inProgress = items.filter((t) => t.status === 'in_progress').length;
    const blocked = items.filter((t) => t.status === 'blocked').length;
    const notStarted = items.filter((t) => t.status === 'not_started').length;
    const cancelled = items.filter((t) => t.status === 'cancelled').length;
    const averageProgress =
      Math.round(
        (items.reduce((s, t) => s + (t.progressPct ?? 0), 0) / total) * 10,
      ) / 10;
    const denom = total - cancelled || 1;
    const completionPct = Math.round((completed / denom) * 1000) / 10;

    return {
      total,
      completed,
      inProgress,
      blocked,
      notStarted,
      cancelled,
      completionPct,
      averageProgress,
    };
  }

  /**
   * Lightweight burndown approximation:
   *   - X axis: project days
   *   - Ideal line: linear from total at projectStart to 0 at projectEnd
   *   - Actual line: tasks remaining (not done) for each day, computed by endDate
   */
  async burndown(projectId: string) {
    const pid = new Types.ObjectId(projectId);
    const items = await this.tasks
      .find({ projectId: pid })
      .select('status startDate endDate')
      .lean();
    if (items.length === 0) return { ideal: [], actual: [] };

    const start = Math.min(...items.map((t) => +new Date(t.startDate)));
    const end = Math.max(...items.map((t) => +new Date(t.endDate)));
    const MS_PER_DAY = 86_400_000;
    const days = Math.max(
      1,
      Math.ceil((end - start) / MS_PER_DAY) + 1,
    );

    const total = items.length;
    const ideal: { date: string; remaining: number }[] = [];
    const actual: { date: string; remaining: number }[] = [];
    for (let i = 0; i < days; i++) {
      const day = new Date(start + i * MS_PER_DAY);
      ideal.push({
        date: day.toISOString().slice(0, 10),
        remaining: Math.max(0, Math.round(total * (1 - i / Math.max(1, days - 1)) * 10) / 10),
      });
      const remaining = items.filter(
        (t) => t.status !== 'done' || +new Date(t.endDate) > +day,
      ).length;
      actual.push({
        date: day.toISOString().slice(0, 10),
        remaining,
      });
    }
    return { ideal, actual };
  }
}
