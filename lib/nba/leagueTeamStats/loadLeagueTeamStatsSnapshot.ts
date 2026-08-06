import type { Firestore } from "firebase-admin/firestore";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import {
  resolveLeagueTeamStatsFromFirestore,
  resolveLeagueTeamStatsMockFallback,
} from "./normalizeLeagueTeamStatsSnapshot";
import type {
  NbaLeagueTeamStatsApiPayload,
  NbaLeagueTeamStatsFirestoreDoc,
} from "./leagueTeamStatsTypes";

export const NBA_LEAGUE_TEAM_STATS_COLLECTION = "nbaLeagueTeamStats";

export function normalizeLeagueTeamStatsSeasonKey(raw: string | null | undefined): string {
  const trimmed = (raw ?? "").trim();
  return trimmed || CURRENT_NBA_SEASON_KEY;
}

export async function loadLeagueTeamStatsSnapshot(
  db: Firestore,
  seasonKey: string
): Promise<NbaLeagueTeamStatsApiPayload> {
  const snap = await db
    .collection(NBA_LEAGUE_TEAM_STATS_COLLECTION)
    .doc(seasonKey)
    .get();

  const fromFs = snap.exists
    ? resolveLeagueTeamStatsFromFirestore(
        snap.data() as NbaLeagueTeamStatsFirestoreDoc
      )
    : null;

  const resolved = fromFs ?? resolveLeagueTeamStatsMockFallback();

  return {
    ok: true,
    season: seasonKey,
    bundle: resolved.bundle,
    source: resolved.source,
    updatedAt: resolved.updatedAt?.toISOString() ?? null,
  };
}
