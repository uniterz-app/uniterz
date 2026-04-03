import type { DocumentReference, Firestore } from "firebase-admin/firestore";
import type { CommunityMetric, CommunityPeriodType } from "./types";
import {
  currentMonthDateKeysJST,
  rolling30DateKeysJST,
} from "./dateRange";

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

/** daily doc id: {uid}_{yyyy-mm-dd} */
function parseDailyDocId(id: string): { uid: string; dateKey: string } | null {
  const m = /^(.+)_(\d{4}-\d{2}-\d{2})$/.exec(id);
  if (!m) return null;
  return { uid: m[1], dateKey: m[2] };
}

async function aggregateFromDaily(
  db: Firestore,
  uids: string[],
  dateKeys: string[]
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
      const all = snap.data()?.all;
      if (!all || typeof all !== "object") continue;
      agg.totalPosts += Number((all as { posts?: number }).posts ?? 0);
      agg.totalWins += Number((all as { wins?: number }).wins ?? 0);
      agg.totalPoints += Number((all as { pointsSumV3?: number }).pointsSumV3 ?? 0);
      agg.totalPrecision += Number(
        (all as { scorePrecisionSum?: number }).scorePrecisionSum ?? 0
      );
      agg.totalUpset += Number(
        (all as { upsetPointsSum?: number }).upsetPointsSum ?? 0
      );
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

export function sortValueFromCumulative(
  row: CumulativeRow,
  metric: CommunityMetric
): number {
  if (metric === "winRate") return row.winRate ?? 0;
  if (metric === "totalPoints") return row.totalPoints ?? 0;
  if (metric === "totalPrecision") return row.totalPrecision ?? 0;
  if (metric === "totalUpset") return row.totalUpset ?? 0;
  return row.activeWinStreak ?? 0;
}

/**
 * メンバーごとの表示用行 + ソート値（降順）
 */
export async function buildMemberLeaderboard(
  db: Firestore,
  memberUids: string[],
  metric: CommunityMetric,
  period: CommunityPeriodType
): Promise<
  {
    uid: string;
    displayName: string;
    handle: string | null;
    photoURL: string | null;
    countryCode: string | null;
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
      totalPosts: Number(d.totalPosts ?? 0),
      totalWins: Number(d.totalWins ?? 0),
      winRate: Number(d.winRate ?? 0),
      totalPoints: Number(d.totalPoints ?? 0),
      totalPrecision: Number(d.totalPrecision ?? 0),
      totalUpset: Number(d.totalUpset ?? 0),
      activeWinStreak: Number(d.activeWinStreak ?? 0),
    });
  }

  let dailyAgg: Map<string, MemberAgg> | null = null;
  if (period === "calendar_month") {
    dailyAgg = await aggregateFromDaily(db, uids, currentMonthDateKeysJST());
  } else if (period === "rolling_30d") {
    dailyAgg = await aggregateFromDaily(db, uids, rolling30DateKeysJST());
  }

  const rows = uids.map((uid) => {
    const c = cumulativeByUid.get(uid) ?? null;
    const displayName = c?.displayName ?? "user";
    const handle = c?.handle ?? null;
    const photoURL = c?.photoURL ?? null;
    const countryCode = c?.countryCode ?? null;

    if (period === "all_time" && c) {
      const sortValue = sortValueFromCumulative(c, metric);
      return {
        uid,
        displayName,
        handle,
        photoURL,
        countryCode,
        totalPosts: c.totalPosts,
        totalWins: c.totalWins,
        winRate: c.winRate,
        totalPoints: c.totalPoints,
        totalPrecision: c.totalPrecision,
        totalUpset: c.totalUpset,
        activeWinStreak: c.activeWinStreak,
        sortValue,
      };
    }

    const agg = dailyAgg?.get(uid) ?? emptyAgg();
    const winRate = agg.totalPosts > 0 ? agg.totalWins / agg.totalPosts : 0;
    const sortValue = sortValueFromAgg(agg, c, metric);

    return {
      uid,
      displayName,
      handle,
      photoURL,
      countryCode,
      totalPosts: agg.totalPosts,
      totalWins: agg.totalWins,
      winRate,
      totalPoints: agg.totalPoints,
      totalPrecision: agg.totalPrecision,
      totalUpset: agg.totalUpset,
      activeWinStreak: c?.activeWinStreak ?? 0,
      sortValue,
    };
  });

  rows.sort((a, b) => {
    if (b.sortValue !== a.sortValue) return b.sortValue - a.sortValue;
    return a.uid.localeCompare(b.uid);
  });

  return rows;
}
