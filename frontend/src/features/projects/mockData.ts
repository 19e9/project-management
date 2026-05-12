import type { Project, Task } from './types';

export const mockProjects: Project[] = [
  { id: '1', name: 'Plot 14 — Foundation', completion: 62, due: '2026-06-15', team: 5, ownerName: 'Demo Owner' },
  { id: '2', name: 'Riverside Mall — Interior', completion: 28, due: '2026-08-02', team: 9, ownerName: 'Demo Owner' },
  { id: '3', name: 'Tower B — Roofing', completion: 91, due: '2026-05-12', team: 3, ownerName: 'Demo Owner' },
];

export const mockTasks: Task[] = [
  { id: 't1', projectId: '1', title: 'Site survey', assigneeName: 'Ayşe Y.', status: 'done', priority: 'high', due: '2026-05-01' },
  { id: 't2', projectId: '1', title: 'Foundation excavation', assigneeName: 'Mehmet K.', status: 'in_progress', priority: 'high', due: '2026-05-20' },
  { id: 't3', projectId: '1', title: 'Concrete pouring', status: 'not_started', priority: 'medium', due: '2026-06-05' },
  { id: 't4', projectId: '1', title: 'Rebar installation', status: 'not_started', priority: 'medium', due: '2026-06-10' },
  { id: 't5', projectId: '2', title: 'Interior framing', assigneeName: 'Ali R.', status: 'in_progress', priority: 'high', due: '2026-07-01' },
  { id: 't6', projectId: '2', title: 'Electrical rough-in', status: 'not_started', priority: 'medium', due: '2026-07-15' },
  { id: 't7', projectId: '3', title: 'Roof structure', assigneeName: 'Fatma D.', status: 'done', priority: 'critical', due: '2026-05-05' },
  { id: 't8', projectId: '3', title: 'Waterproofing membrane', assigneeName: 'Ayşe Y.', status: 'in_progress', priority: 'high', due: '2026-05-10' },
];
