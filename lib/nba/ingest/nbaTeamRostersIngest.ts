/**
 * BDL active players → Firestore `nbaTeamRosters/{seasonKey}`。
 * クライアントは BDL を叩かない。
 *
 * シーズン平均は全選手の base averages をロスター行に載せる。
 * 要求シーズン（例: 2026-27）に出場が無ければ直前シーズン（25-26）の平均を載せる。
 */
import type { Firestore } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import {
  bdlSeasonYearFromSeasonKey,
  requireBdlNbaApiKey,
} from "@/lib/nba/bdl/bdlNbaEnv";
import { fetchBdlActivePlayersByTeam } from "@/lib/nba/bdl/fetchBdlActivePlayers";
import {
  fetchBdlPlayerSeasonAverages,
  type BdlPlayerSeasonAverageRow,
} from "@/lib/nba/bdl/fetchBdlPlayerSeasonAverages";
import { writeTeamRostersSnapshot } from "@/lib/nba/teamRosters/loadTeamRostersSnapshot";
import {
  buildPlayerSeasonAveragesMap,
  mergeSeasonAveragesOntoRosterPlayers,
  playerAveragesRowsHavePlayed,
  sortRosterPlayersByMpg,
} from "@/lib/nba/teamRosters/mergeRosterPlayerMinutes";
import type { NbaTeamRosterDocTeam } from "@/lib/nba/teamRosters/teamRosterTypes";
import {
  CURRENT_NBA_SEASON_KEY,
  previousNbaSeasonKey,
} from "@/lib/rankings/nbaSeason";

export const NBA_TEAM_ROSTERS_INGEST_READY = true;

export type NbaTeamRostersIngestInput = {
  seasonKey?: string;
};

export type NbaTeamRostersIngestResult = {
  ok: true;
  seasonKey: string;
  averagesSeasonKey: string;
  teamCount: number;
  playerCount: number;
};

function seasonKeyFromYear(year: number): string {
  return `${year}-${String((year + 1) % 100).padStart(2, "0")}`;
}

async function loadAveragesForSeasonYear(
  seasonYear: number
): Promise<BdlPlayerSeasonAverageRow[]> {
  return fetchBdlPlayerSeasonAverages({
    seasonYear,
    category: "general",
    type: "base",
  }).catch(() => [] as BdlPlayerSeasonAverageRow[]);
}

/**
 * 2026-27（今季）のスタッツのみを厳密に使用する。
 * 2026-27に出場データ/スタッツが無ければ昨季データへフォールバックせず 0 とする。
 */
async function resolveRosterAverages(seasonKey: string): Promise<{
  averagesSeasonKey: string;
  rows: BdlPlayerSeasonAverageRow[];
}> {
  const year = bdlSeasonYearFromSeasonKey(seasonKey);
  const currentRows = await loadAveragesForSeasonYear(year);
  return { averagesSeasonKey: seasonKey, rows: currentRows };
}

export async function ingestNbaTeamRostersFromBdl(
  db: Firestore,
  input: NbaTeamRostersIngestInput = {}
): Promise<NbaTeamRostersIngestResult> {
  requireBdlNbaApiKey();
  const seasonKey = (input.seasonKey ?? CURRENT_NBA_SEASON_KEY).trim();

  const [byTeam, averages] = await Promise.all([
    fetchBdlActivePlayersByTeam(),
    resolveRosterAverages(seasonKey),
  ]);

  const averagesMap = buildPlayerSeasonAveragesMap(averages.rows);

  const teams: Record<string, NbaTeamRosterDocTeam> = {};
  for (const [teamId, snap] of byTeam) {
    const players = sortRosterPlayersByMpg(
      mergeSeasonAveragesOntoRosterPlayers(snap.players, averagesMap)
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
    FieldValue.serverTimestamp(),
    { averagesSeasonKey: averages.averagesSeasonKey }
  );

  return {
    ok: true,
    seasonKey,
    averagesSeasonKey: averages.averagesSeasonKey,
    teamCount,
    playerCount,
  };
}
