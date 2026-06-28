import type { DocumentReference, Firestore } from "firebase-admin/firestore";
import type {
  CommunityLeague,
  CommunityMetric,
  CommunityPeriodType,
} from "./types";
import { dateKeysFromStartToTodayJST } from "./dateRange";
import { aggregateFromDailyTeams } from "./groupStatsTeams";
import {
  resolveRankingStartDateKey,
  timestampToMs,
} from "./rankingStartDate";
import { normalizeLeague } from "@/lib/leagues";
import { readDailyWcStageBuckets } from "@/lib/rankings/dailyWcStageBuckets";
import { TIMEZONE_JST, parseDateKeyInTimeZone } from "@/lib/time/zonedTime";

export type MemberAgg = {
  totalPosts: number;
  totalWins: number;
  totalPoints: number;
  totalPrecision: number;
  totalUpset: number;
};

function emptyAgg(): MemberAgg {
  return {
    totalPosts: 0,
    totalWins: 0,
    totalPoints: 0,
    totalPrecision: 0,
    totalUpset: 0,
  };
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

function addBucketToAgg(
  agg: MemberAgg,
  bucket: Record<string, unknown> | undefined | null
) {
  if (!bucket || typeof bucket !== "object") return;
  agg.totalPosts += Number((bucket as { posts?: number }).posts ?? 0);
  agg.totalWins += Number((bucket as { wins?: number }).wins ?? 0);
  agg.totalPoints += Number(
    (bucket as { pointsSumV3?: number }).pointsSumV3 ?? 0
  );
  agg.totalPrecision += Number(
    (bucket as { scorePrecisionSum?: number }).scorePrecisionSum ?? 0
  );
  agg.totalUpset += Number(
    (bucket as { upsetPointsSum?: number }).upsetPointsSum ?? 0
  );
}

function dailyBucket(
  data: Record<string, unknown> | undefined,
  league: CommunityLeague
): Record<string, unknown> | undefined {
  if (!data) return undefined;
  if (league === "all") {
    const ranking = data.ranking;
    if (ranking && typeof ranking === "object") {
      return ranking as Record<string, unknown>;
    }
    const all = data.all;
    return all && typeof all === "object"
      ? (all as Record<string, unknown>)
      : undefined;
  }
  /**
   * WC: プロフィール（rankingByWcStage.overall）と同じバケットを使う。
   * leagues.wc はランキング対象外投稿も含むため 1〜2 点ずれることがある。
   */
  if (league === "wc") {
    const overall = readDailyWcStageBuckets(data).overall;
    if (Number(overall.posts ?? 0) > 0) {
      return overall as Record<string, unknown>;
    }
    const leagues = data.leagues as Record<string, unknown> | undefined;
    const legacy = leagues?.wc;
    return legacy && typeof legacy === "object"
      ? (legacy as Record<string, unknown>)
      : undefined;
  }
  const leagues = data.leagues as Record<string, unknown> | undefined;
  const bucket = leagues?.[league];
  return bucket && typeof bucket === "object"
    ? (bucket as Record<string, unknown>)
    : undefined;
}

/** daily doc id: {uid}_{yyyy-mm-dd} */
function parseDailyDocId(id: string): { uid: string; dateKey: string } | null {
  const m = /^(.+)_(\d{4}-\d{2}-\d{2})$/.exec(id);
  if (!m) return null;
  return { uid: m[1], dateKey: m[2] };
}

async function aggregateFromDaily(
  db: Firestore,
  uids: string[],
  dateKeys: string[],
  league: CommunityLeague
): Promise<Map<string, MemberAgg>> {
  const map = new Map<string, MemberAgg>();
  for (const uid of uids) map.set(uid, emptyAgg());

  if (dateKeys.length === 0 || uids.length === 0) return map;

  const refs: DocumentReference[] = [];
  for (const uid of uids) {
    for (const dk of dateKeys) {
      refs.push(db.doc(`user_stats_v2_daily/${uid}_${dk}`));
    }
  }

  for (const group of chunk(refs, 90)) {
    const snaps = await db.getAll(...group);
    for (const snap of snaps) {
      if (!snap.exists) continue;
      const parsed = parseDailyDocId(snap.id);
      if (!parsed) continue;
      const agg = map.get(parsed.uid);
      if (!agg) continue;
      addBucketToAgg(agg, dailyBucket(snap.data(), league));
    }
  }

  return map;
}

function mergeMemberAggs(
  into: Map<string, MemberAgg>,
  from: Map<string, MemberAgg>
): Map<string, MemberAgg> {
  for (const [uid, agg] of from) {
    const cur = into.get(uid) ?? emptyAgg();
    into.set(uid, {
      totalPosts: cur.totalPosts + agg.totalPosts,
      totalWins: cur.totalWins + agg.totalWins,
      totalPoints: cur.totalPoints + agg.totalPoints,
      totalPrecision: cur.totalPrecision + agg.totalPrecision,
      totalUpset: cur.totalUpset + agg.totalUpset,
    });
  }
  return into;
}

function markerCountsSince(
  marker: Record<string, unknown>,
  sinceMs: number
): boolean {
  const atMs = timestampToMs(marker.at);
  if (atMs == null) return true;
  return atMs >= sinceMs;
}

function markerCountsForLeague(
  marker: Record<string, unknown>,
  league: CommunityLeague
): boolean {
  if (marker.countedForRanking === false) return false;
  if (league === "all") return true;
  const raw = marker.league;
  if (raw == null) return false;
  return normalizeLeague(raw) === league;
}

/** 開始日のみ: applied_posts から sinceMs 以降を合算（daily バケットと同等のリーグ条件） */
async function aggregateFromAppliedPostsSince(
  db: Firestore,
  uids: string[],
  dateKey: string,
  league: CommunityLeague,
  sinceMs: number
): Promise<Map<string, MemberAgg>> {
  const map = new Map<string, MemberAgg>();
  for (const uid of uids) map.set(uid, emptyAgg());
  if (uids.length === 0) return map;

  await Promise.all(
    uids.map(async (uid) => {
      const agg = map.get(uid);
      if (!agg) return;
      const snap = await db
        .collection(`user_stats_v2_daily/${uid}_${dateKey}/applied_posts`)
        .get();
      for (const doc of snap.docs) {
        const marker = doc.data() as Record<string, unknown>;
        if (!markerCountsSince(marker, sinceMs)) continue;
        if (!markerCountsForLeague(marker, league)) continue;
        addBucketToAgg(agg, marker);
      }
    })
  );

  return map;
}

async function aggregateFromDailyRange(
  db: Firestore,
  uids: string[],
  dateKeys: string[],
  league: CommunityLeague,
  rankingTeamIds: string[],
  firstDaySinceMs?: number | null
): Promise<Map<string, MemberAgg>> {
  if (dateKeys.length === 0) {
    const map = new Map<string, MemberAgg>();
    for (const uid of uids) map.set(uid, emptyAgg());
    return map;
  }

  const teamFilterActive = rankingTeamIds.length > 0;
  const [firstKey, ...restKeys] = dateKeys;
  const dayStartMs =
    parseDateKeyInTimeZone(firstKey, TIMEZONE_JST)?.getTime() ?? 0;
  const usePartialStartDay =
    firstDaySinceMs != null && firstDaySinceMs > dayStartMs + 1000;

  if (!usePartialStartDay) {
    return teamFilterActive
      ? aggregateFromDailyTeams(
          db,
          uids,
          dateKeys,
          league,
          rankingTeamIds
        )
      : aggregateFromDaily(db, uids, dateKeys, league);
  }

  const map = new Map<string, MemberAgg>();
  for (const uid of uids) map.set(uid, emptyAgg());

  const partial = teamFilterActive
    ? await aggregateFromDailyTeams(
        db,
        uids,
        [firstKey],
        league,
        rankingTeamIds,
        firstDaySinceMs
      )
    : await aggregateFromAppliedPostsSince(
        db,
        uids,
        firstKey,
        league,
        firstDaySinceMs!
      );
  mergeMemberAggs(map, partial);

  if (restKeys.length > 0) {
    const rest = teamFilterActive
      ? await aggregateFromDailyTeams(
          db,
          uids,
          restKeys,
          league,
          rankingTeamIds
        )
      : await aggregateFromDaily(db, uids, restKeys, league);
    mergeMemberAggs(map, rest);
  }

  return map;
}

export type CumulativeRow = {
  uid: string;
  displayName: string;
  handle: string | null;
  photoURL: string | null;
  countryCode: string | null;
  /** cumulative_stats / users 由来の表示用プラン */
  plan: "free" | "pro";
  totalPosts: number;
  totalWins: number;
  winRate: number;
  totalPoints: number;
  totalPrecision: number;
  totalUpset: number;
  activeWinStreak: number;
};

export function sortValueFromAgg(
  agg: MemberAgg,
  cumulative: CumulativeRow | null,
  metric: CommunityMetric,
  league: CommunityLeague = "all"
): number {
  if (metric === "winRate") {
    const posts = agg.totalPosts;
    const wins = agg.totalWins;
    return posts > 0 ? wins / posts : 0;
  }
  if (metric === "totalPoints") return agg.totalPoints;
  if (metric === "totalPrecision") return agg.totalPrecision;
  if (metric === "totalUpset") return agg.totalUpset;
  if (metric === "activeWinStreak") {
    return cumulative?.activeWinStreak ?? 0;
  }
  return 0;
}

function streakFromCumulative(
  d: Record<string, unknown>,
  league: CommunityLeague
): number {
  if (league === "wc") {
    return Number(d.streakFootball ?? d.activeWinStreak ?? 0);
  }
  if (league === "nba") {
    const bySport = d.streakBySport as { basketball?: number } | undefined;
    return Number(bySport?.basketball ?? d.activeWinStreak ?? 0);
  }
  return Number(d.activeWinStreak ?? 0);
}

function rowFromAgg(
  uid: string,
  agg: MemberAgg,
  c: CumulativeRow | null,
  metric: CommunityMetric,
  league: CommunityLeague
) {
  const winRate = agg.totalPosts > 0 ? agg.totalWins / agg.totalPosts : 0;
  const streak = c?.activeWinStreak ?? 0;
  return {
    uid,
    displayName: c?.displayName ?? "user",
    handle: c?.handle ?? null,
    photoURL: c?.photoURL ?? null,
    countryCode: c?.countryCode ?? null,
    plan: c?.plan ?? "free",
    totalPosts: agg.totalPosts,
    totalWins: agg.totalWins,
    winRate,
    totalPoints: agg.totalPoints,
    totalPrecision: agg.totalPrecision,
    totalUpset: agg.totalUpset,
    activeWinStreak: streak,
    sortValue: sortValueFromAgg(agg, c, metric, league),
  };
}

/**
 * メンバーごとの表示用行 + ソート値（降順）
 */
export async function buildMemberLeaderboard(
  db: Firestore,
  memberUids: string[],
  metric: CommunityMetric,
  _period: CommunityPeriodType,
  league: CommunityLeague = "all",
  rankingStartDateKey?: string | null,
  rankingTeamIds: string[] = [],
  rankingStartAtMs?: number | null
): Promise<
  {
    uid: string;
    displayName: string;
    handle: string | null;
    photoURL: string | null;
    countryCode: string | null;
    plan: "free" | "pro";
    totalPosts: number;
    totalWins: number;
    winRate: number;
    totalPoints: number;
    totalPrecision: number;
    totalUpset: number;
    activeWinStreak: number;
    sortValue: number;
  }[]
> {
  const uids = [...new Set(memberUids)].filter(Boolean);
  if (uids.length === 0) return [];

  const cumSnaps = await db.getAll(
    ...uids.map((uid) => db.doc(`cumulative_stats/${uid}`))
  );

  const cumulativeByUid = new Map<string, CumulativeRow>();
  for (const snap of cumSnaps) {
    if (!snap.exists) continue;
    const uid = snap.id;
    const d = snap.data() as Record<string, unknown>;
    cumulativeByUid.set(uid, {
      uid,
      displayName: String(d.displayName ?? "user"),
      handle: (d.handle as string) ?? null,
      photoURL: (d.photoURL as string) ?? null,
      countryCode: (d.countryCode as string) ?? null,
      plan: d.plan === "pro" ? "pro" : "free",
      totalPosts: Number(d.totalPosts ?? 0),
      totalWins: Number(d.totalWins ?? 0),
      winRate: Number(d.winRate ?? 0),
      totalPoints: Number(d.totalPoints ?? 0),
      totalPrecision: Number(d.totalPrecision ?? 0),
      totalUpset: Number(d.totalUpset ?? 0),
      activeWinStreak: streakFromCumulative(d, league),
    });
  }

  const startKey = rankingStartDateKey ?? resolveRankingStartDateKey(undefined);
  const dateKeys = dateKeysFromStartToTodayJST(startKey);
  const firstDaySinceMs = rankingStartAtMs ?? null;
  const dailyAgg =
    metric === "activeWinStreak"
      ? new Map(uids.map((uid) => [uid, emptyAgg()] as const))
      : await aggregateFromDailyRange(
          db,
          uids,
          dateKeys,
          league,
          rankingTeamIds,
          firstDaySinceMs
        );

  const rows = uids.map((uid) => {
    const c = cumulativeByUid.get(uid) ?? null;
    const agg = dailyAgg.get(uid) ?? emptyAgg();
    return rowFromAgg(uid, agg, c, metric, league);
  });

  rows.sort((a, b) => {
    if (b.sortValue !== a.sortValue) return b.sortValue - a.sortValue;
    return a.uid.localeCompare(b.uid);
  });

  return rows;
}
