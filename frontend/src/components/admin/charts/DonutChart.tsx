import { cn } from '../../../lib/cn';

interface Slice {
  label: string;
  value: number;
  color: string;
}

interface Props {
  slices: Slice[];
  /** Coordinate space for SVG math (viewBox); displayed size is fluid inside the chart wrapper. */
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerSubLabel?: string;
  /** Optional override for center text color. */
  centerColor?: string;
  /** @deprecated Use legendPlacement instead. */
  layout?: 'row' | 'col';
  /** Beside tries chart + legend in one row with wrapping when the container is narrow. */
  legendPlacement?: 'beside' | 'below';
  /** Dark variant for charts on ink/black surfaces (e.g. billing health card). */
  tone?: 'light' | 'dark';
}

export function DonutChart({
  slices,
  size = 180,
  thickness = 22,
  centerLabel,
  centerSubLabel,
  centerColor,
  layout,
  legendPlacement = 'beside',
  tone = 'light',
}: Props) {
  const total = slices.reduce((s, x) => s + x.value, 0);
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let acc = 0;

  const trackStroke =
    tone === 'dark' ? 'rgba(248,250,252,0.12)' : 'rgba(15,23,42,0.06)';
  const svgTextPrimary = centerColor ?? (tone === 'dark' ? '#f8fafc' : '#0f172a');
  const svgTextMuted = tone === 'dark' ? 'rgba(248,250,252,0.55)' : '#64748b';
  const placement = layout === 'col' ? 'below' : legendPlacement;

  const legendLabelCls = tone === 'dark' ? 'text-white/80' : 'text-ink-700';
  const legendValueCls = tone === 'dark' ? 'text-white' : 'text-ink-900';
  const legendPctCls = tone === 'dark' ? 'text-white/45' : 'text-ink-500';

  return (
    <div
      className={cn(
        'flex w-full min-w-0 gap-x-5 gap-y-4',
        placement === 'below'
          ? 'flex-col items-center'
          : 'flex-row flex-wrap items-center justify-center md:justify-start',
      )}
    >
      <div
        className={cn(
          'aspect-square shrink-0',
          placement === 'below'
            ? 'mx-auto w-full max-w-[220px]'
            : 'w-full max-w-[min(220px,100%)]',
        )}
      >
        <svg viewBox={`0 0 ${size} ${size}`} className="block size-full" role="img">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={trackStroke}
            strokeWidth={thickness}
            fill="none"
          />
          {total > 0 &&
            slices.map((s) => {
              const dash = (s.value / total) * c;
              const offset = -acc;
              acc += dash;
              return (
                <circle
                  key={s.label}
                  cx={size / 2}
                  cy={size / 2}
                  r={r}
                  stroke={s.color}
                  strokeWidth={thickness}
                  fill="none"
                  strokeDasharray={`${dash} ${c}`}
                  strokeDashoffset={offset}
                  transform={`rotate(-90 ${size / 2} ${size / 2})`}
                  strokeLinecap="butt"
                >
                  <title>{`${s.label}: ${s.value}`}</title>
                </circle>
              );
            })}
          {centerLabel && (
            <g>
              <text
                x="50%"
                y="50%"
                textAnchor="middle"
                fontFamily="Inter"
                fontWeight={700}
                fontSize={22}
                fill={svgTextPrimary}
                dy="-2"
              >
                {centerLabel}
              </text>
              {centerSubLabel && (
                <text
                  x="50%"
                  y="50%"
                  textAnchor="middle"
                  fontFamily="Inter"
                  fontSize={10}
                  fill={svgTextMuted}
                  fillOpacity={centerColor ? 0.55 : undefined}
                  dy="14"
                >
                  {centerSubLabel}
                </text>
              )}
            </g>
          )}
        </svg>
      </div>

      <ul
        className={cn(
          'min-w-0 space-y-2 text-xs sm:text-sm',
          placement === 'below'
            ? 'w-full max-w-sm'
            : 'min-w-[min(100%,12rem)] flex-1 sm:min-w-[14rem]',
        )}
      >
        {slices.map((s) => {
          const pct = total ? Math.round((s.value / total) * 1000) / 10 : 0;
          return (
            <li key={s.label} className="flex min-w-0 items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: s.color }}
              />
              <span className={cn('min-w-0 truncate', legendLabelCls)}>{s.label}</span>
              <span className={cn('ml-auto shrink-0 font-medium tabular-nums', legendValueCls)}>
                {s.value.toLocaleString()}
              </span>
              <span className={cn('w-10 shrink-0 text-right tabular-nums sm:w-11', legendPctCls)}>
                {pct}%
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
