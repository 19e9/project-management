import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Task, TaskDocument } from '../tasks/schemas/task.schema';
import {
  TaskDependency,
  TaskDependencyDocument,
} from '../dependencies/schemas/task-dependency.schema';
import {
  PlanningSnapshot,
  PlanningSnapshotDocument,
} from './schemas/planning-snapshot.schema';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

interface CpmNode {
  id: string;
  durationMs: number;
  es: number;
  ef: number;
  ls: number;
  lf: number;
}

@Injectable()
export class CpmService {
  constructor(
    @InjectModel(Task.name) private readonly tasks: Model<TaskDocument>,
    @InjectModel(TaskDependency.name)
    private readonly deps: Model<TaskDependencyDocument>,
    @InjectModel(PlanningSnapshot.name)
    private readonly snapshots: Model<PlanningSnapshotDocument>,
  ) {}

  async compute(projectId: string) {
    const pid = new Types.ObjectId(projectId);
    const [taskDocs, depDocs] = await Promise.all([
      this.tasks
        .find({ projectId: pid })
        .select('_id startDate endDate durationDays')
        .lean(),
      this.deps
        .find({ projectId: pid })
        .select('predecessorId successorId type lagDays')
        .lean(),
    ]);

    if (taskDocs.length === 0) {
      const empty = {
        projectId,
        computedAt: new Date().toISOString(),
        projectStart: new Date().toISOString(),
        projectEnd: new Date().toISOString(),
        durationDays: 0,
        criticalTaskIds: [] as string[],
        tasks: [],
      };
      await this.snapshots.findOneAndUpdate(
        { projectId: pid },
        {
          projectId: pid,
          computedAt: new Date(),
          projectStart: new Date(),
          projectEnd: new Date(),
          durationDays: 0,
          criticalTaskIds: [],
          cpmByTaskId: {},
        },
        { upsert: true, new: true },
      );
      return empty;
    }

    const projectStart = Math.min(...taskDocs.map((t) => +new Date(t.startDate)));

    const idx = new Map<string, number>();
    taskDocs.forEach((t, i) => idx.set(String(t._id), i));

    const dur = taskDocs.map(
      (t) => Math.max(1, t.durationDays ?? 1) * MS_PER_DAY,
    );

    const succ: number[][] = taskDocs.map(() => []);
    const succLag: number[][] = taskDocs.map(() => []);
    const indeg: number[] = taskDocs.map(() => 0);

    for (const d of depDocs) {
      const u = idx.get(String(d.predecessorId));
      const v = idx.get(String(d.successorId));
      if (u == null || v == null) continue;
      succ[u].push(v);
      succLag[u].push((d.lagDays ?? 0) * MS_PER_DAY);
      indeg[v]++;
    }

    const order = this.topoSort(succ, indeg);
    if (order.length !== taskDocs.length) {
      throw new BadRequestException({
        code: 'TASK_DEPENDENCY_CYCLE',
        message: 'Project graph contains a cycle; cannot compute CPM',
      });
    }

    const inDegInput = taskDocs.map(() => 0);
    for (const u of succ.keys()) {
      for (const v of succ[u]) inDegInput[v]++;
    }

    const es = new Array<number>(taskDocs.length).fill(0);
    const ef = new Array<number>(taskDocs.length).fill(0);

    for (const u of order) {
      let earliest = projectStart;
      let hasPred = false;
      for (let p = 0; p < succ.length; p++) {
        const k = succ[p].indexOf(u);
        if (k >= 0) {
          hasPred = true;
          earliest = Math.max(earliest, ef[p] + succLag[p][k]);
        }
      }
      es[u] = hasPred ? earliest : Math.max(projectStart, +new Date(taskDocs[u].startDate));
      ef[u] = es[u] + dur[u];
    }

    const projectEnd = Math.max(...ef);
    const ls = new Array<number>(taskDocs.length).fill(projectEnd);
    const lf = new Array<number>(taskDocs.length).fill(projectEnd);

    for (let i = order.length - 1; i >= 0; i--) {
      const u = order[i];
      if (succ[u].length === 0) {
        lf[u] = projectEnd;
      } else {
        let minStart = Infinity;
        for (let k = 0; k < succ[u].length; k++) {
          const v = succ[u][k];
          minStart = Math.min(minStart, ls[v] - succLag[u][k]);
        }
        lf[u] = minStart;
      }
      ls[u] = lf[u] - dur[u];
    }

    const nodes: CpmNode[] = taskDocs.map((t, i) => ({
      id: String(t._id),
      durationMs: dur[i],
      es: es[i],
      ef: ef[i],
      ls: ls[i],
      lf: lf[i],
    }));

    const cpmByTaskId: Record<string, any> = {};
    const criticalTaskIds: string[] = [];
    const cpmTasks = nodes.map((n) => {
      const slackMs = n.lf - n.ef;
      const isCritical = slackMs === 0;
      if (isCritical) criticalTaskIds.push(n.id);
      const obj = {
        es: new Date(n.es).toISOString(),
        ef: new Date(n.ef).toISOString(),
        ls: new Date(n.ls).toISOString(),
        lf: new Date(n.lf).toISOString(),
        slackMinutes: Math.round(slackMs / 60_000),
        isCritical,
      };
      cpmByTaskId[n.id] = obj;
      return { taskId: n.id, ...obj };
    });

    const durationDays = Math.ceil((projectEnd - projectStart) / MS_PER_DAY);

    await this.snapshots.findOneAndUpdate(
      { projectId: pid },
      {
        projectId: pid,
        computedAt: new Date(),
        projectStart: new Date(projectStart),
        projectEnd: new Date(projectEnd),
        durationDays,
        criticalTaskIds,
        cpmByTaskId,
      },
      { upsert: true, new: true },
    );

    return {
      projectId,
      computedAt: new Date().toISOString(),
      projectStart: new Date(projectStart).toISOString(),
      projectEnd: new Date(projectEnd).toISOString(),
      durationDays,
      criticalTaskIds,
      tasks: cpmTasks,
    };
  }

  async getCachedOrCompute(projectId: string) {
    const cached = await this.snapshots
      .findOne({ projectId: new Types.ObjectId(projectId) })
      .lean();
    if (cached) {
      return {
        projectId,
        computedAt: cached.computedAt.toISOString(),
        projectStart: cached.projectStart.toISOString(),
        projectEnd: cached.projectEnd.toISOString(),
        durationDays: cached.durationDays,
        criticalTaskIds: cached.criticalTaskIds,
        tasks: Object.entries(cached.cpmByTaskId).map(([taskId, v]) => ({
          taskId,
          ...v,
        })),
      };
    }
    return this.compute(projectId);
  }

  private topoSort(succ: number[][], indegIn: number[]): number[] {
    const indeg = [...indegIn];
    const q: number[] = [];
    for (let i = 0; i < indeg.length; i++) if (indeg[i] === 0) q.push(i);
    const out: number[] = [];
    while (q.length) {
      const u = q.shift()!;
      out.push(u);
      for (const v of succ[u]) if (--indeg[v] === 0) q.push(v);
    }
    return out;
  }
}
