import type { Firestore } from "firebase-admin/firestore";
import { normalizeLeague, type League } from "@/lib/leagues";
import type { CommunityLeague } from "./types";
import type { MemberAgg } from "./groupStats";

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

/** チーム絞り込み: applied_posts マーカーから重複なく合算（リーグ条件も適用） */
async function aggregateTeamsFromAppliedPosts(
  db: Firestore,
  uids: string[],
  dateKeys: string[],
  league: CommunityLeague,
  rankingTeamIds: string[]
): Promise<Map<string, MemberAgg>> {
  const map = new Map<string, MemberAgg>();
  for (const uid of uids) map.set(uid, emptyAgg());
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
            if (!markerInvolvesAnyTeam(marker, rankingTeamIds)) continue;
            const markerLeague = markerLeagueKey(marker);
            if (league !== "all" && markerLeague !== league) continue;
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
 */
export async function aggregateFromDailyTeams(
  db: Firestore,
  uids: string[],
  dateKeys: string[],
  league: CommunityLeague,
  rankingTeamIds: string[]
): Promise<Map<string, MemberAgg>> {
  if (rankingTeamIds.length === 0) {
    const map = new Map<string, MemberAgg>();
    for (const uid of uids) map.set(uid, emptyAgg());
    return map;
  }
  return aggregateTeamsFromAppliedPosts(
    db,
    uids,
    dateKeys,
    league,
    rankingTeamIds
  );
}
