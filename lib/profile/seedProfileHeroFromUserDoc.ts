/**
 * users.profileHeroSnapshot を Kinetik カード用キャッシュに載せる。
 * cumulative_stats を待たず、users 1 read で数字を出す。
 */
"use client";

import type {
  SummaryForCardsV2,
  SummaryRanksV2,
} from "@/app/component/profile/useUserStatsV2";
import {
  heroSnapshotToSummary,
  heroSnapshotToSummaryRanks,
  isProfileHeroSnapshotFresh,
  parseProfileHeroSnapshot,
} from "@/lib/profile/profileHeroSnapshot";
import { preferredNbaKinetikPeriod } from "@/lib/rankings/nbaSeason";
import { seedNbaKinetikPeriodStatsCache } from "@/lib/profile/useNbaKinetikMonthlyStats";

export function seedProfileHeroFromUserDoc(
  uid: string,
  userDoc: Record<string, unknown> | null | undefined
): boolean {
  const safeUid = uid.trim();
  if (!safeUid || !userDoc) return false;
  const hero = parseProfileHeroSnapshot(userDoc);
  if (!isProfileHeroSnapshotFresh(hero)) return false;
  const ranks = heroSnapshotToSummaryRanks(hero) as SummaryRanksV2;
  seedNbaKinetikPeriodStatsCache(
    safeUid,
    "season",
    heroSnapshotToSummary(hero, "season") as SummaryForCardsV2,
    ranks
  );
  seedNbaKinetikPeriodStatsCache(
    safeUid,
    "playoffs",
    heroSnapshotToSummary(hero, "playoffs") as SummaryForCardsV2,
    ranks
  );
  return true;
}

export function profileHeroCardFromUserDoc(
  userDoc: Record<string, unknown> | null | undefined
): {
  summary: SummaryForCardsV2;
  summaryRanks: SummaryRanksV2;
} | null {
  const hero = parseProfileHeroSnapshot(userDoc);
  if (!isProfileHeroSnapshotFresh(hero)) return null;
  const period = preferredNbaKinetikPeriod();
  return {
    summary: heroSnapshotToSummary(hero, period) as SummaryForCardsV2,
    summaryRanks: heroSnapshotToSummaryRanks(hero) as SummaryRanksV2,
  };
}
