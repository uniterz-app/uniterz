/**
 * ENTRY 用プロフィール一括取得。
 * users + cumulative_stats を getAll、期間順位は週/月スナップ 3 本だけ読む。
 */

import type { Firestore } from "firebase-admin/firestore";
import type { GroupBattleEntryProfile } from "@/lib/groupBattles/entryProfileTypes";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import { periodRankingSnapshotDocId } from "@/lib/rankings/rankingDivision";
import { currentRankingPeriodLabel } from "@/lib/rankings/rankingPeriod";
import {
  previousMonthKeyJST,
  previousWeekLabelForMondayDelivery,
} from "@/lib/reports/reportDelivery";
import { currentSeasonWinStreak } from "@/lib/profile/currentSeasonWinStreak";

export type { GroupBattleEntryProfile } from "@/lib/groupBattles/entryProfileTypes";

const GET_ALL_CHUNK = 100;

type SeasonBucket = {
  totalPoints?: unknown;
  totalPosts?: unknown;
  totalWins?: unknown;
  winRate?: unknown;
};

function asFiniteNumber(v: unknown): number | null {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return null;
  return n;
}

function asPositiveRank(v: unknown): number | null {
  const n = asFiniteNumber(v);
  if (n == null) return null;
  const i = Math.floor(n);
  return i > 0 ? i : null;
}

function winRatePercentFromBucket(bucket: SeasonBucket | null): number {
  if (!bucket) return 0;
  const posts = Math.max(0, Math.floor(asFiniteNumber(bucket.totalPosts) ?? 0));
  const wins = Math.max(0, Math.floor(asFiniteNumber(bucket.totalWins) ?? 0));
  if (posts > 0) {
    return Math.round((wins / posts) * 1000) / 10;
  }
  const wr = asFiniteNumber(bucket.winRate);
  if (wr == null) return 0;
  // 0–1 なら %、すでに % ならそのまま
  const pct = wr <= 1 ? wr * 100 : wr;
  return Math.round(pct * 10) / 10;
}

function seasonBucket(
  data: Record<string, unknown> | undefined
): SeasonBucket | null {
  if (!data) return null;
  const bySeason = data.rankingBySeason as
    | Record<string, SeasonBucket>
    | undefined;
  const season = bySeason?.[CURRENT_NBA_SEASON_KEY];
  if (season && typeof season === "object") return season;
  const ranking = data.ranking;
  if (ranking && typeof ranking === "object") return ranking as SeasonBucket;
  return null;
}

function streakFromCumulative(data: Record<string, unknown> | undefined): number {
  if (!data) return 0;
  const bySport = data.streakBySport as Record<string, unknown> | undefined;
  const raw =
    data.activeWinStreakBasketball ??
    bySport?.basketball ??
    data.activeWinStreak;
  return currentSeasonWinStreak(raw, data.streakSeasonKeyBasketball);
}

async function loadRanksMap(
  db: Firestore,
  period: "weekly" | "monthly",
  label: string
): Promise<Record<string, number>> {
  const docId = periodRankingSnapshotDocId({
    division: "standard",
    period,
    label,
    metric: "totalPoints",
  });
  const snap = await db.collection("period_ranking_snapshots").doc(docId).get();
  if (!snap.exists) return {};
  const ranks = snap.data()?.ranks;
  if (!ranks || typeof ranks !== "object") return {};
  const out: Record<string, number> = {};
  for (const [uid, raw] of Object.entries(ranks as Record<string, unknown>)) {
    const r = asPositiveRank(raw);
    if (r != null) out[uid] = r;
  }
  return out;
}

/**
 * 複数 uid の ENTRY プロフィール。
 * 期間順位: 今週 / 先週 / 先月（standard totalPoints）。
 */
export async function loadGroupBattleEntryProfiles(
  db: Firestore,
  uids: string[],
  now: Date = new Date()
): Promise<Map<string, GroupBattleEntryProfile>> {
  const unique = [...new Set(uids.filter(Boolean))];
  const out = new Map<string, GroupBattleEntryProfile>();
  if (unique.length === 0) return out;

  const thisWeek = currentRankingPeriodLabel("weekly", now);
  const lastWeek = previousWeekLabelForMondayDelivery(now);
  const lastMonth = previousMonthKeyJST(now);

  const [thisWeekRanks, lastWeekRanks, lastMonthRanks] = await Promise.all([
    loadRanksMap(db, "weekly", thisWeek),
    loadRanksMap(db, "weekly", lastWeek),
    loadRanksMap(db, "monthly", lastMonth),
  ]);

  for (let i = 0; i < unique.length; i += GET_ALL_CHUNK) {
    const chunk = unique.slice(i, i + GET_ALL_CHUNK);
    const userRefs = chunk.map((uid) => db.collection("users").doc(uid));
    const cumRefs = chunk.map((uid) =>
      db.collection("cumulative_stats").doc(uid)
    );
    const [userSnaps, cumSnaps] = await Promise.all([
      db.getAll(...userRefs),
      db.getAll(...cumRefs),
    ]);

    for (let j = 0; j < chunk.length; j++) {
      const uid = chunk[j]!;
      const userSnap = userSnaps[j]!;
      const cumSnap = cumSnaps[j]!;

      if (!userSnap.exists) continue;
      const u = userSnap.data() as Record<string, unknown>;
      if (u.deletedAt) continue;
      const handleRaw = typeof u.handle === "string" ? u.handle.trim() : "";
      if (handleRaw.startsWith("deleted_")) continue;

      const displayName =
        typeof u.displayName === "string" && u.displayName.trim()
          ? u.displayName.trim()
          : "User";
      const photoURL =
        typeof u.photoURL === "string" && u.photoURL.trim()
          ? u.photoURL.trim()
          : typeof u.avatarUrl === "string" && u.avatarUrl.trim()
            ? u.avatarUrl.trim()
            : null;
      const plan = u.plan === "pro" ? "pro" : "free";

      const cum = cumSnap.exists
        ? (cumSnap.data() as Record<string, unknown>)
        : undefined;
      const bucket = seasonBucket(cum);
      const points = Math.max(
        0,
        Math.floor(asFiniteNumber(bucket?.totalPoints) ?? 0)
      );
      const totalPosts = Math.max(
        0,
        Math.floor(asFiniteNumber(bucket?.totalPosts) ?? 0)
      );

      out.set(uid, {
        uid,
        displayName,
        handle: handleRaw || null,
        photoURL,
        plan,
        points,
        winRate: winRatePercentFromBucket(bucket),
        activeWinStreak: streakFromCumulative(cum),
        totalPosts,
        thisWeekRank: thisWeekRanks[uid] ?? null,
        lastWeekRank: lastWeekRanks[uid] ?? null,
        lastMonthRank: lastMonthRanks[uid] ?? null,
      });
    }
  }

  return out;
}

export function entryProfileOrFallback(
  uid: string,
  map: Map<string, GroupBattleEntryProfile>,
  index = 0
): GroupBattleEntryProfile {
  const hit = map.get(uid);
  if (hit) return hit;
  const short = uid.length >= 4 ? uid.slice(-4) : uid || String(index + 1);
  return {
    uid,
    displayName: `Player · ${short}`,
    handle: null,
    photoURL: null,
    plan: "free",
    points: 0,
    winRate: 0,
    activeWinStreak: 0,
    totalPosts: 0,
    thisWeekRank: null,
    lastWeekRank: null,
    lastMonthRank: null,
  };
}
