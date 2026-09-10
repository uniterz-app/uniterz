import type { DocumentReference, Firestore } from "firebase-admin/firestore";
import type {
  CommunityLeague,
  CommunityMetric,
  CommunityPeriodType,
} from "./types";
import type { CommunityGamesScope } from "./communityGamesScope";
import { resolveCommunityDateKeys } from "./resolveCommunityDateKeys";
import { aggregateFromDailyTeams } from "./groupStatsTeams";
import {
  resolveRankingStartDateKey,
  timestampToMs,
} from "./rankingStartDate";
import { normalizeLeague } from "@/lib/leagues";
import { TIMEZONE_JST, parseDateKeyInTimeZone } from "@/lib/time/zonedTime";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";

function readWcOverallDailyBucket(
  data: Record<string, unknown>
): Record<string, unknown> {
  const nested = (data.rankingByWcStage ?? {}) as Record<
    string,
    Record<string, unknown>
  >;
  return { ...(nested.overall ?? {}) };
}

export type MemberAgg = {
  totalPosts: number;
  totalWins: number;
  totalPoints: number;
  totalUpset: number;
};

function emptyAgg(): MemberAgg {
  return {
    totalPosts: 0,
    totalWins: 0,
    totalPoints: 0,
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
  agg.totalUpset += Number(
    (bucket as { upsetPointsSum?: number }).upsetPointsSum ?? 0
  );
}

function asBucket(v: unknown): Record<string, unknown> | undefined {
  if (!v || typeof v !== "object") return undefined;
  return v as Record<string, unknown>;
}

function nestedSeasonBucket(
  root: unknown,
  seasonKey: string
): Record<string, unknown> | undefined {
  const map = asBucket(root);
  if (!map) return undefined;
  return asBucket(map[seasonKey]);
}

/**
 * 日次ドキュメントから集計バケットを選ぶ。
 * writer（updateUserStatsV2）と揃える。危険なフォールバックは置かない。
 *
 * pickup: ranking / rankingBySeason
 * all:    openRanking / openRankingBySeason / rankingByNbaPlayoffs
 * pickup+playoffs は日次に専用バケットが無い → 呼び出し側で marker 集計
 */
function dailyBucket(
  data: Record<string, unknown> | undefined,
  league: CommunityLeague,
  gamesScope: CommunityGamesScope,
  periodType: CommunityPeriodType,
  seasonKey: string
): Record<string, unknown> | undefined {
  if (!data) return undefined;

  if (gamesScope === "pickup") {
    if (periodType === "nba_season") {
      return nestedSeasonBucket(data.rankingBySeason, seasonKey);
    }
    if (periodType === "nba_playoffs") {
      // pickup 専用プレーオフ日次は無い（marker 経路へ）
      return undefined;
    }
    // from_now / calendar_month: Match Pickup のみ（all に落とさない）
    return asBucket(data.ranking);
  }

  if (periodType === "nba_season") {
    return nestedSeasonBucket(data.openRankingBySeason, seasonKey);
  }

  if (periodType === "nba_playoffs") {
    return nestedSeasonBucket(data.rankingByNbaPlayoffs, seasonKey);
  }

  // from_now / calendar_month — オープンランキング
  if (league === "all" || league === "nba") {
    return asBucket(data.openRanking);
  }

  if (league === "wc") {
    const overall = readWcOverallDailyBucket(data);
    if (Number(overall.posts ?? 0) > 0) {
      return overall;
    }
    const leagues = data.leagues as Record<string, unknown> | undefined;
    return asBucket(leagues?.wc);
  }

  const leagues = data.leagues as Record<string, unknown> | undefined;
  return asBucket(leagues?.[league]);
}

function mustUseAppliedPostsMarkers(
  rankingTeamIds: string[],
  gamesScope: CommunityGamesScope,
  periodType: CommunityPeriodType
): boolean {
  if (rankingTeamIds.length > 0) return true;
  // pickup × プレーオフ: 日次バケットが無い
  return gamesScope === "pickup" && periodType === "nba_playoffs";
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
  league: CommunityLeague,
  gamesScope: CommunityGamesScope,
  periodType: CommunityPeriodType,
  seasonKey: string
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
      addBucketToAgg(
        agg,
        dailyBucket(snap.data(), league, gamesScope, periodType, seasonKey)
      );
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

function markerMatchesGamesScope(
  marker: Record<string, unknown>,
  gamesScope: CommunityGamesScope
): boolean {
  if (gamesScope === "pickup") return marker.countedForPickup === true;
  return marker.countedForRanking !== false;
}

function markerCountsForLeague(
  marker: Record<string, unknown>,
  league: CommunityLeague,
  gamesScope: CommunityGamesScope
): boolean {
  if (!markerMatchesGamesScope(marker, gamesScope)) return false;
  if (league === "all") return true;
  const raw = marker.league;
  if (raw == null) return false;
  return normalizeLeague(raw) === league;
}

async function aggregateFromAppliedPostsSince(
  db: Firestore,
  uids: string[],
  dateKey: string,
  league: CommunityLeague,
  sinceMs: number,
  gamesScope: CommunityGamesScope
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
        if (!markerCountsForLeague(marker, league, gamesScope)) continue;
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
  firstDaySinceMs: number | null | undefined,
  gamesScope: CommunityGamesScope,
  periodType: CommunityPeriodType,
  seasonKey: string
): Promise<Map<string, MemberAgg>> {
  if (dateKeys.length === 0) {
    const map = new Map<string, MemberAgg>();
    for (const uid of uids) map.set(uid, emptyAgg());
    return map;
  }

  const useMarkers = mustUseAppliedPostsMarkers(
    rankingTeamIds,
    gamesScope,
    periodType
  );
  const [firstKey, ...restKeys] = dateKeys;
  const dayStartMs =
    parseDateKeyInTimeZone(firstKey, TIMEZONE_JST)?.getTime() ?? 0;
  const usePartialStartDay =
    firstDaySinceMs != null && firstDaySinceMs > dayStartMs + 1000;

  if (!usePartialStartDay) {
    if (useMarkers) {
      return aggregateFromDailyTeams(
        db,
        uids,
        dateKeys,
        league,
        rankingTeamIds,
        null,
        gamesScope
      );
    }
    return aggregateFromDaily(
      db,
      uids,
      dateKeys,
      league,
      gamesScope,
      periodType,
      seasonKey
    );
  }

  const map = new Map<string, MemberAgg>();
  for (const uid of uids) map.set(uid, emptyAgg());

  const partial = useMarkers
    ? await aggregateFromDailyTeams(
        db,
        uids,
        [firstKey],
        league,
        rankingTeamIds,
        firstDaySinceMs,
        gamesScope
      )
    : await aggregateFromAppliedPostsSince(
        db,
        uids,
        firstKey,
        league,
        firstDaySinceMs!,
        gamesScope
      );
  mergeMemberAggs(map, partial);

  if (restKeys.length > 0) {
    const rest = useMarkers
      ? await aggregateFromDailyTeams(
          db,
          uids,
          restKeys,
          league,
          rankingTeamIds,
          null,
          gamesScope
        )
      : await aggregateFromDaily(
          db,
          uids,
          restKeys,
          league,
          gamesScope,
          periodType,
          seasonKey
        );
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
  plan: "free" | "pro";
  totalPosts: number;
  totalWins: number;
  winRate: number;
  totalPoints: number;
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
    totalUpset: agg.totalUpset,
    activeWinStreak: streak,
    sortValue: sortValueFromAgg(agg, c, metric, league),
  };
}

export type BuildMemberLeaderboardOptions = {
  periodType: CommunityPeriodType;
  league?: CommunityLeague;
  rankingStartDateKey?: string | null;
  rankingEndDateKey?: string | null;
  rankingPeriodMonthKey?: string | null;
  rankingSeasonKey?: string | null;
  rankingTeamIds?: string[];
  rankingStartAtMs?: number | null;
  gamesScope?: CommunityGamesScope;
};

/**
 * メンバーごとの表示用行 + ソート値（降順）
 * 互換: 旧引数並び (period, league, startKey, teamIds, startAtMs) も可。
 */
export async function buildMemberLeaderboard(
  db: Firestore,
  memberUids: string[],
  metric: CommunityMetric,
  periodOrOpts: CommunityPeriodType | BuildMemberLeaderboardOptions,
  leagueArg: CommunityLeague = "all",
  rankingStartDateKeyArg?: string | null,
  rankingTeamIdsArg: string[] = [],
  rankingStartAtMsArg?: number | null
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
    totalUpset: number;
    activeWinStreak: number;
    sortValue: number;
  }[]
> {
  const opts: BuildMemberLeaderboardOptions =
    typeof periodOrOpts === "string"
      ? {
          periodType: periodOrOpts,
          league: leagueArg,
          rankingStartDateKey: rankingStartDateKeyArg,
          rankingTeamIds: rankingTeamIdsArg,
          rankingStartAtMs: rankingStartAtMsArg,
          gamesScope: "all",
        }
      : periodOrOpts;

  const league = opts.league ?? "all";
  const rankingTeamIds = opts.rankingTeamIds ?? [];
  const gamesScope = opts.gamesScope ?? "all";
  const periodType = opts.periodType;

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
      totalUpset: Number(d.totalUpset ?? 0),
      activeWinStreak: streakFromCumulative(d, league),
    });
  }

  const startKey =
    opts.rankingStartDateKey ?? resolveRankingStartDateKey(undefined);
  const resolved = resolveCommunityDateKeys({
    periodType,
    rankingStartDateKey: startKey,
    rankingEndDateKey: opts.rankingEndDateKey,
    rankingPeriodMonthKey: opts.rankingPeriodMonthKey,
    rankingSeasonKey: opts.rankingSeasonKey ?? CURRENT_NBA_SEASON_KEY,
  });

  const firstDaySinceMs =
    periodType === "from_now" ? opts.rankingStartAtMs ?? null : null;

  const dailyAgg =
    metric === "activeWinStreak"
      ? new Map(uids.map((uid) => [uid, emptyAgg()] as const))
      : await aggregateFromDailyRange(
          db,
          uids,
          resolved.dateKeys,
          league,
          rankingTeamIds,
          firstDaySinceMs,
          gamesScope,
          periodType,
          resolved.seasonKey
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
