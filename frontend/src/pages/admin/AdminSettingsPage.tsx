import { useAdminPlatformSettings } from '../../features/admin/hooks';

function fmtTtl(sec: number): string {
  if (sec < 120) return `${sec}s`;
  if (sec < 7200) return `${Math.round(sec / 60)} min`;
  if (sec < 172_800) return `${Math.round(sec / 3600)} h`;
  return `${Math.round(sec / 86_400)} d`;
}

const moneyUsd = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

function SettingRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-b border-ink-100 py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <span className="text-sm text-ink-500">{label}</span>
      <div className="min-w-0 text-sm font-medium text-ink-900 sm:text-right">{children}</div>
    </div>
  );
}

function Section({
  title,
  description,
  children,
  className = '',
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`card overflow-hidden ${className}`}>
      <header className="border-b border-ink-200 bg-ink-50/30 px-5 py-4">
        <h2 className="text-base font-semibold text-ink-900">{title}</h2>
        {description && <p className="mt-0.5 text-xs text-ink-500">{description}</p>}
      </header>
      <div className="px-5 py-1">{children}</div>
    </section>
  );
}

function BoolBadge({ value, invert }: { value: boolean; invert?: boolean }) {
  const on = invert ? !value : value;
  return on ? (
    <span className="badge bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-100">On</span>
  ) : (
    <span className="badge bg-ink-100 text-ink-600 ring-1 ring-inset ring-ink-200">Off</span>
  );
}

