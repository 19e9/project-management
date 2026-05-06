export interface ProjectBudgetPrefs {
  capUsd: number;
  spentUsd: number;
}

export interface KanbanWipPrefs {
  not_started: number;
  in_progress: number;
  blocked: number;
  done: number;
  cancelled: number;
}

const budgetKey = (projectId: string) => `planforge.projectBudget.${projectId}`;
const wipKey = (projectId: string) => `planforge.kanbanWip.${projectId}`;
const sprintKey = (projectId: string) => `planforge.sprint.${projectId}`;
const priorityKey = (projectId: string) => `planforge.projectPriority.${projectId}`;

export function loadBudgetPrefs(projectId: string): ProjectBudgetPrefs | null {
  try {
    const raw = localStorage.getItem(budgetKey(projectId));
    if (!raw) return null;
    const j = JSON.parse(raw) as ProjectBudgetPrefs;
    if (typeof j.capUsd !== 'number' || typeof j.spentUsd !== 'number') return null;
    return j;
  } catch {
    return null;
  }
}

export function saveBudgetPrefs(projectId: string, prefs: ProjectBudgetPrefs) {
  localStorage.setItem(budgetKey(projectId), JSON.stringify(prefs));
}

const DEFAULT_WIP: KanbanWipPrefs = {
  not_started: 50,
  in_progress: 8,
  blocked: 20,
  done: 50,
  cancelled: 20,
};

export function loadKanbanWip(projectId: string): KanbanWipPrefs {
  try {
    const raw = localStorage.getItem(wipKey(projectId));
    if (!raw) return DEFAULT_WIP;
    const j = JSON.parse(raw) as Partial<KanbanWipPrefs>;
    return { ...DEFAULT_WIP, ...j };
  } catch {
    return DEFAULT_WIP;
  }
}

export function saveKanbanWip(projectId: string, prefs: KanbanWipPrefs) {
  localStorage.setItem(wipKey(projectId), JSON.stringify(prefs));
}

export function loadSprintLabel(projectId: string): string {
  return localStorage.getItem(sprintKey(projectId)) ?? '';
}

export function saveSprintLabel(projectId: string, label: string) {
  if (!label.trim()) localStorage.removeItem(sprintKey(projectId));
  else localStorage.setItem(sprintKey(projectId), label.trim());
}

export type UiPriority = 'low' | 'medium' | 'high' | 'critical';

export function loadProjectUiPriority(projectId: string): UiPriority | null {
  const v = localStorage.getItem(priorityKey(projectId));
  if (v === 'low' || v === 'medium' || v === 'high' || v === 'critical') return v;
  return null;
}

export function saveProjectUiPriority(projectId: string, p: UiPriority) {
  localStorage.setItem(priorityKey(projectId), p);
}
