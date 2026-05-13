import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { MarketingPageShell } from '../components/marketing/MarketingPageShell';
import { DynamicPricingSection } from '../components/marketing/DynamicPricingSection';
import { HeroMockup } from '../components/marketing/HeroMockup';
import {
  IconArrowRight,
  IconChart,
  IconCheck,
  IconGantt,
  IconLayers,
  IconRoute,
  IconShield,
  IconStar,
  IconTree,
  IconUsers,
} from '../components/ui/Icons';
import { useT } from '../i18n/I18nProvider';

export default function LandingPage() {
  return (
    <MarketingPageShell>
      <Hero />
      <LogoCloud />
      <Features />
      <HowItWorks />
      <DeepFeatures />
      <DynamicPricingSection />
      <SocialProof />
      <FinalCta />
    </MarketingPageShell>
  );
}

function Hero() {
  const t = useT();
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-radial-fade" aria-hidden />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[640px] opacity-[0.35]"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(15,23,42,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(15,23,42,0.06) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          maskImage:
            'radial-gradient(ellipse 70% 60% at 50% 0%, black 50%, transparent 80%)',
        }}
        aria-hidden
      />

      <div className="container relative pb-12 pt-14 md:pb-20 md:pt-20">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="h-display mt-6 text-balance animate-fade-in-up [animation-delay:80ms]">
            {t('marketing.heroTitle1')}
            <br />
            <span className="gradient-text">{t('marketing.heroSubtitle')}</span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-pretty text-lg leading-relaxed text-ink-600 animate-fade-in-up [animation-delay:160ms]">
            {t('marketing.heroBody')}
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-3 animate-fade-in-up [animation-delay:240ms]">
            <Link to="/register" className="btn-brand btn-lg">
              {t('marketing.startFree')}
              <IconArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/#pricing" className="btn-secondary btn-lg">
              {t('marketing.seePricing')}
            </Link>
          </div>

          <p className="mt-3 text-xs text-ink-500 animate-fade-in-up [animation-delay:320ms]">
            {t('marketing.heroFootnote')}
          </p>
        </div>

        <div className="relative mx-auto mt-14 max-w-6xl animate-fade-in-up [animation-delay:400ms]">
          <HeroMockup />
        </div>
      </div>
    </section>
  );
}

