/**
 * cumulative_stats.profileCharts を正とする overview チャート集計。
 * 欠けている部品だけソースから組み立てて書き戻し、以降のクライアント多重 read を無くす。
 */
import { FieldPath } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { filterDailyTrendToSeasonActivity } from "@/lib/profile/dailyTrendSeasonActivity";
import {
  PROFILE_CHARTS_BUNDLE_VERSION,
  PROFILE_CHARTS_DAILY_MAX,
  PROFILE_CHARTS_LAST20_MAX,
  PROFILE_CHARTS_RANK_MAX,
  isProfileChartsComplete,
  parseProfileChartsBundle,
  pruneDailyTrendRows,
  type ProfileChartsLast20Point,
  type ProfileChartsRankPoint,
} from "@/lib/profile/profileChartsBundle";
import type { ProfileDailyTrendRow } from "@/lib/profile/profileDailyTrendRow";
import { filterPostsForScope } from "@/lib/profile/profileStreakPostsCompute";
import { coerceTotalPointsRank } from "@/lib/profile/resolvePlayoffTotalPointsRank";
import {
  buildDailyTrendFromDailySnaps,
  resolveProfileDailyTrendContext,
} from "@/lib/profile/userStatsV2ProfileRollup";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import { loadRankSnapshotHistoryDocsWalkBack } from "@/lib/rankings/server/loadRankSnapshotHistoryDocs";
import { getPastDateKeysInTimeZone, TIMEZONE_JST } from "@/lib/time/zonedTime";

export type CompleteProfileChartsBundle = {
  v: typeof PROFILE_CHARTS_BUNDLE_VERSION;
  seasonKey: string;
  dailyTrend: ProfileDailyTrendRow[];
  rankTrend: ProfileChartsRankPoint[];
  last20: ProfileChartsLast20Point[];
  builtAtMs: number;
};

export { isProfileChartsComplete } from "@/lib/profile/profileChartsBundle";

const ensureInflight = new Map<string, Promise<CompleteProfileChartsBundle>>();

function shortCacheKey(uid: string, seasonKey: string) {
  return `${uid}:${seasonKey}`;
}

async function buildDailyTrend(
  uid: string,
  seasonKey: string
): Promise<ProfileDailyTrendRow[]> {
  const adminDb = getAdminDb();
  const keys = getPastDateKeysInTimeZone(new Date(), TIMEZONE_JST, 30);
  if (keys.length === 0) return [];
  const start = keys[keys.length - 1]!;
  const end = keys[0]!;
  const snap = await adminDb
    .collection("user_stats_v2_daily")
    .where(FieldPath.documentId(), ">=", `${uid}_${start}`)
    .where(FieldPath.documentId(), "<=", `${uid}_${end}`)
    .orderBy(FieldPath.documentId())
    .get();

  const ctx = resolveProfileDailyTrendContext("nba", undefined, "season");
  const rows = buildDailyTrendFromDailySnaps(snap.docs, ctx);
  return pruneDailyTrendRows(
    filterDailyTrendToSeasonActivity(rows),
    PROFILE_CHARTS_DAILY_MAX
  );
}

async function buildRankTrend(
  uid: string,
  seasonKey: string
): Promise<ProfileChartsRankPoint[]> {
  const historyDocs = await loadRankSnapshotHistoryDocsWalkBack(uid, {
    maxDocs: PROFILE_CHARTS_RANK_MAX,
    maxLookbackDays: 90,
  });

  const points: ProfileChartsRankPoint[] = [];
  for (const d of historyDocs) {
    const data = d.data as {
      seasons?: Record<string, Record<string, unknown>>;
    };
    const rank = coerceTotalPointsRank(
      data.seasons?.[seasonKey]?.totalPoints
    );
    if (rank == null) continue;
    points.push({ dateKey: d.id, rank });
  }
  return points.sort((a, b) => a.dateKey.localeCompare(b.dateKey));
}

