/**
 * Result detail: posts + games をまとめて取得（Web / Native 共用）。
 * Firestore インスタンスは呼び出し側から渡す。
 */
import { doc, getDoc, type Firestore } from "firebase/firestore";
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

export type LoadResultPostDetailResult =
  | { ok: false; reason: "missing" }
  | {
      ok: true;
      post: PredictionPostV2 & Record<string, unknown>;
      market: ResultPostDetailMarket | null;
      pointsSummary: GamePointsSummaryV1 | null;
      /** @deprecated 旧分布チャート用 */
      pointsDistribution: GamePointsDistributionV1 | null;
      game: Record<string, unknown> | null;
    };

function marketFromGameDoc(
  gameData: Record<string, unknown>
): ResultPostDetailMarket | null {
  const mkt = gameData.market as
    | {
        homeRate?: number;
        awayRate?: number;
        drawRate?: number;
        total?: number;
      }
    | undefined;
  const asFinite = (v: unknown, fallback = 0) => {
    const n = Number(v ?? fallback);
    return Number.isFinite(n) ? n : fallback;
  };
  const homeRate = asFinite(mkt?.homeRate, 0);
  const awayRate = asFinite(mkt?.awayRate, 0);
  const drawRate = asFinite(mkt?.drawRate, 0);
  const total = asFinite(mkt?.total, 0);
  // 未書き込みの {0,0,0} は null（post.marketMeta を 0% で潰さない）
  if (!(homeRate > 0 || awayRate > 0 || drawRate > 0 || total > 0)) {
    return null;
  }
  return { homeRate, awayRate, drawRate, total };
}

/** posts + games（キャッシュ付き）。追加 BDL なし */
export async function loadResultPostDetail(
  postId: string,
  firestore: Firestore
): Promise<LoadResultPostDetailResult> {
  const postSnap = await getDoc(doc(firestore, "posts", postId));
  if (!postSnap.exists()) {
    return { ok: false, reason: "missing" };
  }

  const post = {
    id: postSnap.id,
    ...postSnap.data(),
  } as PredictionPostV2 & Record<string, unknown>;

  const gid = typeof post.gameId === "string" ? post.gameId.trim() : "";
  if (!gid) {
    return {
      ok: true,
      post,
      market: null,
      pointsSummary: null,
      pointsDistribution: null,
      game: null,
    };
  }

  const { exists: gameExists, data: gameData } = await getCachedGameDocForResult(
    gid,
    firestore
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

  const market = marketFromGameDoc(gameData);
  const pointsDistribution = parseGamePointsDistributionV1(
    rawPointsDistributionFromGameDoc(gameData)
  );
  const pointsSummary = resolveGamePointsSummary(gameData);
  if (pointsSummary?.top.length) {
    pointsSummary.top = await enrichTopEntriesCountryFromUsers(
      firestore,
      pointsSummary.top
    );
  }

  return {
    ok: true,
    post,
    market,
    pointsSummary,
    pointsDistribution,
    game: { id: gid, ...gameData },
  };
}

/** 取得結果 → 共有 VM（追加 read なし） */
export function buildResultDetailViewFromLoad(
  loaded: Extract<LoadResultPostDetailResult, { ok: true }>,
  viewer?: {
    uid?: string | null;
    handle?: string | null;
    displayName?: string | null;
    photoURL?: string | null;
    isPro?: boolean;
  } | null
): ResultDetailViewModel {
  const game = loaded.game;
  return buildResultDetailViewModel(loaded.post, {
    market: loaded.market
      ? {
          homeRate: loaded.market.homeRate,
          awayRate: loaded.market.awayRate,
        }
      : null,
    pointsSummary: loaded.pointsSummary,
    leadingScorers: game?.leadingScorers,
    topScorerCandidates: game?.topScorerCandidates,
    topScorerMarket: resolveTopScorerMarketView(game, loaded.post),
    gameMeta: game
      ? {
          roundLabel: game.roundLabel,
          playoffRound: game.playoffRound,
          seasonRound: game.seasonRound,
          seasonPhase: game.seasonPhase,
          isPickup: game.isPickup,
          pickupWeekKey: game.pickupWeekKey,
        }
      : null,
    viewer,
  });
}

/** post だけ先に描画する warm VM（一覧 → 詳細の即時表示） */
export function buildWarmResultDetailViewFromPost(
  post: Record<string, unknown> & { id?: string },
  options?: {
    viewer?: {
      uid?: string | null;
      handle?: string | null;
      displayName?: string | null;
      photoURL?: string | null;
      isPro?: boolean;
    } | null;
    market?: { homeRate: number; awayRate: number } | null;
    gameMeta?: {
      roundLabel?: unknown;
      playoffRound?: unknown;
      seasonRound?: unknown;
      seasonPhase?: unknown;
    } | null;
  } | null
): ResultDetailViewModel {
  return buildResultDetailViewModel(post, {
    viewer: options?.viewer ?? null,
    ...(options?.market
      ? {
          market: {
            homeRate: options.market.homeRate,
            awayRate: options.market.awayRate,
          },
        }
      : {}),
    ...(options?.gameMeta ? { gameMeta: options.gameMeta } : {}),
  });
}
