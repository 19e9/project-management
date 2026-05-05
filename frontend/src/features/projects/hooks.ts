import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api-client';

export function useProjects(workspaceId: string | undefined) {
  return useQuery({
    enabled: !!workspaceId,
    queryKey: ['projects', workspaceId],
    queryFn: async () =>
      (await api.get(`/workspaces/${workspaceId}/projects`)).data as Array<any>,
  });
}

export function useCreateProject(workspaceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { name: string; description?: string }) =>
      (await api.post(`/workspaces/${workspaceId}/projects`, payload)).data,
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['projects', workspaceId] }),
  });
}

export function useProject(workspaceId?: string, projectId?: string) {
  return useQuery({
    enabled: !!workspaceId && !!projectId,
    queryKey: ['project', workspaceId, projectId],
    queryFn: async () =>
      (await api.get(`/workspaces/${workspaceId}/projects/${projectId}`)).data,
  });
}
