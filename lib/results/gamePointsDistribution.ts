/**
 * @deprecated ヒストグラム用。新リザルトは `gamePointsSummary` を使う。
 * 互換のため型・パーサのみ残す。
 */
import {
  parseGamePointsTopEntries,
  type GamePointsTopEntryV1,
} from "./gamePointsTop";

export type { GamePointsTopEntryV1 } from "./gamePointsTop";

export type PointsDistBin = {
  lo: number;
  hi: number;
  count: number;
};

export type GamePointsDistributionV1 = {
  v: 1;
  bins: PointsDistBin[];
  n: number;
  median: number | null;
  mean: number | null;
  max?: number | null;
  top?: GamePointsTopEntryV1[];
  updatedAtMillis?: number;
};

export function rawPointsDistributionFromGameDoc(
  gameData: Record<string, unknown> | null | undefined
): unknown {
  if (!gameData || typeof gameData !== "object") return null;
  return (
    gameData.pointsDistribution ??
    gameData.pointsDistributionV1 ??
    null
  );
}

function isFiniteNum(x: unknown): x is number {
  return typeof x === "number" && Number.isFinite(x);
}

export function parseGamePointsDistributionV1(
  raw: unknown
): GamePointsDistributionV1 | null {
  if (raw == null || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (o.v !== 1 || !Array.isArray(o.bins)) return null;
  const bins: PointsDistBin[] = [];
  for (const b of o.bins) {
    if (b == null || typeof b !== "object") return null;
    const r = b as Record<string, unknown>;
    if (
      !isFiniteNum(r.lo) ||
      !isFiniteNum(r.hi) ||
      typeof r.count !== "number" ||
      !Number.isFinite(r.count) ||
      r.count < 0
    ) {
      return null;
    }
    bins.push({ lo: r.lo, hi: r.hi, count: Math.floor(r.count) });
  }
  const n = isFiniteNum(o.n) ? Math.max(0, Math.floor(o.n)) : 0;
  const median =
    o.median === null || o.median === undefined
      ? null
      : isFiniteNum(o.median)
        ? o.median
        : null;
  const mean =
    o.mean === null || o.mean === undefined
      ? null
      : isFiniteNum(o.mean)
        ? o.mean
        : null;
  const max =
    o.max === null || o.max === undefined
      ? null
      : isFiniteNum(o.max)
        ? o.max
        : null;
  const top = parseGamePointsTopEntries(o.top);
  return {
    v: 1,
    bins,
    n,
    median,
    mean,
    max,
    ...(top.length > 0 ? { top } : {}),
  };
}
