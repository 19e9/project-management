interface Slice {
  label: string;
  value: number;
  color: string;
}

interface Props {
  slices: Slice[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerSubLabel?: string;
}

export function DonutChart({
  slices,
  size = 180,
  thickness = 22,
  centerLabel,
  centerSubLabel,
}: Props) {
  const total = slices.reduce((s, x) => s + x.value, 0);
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let acc = 0;

  return (
    <div className="flex items-center gap-6">
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="rgba(15,23,42,0.06)"
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
              fill="#0f172a"
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
                fill="#64748b"
                dy="14"
              >
                {centerSubLabel}
              </text>
            )}
          </g>
        )}
      </svg>

      <ul className="flex-1 space-y-2.5 text-sm">
        {slices.map((s) => {
          const pct = total ? Math.round((s.value / total) * 1000) / 10 : 0;
          return (
            <li key={s.label} className="flex items-center gap-3">
              <span
                className="h-2.5 w-2.5 flex-none rounded-full"
                style={{ backgroundColor: s.color }}
              />
              <span className="text-ink-700">{s.label}</span>
              <span className="ml-auto font-medium text-ink-900">
                {s.value.toLocaleString()}
              </span>
              <span className="w-12 text-right text-xs text-ink-500">{pct}%</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
