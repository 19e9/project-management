import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useT } from '../../i18n/I18nProvider';

const projects = [
  { id: '1', name: 'Plot 14 — Foundation', completion: 62, status: 'on-track' as const },
  { id: '2', name: 'Riverside Mall — Interior', completion: 28, status: 'at-risk' as const },
];

export function ClientDashboard() {
  const t = useT();
  return (
    <div className="space-y-6">
      <header>
        <span className="eyebrow">{t('roles.client')}</span>
        <h1 className="mt-1 text-2xl font-bold text-fg">{t('dashboard.titleClient')}</h1>
        <p className="mt-1 text-sm text-muted">{t('dashboard.readOnlyClientNotice')}</p>
      </header>

      <Card>
        <CardHeader title={t('dashboard.recentProjects')} />
        <CardBody className="px-0 py-0">
          <ul className="divide-y divide-border">
            {projects.map((p) => (
              <li key={p.id} className="flex items-center gap-4 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-fg">{p.name}</p>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-3">
                    <div
                      className={p.status === 'at-risk' ? 'h-full bg-warning' : 'h-full bg-brand'}
                      style={{ width: `${p.completion}%` }}
                    />
                  </div>
                </div>
                <Badge tone={p.status === 'at-risk' ? 'warning' : 'success'}>%{p.completion}</Badge>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}
