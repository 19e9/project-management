import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/marketing/Navbar';
import { Footer } from '../components/marketing/Footer';
import { IconBolt, IconCheck } from '../components/ui/Icons';

type Cycle = 'monthly' | 'annual';

interface Tier {
  name: string;
  description: string;
  monthly: number | 'custom';
  annual: number | 'custom';
  highlighted?: boolean;
  cta: string;
  href: string;
  features: string[];
}

const TIERS: Tier[] = [
  {
    name: 'Free',
    description: 'For solo PMs and small teams getting organized.',
    monthly: 0,
    annual: 0,
    cta: 'Start free',
    href: '/register',
    features: [
      'Up to 10 members',
      '3 active projects',
      'Tasks, dependencies, WBS',
      'Gantt chart',
      'Email support',
    ],
  },
  {
    name: 'Pro',
    description: 'For growing teams that ship under deadline pressure.',
    monthly: 12,
    annual: 9.6,
    highlighted: true,
    cta: 'Start 14-day trial',
    href: '/register',
    features: [
      'Up to 50 members',
      '50 projects',
      'Critical Path Method',
      'Resource histogram',
      'Burndown & dashboards',
      'Priority support',
    ],
  },
  {
    name: 'Enterprise',
    description: 'Compliance, scale and dedicated support.',
    monthly: 'custom',
    annual: 'custom',
    cta: 'Contact sales',
    href: 'mailto:sales@example.com',
    features: [
      'Unlimited members & projects',
      'SSO / SAML / SCIM',
      'Audit log',
      'SLA & DPA',
      'Dedicated CSM',
    ],
  },
];

const COMPARE: Array<{
  group: string;
  rows: Array<{ feature: string; free: string | boolean; pro: string | boolean; enterprise: string | boolean }>;
}> = [
  {
    group: 'Planning',
    rows: [
      { feature: 'Tasks & subtasks', free: true, pro: true, enterprise: true },
      { feature: 'Dependencies (FS, lag/lead)', free: true, pro: true, enterprise: true },
      { feature: 'Gantt chart', free: true, pro: true, enterprise: true },
      { feature: 'Critical Path Method', free: false, pro: true, enterprise: true },
      { feature: 'Resource histogram', free: false, pro: true, enterprise: true },
    ],
  },
  {
    group: 'Limits',
    rows: [
      { feature: 'Members per workspace', free: '10', pro: '50', enterprise: 'Unlimited' },
      { feature: 'Active projects', free: '3', pro: '50', enterprise: 'Unlimited' },
      { feature: 'API rate limit (req/min)', free: '60', pro: '300', enterprise: 'Custom' },
    ],
  },
  {
    group: 'Security & support',
    rows: [
      { feature: 'SSO / SAML', free: false, pro: false, enterprise: true },
      { feature: 'Audit log', free: false, pro: false, enterprise: true },
      { feature: 'SLA & DPA', free: false, pro: false, enterprise: true },
      { feature: 'Support', free: 'Email', pro: 'Priority', enterprise: 'Dedicated CSM' },
    ],
  },
];

const FAQ = [
  {
    q: 'Do I need a credit card to try Pro?',
    a: 'No. The 14-day Pro trial is free, with no card required. After the trial you can stay on Free.',
  },
  {
    q: 'How is billing handled?',
    a: 'You only pay for active members in your workspace, billed monthly or annually. Annual saves 20%.',
  },
  {
    q: 'Can I switch plans later?',
    a: 'Anytime — upgrades are instant; downgrades take effect at the next billing period.',
  },
  {
    q: 'What happens to clients (read-only viewers)?',
    a: 'Clients are free on every plan. Only active members count toward your seat total.',
  },
];