export default function AdminSettingsPage() {
  const q = useAdminPlatformSettings();
  const s = q.data;

  return (
    <div className="mx-auto max-w-[1200px] space-y-6 px-4 pb-10 sm:px-6">
      <header className="pt-2">
        <p className="eyebrow text-brand-600">Platform administration</p>
        <h1 className="h-display text-2xl text-ink-900">Platform settings</h1>
        <p className="mt-1 max-w-3xl text-sm text-ink-500">
          Operasyonel yapılandırma özeti: ürün adı, erişim politikaları, HTTP katmanı, veri envanteri
          ve plan varsayılanları. Hassas değerler asla API üzerinden dönmez; değişiklikler ortam
          değişkenleri ve yeniden başlatma ile yapılır.
        </p>
      </header>

      {q.isError && (
        <div
          className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
          role="alert"
        >
          {q.error instanceof Error ? q.error.message : 'Could not load settings.'}
        </div>
      )}

      {q.isLoading && (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card h-44 p-5">
              <div className="skeleton mb-3 h-5 w-40" />
              <div className="skeleton h-4 w-full" />
              <div className="skeleton mt-2 h-4 w-2/3" />
            </div>
          ))}
        </div>
      )}

      {s && (
        <>
          <div className="grid gap-6 lg:grid-cols-2">
            <Section title="Runtime" description="API sürecinin ortam bilgisi.">
              <SettingRow label="NODE_ENV">
                <span className="rounded-lg bg-ink-100 px-2 py-0.5 font-mono text-xs">{s.environment}</span>
              </SettingRow>
              <SettingRow label="Snapshot time">{new Date(s.generatedAt).toLocaleString()}</SettingRow>
            </Section>

            <Section title="Sürüm" description="APP_VERSION ortam değişkeni (isteğe bağlı).">
              <SettingRow label="Build / sürüm etiketi">
                <span className="font-mono text-xs">{s.release.version}</span>
              </SettingRow>
            </Section>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Section
              title="Ürün ve politika"
              description="Kullanıcıya yansıyan isimler ve kontrollü kayıt davranışı."
            >
              <SettingRow label="Platform görünen adı">{s.product.displayName}</SettingRow>
              <SettingRow label="Destek e-postası">
                {s.product.supportEmail ? (
                  <a className="text-brand-700 hover:underline" href={`mailto:${s.product.supportEmail}`}>
                    {s.product.supportEmail}
                  </a>
                ) : (
                  <span className="font-normal text-ink-400">—</span>
                )}
              </SettingRow>
              <SettingRow label="Açık kayıt (local)">
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <BoolBadge value={s.product.openRegistration} />
                  <span className="text-xs font-normal text-ink-500">OPEN_REGISTRATION</span>
                </div>
              </SettingRow>
              <SettingRow label="Bakım modu (yeni kayıt)">
                <div className="flex flex-wrap items-center justify-end gap-2">
                  {s.product.maintenanceMode ? (
                    <span className="badge bg-amber-50 text-amber-900 ring-1 ring-inset ring-amber-200">
                      Aktif — kayıt durduruldu
                    </span>
                  ) : (
                    <span className="badge bg-ink-100 text-ink-600 ring-1 ring-inset ring-ink-200">Kapalı</span>
                  )}
                  <span className="text-xs font-normal text-ink-500">MAINTENANCE_MODE</span>
                </div>
              </SettingRow>
              <SettingRow label="Yeni workspace varsayılan planı">
                <span className="capitalize">{s.product.defaultNewWorkspacePlan}</span>
                <span className="mt-1 block text-xs font-normal text-ink-500">
                  DEFAULT_NEW_WORKSPACE_PLAN
                </span>
              </SettingRow>
              <SettingRow label="Pro koltuk list fiyatı (MRR modeli)">
                {moneyUsd(s.product.billingProSeatUsdMonthly)}
                <span className="mt-1 block text-xs font-normal text-ink-500">
                  BILLING_PRO_SEAT_USD_MONTHLY
                </span>
              </SettingRow>
            </Section>

            <Section title="Veri envanteri" description="Bu veritabanındaki toplam kayıtlar (anlık).">
              <SettingRow label="Kullanıcılar">{s.inventory.users.toLocaleString()}</SettingRow>
              <SettingRow label="Workspace’ler">{s.inventory.workspaces.toLocaleString()}</SettingRow>
              <SettingRow label="Projeler">{s.inventory.projects.toLocaleString()}</SettingRow>
              <SettingRow label="Görevler">{s.inventory.tasks.toLocaleString()}</SettingRow>
              <SettingRow label="Platform admin kullanıcıları">
                {s.inventory.platformAdmins.toLocaleString()}
              </SettingRow>
            </Section>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Section title="HTTP API" description="Dinleyici, CORS ve genel önek.">
              <SettingRow label="Port">{s.api.port}</SettingRow>
              <SettingRow label="Public API tabanı">
                <span className="break-all font-mono text-xs font-normal text-ink-800">
                  {s.api.publicBaseUrl}
                </span>
                <span className="mt-1 block text-xs font-normal text-ink-500">API_PUBLIC_BASE_URL veya PORT</span>
              </SettingRow>
              <SettingRow label="Global prefix">
                <code className="rounded bg-ink-100 px-1.5 py-0.5 font-mono text-xs">{s.api.globalPrefix}</code>
              </SettingRow>
              <SettingRow label="Swagger UI yolu">
                <span className="font-mono text-xs">
                  /{s.api.swaggerPath}
                </span>
              </SettingRow>
              <SettingRow label="CORS origin’ler">
                <ul className="space-y-1 text-right">
                  {s.api.corsOrigins.map((o) => (
                    <li key={o} className="break-all font-mono text-xs text-ink-800">
                      {o}
                    </li>
                  ))}
                </ul>
              </SettingRow>
              <SettingRow label="Global rate limit">
                {s.rateLimit.maxRequests} istek / {s.rateLimit.windowMs / 1000}s (Throttler)
              </SettingRow>
            </Section>

            <Section title="Güvenlik katmanı" description="Bootstrap’ta etkin middleware ve pipe davranışı.">
              <SettingRow label="Helmet middleware">
                <BoolBadge value={s.httpSecurity.helmetContentSecurityPolicy} />
              </SettingRow>
              <SettingRow label="CORS credentials">
                <BoolBadge value={s.httpSecurity.corsCredentialsEnabled} />
              </SettingRow>
              <SettingRow label="ValidationPipe · transform">
                <BoolBadge value={s.validation.transformEnabled} />
              </SettingRow>
              <SettingRow label="ValidationPipe · whitelist (strip)">
                <BoolBadge value={s.validation.stripUnknownFields} />
              </SettingRow>
              <SettingRow label="ValidationPipe · forbid unknown body">
                <BoolBadge value={s.validation.forbidNonWhitelistedBody} />
              </SettingRow>
            </Section>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Section title="Kimlik doğrulama" description="JWT süreleri ve Google OAuth.">
              <SettingRow label="Access token TTL">{fmtTtl(s.auth.accessTokenTtlSeconds)}</SettingRow>
              <SettingRow label="Refresh token TTL">{fmtTtl(s.auth.refreshTokenTtlSeconds)}</SettingRow>
              <SettingRow label="Google OAuth">
                {s.auth.googleOAuthConfigured ? (
                  <span className="badge bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-100">
                    Yapılandırılmış
                  </span>
                ) : (
                  <span className="badge bg-ink-100 text-ink-600 ring-1 ring-inset ring-ink-200">
                    Kapalı / placeholder
                  </span>
                )}
              </SettingRow>
              <SettingRow label="Google callback URL">
                <span className="break-all font-mono text-xs font-normal text-ink-700">
                  {s.auth.googleCallbackUrl || '—'}
                </span>
              </SettingRow>
            </Section>

            <Section title="Veritabanı" description="Mongoose bağlantı özeti (URI gösterilmez).">
              <SettingRow label="Durum">
                {s.database.connected ? (
                  <span className="badge bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-100">
                    Bağlı
                  </span>
                ) : (
                  <span className="badge bg-rose-50 text-rose-800 ring-1 ring-inset ring-rose-100">
                    Bağlı değil (readyState {s.database.readyState})
                  </span>
                )}
              </SettingRow>
              <SettingRow label="Host özeti">
                <span className="break-all font-mono text-xs font-normal text-ink-800">
                  {s.database.mongoHostSummary}
                </span>
              </SettingRow>
            </Section>
          </div>

          <Section
            title="Varsayılan plan hakları"
            description="Her plan katmanı için kodda tanımlı üst limitler ve özellik bayrakları."
            className="lg:col-span-2"
          >
            <div className="overflow-x-auto py-2">
              <table className="w-full text-left text-sm">
                <thead className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                  <tr>
                    <th className="pb-2 pr-3">Plan</th>
                    <th className="pb-2 pr-3">Üye</th>
                    <th className="pb-2 pr-3">Proje</th>
                    <th className="pb-2 pr-3">Gantt</th>
                    <th className="pb-2 pr-3">CPM</th>
                    <th className="pb-2">Denetim</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {s.planDefaults.map((p) => (
                    <tr key={p.plan}>
                      <td className="py-2.5 pr-3 capitalize">
                        <span className="font-medium text-ink-900">{p.plan}</span>
                      </td>
                      <td className="py-2.5 pr-3 tabular-nums text-ink-700">{p.maxMembers}</td>
                      <td className="py-2.5 pr-3 tabular-nums text-ink-700">{p.maxProjects}</td>
                      <td className="py-2.5 pr-3 text-ink-700">{p.ganttEnabled ? 'Evet' : '—'}</td>
                      <td className="py-2.5 pr-3 text-ink-700">{p.cpmEnabled ? 'Evet' : '—'}</td>
                      <td className="py-2.5 text-ink-700">{p.auditLogEnabled ? 'Evet' : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <section className="rounded-xl border border-ink-200 bg-ink-50/50 px-5 py-4">
            <h3 className="text-sm font-semibold text-ink-800">Operatör notları</h3>
            <ul className="mt-2 list-inside list-disc space-y-1.5 text-xs text-ink-600">
              {s.notes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