async function buildLast20(uid: string): Promise<ProfileChartsLast20Point[]> {
  const adminDb = getAdminDb();
  const snap = await adminDb
    .collection("posts")
    .where("authorUid", "==", uid)
    .where("schemaVersion", "==", 2)
    .orderBy("settledAt", "desc")
    .limit(40)
    .get();

  const rows = snap.docs
    .map((d) => {
      const data = d.data() as Record<string, unknown>;
      const settledAt = data.settledAt as { toMillis?: () => number } | null;
      const ms =
        settledAt && typeof settledAt.toMillis === "function"
          ? settledAt.toMillis()
          : null;
      if (ms == null || !Number.isFinite(ms)) return null;
      const stats = data.stats as Record<string, unknown> | undefined;
      if (typeof stats?.isWin !== "boolean") return null;
      return {
        postId: d.id,
        gameId: typeof data.gameId === "string" ? data.gameId : null,
        settledAtMs: ms,
        isWin: stats.isWin,
        league: data.league,
        seasonPhase: data.seasonPhase,
        wcStage: data.wcStage,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r != null);

  const scoped = filterPostsForScope(rows, "nba:season", PROFILE_CHARTS_LAST20_MAX);
  return scoped
    .slice()
    .sort((a, b) => a.settledAtMs - b.settledAtMs)
    .map((r) => ({
      postId: r.postId,
      settledAtMs: r.settledAtMs,
      isWin: r.isWin,
    }));
}

async function writeCompleteBundle(
  uid: string,
  bundle: CompleteProfileChartsBundle
): Promise<void> {
  const adminDb = getAdminDb();
  await adminDb.collection("cumulative_stats").doc(uid).set(
    {
      "profileCharts.v": bundle.v,
      "profileCharts.seasonKey": bundle.seasonKey,
      "profileCharts.dailyTrend": bundle.dailyTrend,
      "profileCharts.rankTrend": bundle.rankTrend,
      "profileCharts.last20": bundle.last20,
      "profileCharts.builtAtMs": bundle.builtAtMs,
    },
    { merge: true }
  );
}

/**
 * profileCharts が揃っていればそれを返す。欠けていればソースから埋めて書き戻す。
 * 同一 uid の並行呼び出しは 1 本にまとめる。
 */
export async function ensureProfileChartsBundle(
  uid: string,
  options?: { seasonKey?: string; forceRebuild?: boolean }
): Promise<CompleteProfileChartsBundle> {
  const safeUid = uid.trim();
  if (!safeUid) {
    return {
      v: PROFILE_CHARTS_BUNDLE_VERSION,
      seasonKey: options?.seasonKey ?? CURRENT_NBA_SEASON_KEY,
      dailyTrend: [],
      rankTrend: [],
      last20: [],
      builtAtMs: Date.now(),
    };
  }

  const seasonKey = options?.seasonKey ?? CURRENT_NBA_SEASON_KEY;
  const inflightKey = shortCacheKey(safeUid, seasonKey);
  const existing = ensureInflight.get(inflightKey);
  if (existing) return existing;

  const promise = (async (): Promise<CompleteProfileChartsBundle> => {
    const adminDb = getAdminDb();
    const cumSnap = await adminDb
      .collection("cumulative_stats")
      .doc(safeUid)
      .get();
    const cumData = cumSnap.exists
      ? (cumSnap.data() as Record<string, unknown>)
      : null;
    const parsed = parseProfileChartsBundle(cumData, seasonKey);

    if (!options?.forceRebuild && isProfileChartsComplete(parsed)) {
      return {
        v: PROFILE_CHARTS_BUNDLE_VERSION,
        seasonKey,
        dailyTrend: parsed.dailyTrend,
        rankTrend: parsed.rankTrend,
        last20: parsed.last20,
        builtAtMs:
          typeof (cumData?.profileCharts as { builtAtMs?: unknown } | undefined)
            ?.builtAtMs === "number"
            ? ((cumData!.profileCharts as { builtAtMs: number }).builtAtMs)
            : Date.now(),
      };
    }

    const needDaily = options?.forceRebuild || parsed?.dailyTrend == null;
    const needRank = options?.forceRebuild || parsed?.rankTrend == null;
    const needLast20 = options?.forceRebuild || parsed?.last20 == null;

    const [dailyTrend, rankTrend, last20] = await Promise.all([
      needDaily
        ? buildDailyTrend(safeUid, seasonKey)
        : Promise.resolve(parsed!.dailyTrend!),
      needRank
        ? buildRankTrend(safeUid, seasonKey)
        : Promise.resolve(parsed!.rankTrend!),
      needLast20 ? buildLast20(safeUid) : Promise.resolve(parsed!.last20!),
    ]);

    const bundle: CompleteProfileChartsBundle = {
      v: PROFILE_CHARTS_BUNDLE_VERSION,
      seasonKey,
      dailyTrend,
      rankTrend,
      last20,
      builtAtMs: Date.now(),
    };
    await writeCompleteBundle(safeUid, bundle);
    return bundle;
  })().finally(() => {
    ensureInflight.delete(inflightKey);
  });

  ensureInflight.set(inflightKey, promise);
  return promise;
}
