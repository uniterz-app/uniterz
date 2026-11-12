/**
 * 先週の Pick Up 週間ランキング（totalPoints）上位 5% の人だけの予想分布（Pro Insight 用）。
 * 書き込み: Functions `buildNbaSmartMoneyMarkets`（日次の数え直し）+ `smartMoneyMarketServer.ts`（投稿の増減）。
 * 読み: `/api/nba/matchup-insight`（Pro のみ）。クライアントから Firestore 直読みはしない。
 */
import { liveGameMarketFromCounts } from "./liveGameMarket";

export const SMART_MONEY_COHORT_COLLECTION = "nbaSmartMoneyCohort";
export const SMART_MONEY_MARKETS_COLLECTION = "nbaSmartMoneyMarkets";
export const SMART_MONEY_TOP_PERCENT = 5;

export type SmartMoneyMarket = {
  /** コホートを切った週（Eastern 月曜） */
  weekLabel: string;
  home: number;
  away: number;
  draw: number;
  /** 上位 5% のうちこの試合を予想した人数 */
  predictorCount: number;
  /** 上位 5% の人数。不明なら null */
  cohortSize: number | null;
  /** HOME / AWAY のバー用（draw は入れない） */
  homePct: number;
  awayPct: number;
};

function nonNegInt(v: unknown): number {
  if (typeof v !== "number" || !Number.isFinite(v) || v <= 0) return 0;
  return Math.floor(v);
}

export function sanitizeSmartMoneyMarket(raw: unknown): SmartMoneyMarket | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const weekLabel = typeof o.weekLabel === "string" ? o.weekLabel : "";
  if (!weekLabel) return null;
  const counts = {
    home: nonNegInt(o.home),
    away: nonNegInt(o.away),
    draw: nonNegInt(o.draw),
  };
  const bias = liveGameMarketFromCounts(counts).marketBias;
  const cohortSize = nonNegInt(o.cohortSize);
  return {
    weekLabel,
    ...counts,
    predictorCount: counts.home + counts.away + counts.draw,
    cohortSize: cohortSize > 0 ? cohortSize : null,
    homePct: bias.homePct,
    awayPct: bias.awayPct,
  };
}