function LogoCloud() {
  const t = useT();
  const brands: { name: string; href: string }[] = [
    { name: 'Slope', href: 'https://slope.so' },
    { name: 'Relay', href: 'https://relay.app' },
    { name: 'Harbor', href: 'https://harbor.build' },
    { name: 'Beacon', href: 'https://beacon.team' },
    { name: 'Stride', href: 'https://stride.work' },
    { name: 'Catalyst', href: 'https://catalyst.io' },
  ];
  return (
    <section className="border-y border-ink-200/70 bg-ink-50/40 py-10">
      <div className="container">
        <p className="text-center text-xs font-semibold uppercase tracking-widest text-ink-500">
          {t('marketing.logoCloud')}
        </p>
        <div className="mt-6 grid grid-cols-2 items-center gap-x-10 gap-y-6 sm:grid-cols-3 md:grid-cols-6">
          {brands.map(({ name, href }) => (
            <a
              key={name}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center text-base font-semibold tracking-tight text-ink-400 transition hover:text-ink-700 hover:underline underline-offset-2"
            >
              <span className="mr-2 inline-block h-2 w-2 rounded-full bg-current opacity-60" />
              {name}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

const FEATURE_ICONS = [
  { icon: IconGantt, titleKey: 'marketing.featureGanttTitle', bodyKey: 'marketing.featureGanttBody', color: 'from-brand-500/15 to-brand-500/0 text-brand-700' },
  { icon: IconRoute, titleKey: 'marketing.featureCpmTitle', bodyKey: 'marketing.featureCpmBody', color: 'from-rose-500/15 to-rose-500/0 text-rose-700' },
  { icon: IconTree, titleKey: 'marketing.featureWbsTitle', bodyKey: 'marketing.featureWbsBody', color: 'from-accent-500/15 to-accent-500/0 text-accent-700' },
  { icon: IconUsers, titleKey: 'marketing.featureResTitle', bodyKey: 'marketing.featureResBody', color: 'from-violet-500/15 to-violet-500/0 text-violet-700' },
  { icon: IconChart, titleKey: 'marketing.featureAnalyticsTitle', bodyKey: 'marketing.featureAnalyticsBody', color: 'from-emerald-500/15 to-emerald-500/0 text-emerald-700' },
  { icon: IconShield, titleKey: 'marketing.featureMultiTenantTitle', bodyKey: 'marketing.featureMultiTenantBody', color: 'from-amber-500/15 to-amber-500/0 text-amber-700' },
] as const;

function Features() {
  const t = useT();
  return (
    <section id="features" className="section">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <span className="eyebrow">{t('marketing.featuresEyebrow')}</span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-5xl">
            {t('marketing.featuresHeading1')}
            <br />
            <span className="text-ink-500">{t('marketing.featuresHeading2')}</span>
          </h2>
          <p className="mt-4 text-pretty text-ink-600">{t('marketing.featuresIntro')}</p>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {FEATURE_ICONS.map(({ icon: Icon, titleKey, bodyKey, color }) => (
            <article key={titleKey} className="card card-hover group relative overflow-hidden p-6">
              <div
                className={`absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gradient-to-br ${color} blur-2xl transition duration-500 group-hover:scale-110`}
                aria-hidden
              />
              <div className="relative">
                <div
                  className={`inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-soft ring-1 ring-ink-200 ${color
                    .split(' ')
                    .pop()}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-lg font-semibold tracking-tight">{t(titleKey)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-600">{t(bodyKey)}</p>
                <div className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-ink-700 opacity-0 transition group-hover:opacity-100">
                  {t('marketing.featuresCardCta')}
                  <IconArrowRight className="h-3.5 w-3.5" />
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const t = useT();
  const steps = [
    { n: '01', titleKey: 'marketing.step1Title', bodyKey: 'marketing.step1Body' },
    { n: '02', titleKey: 'marketing.step2Title', bodyKey: 'marketing.step2Body' },
    { n: '03', titleKey: 'marketing.step3Title', bodyKey: 'marketing.step3Body' },
    { n: '04', titleKey: 'marketing.step4Title', bodyKey: 'marketing.step4Body' },
  ] as const;

  return (
    <section id="how" className="relative section bg-ink-50/40">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-ink-300 to-transparent"
        aria-hidden
      />
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <span className="eyebrow">{t('marketing.hiwEyebrow')}</span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-5xl">{t('marketing.hiwHeading')}</h2>
          <p className="mt-4 text-ink-600">{t('marketing.hiwIntro')}</p>
        </div>

        <ol className="relative mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div
            className="pointer-events-none absolute left-0 right-0 top-9 hidden h-px bg-gradient-to-r from-transparent via-brand-300 to-transparent lg:block"
            aria-hidden
          />
          {steps.map((s, i) => (
            <li key={s.n} className="relative card p-6" style={{ animationDelay: `${i * 80}ms` }}>
              <div className="flex items-center justify-between">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-gradient text-xs font-bold text-white shadow-lift">
                  {s.n}
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">
                  {t('marketing.stepBadge', { n: i + 1 })}
                </span>
              </div>
              <h3 className="mt-5 text-lg font-semibold tracking-tight">{t(s.titleKey)}</h3>
              <p className="mt-1.5 text-sm text-ink-600">{t(s.bodyKey)}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function DeepFeatures() {
  const t = useT();
  return (
    <section className="section">
      <div className="container space-y-24">
        <DeepRow
          eyebrow={t('marketing.deepCpmEyebrow')}
          title={t('marketing.deepCpmTitle')}
          body={t('marketing.deepCpmBody')}
          bullets={[t('marketing.deepCpmB1'), t('marketing.deepCpmB2'), t('marketing.deepCpmB3')]}
          visual={<CpmVisual />}
        />
        <DeepRow
          reverse
          eyebrow={t('marketing.deepResEyebrow')}
          title={t('marketing.deepResTitle')}
          body={t('marketing.deepResBody')}
          bullets={[t('marketing.deepResB1'), t('marketing.deepResB2'), t('marketing.deepResB3')]}
          visual={<HistogramVisual />}
        />
      </div>
    </section>
  );
}

function DeepRow({
  eyebrow,
  title,
  body,
  bullets,
  visual,
  reverse = false,
}: {
  eyebrow: string;
  title: string;
  body: string;
  bullets: string[];
  visual: ReactNode;
  reverse?: boolean;
}) {
  return (
    <div className={`grid items-center gap-12 lg:grid-cols-2 ${reverse ? 'lg:grid-flow-dense' : ''}`}>
      <div className={reverse ? 'lg:col-start-2' : ''}>
        <span className="eyebrow">{eyebrow}</span>
        <h3 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">{title}</h3>
        <p className="mt-4 text-ink-600">{body}</p>
        <ul className="mt-6 space-y-2.5">
          {bullets.map((b) => (
            <li key={b} className="flex items-start gap-2.5 text-sm text-ink-700">
              <span className="mt-0.5 grid h-5 w-5 flex-none place-items-center rounded-full bg-emerald-100 text-emerald-700">
                <IconCheck className="h-3.5 w-3.5" />
              </span>
              {b}
            </li>
          ))}
        </ul>
      </div>
      <div className={reverse ? 'lg:col-start-1' : ''}>
        <div className="relative">
          <div className="pointer-events-none absolute -inset-6 rounded-3xl bg-brand-500/10 blur-2xl" aria-hidden />
          <div className="relative card overflow-hidden p-4">{visual}</div>
        </div>
      </div>
    </div>
  );
}

function CpmVisual() {
  const t = useT();
  const tasks = [
    { nameKey: 'marketing.demoTaskExcavation' as const, es: 0, ef: 4, slack: 0, critical: true },
    { nameKey: 'marketing.demoTaskSlab' as const, es: 4, ef: 10, slack: 0, critical: true },
    { nameKey: 'marketing.demoTaskFraming' as const, es: 10, ef: 25, slack: 0, critical: true },
    { nameKey: 'marketing.demoTaskLogistics' as const, es: 4, ef: 8, slack: 6, critical: false },
    { nameKey: 'marketing.demoTaskPermits' as const, es: 0, ef: 3, slack: 12, critical: false },
  ];
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between text-xs text-ink-500">
        <span>{t('marketing.demoCriticalPath')}</span>
        <span className="badge bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-100">
          {t('marketingUi.cpmDemoBadge', { tasks: 5, days: 25 })}
        </span>
      </div>
      {tasks.map((row) => (
        <div
          key={row.nameKey}
          className={`flex items-center justify-between rounded-xl border px-3 py-2.5 text-sm ${
            row.critical ? 'border-rose-200 bg-rose-50/60' : 'border-ink-200 bg-white'
          }`}
        >
          <div className="flex items-center gap-3">
            <span className={`h-2 w-2 rounded-full ${row.critical ? 'bg-rose-500' : 'bg-ink-300'}`} />
            <span className="font-medium text-ink-900">{t(row.nameKey)}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-ink-500">
            <span>
              {t('marketing.esAbbr')} {row.es}d
            </span>
            <span>
              {t('marketing.efAbbr')} {row.ef}d
            </span>
            <span>
              {t('marketing.demoSlack')}{' '}
              <strong className={row.critical ? 'text-rose-600' : 'text-ink-700'}>{row.slack}d</strong>
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function HistogramVisual() {
  const t = useT();
  const bars = [40, 60, 80, 110, 95, 70, 55, 90, 105, 75];
  return (
    <div>
      <div className="flex items-center justify-between text-xs text-ink-500">
        <span>{t('marketing.demoDailyUtil')}</span>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-brand-500" />
            {t('marketing.demoBooked')}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-rose-500" />
            {t('marketing.demoOver')}
          </span>
        </div>
      </div>
      <div className="mt-3 flex h-36 items-end gap-2">
        {bars.map((v, i) => {
          const over = v > 100;
          return (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <div
                className={`w-full rounded-md ${
                  over ? 'bg-gradient-to-t from-rose-500 to-rose-400' : 'bg-gradient-to-t from-brand-600 to-brand-400'
                }`}
                style={{ height: `${Math.min(100, v)}%` }}
              />
              <span className="text-[10px] text-ink-400">{t('marketing.demoDayAxis', { n: i + 1 })}</span>
            </div>
          );
        })}
      </div>
      <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50/60 p-2.5 text-xs text-rose-700">
        {t('marketing.demoWarn')}
      </div>
    </div>
  );
}

function SocialProof() {
  const t = useT();
  return (
    <section id="proof" className="section">
      <div className="container">
        <div className="grid gap-10 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <span className="eyebrow">{t('marketing.proofEyebrow')}</span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">{t('marketing.proofHeading')}</h2>
            <p className="mt-4 text-ink-600">{t('marketing.proofBody')}</p>
            <div className="mt-6 grid grid-cols-3 gap-4">
              <KpiTile value="42%" label={t('marketing.kpi1')} />
              <KpiTile value="−4d" label={t('marketing.kpi2')} />
              <KpiTile value="98%" label={t('marketing.kpi3')} />
            </div>
          </div>

          <div className="grid gap-5 lg:col-span-2 md:grid-cols-2">
            <Testimonial quote={t('marketingUi.testimonial1Quote')} name={t('marketingUi.testimonial1Name')} role={t('marketingUi.testimonial1Role')} />
            <Testimonial quote={t('marketingUi.testimonial2Quote')} name={t('marketingUi.testimonial2Name')} role={t('marketingUi.testimonial2Role')} />
            <Testimonial quote={t('marketingUi.testimonial3Quote')} name={t('marketingUi.testimonial3Name')} role={t('marketingUi.testimonial3Role')} />
            <Testimonial quote={t('marketingUi.testimonial4Quote')} name={t('marketingUi.testimonial4Name')} role={t('marketingUi.testimonial4Role')} />
          </div>
        </div>
      </div>
    </section>
  );
}

function KpiTile({ value, label }: { value: string; label: string }) {
  return (
    <div className="card p-4">
      <div className="text-2xl font-bold tracking-tight gradient-text">{value}</div>
      <div className="mt-1 text-xs text-ink-500">{label}</div>
    </div>
  );
}

function Testimonial({ quote, name, role }: { quote: string; name: string; role: string }) {
  return (
    <figure className="card card-hover relative p-6">
      <div className="flex gap-0.5 text-amber-500">
        {Array.from({ length: 5 }).map((_, i) => (
          <IconStar key={i} />
        ))}
      </div>
      <blockquote className="mt-3 text-[15px] leading-relaxed text-ink-800">“{quote}”</blockquote>
      <figcaption className="mt-5 flex items-center gap-3">
        <span
          className="grid h-9 w-9 place-items-center rounded-full bg-brand-gradient text-xs font-semibold text-white"
          aria-hidden
        >
          {name
            .split(' ')
            .map((n) => n[0])
            .join('')}
        </span>
        <div>
          <div className="text-sm font-semibold text-ink-900">{name}</div>
          <div className="text-xs text-ink-500">{role}</div>
        </div>
      </figcaption>
    </figure>
  );
}

function FinalCta() {
  const t = useT();
  return (
    <section className="section">
      <div className="container">
        <div className="relative overflow-hidden rounded-3xl bg-ink-950 p-10 text-white md:p-16">
          <div
            className="pointer-events-none absolute inset-0 opacity-80"
            style={{
              background:
                'radial-gradient(60% 80% at 80% 20%, rgba(99,102,241,0.45), transparent 60%), radial-gradient(50% 60% at 10% 80%, rgba(6,182,212,0.4), transparent 60%)',
            }}
            aria-hidden
          />
          <div className="pointer-events-none absolute inset-0 bg-noise opacity-40" aria-hidden />
          <div className="relative grid items-center gap-8 md:grid-cols-3">
            <div className="md:col-span-2">
              <span className="eyebrow border-white/15 bg-white/5 text-white/80">
                <IconLayers className="h-3.5 w-3.5" />
                {t('marketingUi.finalBadgeWithIcon')}
              </span>
              <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-5xl">{t('marketing.finalTitle')}</h2>
              <p className="mt-4 max-w-xl text-pretty text-white/70">{t('marketing.finalBody')}</p>
            </div>
            <div className="flex flex-col gap-3 md:items-end">
              <Link
                to="/register"
                className="btn btn-lg w-full justify-center bg-white text-ink-900 hover:bg-ink-100 md:w-auto"
              >
                {t('marketing.startFree')}
                <IconArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/#pricing"
                className="btn btn-lg w-full justify-center border border-white/15 text-white hover:bg-white/10 md:w-auto"
              >
                {t('marketing.comparePlans')}
              </Link>
              <span className="text-xs text-white/50">{t('marketing.finalTrust')}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
