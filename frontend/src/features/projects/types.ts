export type TaskStatus = 'not_started' | 'in_progress' | 'blocked' | 'done' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Task {
  id: string;
  projectId: string;
  title: string;
  assigneeName?: string;
  status: TaskStatus;
  priority: TaskPriority;
  due?: string;
  description?: string;
}

export interface Project {
  id: string;
  name: string;
  completion: number;
  due: string;
  team: number;
  ownerName: string;
}
