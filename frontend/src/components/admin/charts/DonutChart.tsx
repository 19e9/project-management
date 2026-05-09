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
  centerColor?: string;
  layout?: 'row' | 'col';
}

export function DonutChart({
  slices,
  size = 180,
  thickness = 22,
  centerLabel,
  centerSubLabel,
  centerColor = '#0f172a',
  layout = 'row',
}: Props) {
  const total = slices.reduce((s, x) => s + x.value, 0);
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let acc = 0;

  const chart = (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} className="shrink-0">
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
            fill={centerColor}
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
              fill={centerColor}
              fillOpacity={0.55}
              dy="14"
            >
              {centerSubLabel}
            </text>
          )}
        </g>
      )}
    </svg>
  );

  const legend = (
    <ul className={`space-y-2 text-sm ${layout === 'col' ? 'w-full' : 'flex-1'}`}>
      {slices.map((s) => {
        const pct = total ? Math.round((s.value / total) * 1000) / 10 : 0;
        return (
          <li key={s.label} className="flex items-center gap-2">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: s.color }}
            />
            <span className="min-w-0 flex-1 truncate opacity-70">{s.label}</span>
            <span className="font-medium tabular-nums">{s.value.toLocaleString()}</span>
            <span className="w-11 text-right text-xs opacity-50">{pct}%</span>
          </li>
        );
      })}
    </ul>
  );

  if (layout === 'col') {
    return (
      <div className="flex flex-col items-center gap-4">
        {chart}
        {legend}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-6">
      {chart}
      {legend}
    </div>
  );
}
