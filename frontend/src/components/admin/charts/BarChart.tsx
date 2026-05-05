interface BarItem {
  label: string;
  value: number;
  color: string;
  hint?: string;
}

interface Props {
  items: BarItem[];
  height?: number;
}

export function BarChart({ items, height = 220 }: Props) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div className="w-full">
      <div
        className="flex items-end gap-3"
        style={{ height: `${height}px` }}
      >
        {items.map((item) => {
          const pct = (item.value / max) * 100;
          return (
            <div key={item.label} className="group flex flex-1 flex-col items-center gap-2">
              <div className="flex w-full flex-1 items-end">
                <div
                  className="relative w-full overflow-hidden rounded-t-lg transition-all duration-500 ease-out-quint"
                  style={{
                    height: `${pct}%`,
                    background: `linear-gradient(to top, ${item.color}, ${withAlpha(item.color, 0.7)})`,
                  }}
                  title={item.hint}
                >
                  <span className="absolute inset-x-0 -top-6 text-center text-xs font-semibold text-ink-700 opacity-0 transition group-hover:opacity-100">
                    {item.value.toLocaleString()}
                  </span>
                </div>
              </div>
              <span className="text-[11px] font-medium text-ink-500">{item.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function withAlpha(hex: string, a: number) {
  // Simple #RRGGBB -> rgba()
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return hex;
  const r = parseInt(m[1], 16);
  const g = parseInt(m[2], 16);
  const b = parseInt(m[3], 16);
  return `rgba(${r},${g},${b},${a})`;
}
