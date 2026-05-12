import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMyDashboard } from '../features/dashboard/hooks';
import {
  useDeleteProject,
  useProject,
  useRemoveProjectMember,
  useUpdateProject,
} from '../features/projects/hooks';
import {
  useAnalyticsOverview,
  useCpm,
  useCreateDependency,
  useCreateTask,
  useDependencies,
  useDeleteTask,
  usePatchTask,
  useTaskTree,
  useTasks,
  type TaskItem,
} from '../features/tasks/hooks';
import {
  useInviteWorkspaceMember,
  useRemoveWorkspaceMember,
  useWorkspace,
  useWorkspaceMembers,
} from '../features/workspaces/hooks';
import { ProjectGantt } from '../features/gantt/ProjectGantt';
import { WbsTree } from '../features/wbs/WbsTree';
import { ProjectKanban } from '../features/project-detail/ProjectKanban';
import { TaskDrawer } from '../features/project-detail/TaskDrawer';
import {
  ProjectCommandCenter,
  type QuickAction,
} from '../features/project-detail/ProjectCommandCenter';
import { ProjectOverviewAnalytics } from '../features/project-detail/ProjectOverviewAnalytics';
import {
  ProjectActivityTab,
  ProjectAiTab,
  ProjectDocsTab,
} from '../features/project-detail/ProjectPulsePanels';
import { CpmLockedPreview } from '../features/project-detail/CpmLockedPreview';
import { countOverdue, isDescendantTasks } from '../features/project-detail/projectMetrics';

type TabId =
  | 'overview'
  | 'wbs'
  | 'gantt'
  | 'cpm'
  | 'tasks'
  | 'kanban'
  | 'activity'
  | 'docs'
  | 'ai';

const TABS: { id: TabId; label: string; description: string }[] = [
  { id: 'overview', label: 'Overview', description: 'Health & progress' },
  { id: 'wbs', label: 'WBS', description: 'Work breakdown' },
  { id: 'gantt', label: 'Gantt', description: 'Timeline' },
  { id: 'cpm', label: 'Critical path', description: 'CPM' },
  { id: 'tasks', label: 'Tasks', description: 'Table & dependencies' },
  { id: 'kanban', label: 'Kanban', description: 'Board & WIP' },
  { id: 'activity', label: 'Activity', description: 'Project pulse' },
  { id: 'docs', label: 'Docs', description: 'Files vault' },
  { id: 'ai', label: 'AI', description: 'Copilot preview' },
];

