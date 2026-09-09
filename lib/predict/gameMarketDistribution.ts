import type { League } from "@/lib/leagues";
import {
  liveGameMarketFromCounts,
  readLiveMarketCounts,
} from "@/lib/predict/liveGameMarket";

export type MarketBiasFallback = {
  homePct: number;
  awayPct: number;
};

/** 0–1 rate と 0–100 pct の両方を pct に揃える */
function asMarketPct(v: unknown): number | undefined {
  if (typeof v !== "number" || !Number.isFinite(v)) return undefined;
  if (v >= 0 && v <= 1) return v * 100;
  if (v >= 0 && v <= 100) return v;
  return undefined;
}

function clampPct(v: number): number {
  return Math.max(0, Math.min(100, v));
}

/**
 * Web `toMatchCardProps` と同じ：欠落時は 50/50。
 * Native オーバーレイの市場バーが消えないようにする。
 * `homeRate` が 0–1 のときは pct に正規化する。
 */
export function resolveMarketBiasFallback(
  raw?: {
    homePct?: number | null;
    awayPct?: number | null;
    homeRate?: number | null;
    awayRate?: number | null;
  } | null,
  nestedMarket?: {
    homePct?: number | null;
    awayPct?: number | null;
    homeRate?: number | null;
    awayRate?: number | null;
  } | null
): MarketBiasFallback {
  const homePct = clampPct(
    asMarketPct(raw?.homePct) ??
      asMarketPct(nestedMarket?.homePct) ??
      asMarketPct(nestedMarket?.homeRate) ??
      asMarketPct(raw?.homeRate) ??
      50
  );
  const awayPct = clampPct(
    asMarketPct(raw?.awayPct) ??
      asMarketPct(nestedMarket?.awayPct) ??
      asMarketPct(nestedMarket?.awayRate) ??
      asMarketPct(raw?.awayRate) ??
      50
  );
  return { homePct, awayPct };
}

/**
 * games ドキュメントから表示用の市場偏りを組む。
 * 優先: 投稿1件+自分の勝者 → marketPickCounts → marketBias/market → 自分の勝者 → 50/50。
 */
export function resolveGameMarketBiasDisplay(
  game?: Record<string, unknown> | null,
  options?: {
    userWinner?: "home" | "away" | "draw" | null;
    predictionCount?: number | null;
  }
): MarketBiasFallback {
  const winner = options?.userWinner ?? null;
  const predictionCount =
    typeof options?.predictionCount === "number" &&
    Number.isFinite(options.predictionCount) &&
    options.predictionCount >= 0
      ? Math.floor(options.predictionCount)
      : null;

  // 1票しかないとき 50/50 はあり得ない（CDN 未更新の既定値を上書き）
  if (
    predictionCount === 1 &&
    (winner === "home" || winner === "away")
  ) {
    return winner === "home"
      ? { homePct: 100, awayPct: 0 }
      : { homePct: 0, awayPct: 100 };
  }

  if (game) {
    const counts = readLiveMarketCounts(game);
    if (counts.home + counts.away > 0) {
      return liveGameMarketFromCounts(counts).marketBias;
    }

    const bias =
      game.marketBias !== null && typeof game.marketBias === "object"
        ? (game.marketBias as Record<string, unknown>)
        : null;
    const market =
      game.market !== null && typeof game.market === "object"
        ? (game.market as Record<string, unknown>)
        : null;
    const home =
      asMarketPct(bias?.homePct) ??
      asMarketPct(market?.homePct) ??
      asMarketPct(market?.homeRate) ??
      asMarketPct(game.homePct);
    const away =
      asMarketPct(bias?.awayPct) ??
      asMarketPct(market?.awayPct) ??
      asMarketPct(market?.awayRate) ??
      asMarketPct(game.awayPct);
    if (home != null || away != null) {
      const h = home ?? 0;
      const a = away ?? 0;
      if (h + a > 0) {
        return {
          homePct: clampPct(h),
          awayPct: clampPct(a),
        };
      }
    }
  }

  if (winner === "home") return { homePct: 100, awayPct: 0 };
  if (winner === "away") return { homePct: 0, awayPct: 100 };

  return { homePct: 50, awayPct: 50 };
}

/** games.predictorCount（投稿時 increment）。無いときは settle 後の pointsSummary.n */
export function readGamePredictorCount(
  raw?: Record<string, unknown> | null
): number | undefined {
  if (!raw) return undefined;
  const direct = raw.predictorCount;
  if (typeof direct === "number" && Number.isFinite(direct) && direct >= 0) {
    return Math.floor(direct);
  }
  const summary = raw.pointsSummary;
  const n =
    summary && typeof summary === "object"
      ? (summary as { n?: unknown }).n
      : undefined;
  if (typeof n === "number" && Number.isFinite(n) && n >= 0) {
    return Math.floor(n);
  }
  return undefined;
}

export type GamePredictionCounts = {
  homeCount: number;
  awayCount: number;
  drawCount: number;
};

export type GameMarketPcts = {
  homePct: number;
  awayPct: number;
  drawPct: number;
  total: number;
  fromFallback: boolean;
};

export function isSoccerMarketLeague(league: League | string): boolean {
  return league === "j1" || league === "pl" || league === "wc";
}

/** posts 全件 read は廃止（常に 0）。UI は game.pointsDistribution へ移行。 */
export async function fetchGamePredictionCounts(
  _gameId: string
): Promise<GamePredictionCounts> {
  return { homeCount: 0, awayCount: 0, drawCount: 0 };
}

export function computeGameMarketPcts(
  counts: GamePredictionCounts,
  isSoccer: boolean,
  fallback?: MarketBiasFallback | null,
  options?: { excludeDraw?: boolean }
): GameMarketPcts {
  const drawEnabled = isSoccer && !options?.excludeDraw;
  const total = drawEnabled
    ? counts.homeCount + counts.awayCount + counts.drawCount
    : counts.homeCount + counts.awayCount;

  if (total > 0) {
    return {
      total,
      fromFallback: false,
      homePct: (counts.homeCount / total) * 100,
      awayPct: (counts.awayCount / total) * 100,
      drawPct: drawEnabled ? (counts.drawCount / total) * 100 : 0,
    };
  }

  const sumFb = (fallback?.homePct ?? 0) + (fallback?.awayPct ?? 0);
  if (sumFb <= 0) {
    return {
      total: 0,
      fromFallback: false,
      homePct: 0,
      awayPct: 0,
      drawPct: 0,
    };
  }

  const h = Math.max(0, fallback?.homePct ?? 0);
  const a = Math.max(0, fallback?.awayPct ?? 0);
  const s = Math.max(1e-6, h + a);

  return {
    total: 0,
    fromFallback: true,
    homePct: (h / s) * 100,
    awayPct: (a / s) * 100,
    drawPct: 0,
  };
}
