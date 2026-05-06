import type { TaskItem } from '../tasks/hooks';
import type { WorkspaceMemberRow } from '../workspaces/hooks';

export type HealthLabel = 'Healthy' | 'Watch' | 'At risk' | 'Critical';

export function daysUntil(iso?: string | null): number | null {
  if (!iso) return null;
  const end = new Date(iso).setHours(0, 0, 0, 0);
  const now = new Date().setHours(0, 0, 0, 0);
  return Math.round((end - now) / (24 * 60 * 60 * 1000));
}

export function countOverdue(tasks: TaskItem[]): number {
  const today = new Date().setHours(0, 0, 0, 0);
  return tasks.filter((t) => {
    if (t.status === 'done' || t.status === 'cancelled') return false;
    const end = new Date(t.endDate).setHours(0, 0, 0, 0);
    return end < today;
  }).length;
}

export function deriveHealth(args: {
  blocked: number;
  overdue: number;
  completionPct: number;
  criticalCount: number;
}): HealthLabel {
  if (args.blocked >= 3 || args.overdue >= 5 || args.criticalCount >= 4) return 'Critical';
  if (args.blocked >= 1 || args.overdue >= 2 || args.completionPct < 25) return 'At risk';
  if (args.overdue === 1 || args.blocked === 0 && args.completionPct < 45) return 'Watch';
  return 'Healthy';
}

export function deriveRiskLevel(args: {
  overdue: number;
  blocked: number;
  completionPct: number;
}): 'Low' | 'Medium' | 'High' | 'Severe' {
  if (args.overdue >= 5 || args.blocked >= 4) return 'Severe';
  if (args.overdue >= 2 || args.blocked >= 2) return 'High';
  if (args.overdue >= 1 || args.blocked >= 1 || args.completionPct < 40) return 'Medium';
  return 'Low';
}

export function maxTaskPriority(tasks: TaskItem[]): string | null {
  const rank: Record<string, number> = {
    low: 1,
    medium: 2,
    high: 3,
    critical: 4,
  };
  let best: string | null = null;
  let bestR = 0;
  for (const t of tasks) {
    const r = rank[t.priority] ?? 0;
    if (r > bestR) {
      bestR = r;
      best = t.priority;
    }
  }
  return best;
}

export function isDescendantTasks(all: TaskItem[], ancestorId: string, maybeDescId: string): boolean {
  let cur = all.find((x) => x.id === maybeDescId);
  const guard = new Set<string>();
  while (cur?.parentTaskId) {
    if (cur.parentTaskId === ancestorId) return true;
    if (guard.has(cur.id)) break;
    guard.add(cur.id);
    const pid = cur.parentTaskId;
    cur = all.find((x) => x.id === pid);
  }
  return false;
}

export function workloadByAssignee(tasks: TaskItem[], members: WorkspaceMemberRow[]) {
  const map = new Map<string, number>();
  for (const m of members) map.set(m.userId, 0);
  for (const t of tasks) {
    if (t.status === 'done' || t.status === 'cancelled') continue;
    for (const id of t.assigneeIds) {
      map.set(id, (map.get(id) ?? 0) + 1);
    }
  }
  return members.map((m) => ({
    userId: m.userId,
    label: m.displayName,
    count: map.get(m.userId) ?? 0,
  }));
}
