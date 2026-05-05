import { Link } from 'react-router-dom';
import { StatCard } from '../../components/dashboard/StatCard';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import { IPlus, IFolder, ICheck, IUsers, IActivity } from '../../components/layout/icons';
import { useT } from '../../i18n/I18nProvider';
import { formatDate } from '../../lib/format';

const projects = [
  { id: '1', name: 'Plot 14 — Foundation', completion: 62, due: '2026-06-15', team: 5 },
  { id: '2', name: 'Riverside Mall — Interior', completion: 28, due: '2026-08-02', team: 9 },
  { id: '3', name: 'Tower B — Roofing', completion: 91, due: '2026-05-12', team: 3 },
];

export function OwnerDashboard() {
  const t = useT();
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="eyebrow">{t('roles.owner')}</span>
          <h1 className="mt-1 text-2xl font-bold text-fg">{t('dashboard.titleOwner')}</h1>
        </div>
        <Link to="/projects">
          <Button leftIcon={<IPlus className="h-3.5 w-3.5" />}>{t('projects.new')}</Button>
        </Link>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t('dashboard.kpiActiveProjects')}
          value={projects.length}
          tone="brand"
          icon={<IFolder className="h-4 w-4" />}
        />
        <StatCard
          label={t('dashboard.kpiOpenTasks')}
          value={48}
          tone="info"
          icon={<ICheck className="h-4 w-4" />}
        />
        <StatCard
          label={t('dashboard.kpiOverdue')}
          value={4}
          tone="danger"
          icon={<IActivity className="h-4 w-4" />}
        />
        <StatCard
          label="Ekip"
          value={17}
          hint="3 onay bekleyen davet"
          tone="success"
          icon={<IUsers className="h-4 w-4" />}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title={t('dashboard.recentProjects')} subtitle="Tamamlanma oranları" />
          <CardBody className="px-0 py-0">
            <ul className="divide-y divide-border">
              {projects.map((p) => (
                <li key={p.id} className="flex items-center gap-4 px-5 py-4">
                  <span className="grid h-9 w-9 flex-none place-items-center rounded-lg bg-brand/10 text-brand">
                    <IFolder className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-fg">{p.name}</p>
                    <p className="text-xs text-muted">
                      {t('projects.deadline')}: {formatDate(p.due)} · {p.team} {t('projects.teamSize')}
                    </p>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-3">
                      <div
                        className="h-full rounded-full bg-brand"
                        style={{ width: `${p.completion}%` }}
                      />
                    </div>
                  </div>
                  <Badge tone={p.completion > 80 ? 'success' : 'brand'}>%{p.completion}</Badge>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title={t('dashboard.activityFeed')} subtitle={t('common.seeAll')} />
          <CardBody className="space-y-3">
            {[
              ['Ayşe', 'Plot 14 — yeni yorum'],
              ['Mehmet', 'Tower B — Görev tamamlandı'],
              ['Demo Owner', 'Riverside Mall — yeni üye'],
            ].map(([who, what]) => (
              <div key={what} className="flex items-start gap-3">
                <Avatar name={who} size="sm" />
                <div className="text-sm">
                  <span className="font-medium text-fg">{who}</span>{' '}
                  <span className="text-muted">{what}</span>
                </div>
              </div>
            ))}
          </CardBody>
        </Card>
      </section>
    </div>
  );
}
