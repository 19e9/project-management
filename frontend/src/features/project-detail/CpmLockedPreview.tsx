import { Link } from 'react-router-dom';

export function CpmLockedPreview({ workspaceId }: { workspaceId?: string }) {
  const rows = [
    { feature: 'Forward pass (ES / EF)', free: 'Preview timings', enterprise: 'Full precision' },
    { feature: 'Slack visualization', free: 'Blurred teaser', enterprise: 'Per-task slack' },
    {
      feature: 'Drag impact analysis',
      free: 'Limited',
      enterprise: 'Live what-if',
    },
    { feature: 'Exports', free: 'CSV snapshot', enterprise: 'CPM workbook' },
  ];
  const billingHref = '/dashboard/billing';

  return (
    <div className="relative overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-rose-50 p-6">
      <div className="relative space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-amber-950">See the critical chain before upgrading</h3>
            <p className="text-sm text-amber-900/80">
              We blur the deterministic engine but keep the affordances so planners feel the payoff.
            </p>
          </div>
          <Link to={billingHref} className="btn-primary whitespace-nowrap px-4 py-2 text-sm">
            Compare plans →
          </Link>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-white/70 bg-white/60 p-4 shadow-inner backdrop-blur">
          <div className="pointer-events-none select-none blur-sm">
            <PreviewGraph />
          </div>
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white/55">
            <div className="rounded-2xl border border-amber-200 bg-white/90 px-4 py-3 text-center shadow-lg backdrop-blur">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-900">Unlock</p>
              <p className="text-lg font-semibold text-ink-900">Live CPM telemetry</p>
              <p className="mt-1 text-xs text-ink-500">Enterprise planning workspace</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-ink-100 bg-white/80 shadow-sm backdrop-blur">
          <table className="w-full text-sm">
            <thead className="border-b border-ink-100 text-left text-[11px] font-semibold uppercase tracking-wide text-ink-500">
              <tr>
                <th className="px-4 py-2">Capability</th>
                <th className="px-4 py-2">Current</th>
                <th className="px-4 py-2">Upgrade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {rows.map((r) => (
                <tr key={r.feature}>
                  <td className="px-4 py-3 font-medium text-ink-900">{r.feature}</td>
                  <td className="px-4 py-3 text-xs text-ink-500">{r.free}</td>
                  <td className="px-4 py-3 text-xs font-semibold text-emerald-700">{r.enterprise}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {workspaceId && (
          <p className="text-[11px] text-amber-900/70">
            Workspace <span className="font-mono">{workspaceId.slice(0, 8)}…</span> is still on a plan without full CPM
            parity.
          </p>
        )}
      </div>
    </div>
  );
}

function PreviewGraph() {
  return (
    <svg viewBox="0 0 640 240" role="presentation" className="h-56 w-full text-rose-500">
      <defs>
        <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 z" fill="#f87171" />
        </marker>
      </defs>
      {[48, 120, 206, 300, 394].map((x, idx) => (
        <circle key={idx} cx={x} cy={idx % 2 ? 104 : 150} r={idx === 2 ? 9 : 6} fill={idx === 2 ? '#f97316' : '#fb7185'} />
      ))}
      {[0, 1, 2, 3].map((i) => {
        const x1 = [48, 120, 206, 300][i];
        const x2 = [120, 206, 300, 394][i];
        const y1 = i % 2 ? 104 : 150;
        const y2 = (i + 1) % 2 ? 104 : 150;
        return (
          <line
            key={`e-${i}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="#f87171"
            strokeWidth={3}
            markerEnd="url(#arrow)"
          />
        );
      })}
      {[48, 120, 206, 300].map((x, i) => (
        <text key={`t-${i}`} x={x - 20} y={58} fill="#cbd5f5" fontSize="12" fontWeight={700}>
          T{i + 1}
        </text>
      ))}
    </svg>
  );
}