export default function ProjectDetailPage() {
  const { workspaceId, projectId } = useParams<{
    workspaceId: string;
    projectId: string;
  }>();
  const nav = useNavigate();
  const [tab, setTab] = useState<TabId>('overview');

  const { data: workspace } = useWorkspace(workspaceId);
  const { data: dashboard } = useMyDashboard();
  const { data: project } = useProject(workspaceId, projectId);
  const { data: tasks = [] } = useTasks(workspaceId, projectId);
  const { data: tree = [] } = useTaskTree(workspaceId, projectId);
  const { data: deps = [] } = useDependencies(workspaceId, projectId);
  const overview = useAnalyticsOverview(workspaceId, projectId);
  const cpmEnabled = workspace?.entitlements?.cpmEnabled;
  const cpm = useCpm(workspaceId, projectId, !!cpmEnabled);
  const createTask = useCreateTask(workspaceId!, projectId!);
  const updateProject = useUpdateProject(workspaceId!, projectId!);
  const deleteProject = useDeleteProject(workspaceId!);
  const createDep = useCreateDependency(workspaceId!, projectId!);
  const deleteTask = useDeleteTask(workspaceId!, projectId!);
  const patchTaskMut = usePatchTask(workspaceId!, projectId!);
  const { data: members = [] } = useWorkspaceMembers(workspaceId);
  const inviteMutation = useInviteWorkspaceMember(workspaceId!);
  const removeProjectMember = useRemoveProjectMember(workspaceId!, projectId!);
  const removeWorkspaceMember = useRemoveWorkspaceMember(workspaceId!);

  const [drawerTaskId, setDrawerTaskId] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'owner' | 'member' | 'viewer'>('member');
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [memberActionError, setMemberActionError] = useState<string | null>(null);
  const [taskFormKey, setTaskFormKey] = useState(0);
  const [newTaskDefaultTitle, setNewTaskDefaultTitle] = useState('');
  const [quickActionError, setQuickActionError] = useState<string | null>(null);
  const [projectEditOpen, setProjectEditOpen] = useState(false);
  const [projectNameDraft, setProjectNameDraft] = useState('');
  const [projectDescriptionDraft, setProjectDescriptionDraft] = useState('');
  const taskAnchorRef = useRef<HTMLDivElement | null>(null);

  const criticalIds: string[] = cpm.data?.criticalTaskIds ?? [];
  const drawerTask = drawerTaskId ? (tasks.find((t) => t.id === drawerTaskId) ?? null) : null;

  const criticalCount = tasks.filter((t) => criticalIds.includes(t.id)).length;
  const blocked = overview.data?.blocked ?? 0;
  const completionPct = overview.data?.completionPct ?? 0;
  const overdueCount = countOverdue(tasks);
  const workspaceRole = dashboard?.workspaces.find((w) => w.id === workspaceId)?.role;
  const canManageProject =
    dashboard?.myRole === 'platform_admin' ||
    workspaceRole === 'owner' ||
    workspaceRole === 'admin';
  const canCreateTask = canManageProject || workspaceRole === 'member';
  const canUpdateTaskProgress = canCreateTask;
  const canComment = workspaceRole !== 'viewer' && workspaceRole !== 'client';
  const canGrantOwner = dashboard?.myRole === 'platform_admin' || workspaceRole === 'owner';
  const projectMemberIds = new Set([
    ...(project?.leadId ? [project.leadId] : []),
    ...tasks.flatMap((task) => task.assigneeIds ?? []),
  ]);
  const projectMembers = members.filter((member) => projectMemberIds.has(member.userId));
  const taskDrawerMembers = canManageProject ? members : projectMembers;

  async function handleQuickAction(action: QuickAction) {
    setQuickActionError(null);
    switch (action.type) {
      case 'task':
        if (!canCreateTask) return;
        {
          const { startDate, endDate, durationDays } = defaultNewTaskWindow(
            project?.startDate,
            project?.endDate,
          );
          await createTask.mutateAsync({
            title: `Task ${tasks.length + 1}`,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            durationDays,
            parentTaskId: null,
          });
        }
        setTab('tasks');
        setNewTaskDefaultTitle('');
        setTaskFormKey((k) => k + 1);
        queueMicrotask(() => taskAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
        break;
      case 'milestone':
        if (!canCreateTask) return;
        {
          const { startDate } = defaultNewTaskWindow(project?.startDate, project?.endDate);
          await createTask.mutateAsync({
            title: `Milestone ${tasks.length + 1}`,
            startDate: startDate.toISOString(),
            endDate: startDate.toISOString(),
            durationDays: 1,
            parentTaskId: null,
          });
        }
        setTab('tasks');
        setNewTaskDefaultTitle('Milestone: ');
        setTaskFormKey((k) => k + 1);
        queueMicrotask(() => taskAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
        break;
      case 'invite':
        if (!canManageProject) return;
        setInviteError(null);
        setMemberActionError(null);
        setInviteOpen(true);
        break;
      case 'docs':
        setTab('docs');
        break;
      case 'export':
        exportTasksJson(project?.name ?? 'project', tasks);
        break;
      case 'kanban':
        setTab('kanban');
        break;
      case 'report':
        exportMarkdownReport(project?.name ?? 'Project', tasks, overview.data);
        break;
      default:
        break;
    }
  }

  async function runQuickAction(action: QuickAction) {
    try {
      await handleQuickAction(action);
    } catch (err: any) {
      setQuickActionError(
        err?.response?.data?.message ??
          err?.response?.data?.code ??
          err?.message ??
          'Could not add task.',
      );
    }
  }

  async function reparentTask(taskId: string, newParentId: string | null) {
    if (newParentId && isDescendantTasks(tasks, taskId, newParentId)) return;
    await patchTaskMut.mutateAsync({ id: taskId, parentTaskId: newParentId });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <Breadcrumb
          items={[
            { to: '/dashboard', label: 'Overview' },
            { to: '/dashboard/workspaces', label: 'Workspaces' },
            {
              to: `/dashboard/workspaces/${workspaceId}/projects`,
              label: workspace?.name ?? 'Projects',
            },
            { label: project?.name ?? 'Project' },
          ]}
        />
        <div className="flex flex-wrap gap-2">
          {canManageProject && (
            <button
              type="button"
              className="btn-secondary h-10 px-4 text-sm"
              onClick={() => {
                setProjectNameDraft(project?.name ?? '');
                setProjectDescriptionDraft(project?.description ?? '');
                setProjectEditOpen(true);
              }}
            >
              Edit project
            </button>
          )}
          {canManageProject && (
            <button
              type="button"
              className="btn-secondary h-10 px-4 text-sm text-rose-700"
              disabled={deleteProject.isPending}
              onClick={async () => {
                if (!window.confirm(`Delete project "${project?.name ?? 'Project'}"?`)) return;
                await deleteProject.mutateAsync(projectId!);
                nav(`/dashboard/workspaces/${workspaceId}/projects`);
              }}
            >
              Delete project
            </button>
          )}
        <Link
          to={`/dashboard/workspaces/${workspaceId}/projects`}
          className="btn-secondary h-10 shrink-0 px-4 text-sm"
        >
          ← Back to projects
        </Link>
        </div>
      </div>

      {projectEditOpen && (
        <div className="rounded-2xl border border-ink-200 bg-white p-5 shadow-card">
          <form
            className="grid gap-4 md:grid-cols-2 md:items-end"
            onSubmit={async (e) => {
              e.preventDefault();
              const name = projectNameDraft.trim();
              if (!name) return;
              await updateProject.mutateAsync({
                name,
                description: projectDescriptionDraft.trim(),
              });
              setProjectEditOpen(false);
            }}
          >
            <div>
              <label className="label">Project name</label>
              <input className="input" value={projectNameDraft} onChange={(e) => setProjectNameDraft(e.target.value)} />
            </div>
            <div>
              <label className="label">Description</label>
              <input className="input" value={projectDescriptionDraft} onChange={(e) => setProjectDescriptionDraft(e.target.value)} />
            </div>
            <div className="flex gap-2 md:col-span-2">
              <button type="submit" className="btn-primary px-4 text-sm" disabled={updateProject.isPending}>
                Save project
              </button>
              <button type="button" className="btn-secondary px-4 text-sm" onClick={() => setProjectEditOpen(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <ProjectCommandCenter
        projectId={projectId!}
        projectName={project?.name ?? 'Project'}
        projectEnd={project?.endDate ?? null}
        tasks={tasks}
        members={projectMembers}
        overview={overview.data}
        criticalCount={criticalCount}
        blocked={blocked}
        completionPct={completionPct}
        cpmEnabled={!!cpmEnabled}
        canManage={!!canManageProject}
        canCreateTask={!!canCreateTask}
        onQuickAction={runQuickAction}
      />
      {quickActionError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
          {quickActionError}
        </div>
      )}

      {project?.code && (
        <p className="text-xs text-ink-500">
          Code{' '}
          <span className="rounded-md bg-ink-100 px-2 py-0.5 font-mono font-semibold text-ink-700">
            {project.code}
          </span>
        </p>
      )}

      <div className="card overflow-hidden">
        <div className="border-b border-ink-200 bg-ink-50/40 px-2 py-2 sm:px-4">
          <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none sm:flex-wrap sm:pb-0">
            {TABS.map((t) => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`flex min-w-0 flex-col rounded-xl px-3 py-2 text-left transition sm:px-4 ${
                    active
                      ? 'bg-white text-ink-900 shadow-soft ring-1 ring-inset ring-ink-200'
                      : 'text-ink-600 hover:bg-white/70 hover:text-ink-900'
                  }`}
                >
                  <span className="text-sm font-semibold">{t.label}</span>
                  <span className="hidden text-[11px] text-ink-500 sm:block">{t.description}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-4 sm:p-5">
          {tab === 'overview' && (
            <ProjectOverviewAnalytics
              projectId={projectId!}
              overview={overview.data}
              tasks={tasks}
              members={projectMembers}
              criticalIds={criticalIds}
            />
          )}

          {tab === 'wbs' && (
            <>
              <SectionIntro
                title="Work breakdown structure"
                subtitle="Drag :: handles to reorganize parents. Drop on the dashed strip to promote to root."
              />
              <div className="mt-4 rounded-2xl border border-ink-100 bg-ink-50/30 p-4 sm:p-5">
                <WbsTree
                  nodes={tree as any}
                  criticalIds={criticalIds}
                  onReparent={canManageProject ? reparentTask : undefined}
                />
              </div>
            </>
          )}

          {tab === 'gantt' && (
            <>
              <SectionIntro
                title="Gantt"
                subtitle="Zoom levels, today marker, dependency arrows, and drag to reschedule."
              />
              <div className="mt-4 rounded-2xl border border-ink-100 bg-white p-2 sm:p-4">
                <ProjectGantt
                  workspaceId={workspaceId!}
                  projectId={projectId!}
                  criticalIds={criticalIds}
                  members={projectMembers}
                  canManage={!!canManageProject}
                />
              </div>
            </>
          )}

          {tab === 'cpm' && (
            <CpmPanel
              workspaceId={workspaceId}
              cpmEnabled={!!cpmEnabled}
              cpm={cpm}
              tasks={tasks}
            />
          )}

          {tab === 'tasks' && (
            <div ref={taskAnchorRef}>
              <TasksPanel
                key={taskFormKey}
                tasks={tasks}
                deps={deps}
                criticalIds={criticalIds}
                members={projectMembers}
                canManage={!!canManageProject}
                canCreate={!!canCreateTask}
                newTaskDefaultTitle={newTaskDefaultTitle}
                onCreateTask={(payload) => createTask.mutateAsync(payload)}
                onCreateDep={(body) => createDep.mutateAsync(body)}
                onDeleteTask={(id) => deleteTask.mutate(id)}
                onOpenTask={(t) => setDrawerTaskId(t.id)}
              />
            </div>
          )}

          {tab === 'kanban' && (
            <ProjectKanban
              projectId={projectId!}
              tasks={tasks}
              members={projectMembers}
              onStatusChange={(id, status) => patchTaskMut.mutate({ id, status })}
              onOpenTask={(t) => setDrawerTaskId(t.id)}
              canMove={!!canUpdateTaskProgress}
            />
          )}

          {tab === 'activity' && <ProjectActivityTab tasks={tasks} />}

          {tab === 'docs' && (
            <ProjectDocsTab projectId={projectId!} workspaceId={workspaceId!} />
          )}

          {tab === 'ai' && (
            <ProjectAiTab
              tasks={tasks}
              projectName={project?.name ?? 'Project'}
              blocked={blocked}
              overdue={overdueCount}
            />
          )}
        </div>
      </div>

      <TaskDrawer
        open={drawerTaskId !== null}
        task={drawerTask}
        tasks={tasks}
        members={taskDrawerMembers}
        projectId={projectId!}
        canManage={!!canManageProject}
        canUpdateProgress={!!canUpdateTaskProgress}
        canComment={canComment}
        onClose={() => setDrawerTaskId(null)}
        patchTask={(patch) => patchTaskMut.mutateAsync(patch)}
        createTask={(body) => createTask.mutateAsync(body)}
      />

      {inviteOpen && (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-ink-900/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-ink-200">
            <h3 className="text-lg font-semibold text-ink-900">Invite teammate</h3>
            <p className="mt-1 text-xs text-ink-500">Invite workspace members and manage this project's access.</p>
            <form
              className="mt-4 space-y-3"
              onSubmit={async (e) => {
                e.preventDefault();
                setInviteError(null);
                const email = inviteEmail.trim();
                if (!email) return;
                try {
                  await inviteMutation.mutateAsync({ email, role: inviteRole });
                  setInviteEmail('');
                  setInviteOpen(false);
                  setMemberActionError(null);
                } catch (err: any) {
                  setInviteError(
                    err?.response?.data?.message ??
                      err?.response?.data?.code ??
                      err?.message ??
                      'Could not invite this user.',
                  );
                }
              }}
            >
              <div>
                <label className="label">Email</label>
                <input
                  className="input text-sm"
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Role</label>
                <select
                  className="input text-sm"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as typeof inviteRole)}
                >
                  <option value="member">Member</option>
                  <option value="viewer">Viewer</option>
                  {canGrantOwner && <option value="owner">Owner</option>}
                </select>
              </div>
              {inviteError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
                  {inviteError}
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="btn-secondary px-4 text-sm"
                  onClick={() => setInviteOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary px-4 text-sm" disabled={inviteMutation.isPending}>
                  Send invite
                </button>
              </div>
            </form>

            <div className="mt-5 border-t border-ink-100 pt-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <h4 className="text-sm font-semibold text-ink-900">Project members</h4>
                <span className="text-[11px] font-medium text-ink-500">{projectMembers.length} assigned</span>
              </div>
              <ul className="max-h-64 space-y-2 overflow-y-auto pr-1">
                {projectMembers.map((m) => (
                  <ProjectMemberRow
                    key={m.userId}
                    member={m}
                    isPrimaryOwner={m.userId === workspace?.ownerId}
                    removePending={removeProjectMember.isPending}
                    onRemove={async () => {
                      if (window.confirm(`Remove ${m.displayName} from this project? They will keep access to other assigned projects.`)) {
                        setMemberActionError(null);
                        try {
                          await removeProjectMember.mutateAsync(m.userId);
                        } catch (err: any) {
                          setMemberActionError(
                            err?.response?.data?.message ??
                              err?.response?.data?.code ??
                              err?.message ??
                              'Could not remove this member from the project.',
                          );
                        }
                      }
                    }}
                  />
                ))}
                {projectMembers.length === 0 && (
                  <li className="rounded-xl border border-dashed border-ink-200 px-4 py-8 text-center text-sm text-ink-500">
                    No project members assigned yet.
                  </li>
                )}
              </ul>
              {memberActionError && (
                <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
                  {memberActionError}
                </div>
              )}
              <div className="mt-5 border-t border-ink-100 pt-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <h4 className="text-sm font-semibold text-ink-900">Workspace access</h4>
                  <span className="text-[11px] font-medium text-ink-500">{members.length} active</span>
                </div>
                <ul className="max-h-56 space-y-2 overflow-y-auto pr-1">
                  {members.map((m) => (
                    <WorkspaceAccessRow
                      key={m.userId}
                      member={m}
                      isPrimaryOwner={m.userId === workspace?.ownerId}
                      removePending={removeWorkspaceMember.isPending}
                      onRemove={async () => {
                        if (window.confirm(`Remove ${m.displayName} from this workspace? They will lose access to all projects in this workspace.`)) {
                          setMemberActionError(null);
                          try {
                            await removeWorkspaceMember.mutateAsync(m.userId);
                          } catch (err: any) {
                            setMemberActionError(
                              err?.response?.data?.message ??
                                err?.response?.data?.code ??
                                err?.message ??
                                'Could not remove this member from the workspace.',
                            );
                          }
                        }
                      }}
                    />
                  ))}
                  {members.length === 0 && (
                    <li className="rounded-xl border border-dashed border-ink-200 px-4 py-8 text-center text-sm text-ink-500">
                      No workspace members loaded.
                    </li>
                  )}
                </ul>
              </div>
              <div className="mt-4 flex justify-end">
                <button type="button" className="btn-secondary px-4 text-sm" onClick={() => setInviteOpen(false)}>
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Breadcrumb({
  items,
}: {
  items: Array<{ to?: string; label: string }>;
}) {
  return (
    <nav className="flex flex-wrap items-center gap-1.5 text-xs text-ink-500" aria-label="Breadcrumb">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-ink-300">/</span>}
          {item.to ? (
            <Link to={item.to} className="font-medium text-ink-600 transition hover:text-brand-700">
              {item.label}
            </Link>
          ) : (
            <span className="max-w-[12rem] truncate font-semibold text-ink-800 sm:max-w-md">
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}

function ProjectMemberRow({
  member,
  isPrimaryOwner,
  removePending,
  onRemove,
}: {
  member: import('../features/workspaces/hooks').WorkspaceMemberRow;
  isPrimaryOwner: boolean;
  removePending: boolean;
  onRemove: () => Promise<void>;
}) {
  return (
    <li className="flex flex-col gap-2 rounded-xl border border-ink-100 bg-ink-50/30 px-3 py-2 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate text-sm font-semibold text-ink-900">{member.displayName}</span>
          {isPrimaryOwner && (
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800 ring-1 ring-inset ring-amber-100">
              primary owner
            </span>
          )}
        </div>
        <div className="truncate text-xs text-ink-500">{member.email}</div>
      </div>
      <span className="badge bg-white text-ink-700 ring-1 ring-inset ring-ink-200">
        {member.role}
      </span>
      <button
        type="button"
        className="btn-secondary h-9 px-3 text-xs text-rose-700"
        disabled={removePending || isPrimaryOwner}
        title={isPrimaryOwner ? 'Only a platform admin can remove the current workspace owner' : 'Remove from project'}
        onClick={onRemove}
      >
        Remove from project
      </button>
    </li>
  );
}

function WorkspaceAccessRow({
  member,
  isPrimaryOwner,
  removePending,
  onRemove,
}: {
  member: import('../features/workspaces/hooks').WorkspaceMemberRow;
  isPrimaryOwner: boolean;
  removePending: boolean;
  onRemove: () => Promise<void>;
}) {
  return (
    <li className="flex flex-col gap-2 rounded-xl border border-ink-100 bg-white px-3 py-2 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate text-sm font-semibold text-ink-900">{member.displayName}</span>
          {isPrimaryOwner && (
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800 ring-1 ring-inset ring-amber-100">
              primary owner
            </span>
          )}
        </div>
        <div className="truncate text-xs text-ink-500">{member.email}</div>
      </div>
      <span className="badge bg-ink-50 text-ink-700 ring-1 ring-inset ring-ink-200">
        {member.role}
      </span>
      <button
        type="button"
        className="btn-secondary h-9 px-3 text-xs text-rose-700"
        disabled={removePending || isPrimaryOwner}
        title={isPrimaryOwner ? 'Only a platform admin can remove the current workspace owner' : 'Remove from workspace'}
        onClick={onRemove}
      >
        Remove from workspace
      </button>
    </li>
  );
}

function SectionIntro({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-ink-900">{title}</h2>
      <p className="mt-1 text-sm text-ink-500">{subtitle}</p>
    </div>
  );
}

function CpmPanel({
  workspaceId,
  cpmEnabled,
  cpm,
  tasks,
}: {
  workspaceId?: string;
  cpmEnabled: boolean;
  cpm: ReturnType<typeof useCpm>;
  tasks: { id: string; title: string }[];
}) {
  return (
    <div className="space-y-4">
      <SectionIntro
        title="Critical path (CPM)"
        subtitle="Early start/finish with slack; critical activities highlighted."
      />
      {!cpmEnabled && (
        <>
          <CpmLockedPreview workspaceId={workspaceId} />
          <div className="rounded-xl border border-amber-100 bg-amber-50/60 px-4 py-3 text-xs text-amber-900">
            Upgrade this workspace to compute exact slack, drag-impact scenarios, and exports.
          </div>
        </>
      )}
      {cpmEnabled && cpm.isLoading && (
        <div className="flex items-center gap-2 text-sm text-ink-500">
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-ink-200 border-t-brand-600" />
          Computing…
        </div>
      )}
      {cpmEnabled && cpm.data && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-ink-200 bg-ink-50/40 px-4 py-3 text-sm">
            <span className="text-ink-500">Project window </span>
            <strong className="text-ink-900">
              {fmt(cpm.data.projectStart)} → {fmt(cpm.data.projectEnd)}
            </strong>
            <span className="text-ink-500"> · </span>
            <span className="font-semibold text-ink-800">{cpm.data.durationDays} days</span>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-ink-800">
              Activities ({cpm.data.tasks.length})
            </h4>
            <ul className="mt-3 divide-y divide-ink-100 rounded-2xl border border-ink-200 bg-white">
              {cpm.data.tasks.map((t: any) => {
                const task = tasks.find((x) => x.id === t.taskId);
                return (
                  <li
                    key={t.taskId}
                    className={`flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${
                      t.isCritical ? 'bg-rose-50/50' : ''
                    }`}
                  >
                    <div className="min-w-0 font-medium text-ink-900">
                      {task?.title ?? t.taskId}
                      {t.isCritical && (
                        <span className="ml-2 inline-block rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rose-800">
                          Critical
                        </span>
                      )}
                    </div>
                    <div className="shrink-0 font-mono text-[11px] text-ink-500">
                      ES {fmt(t.es)} · EF {fmt(t.ef)} · slack ~
                      {Math.round(t.slackMinutes / 60 / 24)}g
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function TasksPanel({
  tasks,
  deps,
  criticalIds,
  members,
  canManage,
  canCreate,
  newTaskDefaultTitle,
  onCreateTask,
  onCreateDep,
  onDeleteTask,
  onOpenTask,
}: {
  tasks: TaskItem[];
  deps: {
    id: string;
    predecessorId: string;
    successorId: string;
    type: string;
    lagDays: number;
  }[];
  criticalIds: string[];
  members: import('../features/workspaces/hooks').WorkspaceMemberRow[];
  canManage: boolean;
  canCreate: boolean;
  newTaskDefaultTitle: string;
  onCreateTask: (payload: any) => Promise<void>;
  onCreateDep: (b: { predecessorId: string; successorId: string }) => Promise<void>;
  onDeleteTask: (id: string) => void;
  onOpenTask: (task: TaskItem) => void;
}) {
  const memberMap = new Map(members.map((m) => [m.userId, m]));

  return (
    <div className="space-y-6">
      {canCreate && (
        <NewTaskForm
          tasks={tasks}
          defaultTitle={newTaskDefaultTitle}
          onCreate={onCreateTask}
        />
      )}
      {canManage && <NewDependencyForm tasks={tasks} onCreate={onCreateDep} />}

      <div className="overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-card">
        <div className="border-b border-ink-200 bg-ink-50/40 px-5 py-4">
          <h3 className="text-base font-semibold text-ink-900">All tasks</h3>
          <p className="text-xs text-ink-500">{tasks.length} rows · click a row for the detail drawer</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-sm">
            <thead className="border-b border-ink-200 bg-ink-50/30 text-left text-[11px] font-semibold uppercase tracking-wider text-ink-500">
              <tr>
                <th className="whitespace-nowrap px-5 py-3">Title</th>
                <th className="px-5 py-3">Priority</th>
                <th className="px-5 py-3">Assignees</th>
                <th className="px-5 py-3">WBS</th>
                <th className="px-5 py-3">Start</th>
                <th className="px-5 py-3">End</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">%</th>
                <th className="px-5 py-3">Critical</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {tasks.map((t) => (
                <tr
                  key={t.id}
                  role="button"
                  tabIndex={0}
                  className="cursor-pointer transition hover:bg-ink-50/50"
                  onClick={() => onOpenTask(t)}
                  onKeyDown={(ev) => {
                    if (ev.key === 'Enter' || ev.key === ' ') {
                      ev.preventDefault();
                      onOpenTask(t);
                    }
                  }}
                >
                  <td className="px-5 py-3 font-medium text-ink-900">{t.title}</td>
                  <td className="px-5 py-3 text-xs capitalize text-ink-700">{t.priority}</td>
                  <td className="px-5 py-3 text-xs text-ink-600">
                    {t.assigneeIds.length === 0
                      ? '—'
                      : t.assigneeIds
                          .map((id) => memberMap.get(id)?.displayName ?? id.slice(-4))
                          .join(', ')}
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-ink-600">{t.wbsCode ?? '—'}</td>
                  <td className="px-5 py-3 tabular-nums text-ink-700">{fmt(t.startDate)}</td>
                  <td className="px-5 py-3 tabular-nums text-ink-700">{fmt(t.endDate)}</td>
                  <td className="px-5 py-3">
                    <TaskStatusBadge status={t.status} />
                  </td>
                  <td className="px-5 py-3 tabular-nums text-xs text-ink-700">{t.progressPct ?? 0}</td>
                  <td className="px-5 py-3">
                    {criticalIds.includes(t.id) ? (
                      <span className="badge bg-rose-50 text-rose-800 ring-1 ring-inset ring-rose-100">
                        Yes
                      </span>
                    ) : (
                      <span className="text-xs text-ink-400">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {canManage && (
                      <button
                        type="button"
                        className="text-xs font-semibold text-rose-600 transition hover:text-rose-700"
                        onClick={(ev) => {
                          ev.stopPropagation();
                          onDeleteTask(t.id);
                        }}
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {tasks.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-5 py-12 text-center text-sm text-ink-500">
                    No assigned tasks yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="text-base font-semibold text-ink-900">Dependencies</h3>
        <p className="text-xs text-ink-500">Finish-to-start links and lag in days</p>
        <ul className="mt-4 space-y-2">
          {deps.map((d) => {
            const a = tasks.find((t) => t.id === d.predecessorId);
            const b = tasks.find((t) => t.id === d.successorId);
            return (
              <li
                key={d.id}
                className="flex flex-col gap-2 rounded-xl border border-ink-200 bg-ink-50/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="text-sm text-ink-800">
                  <span className="font-semibold">{a?.title ?? d.predecessorId}</span>
                  <span className="mx-2 text-ink-400">→</span>
                  <span className="font-semibold">{b?.title ?? d.successorId}</span>
                </div>
                <span className="shrink-0 rounded-lg bg-white px-2 py-1 font-mono text-[11px] text-ink-600 ring-1 ring-inset ring-ink-200">
                  {d.type} · lag {d.lagDays}g
                </span>
              </li>
            );
          })}
          {deps.length === 0 && (
            <li className="rounded-xl border border-dashed border-ink-200 px-4 py-8 text-center text-sm text-ink-500">
              No dependencies yet.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}

function TaskStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    not_started: 'bg-ink-100 text-ink-700 ring-ink-200',
    in_progress: 'bg-brand-50 text-brand-800 ring-brand-100',
    blocked: 'bg-amber-50 text-amber-900 ring-amber-100',
    done: 'bg-emerald-50 text-emerald-800 ring-emerald-100',
    cancelled: 'bg-ink-50 text-ink-500 ring-ink-200',
  };
  const label: Record<string, string> = {
    not_started: 'Not started',
    in_progress: 'In progress',
    blocked: 'Blocked',
    done: 'Done',
    cancelled: 'Cancelled',
  };
  const cls = map[status] ?? 'bg-ink-50 text-ink-600 ring-ink-200';
  return (
    <span className={`badge ring-1 ring-inset ${cls}`}>{label[status] ?? status}</span>
  );
}

function NewTaskForm({
  tasks,
  defaultTitle,
  onCreate,
}: {
  tasks: TaskItem[];
  defaultTitle: string;
  onCreate: (payload: any) => Promise<void>;
}) {
  const [title, setTitle] = useState(defaultTitle);
  const [parentTaskId, setParentTaskId] = useState<string>('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [duration, setDuration] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setTitle(defaultTitle);
  }, [defaultTitle]);

  return (
    <div className="card p-5">
      <h3 className="text-base font-semibold text-ink-900">New task</h3>
      <p className="text-xs text-ink-500">
        Use dates together with duration. Optional parent nests tasks for real WBS.
      </p>
      <form
        className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-12 lg:items-end"
        onSubmit={async (e) => {
          e.preventDefault();
          setError(null);
          if (!title.trim() || !start || !end) return;
          setIsSubmitting(true);
          try {
            await onCreate({
              title: title.trim(),
              startDate: new Date(start),
              endDate: new Date(end),
              durationDays: duration,
              parentTaskId: parentTaskId || null,
            });
            setTitle(defaultTitle);
            setParentTaskId('');
            setStart('');
            setEnd('');
            setDuration(1);
          } catch (err: any) {
            setError(
              err?.response?.data?.message ??
                err?.response?.data?.code ??
                err?.message ??
                'Could not add task.',
            );
          } finally {
            setIsSubmitting(false);
          }
        }}
      >
        <div className="sm:col-span-2 lg:col-span-4">
          <label className="label" htmlFor="nt-title">
            Title
          </label>
          <input
            id="nt-title"
            className="input"
            placeholder="e.g. Foundation pour"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="sm:col-span-2 lg:col-span-4">
          <label className="label" htmlFor="nt-parent">
            Parent (optional)
          </label>
          <select
            id="nt-parent"
            className="input"
            value={parentTaskId}
            onChange={(e) => setParentTaskId(e.target.value)}
          >
            <option value="">Top level</option>
            {tasks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
        </div>
        <div className="lg:col-span-2">
          <label className="label" htmlFor="nt-start">
            Start
          </label>
          <input
            id="nt-start"
            type="date"
            className="input"
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
        </div>
        <div className="lg:col-span-2">
          <label className="label" htmlFor="nt-end">
            End
          </label>
          <input
            id="nt-end"
            type="date"
            className="input"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
          />
        </div>
        <div className="lg:col-span-2">
          <label className="label" htmlFor="nt-dur">
            Duration (days)
          </label>
          <input
            id="nt-dur"
            type="number"
            min={1}
            className="input"
            value={duration}
            onChange={(e) => setDuration(parseInt(e.target.value || '1', 10))}
          />
        </div>
        <div className="lg:col-span-2">
          <button type="submit" className="btn-primary w-full lg:w-auto" disabled={isSubmitting}>
            {isSubmitting ? 'Adding...' : 'Add task'}
          </button>
        </div>
        {error && (
          <div className="sm:col-span-2 lg:col-span-12 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
            {error}
          </div>
        )}
      </form>
    </div>
  );
}

function NewDependencyForm({
  tasks,
  onCreate,
}: {
  tasks: { id: string; title: string }[];
  onCreate: (b: { predecessorId: string; successorId: string }) => Promise<void>;
}) {
  const [pred, setPred] = useState('');
  const [succ, setSucc] = useState('');
  if (tasks.length < 2) return null;
  return (
    <div className="card p-5">
      <h3 className="text-base font-semibold text-ink-900">Add dependency (FS)</h3>
      <p className="text-xs text-ink-500">Which task must finish before the next one starts</p>
      <form
        className="mt-4 grid gap-4 md:grid-cols-3 md:items-end"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!pred || !succ || pred === succ) return;
          await onCreate({ predecessorId: pred, successorId: succ });
          setPred('');
          setSucc('');
        }}
      >
        <div>
          <label className="label" htmlFor="dep-pred">
            Predecessor
          </label>
          <select id="dep-pred" className="input" value={pred} onChange={(e) => setPred(e.target.value)}>
            <option value="">Choose…</option>
            {tasks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="dep-succ">
            Successor
          </label>
          <select id="dep-succ" className="input" value={succ} onChange={(e) => setSucc(e.target.value)}>
            <option value="">Choose…</option>
            {tasks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn-primary w-full md:w-auto">
          Link
        </button>
      </form>
    </div>
  );
}

function defaultNewTaskWindow(
  projectStart?: string | Date | null,
  projectEnd?: string | Date | null,
) {
  const today = stripTime(new Date());
  const parsedStart = projectStart ? stripTime(new Date(projectStart)) : null;
  const parsedEnd = projectEnd ? stripTime(new Date(projectEnd)) : null;
  const startDate = parsedStart && parsedStart > today ? parsedStart : today;
  const endDate = parsedEnd && parsedEnd >= startDate ? parsedEnd : startDate;
  const durationDays = Math.max(
    1,
    Math.ceil((+endDate - +startDate) / (24 * 60 * 60 * 1000)) || 1,
  );

  return { startDate, endDate, durationDays };
}

function stripTime(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function fmt(value: string | Date | undefined | null) {
  if (!value) return '—';
  const d = typeof value === 'string' ? new Date(value) : value;
  return d.toISOString().slice(0, 10);
}

function exportTasksJson(projectName: string, tasks: TaskItem[]) {
  const blob = new Blob([JSON.stringify(tasks, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `planforge-${slug(projectName)}-tasks.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportMarkdownReport(
  projectName: string,
  tasks: TaskItem[],
  overview:
    | {
        total?: number;
        completionPct?: number;
        blocked?: number;
        inProgress?: number;
      }
    | undefined,
) {
  const lines = [
    `# ${projectName}`,
    '',
    `- Tasks: ${overview?.total ?? tasks.length}`,
    `- Completion: ${overview?.completionPct ?? 0}%`,
    `- Blocked: ${overview?.blocked ?? 0}`,
    `- In progress: ${overview?.inProgress ?? 0}`,
    '',
    '## Task register',
    '',
    ...tasks.map(
      (t) =>
        `- **${t.title}** · ${t.status} · ${fmt(t.startDate)}→${fmt(t.endDate)} · ${t.priority}`,
    ),
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `planforge-${slug(projectName)}-report.md`;
  a.click();
  URL.revokeObjectURL(url);
}

function slug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'project';
}
