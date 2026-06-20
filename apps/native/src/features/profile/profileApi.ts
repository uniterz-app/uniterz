import {
  collection,
  doc,
  documentId,
  getDoc,
  getDocs,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { getUniterzApiBaseUrl } from "../games/submitPredictionApi";
import { auth, db } from "../../lib/firebase";
import type { ProfileDailyTrendRow } from "../../../../../lib/profile/profileDailyTrendRow";
import type { ProfileStatsStreakContext } from "../../../../../lib/profile/profileStreakScope";
import type { MyRankMetricValueDeltas } from "../../../../../lib/rankings/myRankMetricValueDeltas";
import type { RankingLeagueSource } from "../../../../../lib/rankings/rankingLeagueSource";
import { isWcRankingStage, type WcRankingStage } from "../../../../../lib/rankings/wcRankingStage";
import {
  buildDailyTrendFromDailySnaps,
  dailyTrendRowFromDailySnap,
  resolveProfileDailyTrendContext,
} from "../../../../../lib/profile/userStatsV2ProfileRollup";
import {
  getPastDateKeysInTimeZone,
  TIMEZONE_JST,
  toDateKeyInTimeZone,
} from "../../../../../lib/time/zonedTime";

const DAILY_TREND_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function safeInt(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
}

function safeNum(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

/** Firestore ルール（auth 必須）通過前にトークンを確実に付与する */
async function ensureFirestoreAuthReady(): Promise<boolean> {
  const user = auth.currentUser;
  if (!user) return false;
  try {
    await user.getIdToken();
    return true;
  } catch {
    return false;
  }
}

/** API / Firestore 由来の日付を YYYY-MM-DD に正規化（Timestamp・JSON seconds 形も吸収） */
export function normalizeDailyTrendDate(raw: unknown): string {
  if (typeof raw === "string") {
    const s = raw.trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
    return "";
  }
  if (typeof raw === "number" && Number.isFinite(raw)) {
    const ms = raw > 10_000_000_000 ? raw : raw * 1000;
    const d = new Date(ms);
    if (!Number.isNaN(d.getTime())) return toDateKeyInTimeZone(d, TIMEZONE_JST);
  }
  if (raw && typeof raw === "object" && "toDate" in raw) {
    const fn = (raw as { toDate?: () => Date }).toDate;
    if (typeof fn === "function") {
      try {
        const inst = fn.call(raw);
        if (inst instanceof Date && !Number.isNaN(inst.getTime())) {
          return toDateKeyInTimeZone(inst, TIMEZONE_JST);
        }
      } catch {
        /* fall through */
      }
    }
  }
  if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    const secRaw = o.seconds ?? o._seconds;
    const nanoRaw = o.nanoseconds ?? o._nanoseconds ?? 0;
    const sec =
      typeof secRaw === "number" && Number.isFinite(secRaw)
        ? secRaw
        : typeof secRaw === "string" && secRaw.trim() !== ""
          ? Number(secRaw)
          : NaN;
    const nano =
      typeof nanoRaw === "number" && Number.isFinite(nanoRaw)
        ? nanoRaw
        : typeof nanoRaw === "string" && nanoRaw.trim() !== ""
          ? Number(nanoRaw)
          : 0;
    if (Number.isFinite(sec)) {
      const ms = sec * 1000 + Math.floor(nano / 1e6);
      return toDateKeyInTimeZone(new Date(ms), TIMEZONE_JST);
    }
  }
  return "";
}

/** チャート描画に使える YYYY-MM-DD 行か */
export function isChartRenderableDailyTrendRow(
  row: Pick<ProfileDailyTrendRow, "date"> | null | undefined
): boolean {
  const date = normalizeDailyTrendDate(row?.date);
  return DAILY_TREND_DATE_RE.test(date);
}

/** API / Firestore 由来の行をチャート用に正規化 */
export function normalizeProfileDailyTrendRows(rows: unknown): ProfileDailyTrendRow[] {
  if (!Array.isArray(rows)) return [];
  const out: ProfileDailyTrendRow[] = [];
  for (const raw of rows) {
    if (!raw || typeof raw !== "object") continue;
    const r = raw as Record<string, unknown>;
    const date =
      normalizeDailyTrendDate(r.date) ||
      normalizeDailyTrendDate(r.dateKey) ||
      normalizeDailyTrendDate(r.day) ||
      normalizeDailyTrendDate(r.dayKey) ||
      "";
    if (!DAILY_TREND_DATE_RE.test(date)) continue;
    const posts = safeInt(r.posts);
    const wins = safeInt(r.wins ?? r.hits ?? r.winCount);
    out.push({
      date,
      posts,
      wins,
      pointsV3: safeNum(r.pointsV3),
      upsetPoints: safeNum(r.upsetPoints),
      winRate: safeNum(r.winRate ?? (posts > 0 ? wins / posts : 0)),
      scorePrecision: safeNum(r.scorePrecision),
    });
  }
  out.sort((a, b) => a.date.localeCompare(b.date));
  return out;
}

/** Web `useUserStatsV2` の SummaryForCardsV2 と同等 */
export type ProfileSummaryNative = {
  posts: number;
  fullPosts: number;
  recent3Posts: number;
  wins: number;
  winRate: number;
  scorePrecisionSum: number;
  upsetPointsSum: number;
  pointsSumV3: number;
  upsetChanceCount: number;
  upsetHitCount: number;
  upsetBonusSum: number;
  streakBonusSum: number;
  basePointsSum: number;
  activeWinStreak?: number;
  maxWinStreak?: number;
};

export type ProfileSummaryRanksNative = {
  totalPrecision: number | null;
  totalUpset: number | null;
  totalPoints: number | null;
  totalPointsDenominator?: number | null;
  rankDeltaPlaces?: number | null;
};

export type RankPlayoffTrendPointNative = {
  dateKey: string;
  rank: number;
  labelShort: string;
  date: string;
};

function parseSummary(raw: unknown): ProfileSummaryNative | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const posts = safeInt(o.posts);
  const wins = safeInt(o.wins);
  return {
    posts,
    fullPosts: safeInt(o.fullPosts),
    recent3Posts: safeInt(o.recent3Posts),
    wins,
    winRate: safeNum(o.winRate),
    scorePrecisionSum: safeNum(o.scorePrecisionSum),
    upsetPointsSum: safeNum(o.upsetPointsSum),
    pointsSumV3: safeNum(o.pointsSumV3),
    upsetChanceCount: safeInt(o.upsetChanceCount),
    upsetHitCount: safeInt(o.upsetHitCount),
    upsetBonusSum: safeNum(o.upsetBonusSum),
    streakBonusSum: safeNum(o.streakBonusSum),
    basePointsSum: safeNum(o.basePointsSum),
    activeWinStreak: safeInt(o.activeWinStreak),
    maxWinStreak: safeInt(o.maxWinStreak),
  };
}

