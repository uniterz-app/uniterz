import {
  computePostSettlement,
  type PostSettlementComputed,
} from "./computePostSettlement";
import type { SettlementGameInput } from "./settlementGame";
import type { UpdatedUserStreakResult } from "./updateUserStreak";

export type GamePointsTopEntryAgg = {
  rank: number;
  postId: string;
  uid: string | null;
  handle: string;
  displayName: string;
  photoURL: string | null;
  isPro: boolean;
  points: number;
};

/** games.pointsSummary — 分布 bins なし */
export type GamePointsSummaryAgg = {
  v: 1;
  n: number;
  median: number | null;
  max: number | null;
  p95: number | null;
  p90: number | null;
  top: GamePointsTopEntryAgg[];
};

export type ResultScoreRelAgg = "max" | "top5" | "top10" | "none";

export function resolveScoreRelFromSummary(
  myScore: number,
  summary: Pick<GamePointsSummaryAgg, "n" | "max" | "p95" | "p90">
): ResultScoreRelAgg {
  if (!summary || summary.n <= 0 || !Number.isFinite(myScore)) return "none";
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

export type GamePointsSummaryBuildResult = {
  summary: GamePointsSummaryAgg;
  /** postId → 決済結果（finalize で再計算しない） */
  settlementByPostId: Map<string, PostSettlementComputed>;
};

function percentileFloorFromSortedAsc(
  sortedAsc: number[],
  topFraction: number
): number | null {
  const n = sortedAsc.length;
  if (n <= 0) return null;
  const k = Math.max(1, Math.ceil(n * topFraction));
  return sortedAsc[n - k] ?? null;
}

function buildSummaryFromScores(
  scores: number[],
  top: GamePointsTopEntryAgg[]
): GamePointsSummaryAgg {
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
  return {
    v: 1,
    n,
    median,
    max: sorted[n - 1] ?? null,
    p95: percentileFloorFromSortedAsc(sorted, 0.05),
    p90: percentileFloorFromSortedAsc(sorted, 0.1),
    top: top.slice(0, 10),
  };
}

function authorMetaFromPost(data: FirebaseFirestore.DocumentData): {
  uid: string | null;
  handle: string;
  displayName: string;
  photoURL: string | null;
  isPro: boolean;
} {
  const uid =
    typeof data.authorUid === "string" && data.authorUid.trim()
      ? data.authorUid.trim()
      : null;
  const author =
    data.author !== null && typeof data.author === "object"
      ? (data.author as Record<string, unknown>)
      : null;
  const handleRaw =
    (typeof data.authorHandle === "string" && data.authorHandle.trim()
      ? data.authorHandle.trim()
      : null) ??
    (typeof author?.handle === "string" && String(author.handle).trim()
      ? String(author.handle).trim()
      : null);
  const displayNameRaw =
    typeof author?.name === "string" && String(author.name).trim()
      ? String(author.name).trim()
      : null;
  const handle = handleRaw ?? displayNameRaw ?? "—";
  const displayName = displayNameRaw ?? handle;
  const photoURL =
    typeof author?.avatarUrl === "string" && String(author.avatarUrl).trim()
      ? String(author.avatarUrl).trim()
      : null;
  const isPro =
    data.authorIsPro === true ||
    author?.plan === "pro" ||
    author?.isPro === true;
  return { uid, handle, displayName, photoURL, isPro };
}

/**
 * 既取得の posts スナップから pointsSummary + 各投稿の決済結果を構築。
 * 追加 posts クエリなし。finalize は settlement を再利用して再計算しない。
 */
export function aggregateGamePointsSummaryFromPostsSnap({
  postsSnap,
  game,
  market,
  hadUpsetGame,
  streakResultMap,
}: {
  postsSnap: FirebaseFirestore.QuerySnapshot;
  game: SettlementGameInput;
  market: {
    majoritySide: string;
    majorityRatio: number;
    total: number;
  };
  hadUpsetGame: boolean;
  streakResultMap: Map<string, UpdatedUserStreakResult>;
}): GamePointsSummaryBuildResult {
  const scores: number[] = [];
  const scoredRows: GamePointsTopEntryAgg[] = [];
  const settlementByPostId = new Map<string, PostSettlementComputed>();

  for (const doc of postsSnap.docs) {
    const p = doc.data();
    const settlement = computePostSettlement({
      p,
      game: {
        ...game,
      },
      market,
      hadUpsetGame,
      streakResultMap,
    });
    scores.push(settlement.totalPoints);
    settlementByPostId.set(doc.id, settlement);
    const author = authorMetaFromPost(p);
    scoredRows.push({
      rank: 0,
      postId: doc.id,
      uid: author.uid,
      handle: author.handle,
      displayName: author.displayName,
      photoURL: author.photoURL,
      isPro: author.isPro,
      points: settlement.totalPoints,
    });
  }

  const top = scoredRows
    .sort((a, b) => b.points - a.points || a.postId.localeCompare(b.postId))
    .slice(0, 10)
    .map((row, i) => ({
      ...row,
      rank: i + 1,
    }));

  return {
    summary: buildSummaryFromScores(scores, top),
    settlementByPostId,
  };
}

/** @deprecated */
export const aggregateGamePointsDistributionFromPostsSnap =
  aggregateGamePointsSummaryFromPostsSnap;
