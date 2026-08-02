/**
 * cumulative_stats.profileCharts を正とする overview チャート集計。
 * 欠けている部品だけソースから組み立てて書き戻し、以降のクライアント多重 read を無くす。
 */
import { getAdminDb } from "@/lib/firebaseAdmin";
import type {
  DocumentReference,
  DocumentSnapshot,
} from "firebase-admin/firestore";
import { filterDailyTrendToSeasonActivity } from "@/lib/profile/dailyTrendSeasonActivity";
import {
  PROFILE_CHARTS_BUNDLE_VERSION,
  PROFILE_CHARTS_DAILY_MAX,
  PROFILE_CHARTS_LAST20_MAX,
  PROFILE_CHARTS_RANK_MAX,
  cumulativeHasNbaSeasonActivity,
  emptyProfileChartsBundle,
  isProfileChartsComplete,
  parseProfileChartsBundle,
  pruneDailyTrendRows,
  type ProfileChartsLast20Point,
  type ProfileChartsRankPoint,
} from "@/lib/profile/profileChartsBundle";
import type { ProfileDailyTrendRow } from "@/lib/profile/profileDailyTrendRow";
import {
  profileOverviewDateKeysEndingAt,
  profileOverviewLookbackEndDateKey,
  profileOverviewSeasonKey,
  PROFILE_OVERVIEW_USE_PREVIOUS_SEASON,
  profileOverviewDailyLookbackDays,
  profileOverviewRankLookbackDays,
} from "@/lib/profile/profileOverviewSeason";
import {
  buildDailyTrendFromDailySnaps,
  resolveProfileDailyTrendContext,
} from "@/lib/profile/userStatsV2ProfileRollup";
import { resolvePostListLeague } from "@/lib/leagues";
import {
  nbaSeasonKeyFromDateJST,
} from "@/lib/rankings/nbaSeason";
import { coerceTotalPointsRank } from "@/lib/profile/resolvePlayoffTotalPointsRank";

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

const GET_ALL_CHUNK = 90;

async function getAllChunked(
  refs: DocumentReference[]
): Promise<DocumentSnapshot[]> {
  if (refs.length === 0) return [];
  const adminDb = getAdminDb();
  const out: DocumentSnapshot[] = [];
  for (let i = 0; i < refs.length; i += GET_ALL_CHUNK) {
    const chunk = refs.slice(i, i + GET_ALL_CHUNK);
    const snaps = await adminDb.getAll(...chunk);
    out.push(...snaps);
  }
  return out;
}

function shortCacheKey(uid: string, seasonKey: string) {
  return `${uid}:${seasonKey}`;
}

function normalizeSeasonPhase(v: unknown): string | null {
  const s = String(v ?? "").trim().toLowerCase();
  if (s === "play_in" || s === "playoffs" || s === "regular") return s;
  return null;
}

async function buildDailyTrend(
  uid: string,
  seasonKey: string
): Promise<ProfileDailyTrendRow[]> {
  const adminDb = getAdminDb();
  const endKey = profileOverviewLookbackEndDateKey(seasonKey);
  const keys = profileOverviewDateKeysEndingAt(
    endKey,
    profileOverviewDailyLookbackDays(seasonKey)
  );
  if (keys.length === 0) return [];
  const refs = keys.map((dateKey) =>
    adminDb.doc(`user_stats_v2_daily/${uid}_${dateKey}`)
  );
  const snaps = await getAllChunked(refs);
  const byId = new Map(snaps.map((s) => [s.id, s]));
  const ordered = keys.map((dateKey) => byId.get(`${uid}_${dateKey}`)!);
  const ctx = resolveProfileDailyTrendContext(
    "nba",
    undefined,
    "season",
    seasonKey
  );
  const rows = buildDailyTrendFromDailySnaps(ordered, ctx);
  return pruneDailyTrendRows(
    filterDailyTrendToSeasonActivity(rows),
    PROFILE_CHARTS_DAILY_MAX
  );
}