function parseSummaryRanks(raw: unknown): ProfileSummaryRanksNative | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const rank = (v: unknown): number | null => {
    const n = typeof v === "number" ? v : Number(v);
    if (!Number.isFinite(n)) return null;
    const i = Math.floor(n);
    return i > 0 ? i : null;
  };
  return {
    totalPrecision: rank(o.totalPrecision),
    totalUpset: rank(o.totalUpset),
    totalPoints: rank(o.totalPoints),
    totalPointsDenominator: rank(o.totalPointsDenominator),
    rankDeltaPlaces:
      typeof o.rankDeltaPlaces === "number" && Number.isFinite(o.rankDeltaPlaces)
        ? Math.trunc(o.rankDeltaPlaces)
        : null,
  };
}

function parseMetricValueDeltas(raw: unknown): MyRankMetricValueDeltas | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const num = (v: unknown): number | null => {
    if (v == null) return null;
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) ? n : null;
  };
  return {
    totalPoints: num(o.totalPoints),
    totalPrecision: num(o.totalPrecision),
    totalUpset: num(o.totalUpset),
    winRate: num(o.winRate),
  };
}

function buildProfileStatsQuery(
  uid: string,
  parts: string,
  ctx?: ProfileStatsStreakContext
): URLSearchParams {
  const rankingLeague: RankingLeagueSource = ctx?.rankingLeague ?? "worldcup";
  const safeWcStage: WcRankingStage | undefined =
    rankingLeague === "worldcup"
      ? ctx?.wcStage && isWcRankingStage(ctx.wcStage)
        ? ctx.wcStage
        : "overall"
      : undefined;
  const qs = new URLSearchParams({
    uid,
    parts,
    phase: "playoffs",
  });
  if (rankingLeague) qs.set("league", rankingLeague);
  if (safeWcStage) qs.set("wcStage", safeWcStage);
  return qs;
}

