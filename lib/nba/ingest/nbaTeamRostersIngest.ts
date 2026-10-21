/**
 * BDL active players → Firestore `nbaTeamRosters/{seasonKey}`。
 * クライアントは BDL を叩かない。
 *
 * シーズン平均は全選手の base averages をロスター行に載せる。
 * 要求シーズン（例: 2026-27）に出場が無い選手は直前シーズン（25-26）の平均を載せる
 * （開幕前は全員、開幕後はまだ出場していない選手だけ。選手行の `averagesSeasonKey` に前季を入れる）。
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
import { mergePriorAveragesOntoRosterTeam } from "@/lib/nba/teamRosters/applyPriorSeasonRosterAverages";
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
import { filterCuratedRosterExcludedPlayers } from "@/lib/nba/teamRosters/nbaCuratedRosterExclusions";

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
 * PPG の季:
 * - 今季レギュラーに出場した選手（BDL regular averages に gp≥1）: 今季
 * - まだ出場していない選手: 直前季（例 2025-26）。開幕前は全員こちら
 * - ドキュメントの `averagesSeasonKey` は、今季に1人でも出場していれば今季
 *
 * BDL `season_type=regular` のみ見るのでプレシーズン平均は混ざらない。
 */
async function resolveRosterAverages(seasonKey: string): Promise<{
  averagesSeasonKey: string;
  rows: BdlPlayerSeasonAverageRow[];
  prior: { averagesSeasonKey: string; rows: BdlPlayerSeasonAverageRow[] } | null;
}> {
  const year = bdlSeasonYearFromSeasonKey(seasonKey);
  const prevKey = previousNbaSeasonKey(seasonKey);
  const prevYear = bdlSeasonYearFromSeasonKey(prevKey);
  const [currentRows, prevRows] = await Promise.all([
    loadAveragesForSeasonYear(year),
    prevKey !== seasonKey
      ? loadAveragesForSeasonYear(prevYear)
      : Promise.resolve([] as BdlPlayerSeasonAverageRow[]),
  ]);
  const prior = playerAveragesRowsHavePlayed(prevRows)
    ? { averagesSeasonKey: seasonKeyFromYear(prevYear), rows: prevRows }
    : null;
  if (playerAveragesRowsHavePlayed(currentRows) || !prior) {
    return { averagesSeasonKey: seasonKey, rows: currentRows, prior };
  }
  return { averagesSeasonKey: prior.averagesSeasonKey, rows: prior.rows, prior: null };
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
  const priorAveragesMap = averages.prior
    ? buildPlayerSeasonAveragesMap(averages.prior.rows)
    : null;

  const teams: Record<string, NbaTeamRosterDocTeam> = {};
  for (const [teamId, snap] of byTeam) {
    const current: NbaTeamRosterDocTeam = {
      teamId: snap.teamId,
      teamName: snap.teamName,
      players: mergeSeasonAveragesOntoRosterPlayers(snap.players, averagesMap),
    };
    const merged =
      averages.prior && priorAveragesMap
        ? mergePriorAveragesOntoRosterTeam(
            current,
            {
              ...current,
              players: mergeSeasonAveragesOntoRosterPlayers(
                snap.players,
                priorAveragesMap
              ),
            },
            averages.prior.averagesSeasonKey
          )
        : current;
    teams[teamId] = {
      ...merged,
      players: sortRosterPlayersByMpg(
        filterCuratedRosterExcludedPlayers(seasonKey, merged.players)
      ),
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
