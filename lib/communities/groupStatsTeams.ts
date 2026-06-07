import type { DocumentReference, Firestore } from "firebase-admin/firestore";
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

function teamBucket(
  data: Record<string, unknown> | undefined,
  teamId: string
): Record<string, unknown> | undefined {
  if (!data) return undefined;
  const teams = data.teams as Record<string, unknown> | undefined;
  const bucket = teams?.[teamId];
  return bucket && typeof bucket === "object"
    ? (bucket as Record<string, unknown>)
    : undefined;
}

function parseDailyDocId(id: string): { uid: string; dateKey: string } | null {
  const m = /^(.+)_(\d{4}-\d{2}-\d{2})$/.exec(id);
  if (!m) return null;
  return { uid: m[1], dateKey: m[2] };
}

/** 1チーム指定: daily.teams.{teamId} バケットを合算 */
async function aggregateSingleTeamFromDaily(
  db: Firestore,
  uids: string[],
  dateKeys: string[],
  teamId: string
): Promise<Map<string, MemberAgg>> {
  const map = new Map<string, MemberAgg>();
  for (const uid of uids) map.set(uid, emptyAgg());
  if (uids.length === 0 || dateKeys.length === 0) return map;

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
      addBucketToAgg(agg, teamBucket(snap.data(), teamId));
    }
  }

  return map;
}

/** 複数チーム（OR）: applied_posts マーカーから重複なく合算 */
async function aggregateMultiTeamFromAppliedPosts(
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
 * user_stats_v2_daily の teams.* バケット / applied_posts からチーム絞り込み集計。
 * - 1チーム: teams.{teamId} を合算（高速）
 * - 2チーム以上: applied_posts を OR 集計（1投稿1カウント）
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
  if (rankingTeamIds.length === 1) {
    return aggregateSingleTeamFromDaily(
      db,
      uids,
      dateKeys,
      rankingTeamIds[0]
    );
  }
  return aggregateMultiTeamFromAppliedPosts(
    db,
    uids,
    dateKeys,
    league,
    rankingTeamIds
  );
}
