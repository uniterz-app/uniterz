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
 * PPG の季の切り替え:
 * - プレシーズン〜今季レギュラーが 0 試合: 直前季（例 2025-26）
 * - 今季レギュラーを 1 試合でも誰かが出場（BDL regular averages に gp≥1）: 今季
 *
 * BDL `season_type=regular` のみ見るのでプレシーズン平均は混ざらない。
 */
async function resolveRosterAverages(seasonKey: string): Promise<{
  averagesSeasonKey: string;
  rows: BdlPlayerSeasonAverageRow[];
}> {
  const year = bdlSeasonYearFromSeasonKey(seasonKey);
  const currentRows = await loadAveragesForSeasonYear(year);
  // 今季レギュラーが1試合でも始まっていれば今季平均
  if (playerAveragesRowsHavePlayed(currentRows)) {
    return { averagesSeasonKey: seasonKey, rows: currentRows };
  }
  const prevKey = previousNbaSeasonKey(seasonKey);
  const prevYear = bdlSeasonYearFromSeasonKey(prevKey);
  const prevRows = await loadAveragesForSeasonYear(prevYear);
  if (playerAveragesRowsHavePlayed(prevRows)) {
    return { averagesSeasonKey: seasonKeyFromYear(prevYear), rows: prevRows };
  }
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
