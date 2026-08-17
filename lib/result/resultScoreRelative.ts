/**
 * 試合内相対ラベル（#1 / TOP 5% / TOP 10%）。
 * 一覧は post.stats.scoreRel（settle 埋め込み）を優先。
 * 詳細は pointsSummary の max / p95 / p90 でも再計算可。
 */
import type { GamePointsSummaryV1 } from "@/lib/results/gamePointsSummary";

export type ResultScoreRelKind = "max" | "top5" | "top10" | "none";

export type ResultScoreRelSummaryInput = Pick<
  GamePointsSummaryV1,
  "n" | "max" | "p95" | "p90"
>;

export function parseStoredResultScoreRel(
  raw: unknown
): ResultScoreRelKind | null {
  if (raw === "max" || raw === "top5" || raw === "top10" || raw === "none") {
    return raw;
  }
  return null;
}

/**
 * 表示は #1 / TOP 5% / TOP 10% のみ。それ以外は none。
 * - max と同等 → #1
 * - p95 以上 → TOP 5%
 * - p90 以上 → TOP 10%
 */
export function resolveResultScoreRelative(
  myScore: number,
  summary: ResultScoreRelSummaryInput | null | undefined
): ResultScoreRelKind {
  if (!summary || summary.n <= 0 || !Number.isFinite(myScore)) {
    return "none";
  }

  const max = summary.max;
  if (
    typeof max === "number" &&
    Number.isFinite(max) &&
    myScore >= max - 1e-9
  ) {
    return "max";
  }

  const p95 = summary.p95;
  if (
    typeof p95 === "number" &&
    Number.isFinite(p95) &&
    myScore >= p95 - 1e-9
  ) {
    return "top5";
  }

  const p90 = summary.p90;
  if (
    typeof p90 === "number" &&
    Number.isFinite(p90) &&
    myScore >= p90 - 1e-9
  ) {
    return "top10";
  }

  return "none";
}

/** 埋め込み値優先。なければ summary から算出。 */
export function resolveResultScoreRelForPost(
  stored: unknown,
  myScore: number,
  summary?: ResultScoreRelSummaryInput | null
): ResultScoreRelKind {
  const fromPost = parseStoredResultScoreRel(stored);
  if (fromPost != null) return fromPost;
  return resolveResultScoreRelative(myScore, summary ?? null);
}

export function resultScoreRelText(
  kind: ResultScoreRelKind
): string | null {
  switch (kind) {
    case "max":
      return "#1";
    case "top5":
      return "TOP 5%";
    case "top10":
      return "TOP 10%";
    default:
      return null;
  }
}
