import { Link } from 'react-router-dom';
import { Logo } from '../ui/Logo';
import { IconStar } from '../ui/Icons';

export function AuthBrandPanel({
  title = 'Plan, schedule and ship.',
  subtitle = 'Built-in Critical Path, Gantt and WBS — without the spreadsheets.',
}: {
  title?: string;
  subtitle?: string;
}) {
  return (
    <aside className="relative hidden h-full overflow-hidden bg-ink-950 lg:flex lg:flex-col lg:justify-between">
      {/* gradient mesh */}
      <div
        className="pointer-events-none absolute inset-0 opacity-90"
        style={{
          background:
            'radial-gradient(60% 60% at 20% 10%, rgba(99,102,241,0.55), transparent 60%), radial-gradient(50% 60% at 90% 30%, rgba(139,92,246,0.55), transparent 60%), radial-gradient(60% 80% at 50% 100%, rgba(6,182,212,0.45), transparent 60%)',
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-noise opacity-50 mix-blend-overlay"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(255,255,255,0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.07) 1px, transparent 1px)',
          backgroundSize: '36px 36px',
          maskImage:
            'radial-gradient(ellipse 80% 60% at 50% 50%, black 60%, transparent 100%)',
        }}
        aria-hidden
      />

      <div className="relative z-10 p-10">
        <Logo dark />
      </div>

      <div className="relative z-10 px-10 pb-10">
        <div className="max-w-md">
          <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">{title}</h2>
          <p className="mt-3 text-pretty text-white/70">{subtitle}</p>

          <ul className="mt-8 space-y-3 text-sm text-white/80">
            {[
              'Drag-and-drop Gantt with live dependencies',
              'Built-in CPM with critical-path highlighting',
              'Resource histograms that prevent overload',
              'Multi-tenant workspaces with RBAC',
            ].map((b) => (
              <li key={b} className="flex items-start gap-3">
                <span className="mt-0.5 grid h-5 w-5 flex-none place-items-center rounded-full bg-white/10 text-white">
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12.5l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                {b}
              </li>
            ))}
          </ul>

          <figure className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
            <div className="flex gap-0.5 text-amber-300">
              {Array.from({ length: 5 }).map((_, i) => (
                <IconStar key={i} />
              ))}
            </div>
            <blockquote className="mt-2 text-sm leading-relaxed text-white/85">
              “We replaced three spreadsheets and an aging MS Project install with PlanForge. Our
              ops lead now actually opens the plan.”
            </blockquote>
            <figcaption className="mt-3 text-xs text-white/60">
              Maya R. · Head of Delivery, NorthBuild
            </figcaption>
          </figure>

          <p className="mt-8 text-xs text-white/40">
            By continuing you agree to our{' '}
            <Link to="#" className="text-white/70 underline-offset-2 hover:underline">
              Terms
            </Link>{' '}
            and{' '}
            <Link to="#" className="text-white/70 underline-offset-2 hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </aside>
  );
}
