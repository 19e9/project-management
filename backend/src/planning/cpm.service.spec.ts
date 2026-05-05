import { CpmService } from './cpm.service';
import { Types } from 'mongoose';

/**
 * Pure-function-style test of the CPM math.
 * We stub the mongoose models with in-memory fakes that respond to .find()....lean().
 */
describe('CpmService', () => {
  function makeId(label: string): Types.ObjectId {
    const hex = Buffer.from(label.padEnd(12, '_').slice(0, 12)).toString('hex');
    return new Types.ObjectId(hex);
  }

  function makeService(tasks: any[], deps: any[]) {
    const upserts: any[] = [];
    const tasksModel = {
      find: () => ({ select: () => ({ lean: async () => tasks }) }),
    } as any;
    const depsModel = {
      find: () => ({ select: () => ({ lean: async () => deps }) }),
    } as any;
    const snapshotsModel = {
      findOneAndUpdate: async (_q: any, body: any) => {
        upserts.push(body);
        return body;
      },
      findOne: () => ({ lean: async () => null }),
    } as any;

    return { service: new CpmService(tasksModel, depsModel, snapshotsModel), upserts };
  }

  it('flags the longest path as critical', async () => {
    const A = makeId('A');
    const B = makeId('B');
    const C = makeId('C');
    const D = makeId('D');
    const baseStart = new Date('2026-01-01T00:00:00.000Z');

    const tasks = [
      { _id: A, startDate: baseStart, endDate: baseStart, durationDays: 2 },
      { _id: B, startDate: baseStart, endDate: baseStart, durationDays: 3 },
      { _id: C, startDate: baseStart, endDate: baseStart, durationDays: 1 },
      { _id: D, startDate: baseStart, endDate: baseStart, durationDays: 2 },
    ];
    const deps = [
      { predecessorId: A, successorId: B, type: 'FS', lagDays: 0 },
      { predecessorId: A, successorId: C, type: 'FS', lagDays: 0 },
      { predecessorId: B, successorId: D, type: 'FS', lagDays: 0 },
      { predecessorId: C, successorId: D, type: 'FS', lagDays: 0 },
    ];
    const { service } = makeService(tasks, deps);
    const r = await service.compute(new Types.ObjectId().toHexString());
    expect(r.criticalTaskIds.sort()).toEqual([A, B, D].map(String).sort());
    expect(r.durationDays).toBe(7);
  });

  it('detects cycles and throws', async () => {
    const A = makeId('A');
    const B = makeId('B');
    const baseStart = new Date('2026-01-01T00:00:00.000Z');
    const tasks = [
      { _id: A, startDate: baseStart, endDate: baseStart, durationDays: 1 },
      { _id: B, startDate: baseStart, endDate: baseStart, durationDays: 1 },
    ];
    const deps = [
      { predecessorId: A, successorId: B, type: 'FS', lagDays: 0 },
      { predecessorId: B, successorId: A, type: 'FS', lagDays: 0 },
    ];
    const { service } = makeService(tasks, deps);
    await expect(service.compute(new Types.ObjectId().toHexString())).rejects.toMatchObject({
      response: { code: 'TASK_DEPENDENCY_CYCLE' },
    });
  });
});
