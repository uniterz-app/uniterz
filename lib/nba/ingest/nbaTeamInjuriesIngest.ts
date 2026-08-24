/**
 * BDL player_injuries → Firestore `nbaTeamInjuries/{seasonKey}`。
 * クライアントは BDL を叩かない。
 */
import type { Firestore } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import { requireBdlNbaApiKey } from "@/lib/nba/bdl/bdlNbaEnv";
import { fetchBdlPlayerInjuries } from "@/lib/nba/bdl/fetchBdlPlayerInjuries";
import { buildTeamInjuriesBundleFromBdl } from "@/lib/nba/teamInjuries/mapBdlToTeamInjuries";
import { writeTeamInjuriesSnapshot } from "@/lib/nba/teamInjuries/loadTeamInjuriesSnapshot";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";

export const NBA_TEAM_INJURIES_INGEST_READY = true;

export type NbaTeamInjuriesIngestInput = {
  seasonKey?: string;
};

export type NbaTeamInjuriesIngestResult = {
  ok: true;
  seasonKey: string;
  teamCount: number;
  injuryCount: number;
};

export async function ingestNbaTeamInjuriesFromBdl(
  db: Firestore,
  input: NbaTeamInjuriesIngestInput = {}
): Promise<NbaTeamInjuriesIngestResult> {
  requireBdlNbaApiKey();
  const seasonKey = (input.seasonKey ?? CURRENT_NBA_SEASON_KEY).trim();
  const rows = await fetchBdlPlayerInjuries();
  const { teams } = buildTeamInjuriesBundleFromBdl(rows, seasonKey);

  const { teamCount } = await writeTeamInjuriesSnapshot(db, seasonKey, teams, {
    source: "firestore",
    serverTimestamp: FieldValue.serverTimestamp(),
  });

  const injuryCount = Object.values(teams).reduce((s, list) => s + list.length, 0);

  return { ok: true, seasonKey, teamCount, injuryCount };
}
