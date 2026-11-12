import type { Firestore } from "firebase-admin/firestore";
import {
  NBA_LEAGUE_HUB_COLLECTION,
  NBA_LEAGUE_HUB_DETAIL_COLLECTION,
  type NbaLeagueHubApiPayload,
  type NbaLeagueHubDoc,
} from "@/lib/nba/leagueHub/leagueHubTypes";
import {
  leagueHubDetailDocIds,
  mergeLeagueHubDetail,
  type LeagueHubLineupsDetail,
  type LeagueHubMatchupsDetail,
} from "@/lib/nba/leagueHub/leagueHubDetailSplit";

export async function loadNbaLeagueHubSnapshot(
  db: Firestore,
  seasonKey: string
): Promise<NbaLeagueHubApiPayload> {
  const detailIds = leagueHubDetailDocIds(seasonKey);
  const detail = db.collection(NBA_LEAGUE_HUB_DETAIL_COLLECTION);
  const [snap, matchupsSnap, lineupsSnap] = await Promise.all([
    db.collection(NBA_LEAGUE_HUB_COLLECTION).doc(seasonKey).get(),
    detail.doc(detailIds.matchups).get(),
    detail.doc(detailIds.lineups).get(),
  ]);
  if (!snap.exists) return { ok: true, season: seasonKey, hub: null, updatedAt: null };
  const { updatedAt, ...hub } = snap.data() as NbaLeagueHubDoc & {
    updatedAt?: { toDate(): Date };
  };
  return {
    ok: true,
    season: seasonKey,
    hub: mergeLeagueHubDetail(
      hub as NbaLeagueHubDoc,
      matchupsSnap.exists ? (matchupsSnap.data() as LeagueHubMatchupsDetail) : null,
      lineupsSnap.exists ? (lineupsSnap.data() as LeagueHubLineupsDetail) : null
    ),
    updatedAt: updatedAt?.toDate().toISOString() ?? null,
  };
}
