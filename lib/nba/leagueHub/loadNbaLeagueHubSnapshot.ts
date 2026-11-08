import type { Firestore } from "firebase-admin/firestore";
import {
  NBA_LEAGUE_HUB_COLLECTION,
  type NbaLeagueHubApiPayload,
  type NbaLeagueHubDoc,
} from "@/lib/nba/leagueHub/leagueHubTypes";

export async function loadNbaLeagueHubSnapshot(
  db: Firestore,
  seasonKey: string
): Promise<NbaLeagueHubApiPayload> {
  const snap = await db.collection(NBA_LEAGUE_HUB_COLLECTION).doc(seasonKey).get();
  if (!snap.exists) return { ok: true, season: seasonKey, hub: null, updatedAt: null };
  const { updatedAt, ...hub } = snap.data() as NbaLeagueHubDoc & {
    updatedAt?: { toDate(): Date };
  };
  return {
    ok: true,
    season: seasonKey,
    hub: hub as NbaLeagueHubDoc,
    updatedAt: updatedAt?.toDate().toISOString() ?? null,
  };
}
