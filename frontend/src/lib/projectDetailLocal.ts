export interface TaskComment {
  id: string;
  body: string;
  author: string;
  createdAt: string;
}

export interface ProjectDocRow {
  id: string;
  name: string;
  note?: string;
  uploadedAt: string;
  taskId?: string | null;
}

function commentsKey(taskId: string) {
  return `planforge.taskComments.${taskId}`;
}

export function loadTaskComments(taskId: string): TaskComment[] {
  try {
    const raw = localStorage.getItem(commentsKey(taskId));
    if (!raw) return [];
    const j = JSON.parse(raw) as TaskComment[];
    return Array.isArray(j) ? j : [];
  } catch {
    return [];
  }
}

export function saveTaskComments(taskId: string, rows: TaskComment[]) {
  localStorage.setItem(commentsKey(taskId), JSON.stringify(rows));
}

export function appendTaskComment(taskId: string, body: string, author: string) {
  const prev = loadTaskComments(taskId);
  const row: TaskComment = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    body,
    author,
    createdAt: new Date().toISOString(),
  };
  saveTaskComments(taskId, [row, ...prev]);
  return row;
}

function docsKey(projectId: string) {
  return `planforge.projectDocs.${projectId}`;
}

export function loadProjectDocs(projectId: string): ProjectDocRow[] {
  try {
    const raw = localStorage.getItem(docsKey(projectId));
    if (!raw) return [];
    const j = JSON.parse(raw) as ProjectDocRow[];
    return Array.isArray(j) ? j : [];
  } catch {
    return [];
  }
}

export function saveProjectDocs(projectId: string, rows: ProjectDocRow[]) {
  localStorage.setItem(docsKey(projectId), JSON.stringify(rows));
}

export function appendProjectDoc(projectId: string, row: Omit<ProjectDocRow, 'id' | 'uploadedAt'>) {
  const prev = loadProjectDocs(projectId);
  const doc: ProjectDocRow = {
    ...row,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    uploadedAt: new Date().toISOString(),
  };
  saveProjectDocs(projectId, [doc, ...prev]);
  return doc;
}
