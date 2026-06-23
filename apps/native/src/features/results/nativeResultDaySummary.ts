import type { PostWithMillis } from "./nativeResultModel";

/** Web `ResultListWithOverlay` の predictionWinState と同等 */
function predictionWinState(post: PostWithMillis): boolean | null {
  const stats = post.stats as Record<string, unknown> | undefined;
  const iw = stats?.isWin;
  if (iw === true) return true;
  if (iw === false) return false;
  const detail = stats?.pointsV3Detail as { winnerCorrect?: boolean } | undefined;
  if (detail?.winnerCorrect === true) return true;
  if (detail?.winnerCorrect === false) return false;
  return null;
}

/** Web `sumDayPointsV3` と同等 */
export function sumDayPointsV3(posts: readonly PostWithMillis[]): number {
  let s = 0;
  for (const p of posts) {
    const stats = p.stats as Record<string, unknown> | undefined;
    const v =
      stats?.pointsV3 ??
      (stats?.pointsV3Detail as { totalPoints?: number } | undefined)?.totalPoints;
    if (typeof v === "number" && Number.isFinite(v)) s += v;
  }
  return s;
}

/** Web `hasPointsV3Recorded` と同等（0 点も記録済み） */
function hasPointsV3Recorded(post: PostWithMillis): boolean {
  const stats = post.stats as Record<string, unknown> | undefined;
  const pv3 = stats?.pointsV3;
  if (typeof pv3 === "number" && Number.isFinite(pv3)) return true;
  const tp = (stats?.pointsV3Detail as { totalPoints?: number } | undefined)?.totalPoints;
  return typeof tp === "number" && Number.isFinite(tp);
}

/** Web `countWinnerHits` と同等 */
export function countWinnerHits(posts: readonly PostWithMillis[]): {
  wins: number;
  total: number;
} {
  let wins = 0;
  let total = 0;
  for (const p of posts) {
    const w = predictionWinState(p);
    if (w === null) continue;
    total += 1;
    if (w === true) wins += 1;
  }
  return { wins, total };
}

export type NativeDayPointsHeader =
  | null
  | { variant: "pending"; line: string }
  | {
      variant: "total";
      value: string;
      prefix: string;
      unit: string;
      hitWins?: number;
      hitTotal?: number;
    };

/**
 * Web `dayPointsHeaderForList` と同じ引数順（先が確定投稿・後が未確定）。
 * `final` / `pending` を逆に渡すと確定がある日も「得点未確定」になる。
 * 確定でも pointsV3 が未計算の投稿が混ざる日は「得点未確定」（合計 0 の誤表示を避ける）。
 */
export function dayPointsHeaderForNative(
  finalPosts: PostWithMillis[],
  pendingPosts: PostWithMillis[],
  language: "ja" | "en"
): NativeDayPointsHeader {
  if (finalPosts.length > 0 && finalPosts.every(hasPointsV3Recorded)) {
    const total = sumDayPointsV3(finalPosts);
    const fmt =
      Number.isInteger(total) || Math.abs(total - Math.round(total)) < 1e-6
        ? String(Math.round(total))
        : total.toFixed(1);
    const { wins: hitWins, total: hitTotal } = countWinnerHits(finalPosts);
    if (language === "en") {
      return {
        variant: "total",
        value: fmt,
        prefix: "total",
        unit: "pts",
        ...(hitTotal > 0 ? { hitWins, hitTotal } : {}),
      };
    }
    return {
      variant: "total",
      value: fmt,
      prefix: "total",
      unit: "pt",
      ...(hitTotal > 0 ? { hitWins, hitTotal } : {}),
    };
  }
  if (finalPosts.length > 0 || pendingPosts.length > 0) {
    return language === "en"
      ? { variant: "pending", line: "Pending" }
      : { variant: "pending", line: "得点未確定" };
  }
  return null;
}
