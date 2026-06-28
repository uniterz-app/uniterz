import type { Firestore } from "firebase-admin/firestore";
import { normalizeLeague, type League } from "@/lib/leagues";
import { TIMEZONE_JST, parseDateKeyInTimeZone } from "@/lib/time/zonedTime";
import type { CommunityLeague } from "./types";
import type { MemberAgg } from "./groupStats";
import { timestampToMs } from "./rankingStartDate";

function emptyAgg(): MemberAgg {
  return {
    totalPosts: 0,
    totalWins: 0,
    totalPoints: 0,
    totalPrecision: 0,
    totalUpset: 0,
  };
}

function addMarkerToAgg(agg: MemberAgg, marker: Record<string, unknown>) {
  if (marker.countedForRanking === false) return;
  agg.totalPosts += Number(marker.posts ?? 0);
  agg.totalWins += Number(marker.wins ?? 0);
  agg.totalPoints += Number(marker.pointsSumV3 ?? 0);
  agg.totalPrecision += Number(marker.scorePrecisionSum ?? 0);
  agg.totalUpset += Number(marker.upsetPointsSum ?? 0);
}

function markerLeagueKey(marker: Record<string, unknown>): League | null {
  const raw = marker.league;
  if (raw == null) return null;
  return normalizeLeague(raw);
}

function markerInvolvesAnyTeam(
  marker: Record<string, unknown>,
  teamIds: string[]
): boolean {
  if (teamIds.length === 0) return true;
  const home =
    typeof marker.homeTeamId === "string" ? marker.homeTeamId.trim() : "";
  const away =
    typeof marker.awayTeamId === "string" ? marker.awayTeamId.trim() : "";
  return teamIds.some((t) => t === home || t === away);
}

function markerAtMs(marker: Record<string, unknown>): number | null {
  return timestampToMs(marker.at);
}

function markerCountsForLeague(
  marker: Record<string, unknown>,
  league: CommunityLeague
): boolean {
  if (marker.countedForRanking === false) return false;
  if (league === "all") return true;
  return markerLeagueKey(marker) === league;
}

function markerCountsSince(
  marker: Record<string, unknown>,
  sinceMs: number
): boolean {
  const atMs = markerAtMs(marker);
  if (atMs == null) return true;
  return atMs >= sinceMs;
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

function emptyMapForUids(uids: string[]): Map<string, MemberAgg> {
  const map = new Map<string, MemberAgg>();
  for (const uid of uids) map.set(uid, emptyAgg());
  return map;
}

/** チーム絞り込み: applied_posts マーカーから重複なく合算（リーグ条件も適用） */
async function aggregateTeamsFromAppliedPosts(
  db: Firestore,
  uids: string[],
  dateKeys: string[],
  league: CommunityLeague,
  rankingTeamIds: string[],
  sinceMs?: number | null
): Promise<Map<string, MemberAgg>> {
  const map = emptyMapForUids(uids);
  if (uids.length === 0 || dateKeys.length === 0 || rankingTeamIds.length === 0) {
    return map;
  }

  await Promise.all(
    uids.map(async (uid) => {
      const agg = map.get(uid);
      if (!agg) return;

      await Promise.all(
        dateKeys.map(async (dateKey) => {
          const snap = await db
            .collection(`user_stats_v2_daily/${uid}_${dateKey}/applied_posts`)
            .get();
          for (const doc of snap.docs) {
            const marker = doc.data() as Record<string, unknown>;
            if (sinceMs != null && !markerCountsSince(marker, sinceMs)) continue;
            if (!markerInvolvesAnyTeam(marker, rankingTeamIds)) continue;
            if (!markerCountsForLeague(marker, league)) continue;
            addMarkerToAgg(agg, marker);
          }
        })
      );
    })
  );

  return map;
}

/**
 * user_stats_v2_daily の applied_posts からチーム絞り込み集計（1〜N チーム OR）。
 * firstDaySinceMs: 開始日のみ作成時刻以降のマーカーに限定（それ以降の日は全日）。
 */
export async function aggregateFromDailyTeams(
  db: Firestore,
  uids: string[],
  dateKeys: string[],
  league: CommunityLeague,
  rankingTeamIds: string[],
  firstDaySinceMs?: number | null
): Promise<Map<string, MemberAgg>> {
  if (rankingTeamIds.length === 0) {
    return emptyMapForUids(uids);
  }

  if (dateKeys.length === 0) return emptyMapForUids(uids);

  const [firstKey, ...restKeys] = dateKeys;
  const dayStartMs = parseDateKeyInTimeZone(firstKey, TIMEZONE_JST)?.getTime() ?? 0;
  const usePartialStartDay =
    firstDaySinceMs != null && firstDaySinceMs > dayStartMs + 1000;

  if (!usePartialStartDay) {
    return aggregateTeamsFromAppliedPosts(
      db,
      uids,
      dateKeys,
      league,
      rankingTeamIds
    );
  }

  const map = emptyMapForUids(uids);
  const partial = await aggregateTeamsFromAppliedPosts(
    db,
    uids,
    [firstKey],
    league,
    rankingTeamIds,
    firstDaySinceMs
  );
  mergeMemberAggs(map, partial);

  if (restKeys.length > 0) {
    const rest = await aggregateTeamsFromAppliedPosts(
      db,
      uids,
      restKeys,
      league,
      rankingTeamIds
    );
    mergeMemberAggs(map, rest);
  }

  return map;
}
