export function calcUpsetPoints(
  majorityRatio: number,
  options?: {
    startRatio?: number;
    maxRatio?: number;
    maxPoints?: number;
  }
): number {
  const startRatio = options?.startRatio ?? 0.55;
  const maxRatio = options?.maxRatio ?? 0.9;
  const maxPoints = options?.maxPoints ?? 10;

  if (!Number.isFinite(majorityRatio)) return 0;

  const ratio = Math.min(1, Math.max(0, majorityRatio));

  if (ratio < startRatio) return 0;
  if (ratio >= maxRatio) return maxPoints;

  const normalized = (ratio - startRatio) / (maxRatio - startRatio);

  return Math.round(normalized * maxPoints);
}