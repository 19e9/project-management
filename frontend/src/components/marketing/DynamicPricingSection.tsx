import { useState } from 'react';
import { Link } from 'react-router-dom';
import { IconBolt, IconCheck } from '../ui/Icons';
import { type PublicPricingPlan, usePublicPricingPlans } from '../../features/pricing/publicPricing';
import { useI18n, useT } from '../../i18n/I18nProvider';
import type { TFunction } from '../../i18n/I18nProvider';

type Cycle = 'monthly' | 'annual';

const FAQ_KEYS = [
  { q: 'pricing.faq1q', a: 'pricing.faq1a' },
  { q: 'pricing.faq2q', a: 'pricing.faq2a' },
  { q: 'pricing.faq3q', a: 'pricing.faq3a' },
  { q: 'pricing.faq4q', a: 'pricing.faq4a' },
] as const;

/**
 * Landing-only pricing: renders `/public/pricing-plans` (subscription_plan docs).
 * Admin billing mutations invalidate this query — avoid duplicate `/pricing` routes.
 */
export function DynamicPricingSection() {
  const t = useT();
  const pricing = usePublicPricingPlans();
  const [cycle, setCycle] = useState<Cycle>('monthly');

  const plans = pricing.data?.plans ?? [];
  const maxDisc = pricing.data?.maxAnnualDiscountPercent ?? 0;

  return (
    <div id="pricing" className="scroll-mt-24">
      <section className="relative overflow-hidden section bg-ink-50/40">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-radial-fade opacity-60" aria-hidden />
        <div className="container relative">
          <div className="mx-auto max-w-2xl text-center">
            <span className="eyebrow">{t('pricing.sectionEyebrow')}</span>
            <h2 className="h-display mt-4 text-balance text-3xl md:text-5xl">{t('pricing.sectionTitle')}</h2>
            <p className="mx-auto mt-4 max-w-xl text-pretty text-ink-600">{t('pricing.sectionIntro')}</p>
          </div>

          <div className="mt-8 flex justify-center">
            <CycleToggle cycle={cycle} setCycle={setCycle} annualBadgePct={maxDisc} />
          </div>

          {pricing.isError && (
            <div
              className="mx-auto mt-8 max-w-lg rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-center text-sm text-rose-800"
              role="alert"
            >
              {t('pricing.loadError')}
              <button
                type="button"
                className="ml-2 font-semibold text-brand-700 underline"
                onClick={() => void pricing.refetch()}
              >
                {t('common.retry')}
              </button>
            </div>
          )}

          <div className="mt-10 grid grid-cols-1 gap-6 md:[grid-template-columns:repeat(auto-fit,minmax(260px,1fr))]">
            {pricing.isLoading &&
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="card h-[380px] p-6">
                  <div className="skeleton mb-4 h-6 w-1/3" />
                  <div className="skeleton mb-2 h-4 w-full" />
                  <div className="skeleton mb-6 h-10 w-2/3" />
                  <div className="space-y-2">
                    <div className="skeleton h-4 w-full" />
                    <div className="skeleton h-4 w-full" />
                    <div className="skeleton h-4 w-5/6" />
                  </div>
                  <div className="skeleton mt-8 h-10 w-full rounded-xl" />
                </div>
              ))}
            {!pricing.isLoading &&
              [...plans].sort((a, b) => a.sortOrder - b.sortOrder).map((p) => (
                <PricingPlanCard key={p.id} plan={p} cycle={cycle} />
              ))}
            {!pricing.isLoading && plans.length === 0 && !pricing.isError && (
              <p className="col-span-full text-center text-sm text-ink-600">{t('pricing.emptyPlans')}</p>
            )}
          </div>

          <p className="mt-8 text-center text-xs text-ink-500">
            {t('pricing.pricesIn')} {pricing.data?.currency ?? 'USD'}.
            {maxDisc > 0 ? t('pricing.annualSave', { pct: maxDisc }) : ''} {t('pricing.footerNoteNeedCustom')}{' '}
            <a href="mailto:sales@example.com" className="text-brand-700 hover:underline">
              {t('pricing.talkToSales')}
            </a>
            .
          </p>
        </div>
      </section>

      <section className="section bg-white">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <span className="eyebrow">{t('pricing.compareEyebrow')}</span>
            <h3 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">{t('pricing.compareHeading')}</h3>
          </div>

          <div className="mt-10 overflow-x-auto rounded-2xl border border-ink-200 bg-white shadow-soft">
            <CompareTable plans={plans} loading={pricing.isLoading} />
          </div>
        </div>
      </section>

      <section className="section bg-ink-50/40">
        <div className="container max-w-3xl">
          <div className="text-center">
            <span className="eyebrow">{t('pricing.faqEyebrow')}</span>
            <h3 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">{t('pricing.faqHeading')}</h3>
          </div>
          <div className="mt-10 divide-y divide-ink-200 rounded-2xl border border-ink-200 bg-white">
            {FAQ_KEYS.map((f, i) => (
              <details
                key={f.q}
                className="group p-5 [&_summary::-webkit-details-marker]:hidden"
                open={i === 0}
              >
                <summary className="flex cursor-pointer items-center justify-between gap-4">
                  <span className="font-medium text-ink-900">{t(f.q)}</span>
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-ink-100 text-ink-700 transition group-open:rotate-45">
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                    </svg>
                  </span>
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-ink-600">{t(f.a)}</p>
              </details>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link to="/register" className="btn-brand btn-lg">
              {t('pricingUi.faqCta')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function CycleToggle({
  cycle,
  setCycle,
  annualBadgePct,
}: {
  cycle: Cycle;
  setCycle: (c: Cycle) => void;
  annualBadgePct: number;
}) {
  const t = useT();
  return (
    <div className="inline-flex items-center rounded-full border border-ink-200 bg-white p-1 shadow-soft">
      {(['monthly', 'annual'] as Cycle[]).map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => setCycle(c)}
          className={`relative rounded-full px-4 py-1.5 text-sm font-medium transition ${
            cycle === c ? 'bg-ink-900 text-white shadow-soft' : 'text-ink-600 hover:text-ink-900'
          }`}
        >
          {c === 'monthly' ? t('common.monthly') : t('common.annual')}
          {c === 'annual' && cycle !== 'annual' && annualBadgePct > 0 && (
            <span className="ml-1 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
              {t('pricingUi.trialBanner', { pct: annualBadgePct })}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

function PricingPlanCard({ plan, cycle }: { plan: PublicPricingPlan; cycle: Cycle }) {
  const t = useT();
  const isHi = plan.isHighlighted;
  const { pricing } = plan;

  let primaryPrice = '';
  let period = '';

  if (pricing.model === 'custom') {
    primaryPrice = pricing.customLabel ?? t('pricingDyn.customPrice');
    period = '';
  } else if (pricing.model === 'free') {
    primaryPrice = t('pricingDyn.freePrice');
    period = t('common.forever');
  } else if (cycle === 'monthly') {
    primaryPrice = `$${pricing.seatPriceMonthlyUsd}`;
    period = t('pricing.periodPerUserMo');
  } else {
    primaryPrice = `$${pricing.seatPriceEffectiveMonthlyAnnualUsd}`;
    period = t('pricing.periodAnnual');
  }

  const href = plan.cta.href;
  const isInternal = href.startsWith('/') && !href.startsWith('//');

  return (
    <div
      className={`relative flex flex-col rounded-2xl p-6 transition ${
        isHi
          ? 'border-2 border-brand-600 bg-white shadow-[0_30px_60px_-30px_rgba(79,70,229,0.45)]'
          : 'card card-hover'
      }`}
    >
      {isHi && (
        <span className="absolute -top-3 left-6 inline-flex items-center gap-1 rounded-full bg-brand-gradient px-3 py-1 text-xs font-semibold text-white shadow-lift">
          <IconBolt className="h-3.5 w-3.5" />
          {t('common.featured')}
        </span>
      )}
      <h3 className="text-lg font-semibold tracking-tight">{plan.displayName}</h3>
      <p className="mt-1 text-sm text-ink-600">{plan.marketingDescription}</p>
      {pricing.model === 'per_seat' && cycle === 'annual' && pricing.annualDiscountPercent > 0 && (
        <span className="mt-2 inline-flex w-fit rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-medium text-sky-800 ring-1 ring-sky-100">
          {t('pricing.saveAnnually', { pct: pricing.annualDiscountPercent })}
        </span>
      )}
      <div className="mt-5 flex flex-wrap items-baseline gap-2">
        <span className="text-4xl font-bold tracking-tight">{primaryPrice}</span>
        {period ? (
          <span className="text-sm text-ink-500">
            {t('pricingUi.slashPer')} {period}
          </span>
        ) : null}
      </div>
      <ul className="mt-6 space-y-2.5 text-sm text-ink-700">
        {plan.bullets.map((f) => (
          <li key={f} className="flex items-start gap-2.5">
            <span className="mt-0.5 grid h-5 w-5 flex-none place-items-center rounded-full bg-brand-50 text-brand-700">
              <IconCheck className="h-3.5 w-3.5" />
            </span>
            {f}
          </li>
        ))}
      </ul>
      {isInternal ? (
        <Link to={href} className={`${isHi ? 'btn-brand' : 'btn-secondary'} mt-7 flex w-full justify-center`}>
          {plan.cta.label}
        </Link>
      ) : (
        <a href={href} className={`${isHi ? 'btn-brand' : 'btn-secondary'} mt-7 flex w-full justify-center`}>
          {plan.cta.label}
        </a>
      )}
    </div>
  );
}

function CompareTable({ plans, loading }: { plans: PublicPricingPlan[]; loading: boolean }) {
  const t = useT();
  const { locale } = useI18n();
  const numberLoc = locale === 'tr' ? 'tr-TR' : 'en-US';

  const defs = [
    { labelKey: 'pricing.membersCap' as const, type: 'members' as const },
    { labelKey: 'pricing.projectsCap' as const, type: 'projects' as const },
    { labelKey: 'pricing.storage' as const, type: 'storage' as const },
    { labelKey: 'pricing.gantt' as const, type: 'gantt' as const },
    { labelKey: 'pricing.cpm' as const, type: 'cpm' as const },
    { labelKey: 'pricing.audit' as const, type: 'auditLog' as const },
  ];

  function cell(plan: PublicPricingPlan, type: (typeof defs)[number]['type']) {
    if (type === 'members') {
      const n = plan.limits.maxMembers;
      return n >= 100_000 ? t('common.unlimited') : n.toLocaleString(numberLoc);
    }
    if (type === 'projects') {
      const n = plan.limits.maxProjects;
      return n >= 100_000 ? t('common.unlimited') : n.toLocaleString(numberLoc);
    }
    if (type === 'storage') return formatStorage(t, numberLoc, plan.limits.storageMb);
    if (type === 'gantt') return plan.features.gantt;
    if (type === 'cpm') return plan.features.cpm;
    return plan.features.auditLog;
  }

  const sorted = [...plans].sort((a, b) => a.sortOrder - b.sortOrder);

  if (loading) {
    return (
      <div className="p-8">
        <div className="skeleton mx-auto h-40 w-full max-w-4xl" />
      </div>
    );
  }

  if (sorted.length === 0) {
    return <div className="p-8 text-center text-sm text-ink-500">{t('pricing.compareEmpty')}</div>;
  }

  return (
    <table className="w-full min-w-[640px] text-left text-sm">
      <thead className="bg-ink-50/70 text-xs uppercase tracking-wider text-ink-500">
        <tr>
          <th className="px-5 py-3 font-semibold">{t('pricingUi.tableFeatureColumn')}</th>
          {sorted.map((p) => (
            <th key={p.id} className={`px-5 py-3 font-semibold ${p.isHighlighted ? 'text-brand-700' : ''}`}>
              {p.displayName}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {defs.map((row) => (
          <tr key={row.labelKey} className="border-t border-ink-200">
            <td className="px-5 py-3 font-medium text-ink-800">{t(row.labelKey)}</td>
            {sorted.map((p) => {
              const v = cell(p, row.type);
              return (
                <td key={p.id} className={`px-5 py-3 ${p.isHighlighted ? 'bg-brand-50/40' : ''}`}>
                  {typeof v === 'boolean' ? <CompareBoolCell value={v} /> : v}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function CompareBoolCell({ value }: { value: boolean }) {
  const t = useT();
  return value ? (
    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
      <IconCheck className="h-3.5 w-3.5" />
    </span>
  ) : (
    <span className="text-ink-300">{t('common.none')}</span>
  );
}

function formatStorage(t: TFunction, numberLoc: string, mb: number) {
  if (mb >= 1_048_576) return `${Math.round(mb / 1_048_576)} ${t('pricing.tb')}`;
  if (mb >= 1024) return `${Math.round(mb / 1024)} ${t('pricing.gb')}`;
  return `${mb.toLocaleString(numberLoc)} ${t('pricing.mb')}`;
}
