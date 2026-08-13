/**
 * リザルト詳細の共有 view-model。
 * コスト: posts 1 + games 1（キャッシュ可）。
 * game.pointsSummary = 中央値・最高・件数・p90/p95・Top10（分布 bins なし）。
 */
import {
  buildResultCardFaceModel,
  type ResultCardFaceMarketInput,
  type ResultCardFaceModel,
} from "@/lib/result/buildResultCardFace";
import type { ResultSettlementBreakdown } from "@/lib/result/buildResultStatRows";
import type {
  GamePointsSummaryV1,
  GamePointsTopEntryV1,
} from "@/lib/results/gamePointsSummary";
import type { ResultTopScorerMarketView } from "@/lib/result/resultTopScorerMarket";

export type ResultDetailMatchStats = {
  median: number | null;
  max: number | null;
  postCount: number;
};

export type ResultDetailBreakdownView = ResultSettlementBreakdown & {
  topScorerName: string | null;
  topScorerHit: boolean | null;
};

export type ResultDetailViewModel = {
  card: ResultCardFaceModel;
  matchStats: ResultDetailMatchStats | null;
  breakdown: ResultDetailBreakdownView;
  topEntries: GamePointsTopEntryV1[];
  pointsSummary: GamePointsSummaryV1 | null;
  /** NBA 最多得点者の選択分布（未埋め込み時は null） */
  topScorerMarket: ResultTopScorerMarketView | null;
};

export function buildResultDetailMatchStats(
  summary: GamePointsSummaryV1 | null | undefined
): ResultDetailMatchStats | null {
  if (!summary || summary.n <= 0) return null;
  return {
    median: summary.median,
    max: summary.max ?? null,
    postCount: summary.n,
  };
}

/**
 * post + 既読 game 断片から詳細 VM を構築（追加ネットワークなし）。
 */
export function buildResultDetailViewModel(
  post: Record<string, unknown> & { id?: string },
  options?: {
    market?: ResultCardFaceMarketInput | null;
    pointsSummary?: GamePointsSummaryV1 | null;
    leadingScorers?: unknown;
    topScorerCandidates?: unknown;
    topScorerMarket?: ResultTopScorerMarketView | null;
    /** ログイン中ユーザー（Top10 の "You" 置換用） */
    viewer?: {
      uid?: string | null;
      handle?: string | null;
      displayName?: string | null;
      photoURL?: string | null;
      isPro?: boolean;
    } | null;
  }
): ResultDetailViewModel {
  const summary = options?.pointsSummary ?? null;
  const card = buildResultCardFaceModel(post, {
    market: options?.market,
    pointsSummary: summary,
    leadingScorers: options?.leadingScorers,
    topScorerCandidates: options?.topScorerCandidates,
  });

  const topRaw = summary?.top ?? [];
  const viewer = options?.viewer;
  const topEntries = topRaw.map((row) => {
    if (!viewer?.uid || !row.uid || row.uid !== viewer.uid) return row;
    return {
      ...row,
      handle: (viewer.handle && viewer.handle.trim()) || row.handle,
      displayName:
        (viewer.displayName && viewer.displayName.trim()) ||
        row.displayName,
      photoURL:
        viewer.photoURL !== undefined ? viewer.photoURL : row.photoURL,
      isPro: viewer.isPro ?? row.isPro,
    };
  });

  return {
    card,
    matchStats: buildResultDetailMatchStats(summary),
    breakdown: {
      ...card.breakdown,
      topScorerName: card.topScorer,
      topScorerHit: card.topScorerHit,
    },
    topEntries,
    pointsSummary: summary,
    topScorerMarket: options?.topScorerMarket ?? null,
  };
}
