import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getCachedGameDocForResult } from "@/lib/result/resultDetailFirestoreCache";
import type { PredictionPostV2 } from "@/types/prediction-post-v2";
import {
  parseGamePointsDistributionV1,
  rawPointsDistributionFromGameDoc,
  type GamePointsDistributionV1,
} from "@/lib/results/gamePointsDistribution";
import {
  resolveGamePointsSummary,
  type GamePointsSummaryV1,
} from "@/lib/results/gamePointsSummary";
import {
  buildResultDetailViewModel,
  type ResultDetailViewModel,
} from "@/lib/result/buildResultDetailView";
import { resolveTopScorerMarketView } from "@/lib/result/buildTopScorerMarketEmbed";

export type ResultPostDetailMarket = {
  homeRate: number;
  awayRate: number;
  drawRate?: number;
  total?: number;
};

export type LoadResultPostDetailClientResult =
  | { ok: false; reason: "missing" }
  | {
      ok: true;
      post: PredictionPostV2;
      market: ResultPostDetailMarket | null;
      pointsSummary: GamePointsSummaryV1 | null;
      /** @deprecated 旧分布チャート用 */
      pointsDistribution: GamePointsDistributionV1 | null;
      game: Record<string, unknown> | null;
    };

/** posts + games をまとめて取得（クライアント専用）。 */
export async function loadResultPostDetailClient(
  postId: string
): Promise<LoadResultPostDetailClientResult> {
  const postSnap = await getDoc(doc(db, "posts", postId));
  if (!postSnap.exists()) {
    return { ok: false, reason: "missing" };
  }

  const post = {
    id: postSnap.id,
    ...postSnap.data(),
  } as PredictionPostV2;

  const { exists: gameExists, data: gameData } = await getCachedGameDocForResult(
    post.gameId
  );

  if (!gameExists || !gameData) {
    return {
      ok: true,
      post,
      market: null,
      pointsSummary: null,
      pointsDistribution: null,
      game: null,
    };
  }
  const mkt = gameData.market as
    | {
        homeRate?: number;
        awayRate?: number;
        drawRate?: number;
        total?: number;
      }
    | undefined;
  const market: ResultPostDetailMarket = {
    homeRate: mkt?.homeRate ?? 0,
    awayRate: mkt?.awayRate ?? 0,
    drawRate: mkt?.drawRate ?? 0,
    total: mkt?.total ?? 0,
  };

  return {
    ok: true,
    post,
    market,
    pointsSummary: resolveGamePointsSummary(gameData),
    pointsDistribution: parseGamePointsDistributionV1(
      rawPointsDistributionFromGameDoc(gameData)
    ),
    game: gameData,
  };
}

/** 取得結果 → 新カード／詳細共有 VM（追加 read なし） */
export function buildResultDetailViewFromLoad(
  loaded: Extract<LoadResultPostDetailClientResult, { ok: true }>,
  viewer?: {
    uid?: string | null;
    handle?: string | null;
    displayName?: string | null;
    photoURL?: string | null;
    isPro?: boolean;
  } | null
): ResultDetailViewModel {
  const game = loaded.game;
  return buildResultDetailViewModel(loaded.post as Record<string, unknown>, {
    market: loaded.market
      ? {
          homeRate: loaded.market.homeRate,
          awayRate: loaded.market.awayRate,
        }
      : null,
    pointsSummary: loaded.pointsSummary,
    leadingScorers: game?.leadingScorers,
    topScorerCandidates: game?.topScorerCandidates,
    topScorerMarket: resolveTopScorerMarketView(
      game,
      loaded.post as Record<string, unknown>
    ),
    viewer,
  });
}
