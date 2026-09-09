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
import { enrichTopEntriesCountryFromUsers } from "@/lib/results/enrichTopEntriesCountryFromUsers";

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
    post.gameId,
    db
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
  const homeRate = Number(mkt?.homeRate ?? 0);
  const awayRate = Number(mkt?.awayRate ?? 0);
  const drawRate = Number(mkt?.drawRate ?? 0);
  const total = Number(mkt?.total ?? 0);
  const market: ResultPostDetailMarket | null =
    (Number.isFinite(homeRate) && homeRate > 0) ||
    (Number.isFinite(awayRate) && awayRate > 0) ||
    (Number.isFinite(drawRate) && drawRate > 0) ||
    (Number.isFinite(total) && total > 0)
      ? {
          homeRate: Number.isFinite(homeRate) ? homeRate : 0,
          awayRate: Number.isFinite(awayRate) ? awayRate : 0,
          drawRate: Number.isFinite(drawRate) ? drawRate : 0,
          total: Number.isFinite(total) ? total : 0,
        }
      : null;

  const pointsDistribution = parseGamePointsDistributionV1(
    rawPointsDistributionFromGameDoc(gameData)
  );
  const pointsSummary = resolveGamePointsSummary(gameData);
  if (pointsSummary?.top.length) {
    pointsSummary.top = await enrichTopEntriesCountryFromUsers(
      db,
      pointsSummary.top
    );
  }

  return {
    ok: true,
    post,
    market,
    pointsSummary,
    pointsDistribution,
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
    gameMeta: game
      ? {
          roundLabel: (game as Record<string, unknown>).roundLabel,
          playoffRound: (game as Record<string, unknown>).playoffRound,
          seasonRound: (game as Record<string, unknown>).seasonRound,
          seasonPhase: (game as Record<string, unknown>).seasonPhase,
        }
      : null,
    viewer,
  });
}
