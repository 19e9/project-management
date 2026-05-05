import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Tabs } from '../../components/ui/Tabs';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { KanbanBoard } from '../../components/project/KanbanBoard';
import { TaskDrawer } from '../../components/task/TaskDrawer';
import { mockProjects, mockTasks } from '../../features/projects/mockData';
import type { Task } from '../../features/projects/types';
import { useT } from '../../i18n/I18nProvider';
import { useAuth } from '../../features/auth/AuthProvider';
import { IPlus } from '../../components/layout/icons';
import { formatDate } from '../../lib/format';

type Tab = 'overview' | 'board' | 'tasks';

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const t = useT();
  const { effectiveRole } = useAuth();
  const readOnly = effectiveRole === 'client';

  const project = mockProjects.find((p) => p.id === id);
  const [tasks, setTasks] = useState<Task[]>(() => mockTasks.filter((x) => x.projectId === id));
  const [tab, setTab] = useState<Tab>('board');
  const [openTask, setOpenTask] = useState<string | null>(null);

  const selected = useMemo(() => tasks.find((tk) => tk.id === openTask) ?? null, [tasks, openTask]);

  if (!project) {
    return (
      <EmptyState
        title={t('states.notFoundTitle')}
        hint={t('states.notFoundHint')}
        action={
          <Link to="/projects">
            <Button variant="secondary">{t('nav.projects')}</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="eyebrow">
            <Link to="/projects" className="hover:text-fg">{t('nav.projects')}</Link> /{' '}
            <span className="text-fg">{project.name}</span>
          </span>
          <h1 className="mt-1 text-2xl font-bold text-fg">{project.name}</h1>
          <p className="mt-1 text-sm text-muted">
            {t('projects.deadline')}: {formatDate(project.due, 'long')} · {project.team}{' '}
            {t('projects.teamSize')} ·{' '}
            <Badge tone="success">{t('projects.statusActive')}</Badge>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Tabs
            value={tab}
            onChange={setTab}
            items={[
              { id: 'overview', label: t('dashboard.recentProjects') },
              { id: 'board', label: t('projects.boardView'), count: tasks.length },
              { id: 'tasks', label: t('nav.tasks'), count: tasks.length },
            ]}
          />
          {!readOnly && (
            <Button leftIcon={<IPlus className="h-3.5 w-3.5" />}>{t('tasks.new')}</Button>
          )}
        </div>
      </header>

      {tab === 'overview' && (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader title={t('projects.progress')} subtitle={`%${project.completion}`} />
            <CardBody>
              <div className="h-2 overflow-hidden rounded-full bg-surface-3">
                <div className="h-full bg-brand" style={{ width: `${project.completion}%` }} />
              </div>
              <ul className="mt-6 grid grid-cols-2 gap-y-3 text-sm">
                <li className="text-muted">{t('projects.owner')}</li>
                <li className="text-fg">{project.ownerName}</li>
                <li className="text-muted">{t('projects.deadline')}</li>
                <li className="text-fg">{formatDate(project.due, 'long')}</li>
                <li className="text-muted">{t('projects.teamSize')}</li>
                <li className="text-fg">{project.team}</li>
              </ul>
            </CardBody>
          </Card>
          <Card>
            <CardHeader title={t('dashboard.activityFeed')} />
            <CardBody>
              <p className="text-sm text-muted">—</p>
            </CardBody>
          </Card>
        </div>
      )}

      {tab === 'board' && (
        <KanbanBoard
          tasks={tasks}
          readOnly={readOnly}
          onOpenTask={(taskId) => setOpenTask(taskId)}
          onMove={(taskId, status) =>
            setTasks((s) => s.map((tk) => (tk.id === taskId ? { ...tk, status } : tk)))
          }
        />
      )}

      {tab === 'tasks' && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-2">
                <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-muted">
                  <th className="px-4 py-2.5">{t('tasks.title')}</th>
                  <th className="px-4 py-2.5">{t('tasks.assignee')}</th>
                  <th className="px-4 py-2.5">{t('tasks.statusBacklog')}</th>
                  <th className="px-4 py-2.5">{t('tasks.priorityHigh')}</th>
                  <th className="px-4 py-2.5">{t('tasks.dueDate')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tasks.map((tk) => (
                  <tr
                    key={tk.id}
                    className="cursor-pointer hover:bg-surface-2"
                    onClick={() => setOpenTask(tk.id)}
                  >
                    <td className="px-4 py-3 font-medium text-fg">{tk.title}</td>
                    <td className="px-4 py-3 text-muted">{tk.assigneeName ?? '—'}</td>
                    <td className="px-4 py-3">{tk.status}</td>
                    <td className="px-4 py-3">{tk.priority}</td>
                    <td className="px-4 py-3 text-muted">{tk.due ? formatDate(tk.due) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <TaskDrawer
        open={Boolean(selected)}
        task={selected}
        readOnly={readOnly}
        onClose={() => setOpenTask(null)}
        onSave={(next) => setTasks((s) => s.map((x) => (x.id === next.id ? next : x)))}
        onDelete={(tid) => setTasks((s) => s.filter((x) => x.id !== tid))}
      />
    </div>
  );
}