async function buildRankTrend(
  uid: string,
  seasonKey: string
): Promise<ProfileChartsRankPoint[]> {
  const adminDb = getAdminDb();
  const endKey = profileOverviewLookbackEndDateKey(seasonKey);
  const keys = profileOverviewDateKeysEndingAt(
    endKey,
    profileOverviewRankLookbackDays(seasonKey)
  );
  const refs = keys.map((dateKey) =>
    adminDb.doc(`cumulative_stats/${uid}/rankSnapshotHistory/${dateKey}`)
  );
  const snaps = await getAllChunked(refs);
  const points: ProfileChartsRankPoint[] = [];
  for (const snap of snaps) {
    if (!snap.exists) continue;
    const data = snap.data() as {
      seasons?: Record<string, Record<string, unknown>>;
    };
    const rank = coerceTotalPointsRank(
      data.seasons?.[seasonKey]?.totalPoints
    );
    if (rank == null) continue;
    points.push({ dateKey: snap.id, rank });
  }
  points.sort((a, b) => a.dateKey.localeCompare(b.dateKey));
  if (points.length <= PROFILE_CHARTS_RANK_MAX) return points;
  return points.slice(points.length - PROFILE_CHARTS_RANK_MAX);
}

async function buildLast20(
  uid: string,
  seasonKey: string
): Promise<ProfileChartsLast20Point[]> {
  const adminDb = getAdminDb();
  /** 前シーズン確認時は新しい投稿に埋もれやすいので多めに読む */
  const fetchLimit = PROFILE_OVERVIEW_USE_PREVIOUS_SEASON ? 500 : 120;
  const snap = await adminDb
    .collection("posts")
    .where("authorUid", "==", uid)
    .where("schemaVersion", "==", 2)
    .orderBy("settledAt", "desc")
    .limit(fetchLimit)
    .get();

  const out: ProfileChartsLast20Point[] = [];
  for (const d of snap.docs) {
    const data = d.data() as Record<string, unknown>;
    const settledAt = data.settledAt as { toMillis?: () => number } | null;
    const ms =
      settledAt && typeof settledAt.toMillis === "function"
        ? settledAt.toMillis()
        : null;
    if (ms == null || !Number.isFinite(ms)) continue;
    const stats = data.stats as Record<string, unknown> | undefined;
    if (typeof stats?.isWin !== "boolean") continue;
    if (
      resolvePostListLeague({
        league: data.league,
        gameId: data.gameId,
      }) !== "nba"
    ) {
      continue;
    }
    const phase = normalizeSeasonPhase(data.seasonPhase);
    if (phase === "playoffs" || phase === "play_in") continue;
    if (nbaSeasonKeyFromDateJST(new Date(ms)) !== seasonKey) continue;
    out.push({
      postId: d.id,
      settledAtMs: ms,
      isWin: stats.isWin,
    });
    if (out.length >= PROFILE_CHARTS_LAST20_MAX) break;
  }
  return out.slice().sort((a, b) => a.settledAtMs - b.settledAtMs);
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
      seasonKey: options?.seasonKey ?? profileOverviewSeasonKey(),
      dailyTrend: [],
      rankTrend: [],
      last20: [],
      builtAtMs: Date.now(),
    };
  }

  const seasonKey = options?.seasonKey ?? profileOverviewSeasonKey();
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
      const allEmpty =
        parsed.dailyTrend.length === 0 &&
        parsed.rankTrend.length === 0 &&
        parsed.last20.length === 0;
      if (!(PROFILE_OVERVIEW_USE_PREVIOUS_SEASON && allEmpty)) {
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
    }

    /**
     * 現行シーズンで活動ゼロなら重い読みをスキップ。
     * 前シーズン確認中は rankingBySeason が薄くても daily/posts を掘る。
     */
    if (
      !options?.forceRebuild &&
      !PROFILE_OVERVIEW_USE_PREVIOUS_SEASON &&
      !cumulativeHasNbaSeasonActivity(cumData, seasonKey)
    ) {
      const empty = emptyProfileChartsBundle(seasonKey);
      const bundle: CompleteProfileChartsBundle = {
        ...empty,
        builtAtMs: Date.now(),
      };
      await writeCompleteBundle(safeUid, bundle);
      return bundle;
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
      needLast20
        ? buildLast20(safeUid, seasonKey)
        : Promise.resolve(parsed!.last20!),
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
