import type { Firestore } from "firebase-admin/firestore";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import {
  resolveLeagueTeamStatsFromFirestore,
  resolveLeagueTeamStatsMockFallback,
} from "./normalizeLeagueTeamStatsSnapshot";
import type { NbaLeagueTeamStatsBundle } from "@/lib/predict/nbaLeagueTeamStatsMocks";
import type {
  NbaLeagueTeamStatsApiPayload,
  NbaLeagueTeamStatsFirestoreDoc,
  NbaLeagueTeamStatsSnapshotSource,
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

/** seed / 将来の ingest が同じ口から書く */
export async function writeLeagueTeamStatsSnapshot(
  db: Firestore,
  seasonKey: string,
  bundle: NbaLeagueTeamStatsBundle,
  source: NbaLeagueTeamStatsSnapshotSource,
  serverTimestamp: unknown
): Promise<void> {
  await db.collection(NBA_LEAGUE_TEAM_STATS_COLLECTION).doc(seasonKey).set({
    season: bundle.season,
    last10: bundle.last10,
    asOfLabel: bundle.asOfLabel.replace(/^MOCK · /, "SNAPSHOT · "),
    source,
    updatedAt: serverTimestamp,
  });
}
