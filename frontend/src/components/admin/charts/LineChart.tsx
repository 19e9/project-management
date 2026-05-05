import { useMemo, useState } from 'react';

export interface LineSeries {
  key: string;
  label: string;
  color: string;
  values: number[];
}

interface Props {
  labels: string[];
  series: LineSeries[];
  height?: number;
  yLabelFormatter?: (n: number) => string;
}

export function LineChart({
  labels,
  series,
  height = 240,
  yLabelFormatter = (n) => `${n}`,
}: Props) {
  const [hover, setHover] = useState<number | null>(null);
  const width = 720;
  const padL = 36;
  const padR = 16;
  const padT = 14;
  const padB = 24;
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;

  const max = useMemo(
    () => Math.max(1, ...series.flatMap((s) => s.values)),
    [series],
  );
  const yTicks = niceTicks(max, 4);
  const yMax = yTicks[yTicks.length - 1];

  const stepX = labels.length > 1 ? innerW / (labels.length - 1) : innerW;

  function point(i: number, v: number) {
    return [padL + i * stepX, padT + (1 - v / yMax) * innerH] as const;
  }

  return (
    <div className="relative w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="none">
        {/* Grid + Y labels */}
        {yTicks.map((t) => {
          const y = padT + (1 - t / yMax) * innerH;
          return (
            <g key={t}>
              <line
                x1={padL}
                x2={width - padR}
                y1={y}
                y2={y}
                stroke="rgba(15,23,42,0.06)"
                strokeWidth={1}
              />
              <text
                x={padL - 6}
                y={y + 3}
                fontSize={9}
                textAnchor="end"
                fill="#94a3b8"
                fontFamily="Inter"
              >
                {yLabelFormatter(t)}
              </text>
            </g>
          );
        })}

        {/* X labels (every Nth to avoid overlap) */}
        {labels.map((lbl, i) => {
          const everyN = Math.max(1, Math.floor(labels.length / 7));
          if (i % everyN !== 0 && i !== labels.length - 1) return null;
          const x = padL + i * stepX;
          return (
            <text
              key={`${lbl}-${i}`}
              x={x}
              y={height - 6}
              fontSize={9}
              textAnchor="middle"
              fill="#94a3b8"
              fontFamily="Inter"
            >
              {short(lbl)}
            </text>
          );
        })}

        {/* Series */}
        {series.map((s) => {
          const pts = s.values.map((v, i) => point(i, v));
          const linePath = pts
            .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`)
            .join(' ');
          const last = pts[pts.length - 1];
          const first = pts[0];
          const areaPath = `${linePath} L${last[0].toFixed(1)} ${padT + innerH} L${first[0].toFixed(1)} ${padT + innerH} Z`;
          return (
            <g key={s.key}>
              <defs>
                <linearGradient id={`grad-${s.key}`} x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor={s.color} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={s.color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <path d={areaPath} fill={`url(#grad-${s.key})`} />
              <path
                d={linePath}
                fill="none"
                stroke={s.color}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          );
        })}

        {/* Hover line */}
        {hover != null && (
          <g>
            <line
              x1={padL + hover * stepX}
              x2={padL + hover * stepX}
              y1={padT}
              y2={padT + innerH}
              stroke="rgba(79,70,229,0.4)"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
            {series.map((s) => {
              const [x, y] = point(hover, s.values[hover] ?? 0);
              return (
                <circle key={s.key} cx={x} cy={y} r={3.5} fill="white" stroke={s.color} strokeWidth={2} />
              );
            })}
          </g>
        )}

        {/* Hover capture */}
        <rect
          x={padL}
          y={padT}
          width={innerW}
          height={innerH}
          fill="transparent"
          onMouseLeave={() => setHover(null)}
          onMouseMove={(e) => {
            const rect = (e.target as SVGRectElement).getBoundingClientRect();
            const ratio = (e.clientX - rect.left) / rect.width;
            const idx = Math.round(ratio * (labels.length - 1));
            setHover(Math.max(0, Math.min(labels.length - 1, idx)));
          }}
        />
      </svg>

      {hover != null && (
        <div
          className="pointer-events-none absolute -top-2 z-10 -translate-x-1/2 rounded-lg border border-ink-200 bg-white px-3 py-2 text-xs shadow-card"
          style={{
            left: `calc(${(padL + hover * stepX) / width * 100}% )`,
          }}
        >
          <div className="font-medium text-ink-900">{labels[hover]}</div>
          <div className="mt-1 space-y-0.5">
            {series.map((s) => (
              <div key={s.key} className="flex items-center gap-2 text-ink-700">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="text-[11px] text-ink-500">{s.label}</span>
                <span className="ml-auto font-semibold">{yLabelFormatter(s.values[hover] ?? 0)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function niceTicks(max: number, count: number): number[] {
  if (max <= 0) return [0, 1];
  const step = Math.pow(10, Math.floor(Math.log10(max)));
  const norm = max / step;
  const niceNorm = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10;
  const niceStep = (niceNorm * step) / count;
  const out: number[] = [];
  for (let i = 0; i <= count; i++) out.push(Math.round(i * niceStep));
  return out;
}

function short(d: string) {
  // YYYY-MM-DD -> MMM DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
    const date = new Date(d + 'T00:00:00Z');
    return date.toLocaleDateString('en', { month: 'short', day: 'numeric' });
  }
  return d;
}