function parseUserStatsJson(json: Record<string, unknown>): {
  summary: ProfileSummaryNative | null;
  summaryRanks: ProfileSummaryRanksNative | null;
  stats: Record<string, unknown> | null;
  dailyTrend: ProfileDailyTrendRow[];
  metricValueDeltas: MyRankMetricValueDeltas | null;
} {
  let dailyRaw: unknown = json.dailyTrend;
  if (typeof dailyRaw === "string" && dailyRaw.trim().startsWith("[")) {
    try {
      dailyRaw = JSON.parse(dailyRaw) as unknown;
    } catch {
      dailyRaw = null;
    }
  }
  const dailyTrend = normalizeProfileDailyTrendRows(dailyRaw);
  return {
    summary: parseSummary(json.summary),
    summaryRanks: parseSummaryRanks(json.summaryRanks),
    stats: json.stats != null && typeof json.stats === "object"
      ? (json.stats as Record<string, unknown>)
      : null,
    dailyTrend,
    metricValueDeltas: parseMetricValueDeltas(json.metricValueDeltas),
  };
}

/** Web `useUserStatsV2` の初回+trend と同等の `parts` を明示（window_cache の日付形もパースする） */
export async function fetchProfileUserStatsAll(
  uid: string,
  ctx?: ProfileStatsStreakContext
): Promise<{
  summary: ProfileSummaryNative | null;
  summaryRanks: ProfileSummaryRanksNative | null;
  stats: Record<string, unknown> | null;
  dailyTrend: ProfileDailyTrendRow[];
  metricValueDeltas: MyRankMetricValueDeltas | null;
}> {
  const base = getUniterzApiBaseUrl();
  if (!base) {
    throw new Error("EXPO_PUBLIC_UNITERZ_API_BASE_URL が未設定です。");
  }
  const qs = buildProfileStatsQuery(uid, "stats,phase,trend", ctx);
  const res = await fetch(`${base}/api/profile/user-stats?${qs.toString()}`, {
    method: "GET",
    cache: "no-store",
  });
  const json = (await res.json()) as Record<string, unknown>;
  if (!res.ok || json.ok !== true) {
    throw new Error(typeof json.error === "string" ? json.error : "user-stats failed");
  }
  return parseUserStatsJson(json);
}

/** Web `/api/profile/user-stats` と同一クエリ（parts 指定） */
export async function fetchProfileUserStats(
  uid: string,
  parts: "stats,phase" | "trend",
  ctx?: ProfileStatsStreakContext
): Promise<{
  summary: ProfileSummaryNative | null;
  summaryRanks: ProfileSummaryRanksNative | null;
  stats: Record<string, unknown> | null;
  dailyTrend: ProfileDailyTrendRow[];
  metricValueDeltas: MyRankMetricValueDeltas | null;
}> {
  const base = getUniterzApiBaseUrl();
  if (!base) {
    throw new Error("EXPO_PUBLIC_UNITERZ_API_BASE_URL が未設定です。");
  }
  const qs = buildProfileStatsQuery(uid, parts, ctx);
  const res = await fetch(`${base}/api/profile/user-stats?${qs.toString()}`, {
    method: "GET",
    cache: "no-store",
  });
  const json = (await res.json()) as Record<string, unknown>;
  if (!res.ok || json.ok !== true) {
    throw new Error(typeof json.error === "string" ? json.error : "user-stats failed");
  }
  return parseUserStatsJson(json);
}

/**
 * Web `useUserStatsDailyTrend` と同じ JST 30 日レンジを Firestore から直読。
 * API の `dailyTrend` が空のとき（WC 直近30日・キャッシュ不整合など）のフォールバック。
 */
