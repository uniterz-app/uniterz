/**
 * BDL active players → Firestore `nbaTeamRosters/{seasonKey}`。
 * クライアントは BDL を叩かない。
 */
import type { Firestore } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import { bdlSeasonYearFromSeasonKey, requireBdlNbaApiKey } from "@/lib/nba/bdl/bdlNbaEnv";
import { fetchBdlActivePlayersByTeam } from "@/lib/nba/bdl/fetchBdlActivePlayers";
import { fetchBdlPlayerSeasonAverages } from "@/lib/nba/bdl/fetchBdlPlayerSeasonAverages";
import { writeTeamRostersSnapshot } from "@/lib/nba/teamRosters/loadTeamRostersSnapshot";
import {
  buildPlayerMinutesMap,
  mergeMinutesOntoRosterPlayers,
  sortRosterPlayersByMpg,
} from "@/lib/nba/teamRosters/mergeRosterPlayerMinutes";
import type { NbaTeamRosterDocTeam } from "@/lib/nba/teamRosters/teamRosterTypes";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";

export const NBA_TEAM_ROSTERS_INGEST_READY = true;

export type NbaTeamRostersIngestInput = {
  seasonKey?: string;
};

export type NbaTeamRostersIngestResult = {
  ok: true;
  seasonKey: string;
  teamCount: number;
  playerCount: number;
};

export async function ingestNbaTeamRostersFromBdl(
  db: Firestore,
  input: NbaTeamRostersIngestInput = {}
): Promise<NbaTeamRostersIngestResult> {
  requireBdlNbaApiKey();
  const seasonKey = (input.seasonKey ?? CURRENT_NBA_SEASON_KEY).trim();
  const seasonYear = bdlSeasonYearFromSeasonKey(seasonKey);

  const [byTeam, avgRows] = await Promise.all([
    fetchBdlActivePlayersByTeam(),
    fetchBdlPlayerSeasonAverages({
      seasonYear,
      category: "general",
      type: "base",
    }).catch(() => []),
  ]);

  const minutesMap = buildPlayerMinutesMap(avgRows);

  const teams: Record<string, NbaTeamRosterDocTeam> = {};
  for (const [teamId, snap] of byTeam) {
    const players = sortRosterPlayersByMpg(
      mergeMinutesOntoRosterPlayers(snap.players, minutesMap)
    );
    teams[teamId] = {
      teamId: snap.teamId,
      teamName: snap.teamName,
      players,
    };
  }

  const { teamCount, playerCount } = await writeTeamRostersSnapshot(
    db,
    seasonKey,
    teams,
    "firestore",
    FieldValue.serverTimestamp()
  );

  return { ok: true, seasonKey, teamCount, playerCount };
}
