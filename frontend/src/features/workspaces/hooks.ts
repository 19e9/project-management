import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api-client';

export type WorkspaceRole = 'owner' | 'admin' | 'member' | 'viewer' | 'client';

export type InviteWorkspaceRole = 'member' | 'viewer';

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

export function useUpdateWorkspace(workspaceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { name?: string }) =>
      (await api.patch(`/workspaces/${workspaceId}`, payload)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workspaces'] });
      qc.invalidateQueries({ queryKey: ['workspace', workspaceId] });
      qc.invalidateQueries({ queryKey: ['me', 'dashboard'] });
    },
  });
}

export function useDeleteWorkspace(workspaceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => (await api.delete(`/workspaces/${workspaceId}`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workspaces'] });
      qc.invalidateQueries({ queryKey: ['me', 'dashboard'] });
    },
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
  role: WorkspaceRole;
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
    mutationFn: async (body: { email: string; role: InviteWorkspaceRole }) =>
      (await api.post(`/workspaces/${workspaceId}/invites`, body)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workspace', workspaceId, 'members'] });
      qc.invalidateQueries({ queryKey: ['workspaces'] });
      qc.invalidateQueries({ queryKey: ['me', 'dashboard'] });
    },
  });
}

export function useUpdateWorkspaceMemberRole(workspaceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId,
      role,
    }: {
      userId: string;
      role: WorkspaceRole;
    }) => (await api.patch(`/workspaces/${workspaceId}/members/${userId}`, { role })).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workspace', workspaceId, 'members'] });
      qc.invalidateQueries({ queryKey: ['workspaces'] });
      qc.invalidateQueries({ queryKey: ['me', 'dashboard'] });
    },
  });
}

export function useRemoveWorkspaceMember(workspaceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) =>
      (await api.delete(`/workspaces/${workspaceId}/members/${userId}`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workspace', workspaceId, 'members'] });
      qc.invalidateQueries({ queryKey: ['workspaces'] });
      qc.invalidateQueries({ queryKey: ['me', 'dashboard'] });
    },
  });
}
