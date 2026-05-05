interface Props {
  title: string;
  hint: string;
}

export default function AdminPlaceholderPage({ title, hint }: Props) {
  return (
    <div className="space-y-6">
      <header>
        <span className="eyebrow">Admin</span>
        <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-ink-900 md:text-3xl">
          {title}
        </h1>
        <p className="mt-1 text-sm text-ink-500">{hint}</p>
      </header>
      <div className="card flex flex-col items-center justify-center gap-3 px-6 py-20 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-700">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M12 4v16M4 12h16" strokeLinecap="round" />
          </svg>
        </span>
        <h3 className="text-base font-semibold text-ink-900">Coming soon</h3>
        <p className="max-w-md text-sm text-ink-500">
          Wire this view up to the same admin endpoints (<code>/api/v1/admin/*</code>) — the
          design system, table, and feed primitives are ready to drop in.
        </p>
      </div>
    </div>
  );
}
