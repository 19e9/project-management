interface Props {
  data: number[];
  width?: number;
  height?: number;
  stroke?: string;
  fill?: string;
  className?: string;
}

export function Sparkline({
  data,
  width = 120,
  height = 36,
  stroke = '#4f46e5',
  fill = 'rgba(99,102,241,0.18)',
  className,
}: Props) {
  if (!data.length) {
    return <div className="h-9 w-full skeleton" aria-hidden />;
  }
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const stepX = data.length > 1 ? width / (data.length - 1) : width;

  const points = data.map((v, i) => {
    const x = i * stepX;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return [x, y] as [number, number];
  });

  const linePath = points
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(' ');

  const areaPath =
    `${linePath} L${(points[points.length - 1][0]).toFixed(1)} ${height} ` +
    `L0 ${height} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      preserveAspectRatio="none"
      role="img"
      aria-hidden
    >
      <path d={areaPath} fill={fill} />
      <path d={linePath} fill="none" stroke={stroke} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
