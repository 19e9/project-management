import { StatCard } from '../../components/dashboard/StatCard';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { useT } from '../../i18n/I18nProvider';
import { IBox, ICreditCard, IUsers, IInsights } from '../../components/layout/icons';
import { formatNumber } from '../../lib/format';

const mockUsers = 1248;
const mockWs = 86;
const mockProjects = 312;
const mockMrr = 4_820;

export function AdminDashboard() {
  const t = useT();
  return (
    <div className="space-y-6">
      <header>
        <span className="eyebrow">{t('nav.admin')}</span>
        <h1 className="mt-1 text-2xl font-bold text-fg">{t('dashboard.titleAdmin')}</h1>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t('dashboard.kpiUsers')}
          value={formatNumber(mockUsers)}
          delta={12.4}
          tone="info"
          icon={<IUsers className="h-4 w-4" />}
        />
        <StatCard
          label={t('dashboard.kpiWorkspaces')}
          value={formatNumber(mockWs)}
          delta={6.1}
          tone="brand"
          icon={<IBox className="h-4 w-4" />}
        />
        <StatCard
          label={t('dashboard.kpiActiveProjects')}
          value={formatNumber(mockProjects)}
          delta={9.2}
          tone="success"
          icon={<IInsights className="h-4 w-4" />}
        />
        <StatCard
          label="MRR"
          value={`$${formatNumber(mockMrr)}`}
          delta={4.7}
          tone="warning"
          icon={<ICreditCard className="h-4 w-4" />}
        />
      </section>

      <Card>
        <CardHeader title="Aktivite zaman çizgisi" subtitle="Son 24 saat" />
        <CardBody>
          <ul className="divide-y divide-border">
            {[
              { who: 'Ayşe Y.', what: '3 yeni iş paketi oluşturdu', when: '2sa önce' },
              { who: 'Mehmet K.', what: 'Workspace planını Pro yaptı', when: '4sa önce' },
              { who: 'Demo Owner', what: '2 üye davet etti', when: '8sa önce' },
            ].map((row) => (
              <li key={row.what} className="flex items-center justify-between py-3 text-sm">
                <span>
                  <span className="font-medium text-fg">{row.who}</span>{' '}
                  <span className="text-muted">{row.what}</span>
                </span>
                <span className="text-xs text-muted">{row.when}</span>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}
