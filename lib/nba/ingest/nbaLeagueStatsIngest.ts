/**
 * NBA リーグ表スナップショット ingest。
 *
 * クライアント / Native は BallDontLie を叩かない。
 * ここから `nbaLeagueTeamStats` と `nbaLeaguePlayerStats` を書く。
 * team last10 は試合スコア（firestore `games`）から集計（W–L / PPG のみ実値）。
 * player last10 は ingest 済み `nbaPlayerGameLogs` から集計（追加 BDL なし）。
 */
import type { Firestore } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import {
  bdlSeasonYearFromSeasonKey,
  requireBdlNbaApiKey,
} from "@/lib/nba/bdl/bdlNbaEnv";
import {
  bdlStatNum,
  fetchBdlPlayerSeasonAverages,
  type BdlPlayerSeasonAverageRow,
} from "@/lib/nba/bdl/fetchBdlPlayerSeasonAverages";
import {
  fetchBdlTeamSeasonAverages,
  type BdlTeamSeasonAverageRow,
} from "@/lib/nba/bdl/fetchBdlTeamSeasonAverages";
import { buildLeagueTeamStatsBundleFromBdl } from "@/lib/nba/bdl/mapBdlToLeagueTeamStatsBundle";
import { buildPlayerStatLeadersBundleFromBdl } from "@/lib/nba/bdl/mapBdlToPlayerStatLeadersBundle";
import {
  buildLast10LeadersFromGameLogs,
  last10BoardHasRows,
  listPlayerGameLogsForLeaders,
} from "@/lib/nba/playerStatLeaders/buildLast10LeadersFromGameLogs";
import { buildLast10RowsFromGames } from "@/lib/nba/leagueTeamStats/buildLast10RowsFromGames";
import { writeLeagueTeamStatsSnapshot } from "@/lib/nba/leagueTeamStats/loadLeagueTeamStatsSnapshot";
import { writePlayerStatLeadersSnapshot } from "@/lib/nba/playerStatLeaders/loadPlayerStatLeadersSnapshot";
import { writePlayerSeasonMetricsSnapshots } from "@/lib/nba/playerSeasonMetrics/loadPlayerSeasonMetricsSnapshot";
import { loadNbaSeasonGameRows } from "@/lib/nba/ingest/nbaTeamGameLogsIngest";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";

export const NBA_LEAGUE_STATS_INGEST_READY = true;

export type NbaLeagueStatsIngestInput = {
  seasonKey?: string;
};

export type NbaLeagueStatsIngestResult = {
  ok: true;
  seasonKey: string;
  seasonYear: number;
  dataSeasonKey: string;
  teamCount: number;
  playerLeaderStatTypes: number;
  playerLast10Players: number;
  playerMetricsWritten: number;
};

function playerAveragesHavePlayed(rows: BdlPlayerSeasonAverageRow[]): boolean {
  return rows.some((row) => {
    const gp = bdlStatNum(row.stats, "gp", "games_played", "games");
    return gp != null && gp >= 1;
  });
}

function teamAveragesHavePlayed(rows: BdlTeamSeasonAverageRow[]): boolean {
  return rows.some((row) => {
    const gp = bdlStatNum(row.stats, "gp", "games_played", "games") ?? 0;
    const wins = bdlStatNum(row.stats, "w", "wins") ?? 0;
    const losses = bdlStatNum(row.stats, "l", "losses") ?? 0;
    return gp >= 1 || wins + losses >= 1;
  });
}

/**
 * その BDL シーズンに「1試合でも」出場データがあるか。
 * 行数の多さではなく gp / W–L を見る。
 */
export async function bdlSeasonYearHasPlayData(
  seasonYear: number
): Promise<boolean> {
  const [players, teams] = await Promise.all([
    fetchBdlPlayerSeasonAverages({
      seasonYear,
      type: "base",
    }).catch(() => [] as BdlPlayerSeasonAverageRow[]),
    fetchBdlTeamSeasonAverages({
      seasonYear,
      type: "base",
    }).catch(() => [] as BdlTeamSeasonAverageRow[]),
  ]);
  return playerAveragesHavePlayed(players) || teamAveragesHavePlayed(teams);
}

export async function ingestNbaLeagueStatsFromProvider(
  db: Firestore,
  input: NbaLeagueStatsIngestInput = {}
): Promise<NbaLeagueStatsIngestResult> {
  requireBdlNbaApiKey();
  const seasonKey = (input.seasonKey ?? CURRENT_NBA_SEASON_KEY).trim();
  // 前期フォールバックしない。今季に出場が無ければ空寄りスナップショットのまま。
  const seasonYear = bdlSeasonYearFromSeasonKey(seasonKey);
  const dataSeasonKey = seasonKey;

  const [teamBundle, playerBuilt] = await Promise.all([
    buildLeagueTeamStatsBundleFromBdl({
      seasonKey: dataSeasonKey,
      seasonYear,
    }),
    buildPlayerStatLeadersBundleFromBdl({
      seasonKey: dataSeasonKey,
      seasonYear,
    }),
  ]);
  const playerBundle = playerBuilt.bundle;

  const gameRows = await loadNbaSeasonGameRows(db, dataSeasonKey, 1500);
  teamBundle.last10 = buildLast10RowsFromGames(gameRows);
  if (teamBundle.last10.some((r) => r.wins + r.losses > 0)) {
    teamBundle.asOfLabel = teamBundle.asOfLabel.replace(
      "last10 pending",
      "last10 from games"
    );
  }

  const logPlayers = await listPlayerGameLogsForLeaders(db, dataSeasonKey);
  const playerLast10 = buildLast10LeadersFromGameLogs(logPlayers);
  if (last10BoardHasRows(playerLast10)) {
    playerBundle.last10 = playerLast10;
    playerBundle.asOfLabel = playerBundle.asOfLabel.includes("last10")
      ? playerBundle.asOfLabel.replace(
          /last10 pending|last10[^·]*/gi,
          "last10 from game logs"
        )
      : `${playerBundle.asOfLabel} · last10 from game logs`;
  }

  const ts = FieldValue.serverTimestamp();
  await writeLeagueTeamStatsSnapshot(
    db,
    dataSeasonKey,
    teamBundle,
    "firestore",
    ts
  );
  await writePlayerStatLeadersSnapshot(
    db,
    dataSeasonKey,
    playerBundle,
    "firestore",
    ts
  );
  const playerMetricsWritten = await writePlayerSeasonMetricsSnapshots(
    db,
    dataSeasonKey,
    playerBuilt.playerMetrics
  );

  return {
    ok: true,
    seasonKey,
    seasonYear,
    dataSeasonKey,
    teamCount: teamBundle.season.length,
    playerLeaderStatTypes: Object.keys(playerBundle.season).length,
    playerLast10Players: logPlayers.length,
    playerMetricsWritten,
  };
}
