import { doc, getDoc } from "firebase/firestore";
import { getUniterzApiBaseUrl } from "../games/submitPredictionApi";
import { db } from "../../lib/firebase";
import type { ProfileDailyTrendRow } from "../../../../../lib/profile/profileDailyTrendRow";
import {
  getPastDateKeysInTimeZone,
  TIMEZONE_JST,
  toDateKeyInTimeZone,
} from "../../../../../lib/time/zonedTime";

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
};

export type ProfileSummaryRanksNative = {
  totalPrecision: number | null;
  totalUpset: number | null;
  totalPoints: number | null;
};

export type RankPlayoffTrendPointNative = {
  dateKey: string;
  rank: number;
  labelShort: string;
  date: string;
};

function safeInt(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
}

function safeNum(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

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
  };
}

function parseUserStatsJson(json: Record<string, unknown>): {
  summary: ProfileSummaryNative | null;
  summaryRanks: ProfileSummaryRanksNative | null;
  stats: Record<string, unknown> | null;
  dailyTrend: ProfileDailyTrendRow[];
} {
  let dailyRaw: unknown = json.dailyTrend;
  if (typeof dailyRaw === "string" && dailyRaw.trim().startsWith("[")) {
    try {
      dailyRaw = JSON.parse(dailyRaw) as unknown;
    } catch {
      dailyRaw = null;
    }
  }
  const dailyTrend: ProfileDailyTrendRow[] = Array.isArray(dailyRaw)
    ? dailyRaw.map((row) => {
        const r = row as Record<string, unknown>;
        const posts = safeInt(r.posts);
        const wins = safeInt(r.wins ?? r.hits ?? r.winCount);
        const date =
          normalizeDailyTrendDate(r.date) ||
          normalizeDailyTrendDate(r.dateKey) ||
          normalizeDailyTrendDate(r.day) ||
          normalizeDailyTrendDate(r.dayKey) ||
          "";
        return {
          date,
          posts,
          wins,
          pointsV3: safeNum(r.pointsV3),
          upsetPoints: safeNum(r.upsetPoints),
          winRate: safeNum(r.winRate ?? (posts > 0 ? wins / posts : 0)),
          scorePrecision: safeNum(r.scorePrecision),
        };
      })
    : [];
  return {
    summary: parseSummary(json.summary),
    summaryRanks: parseSummaryRanks(json.summaryRanks),
    stats: json.stats != null && typeof json.stats === "object"
      ? (json.stats as Record<string, unknown>)
      : null,
    dailyTrend,
  };
}

/** Web `useUserStatsV2` の初回+trend と同等の `parts` を明示（window_cache の日付形もパースする） */
export async function fetchProfileUserStatsAll(uid: string): Promise<{
  summary: ProfileSummaryNative | null;
  summaryRanks: ProfileSummaryRanksNative | null;
  stats: Record<string, unknown> | null;
  dailyTrend: ProfileDailyTrendRow[];
}> {
  const base = getUniterzApiBaseUrl();
  if (!base) {
    throw new Error("EXPO_PUBLIC_UNITERZ_API_BASE_URL が未設定です。");
  }
  const qs = new URLSearchParams({
    uid,
    parts: "stats,phase,trend",
    phase: "playoffs",
  });
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
  parts: "stats,phase" | "trend"
): Promise<{
  summary: ProfileSummaryNative | null;
  summaryRanks: ProfileSummaryRanksNative | null;
  stats: Record<string, unknown> | null;
  dailyTrend: ProfileDailyTrendRow[];
}> {
  const base = getUniterzApiBaseUrl();
  if (!base) {
    throw new Error("EXPO_PUBLIC_UNITERZ_API_BASE_URL が未設定です。");
  }
  const qs = new URLSearchParams({
    uid,
    parts,
    phase: "playoffs",
  });
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
 * Web `useUserStatsDailyTrend` / API `fetchLast30DailySnapshots` と同じ暦30日分を docId で直読。
 * `documentId` 範囲クエリはインデックス・実装差で失敗しうるため、`getDoc` の並列取得に寄せる。
 */
export async function fetchDailyTrendFirestoreFallback(
  uid: string
): Promise<ProfileDailyTrendRow[]> {
  try {
    const keys = getPastDateKeysInTimeZone(new Date(), TIMEZONE_JST, 30);
    const snaps = await Promise.all(
      keys.map((dateKey) => getDoc(doc(db, "user_stats_v2_daily", `${uid}_${dateKey}`)))
    );
    const rows: ProfileDailyTrendRow[] = [];

    for (const snap of snaps) {
      if (!snap.exists) continue;
      const d = snap.data();
      if (!d) continue;
      const tail = snap.id.match(/_(\d{4}-\d{2}-\d{2})$/);
      const date =
        normalizeDailyTrendDate(d.date) ||
        normalizeDailyTrendDate((d as { dateKey?: unknown }).dateKey) ||
        (tail ? tail[1]! : "");
      if (!date) continue;

      const all = d.applied_posts?.all ?? d.applied_posts ?? d.all;
      const bucketFromAll =
        all != null && typeof all === "object" ? (all as Record<string, unknown>) : null;
      /** `all` が無くルートにだけメトリクスがある古い／マージ済み doc も拾う */
      const bucket =
        bucketFromAll ??
        (typeof (d as { posts?: unknown }).posts === "number" ||
        typeof (d as { wins?: unknown }).wins === "number"
          ? (d as Record<string, unknown>)
          : null);
      const posts = safeInt(bucket?.posts);
      const wins = safeInt(bucket?.wins ?? bucket?.hits ?? bucket?.winCount);
      const pointsV3 = safeNum(bucket?.pointsSumV3);
      const upsetPoints = safeNum(bucket?.upsetPointsSum);
      const scorePrecisionSum = safeNum(bucket?.scorePrecisionSum);

      rows.push({
        date,
        posts,
        wins,
        pointsV3,
        upsetPoints,
        winRate: posts > 0 ? wins / posts : 0,
        scorePrecision: scorePrecisionSum,
      });
    }
    rows.sort((a, b) => a.date.localeCompare(b.date));
    return rows;
  } catch (e) {
    if (__DEV__) {
      console.warn("[fetchDailyTrendFirestoreFallback]", e);
    }
    return [];
  }
}

/** Web `useProfilePlayoffRankTrend` と同一エンドポイント */
export async function fetchRankPlayoffTrend(
  uid: string
): Promise<RankPlayoffTrendPointNative[]> {
  const base = getUniterzApiBaseUrl();
  if (!base) return [];
  const url = `${base}/api/profile/rank-playoff-trend?uid=${encodeURIComponent(uid)}&phase=playoffs`;
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
