import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api-client';

export type MyRole = 'platform_admin' | 'owner' | 'member' | 'client';

export interface WorkspaceSummary {
  id: string;
  name: string;
  plan: 'free' | 'pro' | 'enterprise';
  status: 'active' | 'suspended';
  role: 'owner' | 'member' | 'client';
  memberCount: number;
  projectCount: number;
  activeTaskCount: number;
  completionPct: number;
  entitlements: {
    cpmEnabled: boolean;
    ganttEnabled: boolean;
    maxMembers: number;
    maxProjects: number;
  };
}

export interface UpcomingTask {
  id: string;
  title: string;
  endDate: string;
  priority: string;
  status: string;
  progressPct: number;
  projectId: string;
  projectName: string;
  workspaceId: string;
  workspaceName: string;
  daysUntilDue: number;
  isOverdue: boolean;
}

export interface ProjectSummary {
  id: string;
  name: string;
  workspaceId: string;
  workspaceName: string;
  status: string;
  taskCount: number;
  completionPct: number;
  overdueCount: number;
}

export interface MyTaskStats {
  total: number;
  inProgress: number;
  done: number;
  blocked: number;
  notStarted: number;
  overdue: number;
  upcomingSoon: number;
  completionPct: number;
}

export interface MeDashboardData {
  myRole: MyRole;
  workspaces: WorkspaceSummary[];
  taskStats: MyTaskStats;
  upcomingTasks: UpcomingTask[];
  myProjects: ProjectSummary[];
}

export function useMyDashboard() {
  return useQuery({
    queryKey: ['me', 'dashboard'],
    queryFn: async () => (await api.get<MeDashboardData>('/me/dashboard')).data,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

export function useUpdateDashboardTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      workspaceId,
      projectId,
      taskId,
      patch,
    }: {
      workspaceId: string;
      projectId: string;
      taskId: string;
      patch: { status?: string; progressPct?: number };
    }) =>
      (
        await api.patch(
          `/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}`,
          patch,
        )
      ).data,
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['me', 'dashboard'] });
      qc.invalidateQueries({ queryKey: ['tasks', vars.workspaceId, vars.projectId] });
      qc.invalidateQueries({ queryKey: ['tasks', 'tree', vars.workspaceId, vars.projectId] });
      qc.invalidateQueries({ queryKey: ['analytics', 'overview', vars.workspaceId, vars.projectId] });
    },
  });
}