export default function PricingPage() {
  const [cycle, setCycle] = useState<Cycle>('monthly');
  return (
    <div className="bg-white">
      <Navbar />

      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-radial-fade"
          aria-hidden
        />
        <div className="container relative pb-12 pt-14 md:pb-20 md:pt-20">
          <div className="mx-auto max-w-2xl text-center">
            <span className="eyebrow">Pricing</span>
            <h1 className="h-display mt-4 text-balance">
              Pricing built for teams who actually ship.
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-pretty text-ink-600">
              Pay only for active members. Cancel anytime. No "contact us to upgrade" games.
            </p>
          </div>

          <div className="mt-8 flex justify-center">
            <CycleToggle cycle={cycle} setCycle={setCycle} />
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {TIERS.map((t) => (
              <Card key={t.name} tier={t} cycle={cycle} />
            ))}
          </div>
        </div>
      </section>

      <section className="section bg-ink-50/40">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <span className="eyebrow">Compare plans</span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">
              Every detail, side by side.
            </h2>
          </div>

          <div className="mt-10 overflow-hidden rounded-2xl border border-ink-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-ink-50/70 text-xs uppercase tracking-wider text-ink-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Feature</th>
                  <th className="px-5 py-3 font-semibold">Free</th>
                  <th className="px-5 py-3 font-semibold text-brand-700">Pro</th>
                  <th className="px-5 py-3 font-semibold">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {COMPARE.map((g) => (
                  <>
                    <tr key={g.group} className="border-t border-ink-200 bg-ink-50/40">
                      <td colSpan={4} className="px-5 py-2 text-xs font-semibold uppercase tracking-wider text-ink-500">
                        {g.group}
                      </td>
                    </tr>
                    {g.rows.map((r) => (
                      <tr key={r.feature} className="border-t border-ink-200">
                        <td className="px-5 py-3 font-medium text-ink-800">{r.feature}</td>
                        <td className="px-5 py-3"><Cell v={r.free} /></td>
                        <td className="px-5 py-3 bg-brand-50/40"><Cell v={r.pro} /></td>
                        <td className="px-5 py-3"><Cell v={r.enterprise} /></td>
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container max-w-3xl">
          <div className="text-center">
            <span className="eyebrow">FAQ</span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">
              Common questions
            </h2>
          </div>
          <div className="mt-10 divide-y divide-ink-200 rounded-2xl border border-ink-200 bg-white">
            {FAQ.map((f, i) => (
              <details
                key={f.q}
                className="group p-5 [&_summary::-webkit-details-marker]:hidden"
                open={i === 0}
              >
                <summary className="flex cursor-pointer items-center justify-between gap-4">
                  <span className="font-medium text-ink-900">{f.q}</span>
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-ink-100 text-ink-700 transition group-open:rotate-45">
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                    </svg>
                  </span>
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-ink-600">{f.a}</p>
              </details>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link to="/register" className="btn-brand btn-lg">
              Start free →
            </Link>
            <p className="mt-3 text-xs text-ink-500">
              Still have questions?{' '}
              <a href="mailto:sales@example.com" className="text-brand-700 hover:underline">
                Talk to sales
              </a>
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function CycleToggle({ cycle, setCycle }: { cycle: Cycle; setCycle: (c: Cycle) => void }) {
  return (
    <div className="inline-flex items-center rounded-full border border-ink-200 bg-white p-1 shadow-soft">
      {(['monthly', 'annual'] as Cycle[]).map((c) => (
        <button
          key={c}
          onClick={() => setCycle(c)}
          className={`relative rounded-full px-4 py-1.5 text-sm font-medium transition ${
            cycle === c
              ? 'bg-ink-900 text-white shadow-soft'
              : 'text-ink-600 hover:text-ink-900'
          }`}
        >
          {c === 'monthly' ? 'Monthly' : 'Annual'}
          {c === 'annual' && cycle !== 'annual' && (
            <span className="ml-1 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
              −20%
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

function Card({ tier, cycle }: { tier: Tier; cycle: Cycle }) {
  const isHi = !!tier.highlighted;
  const price = cycle === 'monthly' ? tier.monthly : tier.annual;
  const display = price === 'custom' ? 'Custom' : price === 0 ? '$0' : `$${price}`;
  const period =
    price === 'custom'
      ? 'volume pricing'
      : cycle === 'monthly'
        ? 'per user / month'
        : 'per user / month, billed annually';

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
          Most popular
        </span>
      )}
      <h3 className="text-lg font-semibold tracking-tight">{tier.name}</h3>
      <p className="mt-1 text-sm text-ink-600">{tier.description}</p>
      <div className="mt-5 flex items-baseline gap-2">
        <span className="text-4xl font-bold tracking-tight">{display}</span>
        <span className="text-sm text-ink-500">/ {period}</span>
      </div>
      <ul className="mt-6 space-y-2.5 text-sm text-ink-700">
        {tier.features.map((f) => (
          <li key={f} className="flex items-start gap-2.5">
            <span className="mt-0.5 grid h-5 w-5 flex-none place-items-center rounded-full bg-brand-50 text-brand-700">
              <IconCheck className="h-3.5 w-3.5" />
            </span>
            {f}
          </li>
        ))}
      </ul>
      <a
        href={tier.href}
        className={`${isHi ? 'btn-brand' : 'btn-secondary'} mt-7 w-full justify-center`}
      >
        {tier.cta}
      </a>
    </div>
  );
}

function Cell({ v }: { v: string | boolean }) {
  if (typeof v === 'boolean') {
    return v ? (
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
        <IconCheck className="h-3.5 w-3.5" />
      </span>
    ) : (
      <span className="text-ink-300">—</span>
    );
  }
  return <span className="text-ink-800">{v}</span>;
}
