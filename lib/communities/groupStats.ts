import type { DocumentReference, Firestore } from "firebase-admin/firestore";
import type {
  CommunityLeague,
  CommunityMetric,
  CommunityPeriodType,
} from "./types";
import { dateKeysFromStartToTodayJST } from "./dateRange";
import { aggregateFromDailyTeams } from "./groupStatsTeams";
import { resolveRankingStartDateKey } from "./rankingStartDate";

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
    const all = data.all;
    return all && typeof all === "object"
      ? (all as Record<string, unknown>)
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
  metric: CommunityMetric
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

function rowFromAgg(
  uid: string,
  agg: MemberAgg,
  c: CumulativeRow | null,
  metric: CommunityMetric
) {
  const winRate = agg.totalPosts > 0 ? agg.totalWins / agg.totalPosts : 0;
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
    activeWinStreak: c?.activeWinStreak ?? 0,
    sortValue: sortValueFromAgg(agg, c, metric),
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
  rankingTeamIds: string[] = []
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
      activeWinStreak: Number(d.activeWinStreak ?? 0),
    });
  }

  const startKey = rankingStartDateKey ?? resolveRankingStartDateKey(undefined);
  const dateKeys = dateKeysFromStartToTodayJST(startKey);
  const teamFilterActive = rankingTeamIds.length > 0;
  const dailyAgg =
    metric === "activeWinStreak"
      ? new Map(uids.map((uid) => [uid, emptyAgg()] as const))
      : teamFilterActive
        ? await aggregateFromDailyTeams(
            db,
            uids,
            dateKeys,
            league,
            rankingTeamIds
          )
        : await aggregateFromDaily(db, uids, dateKeys, league);

  const rows = uids.map((uid) => {
    const c = cumulativeByUid.get(uid) ?? null;
    const agg = dailyAgg.get(uid) ?? emptyAgg();
    return rowFromAgg(uid, agg, c, metric);
  });

  rows.sort((a, b) => {
    if (b.sortValue !== a.sortValue) return b.sortValue - a.sortValue;
    return a.uid.localeCompare(b.uid);
  });

  return rows;
}