export async function fetchDailyTrendFirestoreFallback(
  uid: string,
  ctx?: ProfileStatsStreakContext
): Promise<ProfileDailyTrendRow[]> {
  const trendCtx = resolveProfileDailyTrendContext(
    ctx?.rankingLeague ?? "worldcup",
    ctx?.wcStage
  );
  const authed = await ensureFirestoreAuthReady();
  if (!authed) return [];

  try {
    const now = new Date();
    const end = toDateKeyInTimeZone(now, TIMEZONE_JST);
    const startDt = new Date(now.getTime() - 29 * 86400000);
    const start = toDateKeyInTimeZone(startDt, TIMEZONE_JST);

    const q = query(
      collection(db, "user_stats_v2_daily"),
      where(documentId(), ">=", `${uid}_${start}`),
      where(documentId(), "<=", `${uid}_${end}`),
      orderBy(documentId())
    );
    const snap = await getDocs(q);
    const rows: ProfileDailyTrendRow[] = [];
    for (const docSnap of snap.docs) {
      const row = dailyTrendRowFromDailySnap(docSnap, trendCtx);
      if (row && isChartRenderableDailyTrendRow(row)) rows.push(row);
    }
    rows.sort((a, b) => a.date.localeCompare(b.date));
    if (rows.length > 0) return rows;
  } catch (e) {
    if (__DEV__) {
      console.warn("[fetchDailyTrendFirestoreFallback] range query failed", e);
    }
  }

  try {
    const keys = getPastDateKeysInTimeZone(new Date(), TIMEZONE_JST, 30);
    const snaps = await Promise.all(
      keys.map((dateKey) => getDoc(doc(db, "user_stats_v2_daily", `${uid}_${dateKey}`)))
    );
    return normalizeProfileDailyTrendRows(
      buildDailyTrendFromDailySnaps(snaps, trendCtx)
    );
  } catch (e) {
    if (__DEV__) {
      console.warn("[fetchDailyTrendFirestoreFallback] getDoc fallback failed", e);
    }
    return [];
  }
}

/** Web `useUserStatsV2` の `ensureTrend` + `useUserStatsDailyTrend` に合わせ API / Firestore を並列取得 */
export async function resolveProfileDailyTrend(
  uid: string,
  ctx: ProfileStatsStreakContext,
  bundleTrend: ProfileDailyTrendRow[]
): Promise<ProfileDailyTrendRow[]> {
  const [trendOnlyResult, firestoreRows] = await Promise.all([
    fetchProfileUserStats(uid, "trend", ctx)
      .then((r) => normalizeProfileDailyTrendRows(r.dailyTrend))
      .catch(() => [] as ProfileDailyTrendRow[]),
    fetchDailyTrendFirestoreFallback(uid, ctx)
      .then((rows) => normalizeProfileDailyTrendRows(rows))
      .catch(() => [] as ProfileDailyTrendRow[]),
  ]);

  if (trendOnlyResult.length > 0) return trendOnlyResult;

  const fromBundle = normalizeProfileDailyTrendRows(bundleTrend);
  if (fromBundle.length > 0) return fromBundle;

  return firestoreRows;
}

/** Web `useProfilePlayoffRankTrend` と同一エンドポイント */
export async function fetchRankPlayoffTrend(
  uid: string,
  ctx?: ProfileStatsStreakContext
): Promise<RankPlayoffTrendPointNative[]> {
  const base = getUniterzApiBaseUrl();
  if (!base) return [];
  const rankingLeague: RankingLeagueSource = ctx?.rankingLeague ?? "worldcup";
  const wcStage: WcRankingStage =
    rankingLeague === "worldcup"
      ? ctx?.wcStage && isWcRankingStage(ctx.wcStage)
        ? ctx.wcStage
        : "overall"
      : "overall";
  const qs = new URLSearchParams({ uid, phase: "playoffs" });
  if (rankingLeague === "worldcup") {
    qs.set("league", "worldcup");
    qs.set("wcStage", wcStage);
  }
  const url = `${base}/api/profile/rank-playoff-trend?${qs.toString()}`;
  try {
    const res = await fetch(url, { cache: "no-store" });
    const json = (await res.json()) as {
      ok?: boolean;
      points?: { dateKey: string; rank: number }[];
    };
    if (!res.ok || json.ok !== true || !Array.isArray(json.points)) return [];
    const rows = [...json.points]
      .map((p) => {
        const dk = typeof p.dateKey === "string" ? p.dateKey : "";
        const parts = dk.split("-");
        const labelShort =
          parts.length >= 3 ? `${Number(parts[1])}/${Number(parts[2])}` : dk;
        return {
          dateKey: dk,
          rank: safeInt(p.rank),
          labelShort,
          date: dk,
        };
      })
      .filter((r) => r.dateKey.length > 0 && r.rank > 0)
      .sort((a, b) => a.dateKey.localeCompare(b.dateKey));
    return rows;
  } catch {
    return [];
  }
}
