export function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function formatCount(count: number): string {
  if (count > 0) return `+${count}`;
  return `${count}`;
}

export function formatTrueCount(count: number): string {
  if (count > 0) return `+${count.toFixed(1)}`;
  return count.toFixed(1);
}
