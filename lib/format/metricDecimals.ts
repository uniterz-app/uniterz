/**
 * Profile / rankings metric display: single rounding rule everywhere.
 * Uses `Number.prototype.toFixed` semantics (same as formatting with `toFixed(decimals)`).
 */

export function roundMetricDecimals(value: number, decimals: number): number {
  if (!Number.isFinite(value)) return 0;
  return Number(value.toFixed(decimals));
}

export function formatMetricDecimals(value: number, decimals: number): string {
  if (!Number.isFinite(value)) return (0).toFixed(decimals);
  return value.toFixed(decimals);
}
