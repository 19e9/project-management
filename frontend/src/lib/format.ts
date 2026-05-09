export function formatNumber(n: number): string {
  return new Intl.NumberFormat('tr-TR').format(n);
}

export function formatDate(dateStr: string, style: 'short' | 'long' = 'short'): string {
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('tr-TR', {
      day: 'numeric',
      month: style === 'long' ? 'long' : 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateStr;
  }
}
