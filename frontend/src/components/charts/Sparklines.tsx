/**
 * Lightweight, dependency-free SVG charts that match the design system.
 *  - LineChart: multi-series line with smooth curves and gradient area
 *  - BarChart:  vertical bars with rounded tops
 *  - Donut:     center label + segmented ring
 *
 * All charts are responsive (viewBox-based) and accessible
 * (role="img" + aria-label).
 */

interface SeriesDef {
  key: string;
  label: string;
  values: number[];
  color?: string;
}

const PALETTE = ['#4f46e5', '#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

/* -------------------- Line Chart -------------------- */

export function LineChart({
  labels,
  series,
  height = 220,
  showLegend = true,
}: {
  labels: string[];
  series: SeriesDef[];
  height?: number;
  showLegend?: boolean;
}) {
  const W = 800;
  const H = height;
  const padL = 40;
  const padR = 14;
  const padT = 14;
  const padB = 28;

  const pointsCount = labels.length;
  const max = Math.max(
    1,
    ...series.flatMap((s) => s.values),
  );
  const niceMax = niceCeil(max);

  const xAt = (i: number) =>
    padL + (i / Math.max(1, pointsCount - 1)) * (W - padL - padR);
  const yAt = (v: number) => padT + (1 - v / niceMax) * (H - padT - padB);

  // Build path d strings (smooth Catmull-Rom -> bezier)
  const buildPath = (vals: number[]) => {
    const pts = vals.map((v, i) => [xAt(i), yAt(v)] as [number, number]);
    return smoothPath(pts);
  };

  // Y ticks (4 lines)
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => ({
    y: padT + (1 - t) * (H - padT - padB),
    label: Math.round(niceMax * t).toString(),
  }));

  return (
    <div role="img" aria-label="Growth chart">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="block w-full"
        style={{ height }}
      >
        <defs>
          {series.map((s, i) => {
            const c = s.color ?? PALETTE[i % PALETTE.length];
            return (
              <linearGradient
                key={s.key}
                id={`grad-${s.key}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={c} stopOpacity="0.25" />
                <stop offset="100%" stopColor={c} stopOpacity="0" />
              </linearGradient>
            );
          })}
        </defs>

        {/* Grid */}
        {yTicks.map((t, i) => (
          <g key={i}>
            <line
              x1={padL}
              x2={W - padR}
              y1={t.y}
              y2={t.y}
              stroke="#e2e8f0"
              strokeDasharray="3 4"
              strokeWidth="1"
            />
            <text
              x={padL - 8}
              y={t.y + 3}
              textAnchor="end"
              fontSize="10"
              fill="#94a3b8"
            >
              {t.label}
            </text>
          </g>
        ))}

        {/* X labels (every Nth) */}
        {labels.map((l, i) => {
          const stride = Math.max(1, Math.floor(labels.length / 6));
          if (i % stride !== 0 && i !== labels.length - 1) return null;
          return (
            <text
              key={l + i}
              x={xAt(i)}
              y={H - 8}
              textAnchor="middle"
              fontSize="10"
              fill="#94a3b8"
            >
              {l.slice(5)}
            </text>
          );
        })}

        {series.map((s, i) => {
          const c = s.color ?? PALETTE[i % PALETTE.length];
          const linePath = buildPath(s.values);
          const areaPath = `${linePath} L ${xAt(s.values.length - 1)} ${H - padB} L ${xAt(0)} ${H - padB} Z`;
          return (
            <g key={s.key}>
              <path d={areaPath} fill={`url(#grad-${s.key})`} />
              <path
                d={linePath}
                fill="none"
                stroke={c}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* End-of-line marker */}
              {s.values.length > 0 && (
                <circle
                  cx={xAt(s.values.length - 1)}
                  cy={yAt(s.values[s.values.length - 1])}
                  r={3.5}
                  fill="#fff"
                  stroke={c}
                  strokeWidth="1.5"
                />
              )}
            </g>
          );
        })}
      </svg>

      {showLegend && (
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-600">
          {series.map((s, i) => (
            <span key={s.key} className="inline-flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full"
                style={{
                  backgroundColor: s.color ?? PALETTE[i % PALETTE.length],
                }}
              />
              {s.label}{' '}
              <span className="text-ink-400">
                · {s.values.reduce((a, b) => a + b, 0)}
              </span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* -------------------- Bar Chart -------------------- */

export function BarChart({
  data,
  height = 220,
}: {
  data: { label: string; value: number; color?: string }[];
  height?: number;
}) {
  const W = 800;
  const H = height;
  const padL = 40;
  const padR = 14;
  const padT = 14;
  const padB = 28;

  const max = Math.max(1, ...data.map((d) => d.value));
  const niceMax = niceCeil(max);
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const gap = 14;
  const barW = (innerW - gap * (data.length - 1)) / Math.max(1, data.length);

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => ({
    y: padT + (1 - t) * innerH,
    label: Math.round(niceMax * t).toString(),
  }));

  return (
    <div role="img" aria-label="Bar chart">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="block w-full"
        style={{ height }}
      >
        <defs>
          <linearGradient id="bar-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#4f46e5" />
          </linearGradient>
        </defs>

        {yTicks.map((t, i) => (
          <g key={i}>
            <line
              x1={padL}
              x2={W - padR}
              y1={t.y}
              y2={t.y}
              stroke="#e2e8f0"
              strokeDasharray="3 4"
              strokeWidth="1"
            />
            <text
              x={padL - 8}
              y={t.y + 3}
              textAnchor="end"
              fontSize="10"
              fill="#94a3b8"
            >
              {t.label}
            </text>
          </g>
        ))}

        {data.map((d, i) => {
          const x = padL + i * (barW + gap);
          const h = (d.value / niceMax) * innerH;
          const y = padT + innerH - h;
          return (
            <g key={d.label}>
              <rect
                x={x}
                y={y}
                width={barW}
                height={Math.max(2, h)}
                rx={6}
                fill={d.color ?? 'url(#bar-grad)'}
              />
              <text
                x={x + barW / 2}
                y={padT + innerH + 16}
                textAnchor="middle"
                fontSize="10"
                fill="#94a3b8"
              >
                {d.label}
              </text>
              <text
                x={x + barW / 2}
                y={Math.max(padT + 12, y - 6)}
                textAnchor="middle"
                fontSize="11"
                fontWeight={600}
                fill="#0f172a"
              >
                {d.value}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* -------------------- Donut Chart -------------------- */

export function Donut({
  segments,
  size = 180,
  centerLabel,
  centerValue,
}: {
  segments: { label: string; value: number; color?: string }[];
  size?: number;
  centerLabel?: string;
  centerValue?: string | number;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  const radius = size / 2 - 12;
  const circ = 2 * Math.PI * radius;
  let acc = 0;

  return (
    <div className="flex items-center gap-5" role="img" aria-label="Distribution">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={14}
        />
        {segments.map((s, i) => {
          const value = s.value;
          if (total === 0 || value === 0) return null;
          const len = (value / total) * circ;
          const dasharray = `${len} ${circ - len}`;
          const dashoffset = -((acc / total) * circ);
          acc += value;
          return (
            <circle
              key={s.label}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={s.color ?? PALETTE[i % PALETTE.length]}
              strokeWidth={14}
              strokeDasharray={dasharray}
              strokeDashoffset={dashoffset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              strokeLinecap="butt"
            />
          );
        })}
        <text
          x={size / 2}
          y={size / 2 - 4}
          textAnchor="middle"
          fontSize="11"
          fill="#64748b"
        >
          {centerLabel}
        </text>
        <text
          x={size / 2}
          y={size / 2 + 14}
          textAnchor="middle"
          fontSize="20"
          fontWeight={700}
          fill="#0f172a"
        >
          {centerValue ?? total}
        </text>
      </svg>

      <ul className="space-y-1.5 text-sm">
        {segments.map((s, i) => {
          const pct = total === 0 ? 0 : Math.round((s.value / total) * 100);
          return (
            <li key={s.label} className="flex items-center gap-2 text-ink-700">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: s.color ?? PALETTE[i % PALETTE.length] }}
              />
              <span className="capitalize">{s.label}</span>
              <span className="ml-auto pl-3 text-ink-500">
                {s.value}{' '}
                <span className="text-ink-400">· {pct}%</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* -------------------- helpers -------------------- */

function niceCeil(n: number) {
  if (n <= 0) return 1;
  const exp = Math.floor(Math.log10(n));
  const f = Math.pow(10, exp);
  const m = n / f;
  if (m <= 1) return 1 * f;
  if (m <= 2) return 2 * f;
  if (m <= 5) return 5 * f;
  return 10 * f;
}

function smoothPath(pts: [number, number][]) {
  if (pts.length === 0) return '';
  if (pts.length === 1) return `M ${pts[0][0]} ${pts[0][1]}`;
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const t = 0.18; // tension
    const c1 = [p1[0] + (p2[0] - p0[0]) * t, p1[1] + (p2[1] - p0[1]) * t];
    const c2 = [p2[0] - (p3[0] - p1[0]) * t, p2[1] - (p3[1] - p1[1]) * t];
    d += ` C ${c1[0]} ${c1[1]} ${c2[0]} ${c2[1]} ${p2[0]} ${p2[1]}`;
  }
  return d;
}
