export function formatNumber(value: number): string {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(value);
}

export function formatDate(iso: string, style: 'short' | 'long' = 'short'): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: style === 'long' ? 'long' : 'short',
    day: 'numeric',
  });
}
