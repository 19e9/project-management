type Bar = {
  label: string;
  startCol: number;
  span: number;
  row: number;
  tone: 'brand' | 'accent' | 'critical' | 'muted';
  progress?: number;
};

const BARS: Bar[] = [
  { label: '1.1 Excavation',  startCol: 0,  span: 4,  row: 0, tone: 'critical', progress: 100 },
  { label: '1.2 Slab pour',   startCol: 4,  span: 6,  row: 1, tone: 'critical', progress: 70 },
  { label: '2 Framing',       startCol: 10, span: 7,  row: 2, tone: 'critical', progress: 32 },
  { label: '3 Roofing',       startCol: 17, span: 5,  row: 3, tone: 'accent',   progress: 0 },
  { label: '4 Interior',      startCol: 17, span: 9,  row: 4, tone: 'brand',    progress: 0 },
  { label: '5 Inspection',    startCol: 24, span: 3,  row: 5, tone: 'muted',    progress: 0 },
];

const COLS = 28;

export function HeroMockup() {
  return (
    <div className="relative">
      {/* Glow */}
      <div
        className="pointer-events-none absolute -inset-x-10 -top-10 h-72 rounded-[3rem] bg-brand-500/20 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-12 -right-10 h-56 w-56 rounded-full bg-accent-400/30 blur-3xl"
        aria-hidden
      />

      {/* Window frame */}
      <div className="relative overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-[0_30px_80px_-30px_rgba(15,23,42,0.35)] ring-1 ring-black/5">
        {/* Title bar */}
        <div className="flex items-center justify-between border-b border-ink-200 bg-gradient-to-b from-ink-50 to-white px-4 py-2.5">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-rose-400/80" />
            <span className="h-3 w-3 rounded-full bg-amber-400/80" />
            <span className="h-3 w-3 rounded-full bg-emerald-400/80" />
          </div>
          <div className="hidden text-[11px] font-medium text-ink-500 sm:block">
            planforge.app · House Build — Plot 14
          </div>
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-[11px] text-ink-500">Saved</span>
          </div>
        </div>

        <div className="grid grid-cols-12">
          {/* Sidebar */}
          <aside className="col-span-3 hidden border-r border-ink-200 bg-ink-50/40 p-3 sm:block">
            <div className="rounded-lg bg-white p-2 shadow-soft ring-1 ring-ink-200/70">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                Workspace
              </div>
              <div className="mt-1 text-sm font-semibold text-ink-900">Acme Build Co.</div>
            </div>
            <ul className="mt-3 space-y-1 text-[12px]">
              {[
                ['Inbox', false],
                ['Projects', true],
                ['Timeline', false],
                ['People', false],
                ['Reports', false],
              ].map(([l, active]) => (
                <li
                  key={l as string}
                  className={`flex items-center gap-2 rounded-md px-2 py-1.5 ${
                    active ? 'bg-brand-50 text-brand-700' : 'text-ink-600 hover:bg-ink-100'
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      active ? 'bg-brand-500' : 'bg-ink-300'
                    }`}
                  />
                  {l}
                </li>
              ))}
            </ul>

            <div className="mt-4 rounded-lg bg-gradient-to-br from-brand-50 to-accent-50 p-3 ring-1 ring-brand-100">
              <div className="text-[11px] font-semibold text-brand-700">Critical path</div>
              <div className="mt-0.5 text-sm font-semibold text-ink-900">42d → 38d</div>
              <div className="mt-1 text-[11px] text-ink-500">Saved 4 days vs baseline</div>
            </div>
          </aside>

          {/* Main */}
          <main className="col-span-12 sm:col-span-9">
            {/* Toolbar */}
            <div className="flex items-center gap-2 border-b border-ink-200 px-4 py-2.5">
              <button className="rounded-md bg-ink-900 px-2.5 py-1 text-[11px] font-medium text-white">
                Gantt
              </button>
              <button className="rounded-md px-2.5 py-1 text-[11px] font-medium text-ink-600 hover:bg-ink-100">
                Board
              </button>
              <button className="rounded-md px-2.5 py-1 text-[11px] font-medium text-ink-600 hover:bg-ink-100">
                List
              </button>
              <div className="ml-auto flex items-center gap-2">
                <span className="badge-soft hidden sm:inline-flex">CPM enabled</span>
                <div className="flex -space-x-1.5">
                  {['#6366f1', '#06b6d4', '#f59e0b'].map((c) => (
                    <span
                      key={c}
                      className="h-6 w-6 rounded-full ring-2 ring-white"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Gantt grid */}
            <div className="px-4 pb-4 pt-3">
              {/* Day header */}
              <div
                className="mb-2 grid text-[10px] font-medium uppercase tracking-wider text-ink-400"
                style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}
              >
                {Array.from({ length: COLS }).map((_, i) => (
                  <div key={i} className="text-center">
                    {i % 7 === 0 ? `W${Math.floor(i / 7) + 1}` : ''}
                  </div>
                ))}
              </div>

              {/* Rows */}
              <div className="relative space-y-2.5 rounded-xl border border-ink-200 bg-gradient-to-b from-white to-ink-50/40 p-2">
                {/* Background grid */}
                <div
                  className="pointer-events-none absolute inset-0 opacity-50"
                  style={{
                    backgroundImage:
                      'linear-gradient(to right, rgba(15,23,42,0.06) 1px, transparent 1px)',
                    backgroundSize: `${100 / COLS}% 100%`,
                  }}
                  aria-hidden
                />
                {/* "Today" line */}
                <div
                  className="pointer-events-none absolute top-0 bottom-0 w-px bg-brand-500/70"
                  style={{ left: `calc(${(11 / COLS) * 100}% - 0px)` }}
                  aria-hidden
                >
                  <span className="absolute -top-2 -translate-x-1/2 rounded bg-brand-600 px-1 py-0.5 text-[9px] font-semibold text-white">
                    Today
                  </span>
                </div>

                {BARS.map((b) => (
                  <Row key={b.label} bar={b} />
                ))}

                {/* Dependency arrow */}
                <Arrows />
              </div>

              {/* Footer stats */}
              <div className="mt-4 grid grid-cols-3 gap-3">
                <Stat label="Tasks" value="124" delta="+8" />
                <Stat label="On schedule" value="94%" delta="+2.4%" tone="success" />
                <Stat label="Slack reduced" value="-4d" delta="last sprint" tone="brand" />
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Floating cards */}
      <FloatingTaskCard />
      <FloatingPathCard />
    </div>
  );
}

