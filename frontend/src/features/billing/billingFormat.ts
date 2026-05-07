export function formatUsd(n: number, fraction = 2): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: fraction,
    minimumFractionDigits: fraction,
  }).format(n);
}
