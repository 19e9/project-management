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

export interface WorkspaceMemberRow {
  id: string;
  userId: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  role: 'owner' | 'member' | 'client';
  status: 'invited' | 'active' | 'removed';
}

export function useWorkspaceMembers(workspaceId: string | undefined) {
  return useQuery({
    enabled: !!workspaceId,
    queryKey: ['workspace', workspaceId, 'members'],
    queryFn: async () =>
      (await api.get(`/workspaces/${workspaceId}/members`)).data as WorkspaceMemberRow[],
  });
}

export function useInviteWorkspaceMember(workspaceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { email: string; role: 'owner' | 'member' | 'client' }) =>
      (await api.post(`/workspaces/${workspaceId}/invites`, body)).data,
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['workspace', workspaceId, 'members'] }),
  });
}
