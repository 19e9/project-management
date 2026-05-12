import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api-client';

export interface TaskItem {
  id: string;
  workspaceId: string;
  projectId: string;
  parentTaskId: string | null;
  title: string;
  description?: string | null;
  wbsCode?: string | null;
  startDate: string;
  endDate: string;
  durationDays: number;
  status: string;
  priority: string;
  assigneeIds: string[];
  progressPct: number;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

const base = (wid: string, pid: string) =>
  `/workspaces/${wid}/projects/${pid}`;

export function useTasks(workspaceId?: string, projectId?: string) {
  return useQuery({
    enabled: !!workspaceId && !!projectId,
    queryKey: ['tasks', workspaceId, projectId],
    queryFn: async () =>
      (await api.get(`${base(workspaceId!, projectId!)}/tasks`)).data as TaskItem[],
  });
}

export function useTaskTree(workspaceId?: string, projectId?: string) {
  return useQuery({
    enabled: !!workspaceId && !!projectId,
    queryKey: ['tasks', 'tree', workspaceId, projectId],
    queryFn: async () =>
      (await api.get(`${base(workspaceId!, projectId!)}/tasks/tree`)).data as Array<
        TaskItem & { children: any[] }
      >,
  });
}

export function useCreateTask(workspaceId: string, projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Partial<TaskItem>) =>
      (await api.post(`${base(workspaceId, projectId)}/tasks`, body)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks', workspaceId, projectId] });
      qc.invalidateQueries({ queryKey: ['tasks', 'tree', workspaceId, projectId] });
      qc.invalidateQueries({ queryKey: ['analytics', 'overview', workspaceId, projectId] });
      qc.invalidateQueries({ queryKey: ['cpm', workspaceId, projectId] });
    },
  });
}

export function usePatchTask(workspaceId: string, projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<TaskItem> & { id: string }) =>
      (await api.patch(`${base(workspaceId, projectId)}/tasks/${id}`, patch)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks', workspaceId, projectId] });
      qc.invalidateQueries({ queryKey: ['tasks', 'tree', workspaceId, projectId] });
    },
  });
}

export function useDeleteTask(workspaceId: string, projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) =>
      (await api.delete(`${base(workspaceId, projectId)}/tasks/${id}`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks', workspaceId, projectId] });
      qc.invalidateQueries({ queryKey: ['tasks', 'tree', workspaceId, projectId] });
    },
  });
}

export function useDependencies(workspaceId?: string, projectId?: string) {
  return useQuery({
    enabled: !!workspaceId && !!projectId,
    queryKey: ['dependencies', workspaceId, projectId],
    queryFn: async () =>
      (await api.get(`${base(workspaceId!, projectId!)}/dependencies`)).data as Array<{
        id: string;
        predecessorId: string;
        successorId: string;
        type: 'FS' | 'SS' | 'FF' | 'SF';
        lagDays: number;
      }>,
  });
}

export function useCreateDependency(workspaceId: string, projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      predecessorId: string;
      successorId: string;
      type?: 'FS' | 'SS' | 'FF' | 'SF';
      lagDays?: number;
    }) =>
      (await api.post(`${base(workspaceId, projectId)}/dependencies`, body)).data,
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['dependencies', workspaceId, projectId] }),
  });
}

export function useCpm(workspaceId?: string, projectId?: string, enabled = true) {
  return useQuery({
    enabled: enabled && !!workspaceId && !!projectId,
    queryKey: ['cpm', workspaceId, projectId],
    queryFn: async () =>
      (await api.get(`${base(workspaceId!, projectId!)}/planning/cpm`)).data,
  });
}

export function useAnalyticsOverview(workspaceId?: string, projectId?: string) {
  return useQuery({
    enabled: !!workspaceId && !!projectId,
    queryKey: ['analytics', 'overview', workspaceId, projectId],
    queryFn: async () =>
      (await api.get(`${base(workspaceId!, projectId!)}/analytics/overview`)).data,
  });
}
