/**
 * profileCharts — cumulative_stats/{uid}/profileCharts/{season} が正。
 * 親 nested は移行期の読みフォールバックのみ。
 */
import { doc, getDoc, type Firestore } from "firebase/firestore";
import {
  parseProfileChartsBundle,
  type ProfileChartsBundle,
} from "@/lib/profile/profileChartsBundle";

export const PROFILE_CHARTS_SUBCOL = "profileCharts" as const;

export function profileChartsSubdocPath(
  uid: string,
  seasonKey: string
): string {
  return `cumulative_stats/${uid.trim()}/${PROFILE_CHARTS_SUBCOL}/${seasonKey.trim()}`;
}

const chartsCache = new Map<
  string,
  { at: number; bundle: ProfileChartsBundle | null }
>();
const CHARTS_CACHE_TTL_MS = 10 * 60_000;

export function invalidateProfileChartsCacheClient(uid: string): void {
  const prefix = `${uid.trim()}:`;
  for (const key of chartsCache.keys()) {
    if (key.startsWith(prefix)) chartsCache.delete(key);
  }
}

/**
 * subcollection → 親 nested の順で profileCharts を解決。
 */
export async function loadProfileChartsBundleClient(
  db: Firestore,
  uid: string,
  seasonKey: string,
  cumulativeFallback?: Record<string, unknown> | null
): Promise<ProfileChartsBundle | null> {
  const safeUid = uid.trim();
  const safeSeason = seasonKey.trim();
  if (!safeUid || !safeSeason) return null;

  const cacheKey = `${safeUid}:${safeSeason}`;
  const hit = chartsCache.get(cacheKey);
  if (hit && Date.now() - hit.at < CHARTS_CACHE_TTL_MS) {
    return hit.bundle;
  }

  let bundle: ProfileChartsBundle | null = null;
  try {
    const subSnap = await getDoc(
      doc(db, "cumulative_stats", safeUid, PROFILE_CHARTS_SUBCOL, safeSeason)
    );
    if (subSnap.exists()) {
      bundle = parseProfileChartsBundle(
        { profileCharts: subSnap.data() },
        safeSeason
      );
    }
  } catch {
    /* fall through */
  }

  if (!bundle && cumulativeFallback) {
    bundle = parseProfileChartsBundle(cumulativeFallback, safeSeason);
  }

  chartsCache.set(cacheKey, { at: Date.now(), bundle });
  return bundle;
}

/** Admin / Functions 向け — subcollection doc へ書くペイロード */
export function profileChartsSubdocFields(
  bundle: ProfileChartsBundle & { builtAtMs?: number }
): Record<string, unknown> {
  return {
    v: bundle.v,
    seasonKey: bundle.seasonKey,
    dailyTrend: bundle.dailyTrend ?? [],
    rankTrend: bundle.rankTrend ?? [],
    last20: bundle.last20 ?? [],
    builtAtMs: bundle.builtAtMs ?? Date.now(),
  };
}

/** 親 cumulative_stats への nested 書き込み（移行期 dual-write） */
export function profileChartsNestedFields(
  bundle: ProfileChartsBundle & { builtAtMs?: number }
): Record<string, unknown> {
  const fields = profileChartsSubdocFields(bundle);
  return {
    "profileCharts.v": fields.v,
    "profileCharts.seasonKey": fields.seasonKey,
    "profileCharts.dailyTrend": fields.dailyTrend,
    "profileCharts.rankTrend": fields.rankTrend,
    "profileCharts.last20": fields.last20,
    "profileCharts.builtAtMs": fields.builtAtMs,
  };
}
