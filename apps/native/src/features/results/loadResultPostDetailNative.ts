/**
 * Web `lib/result/loadResultPostDetailClient.ts` と同一の取得内容（posts + games）。
 */
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import {
  parseGamePointsDistributionV1,
  rawPointsDistributionFromGameDoc,
  type GamePointsDistributionV1,
} from "../../../../../lib/results/gamePointsDistribution";
import {
  resolveGamePointsSummary,
  type GamePointsSummaryV1,
} from "../../../../../lib/results/gamePointsSummary";
import {
  buildResultDetailViewModel,
  type ResultDetailViewModel,
} from "../../../../../lib/result/buildResultDetailView";
import { resolveTopScorerMarketView } from "../../../../../lib/result/buildTopScorerMarketEmbed";
import { enrichTopEntriesCountryFromUsers } from "../../../../../lib/results/enrichTopEntriesCountryFromUsers";

const GAME_DOC_TTL_MS = 3 * 60 * 1000;

type GameCacheEntry = {
  at: number;
  exists: boolean;
  data: Record<string, unknown> | null;
};

const gameDocCache = new Map<string, GameCacheEntry>();

async function getCachedGameDocForResultNative(
  gameId: string
): Promise<{ exists: boolean; data: Record<string, unknown> | null }> {
  const hit = gameDocCache.get(gameId);
  const now = Date.now();
  if (hit && now - hit.at < GAME_DOC_TTL_MS) {
    return { exists: hit.exists, data: hit.data };
  }
  const snap = await getDoc(doc(db, "games", gameId));
  const exists = snap.exists();
  const data = exists ? (snap.data() as Record<string, unknown>) : null;
  gameDocCache.set(gameId, { at: now, exists, data });
  return { exists, data };
}

export type ResultPostDetailMarket = {
  homeRate: number;
  awayRate: number;
  drawRate?: number;
  total?: number;
};

/** Firestore 生データ＋ id（詳細画面用） */
export type ResultDetailPost = Record<string, unknown> & { id: string };

export type LoadResultPostDetailNativeResult =
  | { ok: false; reason: "missing" }
  | {
      ok: true;
      post: ResultDetailPost;
      market: ResultPostDetailMarket | null;
      /** 新カード／詳細用（bins なし） */
      pointsSummary: GamePointsSummaryV1 | null;
      /** @deprecated 旧分布チャート用。新規 UI では使わない */
      pointsDistribution: GamePointsDistributionV1 | null;
      game: Record<string, unknown> | null;
    };

/** Web `loadResultPostDetailClient` と同じ手順 */
export async function loadResultPostDetailNative(
  postId: string
): Promise<LoadResultPostDetailNativeResult> {
  const postSnap = await getDoc(doc(db, "posts", postId));
  if (!postSnap.exists()) {
    return { ok: false, reason: "missing" };
  }
  const post = {
    id: postSnap.id,
    ...postSnap.data(),
  } as ResultDetailPost;

  const gid = post.gameId;
  if (typeof gid !== "string" || !gid.trim()) {
    return {
      ok: true,
      post,
      market: null,
      pointsSummary: null,
      pointsDistribution: null,
      game: null,
    };
  }

  const { exists: gameExists, data: gameData } =
    await getCachedGameDocForResultNative(gid.trim());

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

  const asFinite = (v: unknown, fallback = 0) => {
    const n = Number(v ?? fallback);
    return Number.isFinite(n) ? n : fallback;
  };
  const market: ResultPostDetailMarket = {
    homeRate: asFinite(mkt?.homeRate, 0),
    awayRate: asFinite(mkt?.awayRate, 0),
    drawRate: asFinite(mkt?.drawRate, 0),
    total: asFinite(mkt?.total, 0),
  };

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
    game: { id: gid.trim(), ...gameData },
  };
}

/** 取得結果 → 新カード／詳細共有 VM（追加 read なし） */
export function buildResultDetailViewFromLoad(
  loaded: Extract<LoadResultPostDetailNativeResult, { ok: true }>,
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
    viewer,
  });
}
