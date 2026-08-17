/**
 * 試合確定後の得点サマリ（新リザルトカード／詳細用）。
 * settle 時に posts スナップから構築し games.pointsSummary へ埋め込み（追加クエリなし）。
 *
 * 分布ヒストグラム（bins）は持たない。
 *
 * フィールド:
 * - n / median / max
 * - p95: TOP 5% 下限得点
 * - p90: TOP 10% 下限得点
 * - top: 得点上位 10
 */
import {
  parseGamePointsTopEntries,
  type GamePointsTopEntryV1,
} from "./gamePointsTop";

export type { GamePointsTopEntryV1 } from "./gamePointsTop";

export type GamePointsSummaryV1 = {
  v: 1;
  n: number;
  median: number | null;
  max: number | null;
  /** 上位 5% に入るための下限得点 */
  p95: number | null;
  /** 上位 10% に入るための下限得点 */
  p90: number | null;
  top: GamePointsTopEntryV1[];
  updatedAtMillis?: number;
};

function isFiniteNum(x: unknown): x is number {
  return typeof x === "number" && Number.isFinite(x);
}

/** 昇順 sorted から上位 pct（0–1）帯の下限得点 */
export function percentileFloorFromSortedDesc(
  sortedAsc: number[],
  topFraction: number
): number | null {
  const n = sortedAsc.length;
  if (n <= 0) return null;
  const k = Math.max(1, Math.ceil(n * topFraction));
  return sortedAsc[n - k] ?? null;
}

export function buildGamePointsSummaryFromScores(
  scores: number[],
  top: GamePointsTopEntryV1[] = []
): Omit<GamePointsSummaryV1, "updatedAtMillis"> {
  const sorted = scores.filter(Number.isFinite).sort((a, b) => a - b);
  const n = sorted.length;
  if (n === 0) {
    return {
      v: 1,
      n: 0,
      median: null,
      max: null,
      p95: null,
      p90: null,
      top: [],
    };
  }
  const mid = Math.floor(n / 2);
  const median =
    n % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  const max = sorted[n - 1] ?? null;
  return {
    v: 1,
    n,
    median,
    max,
    p95: percentileFloorFromSortedDesc(sorted, 0.05),
    p90: percentileFloorFromSortedDesc(sorted, 0.1),
    top: top.slice(0, 10),
  };
}

export function parseGamePointsSummaryV1(
  raw: unknown
): GamePointsSummaryV1 | null {
  if (raw == null || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (o.v !== 1) return null;
  const n = isFiniteNum(o.n) ? Math.max(0, Math.floor(o.n)) : 0;
  const median =
    o.median === null || o.median === undefined
      ? null
      : isFiniteNum(o.median)
        ? o.median
        : null;
  const max =
    o.max === null || o.max === undefined
      ? null
      : isFiniteNum(o.max)
        ? o.max
        : null;
  const p95 =
    o.p95 === null || o.p95 === undefined
      ? null
      : isFiniteNum(o.p95)
        ? o.p95
        : null;
  const p90 =
    o.p90 === null || o.p90 === undefined
      ? null
      : isFiniteNum(o.p90)
        ? o.p90
        : null;
  const top = parseGamePointsTopEntries(o.top);
  return {
    v: 1,
    n,
    median,
    max,
    p95,
    p90,
    top,
  };
}

/**
 * 旧 pointsDistribution（bins 付き）からサマリ相当を復元。
 * 移行期間の読み取り互換。p90/p95 は旧データでは null。
 */
export function gamePointsSummaryFromLegacyDistribution(
  raw: unknown
): GamePointsSummaryV1 | null {
  if (raw == null || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (o.v !== 1) return null;
  const n = isFiniteNum(o.n) ? Math.max(0, Math.floor(o.n)) : 0;
  if (n <= 0 && !Array.isArray(o.top)) return null;
  return {
    v: 1,
    n,
    median:
      o.median === null || o.median === undefined
        ? null
        : isFiniteNum(o.median)
          ? o.median
          : null,
    max:
      o.max === null || o.max === undefined
        ? null
        : isFiniteNum(o.max)
          ? o.max
          : null,
    p95: null,
    p90: null,
    top: parseGamePointsTopEntries(o.top),
  };
}

export function rawPointsSummaryFromGameDoc(
  gameData: Record<string, unknown> | null | undefined
): unknown {
  if (!gameData || typeof gameData !== "object") return null;
  return gameData.pointsSummary ?? null;
}

export function resolveGamePointsSummary(
  gameData: Record<string, unknown> | null | undefined
): GamePointsSummaryV1 | null {
  if (!gameData) return null;
  const modern = parseGamePointsSummaryV1(rawPointsSummaryFromGameDoc(gameData));
  if (modern) return modern;
  return gamePointsSummaryFromLegacyDistribution(
    gameData.pointsDistribution ?? gameData.pointsDistributionV1 ?? null
  );
}
