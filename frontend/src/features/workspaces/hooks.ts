import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api-client';

export function useWorkspaces() {
  return useQuery({
    queryKey: ['workspaces'],
    queryFn: async () => (await api.get('/workspaces')).data as Array<any>,
  });
}

export function useCreateWorkspace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) =>
      (await api.post('/workspaces', { name })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workspaces'] }),
  });
}

export function useWorkspace(workspaceId: string | undefined) {
  return useQuery({
    enabled: !!workspaceId,
    queryKey: ['workspace', workspaceId],
    queryFn: async () =>
      (await api.get(`/workspaces/${workspaceId}`)).data,
  });
}
