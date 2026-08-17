import { getAdminDb } from "@/lib/firebaseAdmin";
import type { Language } from "@/lib/i18n/language";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import type { RankingLeagueSource } from "@/lib/rankings/rankingLeagueSource";
import type { RankShadowAnalysis } from "@/lib/rankings/rankShadowAnalysis";
import { dateKeyJST } from "@/lib/rankings/rankSnapshotDate";
import type { WcRankingStage } from "@/lib/rankings/wcRankingStage";

export const RANK_SHADOW_CACHE_SUBCOL = "rankIntelShadowCache";

export type RankShadowCacheDoc = {
  weekStartDateKey: string;
  bandAnchorDateKey: string;
  metricAnchorDateKey: string;
  contextKey: string;
  language: Language;
  computedAtDateKey: string;
  analysis: RankShadowAnalysis;
};

export function buildRankShadowCacheId(input: {
  weekStartDateKey: string;
  rankingLeague: RankingLeagueSource;
  language: Language;
}): string {
  const scope = CURRENT_NBA_SEASON_KEY;
  return [
    input.weekStartDateKey,
    input.rankingLeague,
    scope,
    input.language,
  ].join("_");
}

export function buildRankShadowContextKey(input: {
  rankingLeague: RankingLeagueSource;
}): string {
  const scope = CURRENT_NBA_SEASON_KEY;
  return [input.rankingLeague, scope].join("_");
}

export async function readRankShadowCache(input: {
  uid: string;
  cacheId: string;
  weekStartDateKey: string;
}): Promise<RankShadowAnalysis | null> {
  const db = getAdminDb();
  const snap = await db
    .collection("cumulative_stats")
    .doc(input.uid)
    .collection(RANK_SHADOW_CACHE_SUBCOL)
    .doc(input.cacheId)
    .get();
  if (!snap.exists) return null;

  const data = snap.data() as RankShadowCacheDoc;
  if (data.weekStartDateKey !== input.weekStartDateKey) return null;
  if (data.computedAtDateKey !== dateKeyJST()) return null;
  if (!data.analysis?.ok) return null;
  return data.analysis;
}

export async function writeRankShadowCache(input: {
  uid: string;
  cacheId: string;
  doc: RankShadowCacheDoc;
}): Promise<void> {
  const db = getAdminDb();
  await db
    .collection("cumulative_stats")
    .doc(input.uid)
    .collection(RANK_SHADOW_CACHE_SUBCOL)
    .doc(input.cacheId)
    .set(input.doc, { merge: true });
}