function Row({ bar }: { bar: Bar }) {
  const tones: Record<Bar['tone'], string> = {
    brand:
      'bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-[0_6px_18px_-8px_rgba(79,70,229,0.7)]',
    accent:
      'bg-gradient-to-r from-accent-500 to-accent-600 text-white shadow-[0_6px_18px_-8px_rgba(8,145,178,0.7)]',
    critical:
      'bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-[0_6px_18px_-8px_rgba(220,38,38,0.6)]',
    muted: 'bg-ink-200 text-ink-700',
  };
  return (
    <div
      className="grid items-center"
      style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}
    >
      <div
        className={`relative col-span-1 row-start-1 flex h-7 items-center overflow-hidden rounded-md px-2 text-[11px] font-medium ${tones[bar.tone]}`}
        style={{
          gridColumnStart: bar.startCol + 1,
          gridColumnEnd: bar.startCol + 1 + bar.span,
        }}
      >
        <span className="truncate">{bar.label}</span>
        {typeof bar.progress === 'number' && bar.progress > 0 && (
          <span
            className="absolute inset-y-0 left-0 bg-white/25"
            style={{ width: `${bar.progress}%` }}
            aria-hidden
          />
        )}
      </div>
    </div>
  );
}

function Arrows() {
  // Decorative dependency curves between bar rows
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <marker id="ah" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6" fill="#94a3b8" />
        </marker>
      </defs>
      <path
        d="M14 12 C 18 14, 18 22, 22 24"
        fill="none"
        stroke="#94a3b8"
        strokeWidth="0.4"
        strokeDasharray="0.8 0.8"
        markerEnd="url(#ah)"
      />
      <path
        d="M36 36 C 40 38, 40 50, 44 52"
        fill="none"
        stroke="#94a3b8"
        strokeWidth="0.4"
        strokeDasharray="0.8 0.8"
        markerEnd="url(#ah)"
      />
    </svg>
  );
}

function Stat({
  label,
  value,
  delta,
  tone = 'default',
}: {
  label: string;
  value: string;
  delta: string;
  tone?: 'default' | 'success' | 'brand';
}) {
  const dt: Record<string, string> = {
    default: 'text-ink-500',
    success: 'text-emerald-600',
    brand: 'text-brand-600',
  };
  return (
    <div className="rounded-xl border border-ink-200 bg-white p-3 shadow-soft">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-500">
        {label}
      </div>
      <div className="mt-0.5 flex items-baseline gap-2">
        <span className="text-base font-semibold text-ink-900">{value}</span>
        <span className={`text-[11px] ${dt[tone]}`}>{delta}</span>
      </div>
    </div>
  );
}

function FloatingTaskCard() {
  return (
    <div className="absolute -left-6 bottom-10 hidden w-60 animate-float rounded-2xl border border-ink-200 bg-white p-3 shadow-card md:block">
      <div className="flex items-center gap-2">
        <span className="badge-soft">In progress</span>
        <span className="text-[11px] text-ink-500">2.1 · Slab pour</span>
      </div>
      <div className="mt-2 text-sm font-semibold text-ink-900">
        Pour 12m³ concrete · Section A
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-ink-100">
        <div className="h-full w-[68%] rounded-full bg-brand-gradient" />
      </div>
      <div className="mt-2 flex items-center justify-between text-[11px] text-ink-500">
        <span>68% complete</span>
        <div className="flex -space-x-1">
          <span className="h-5 w-5 rounded-full bg-amber-400 ring-2 ring-white" />
          <span className="h-5 w-5 rounded-full bg-cyan-500 ring-2 ring-white" />
        </div>
      </div>
    </div>
  );
}

function FloatingPathCard() {
  return (
    <div className="absolute -right-3 -top-6 hidden w-56 rotate-[2deg] animate-float rounded-2xl border border-ink-200 bg-white p-3 shadow-card sm:block">
      <div className="flex items-center justify-between">
        <span className="badge bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-100">
          Critical path
        </span>
        <span className="text-[11px] font-medium text-ink-500">5 tasks</span>
      </div>
      <div className="mt-2.5 space-y-1.5 text-[12px]">
        {['Excavation', 'Slab pour', 'Framing', 'Roofing', 'Interior'].map((t, i) => (
          <div key={t} className="flex items-center gap-2 text-ink-700">
            <span className="grid h-4 w-4 place-items-center rounded-full bg-rose-500/10 text-[10px] font-semibold text-rose-700">
              {i + 1}
            </span>
            {t}
          </div>
        ))}
      </div>
    </div>
  );
}
