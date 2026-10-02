/**
 * NBA リーグ表スナップショット ingest。
 *
 * クライアント / Native は BallDontLie を叩かない。
 * ここから `nbaLeagueTeamStats` と `nbaLeaguePlayerStats` を書く。
 * playoffs は BDL season_type=playoffs。
 * last10 はリーグ表に出さない（マッチアップ FORM は team game logs 側）。
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
  buildSeasonCountLeadersFromGameLogs,
  seasonCountBoardHasRows,
} from "@/lib/nba/playerStatLeaders/buildSeasonCountLeadersFromGameLogs";
import { listPlayerGameLogsForLeaders } from "@/lib/nba/playerStatLeaders/buildLast10LeadersFromGameLogs";
import { writeLeagueTeamStatsSnapshot } from "@/lib/nba/leagueTeamStats/loadLeagueTeamStatsSnapshot";
import { writePlayerStatLeadersSnapshot } from "@/lib/nba/playerStatLeaders/loadPlayerStatLeadersSnapshot";
import { writePlayerSeasonMetricsSnapshots } from "@/lib/nba/playerSeasonMetrics/loadPlayerSeasonMetricsSnapshot";
import {
  CURRENT_NBA_SEASON_KEY,
  NBA_LEAGUE_STATS_SEASON_LOOKBACK,
  nbaSeasonKeysLookingBack,
} from "@/lib/rankings/nbaSeason";
import type { NbaPlayerStatLeadersBundle } from "@/lib/predict/nbaPlayerStatLeadersMocks";

export const NBA_LEAGUE_STATS_INGEST_READY = true;

export type NbaLeagueStatsIngestInput = {
  seasonKey?: string;
  /**
   * 今季から遡って複数シーズンを順に ingest。
   * 例: 5 → 今季 + 過去4 = 5 シーズン。指定時は seasonKey を起点にする。
   */
  lookbackSeasons?: number;
};

export type NbaLeagueStatsIngestSeasonResult = {
  seasonKey: string;
  seasonYear: number;
  dataSeasonKey: string;
  teamCount: number;
  teamPlayoffsCount: number;
  playerLeaderStatTypes: number;
  playerPlayoffsStatTypes: number;
  playerMetricsWritten: number;
};

export type NbaLeagueStatsIngestResult = {
  ok: true;
  seasons: NbaLeagueStatsIngestSeasonResult[];
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

function playerBoardHasRows(
  board: NbaPlayerStatLeadersBundle["season"]
): boolean {
  return Object.values(board).some((rows) => rows.length > 0);
}

async function ingestOneLeagueStatsSeason(
  db: Firestore,
  seasonKey: string
): Promise<NbaLeagueStatsIngestSeasonResult> {
  const seasonYear = bdlSeasonYearFromSeasonKey(seasonKey);
  const dataSeasonKey = seasonKey;

  const [teamBundle, playerRegular, playerPlayoffs] = await Promise.all([
    buildLeagueTeamStatsBundleFromBdl({
      seasonKey: dataSeasonKey,
      seasonYear,
    }),
    buildPlayerStatLeadersBundleFromBdl({
      seasonKey: dataSeasonKey,
      seasonYear,
      seasonType: "regular",
    }),
    buildPlayerStatLeadersBundleFromBdl({
      seasonKey: dataSeasonKey,
      seasonYear,
      seasonType: "playoffs",
    }).catch(() => null),
  ]);

  const playerBundle: NbaPlayerStatLeadersBundle = {
    season: playerRegular.bundle.season,
    playoffs: playerPlayoffs?.bundle.playoffs ?? playerRegular.bundle.playoffs,
    last10: playerRegular.bundle.last10,
    asOfLabel: `BDL · ${dataSeasonKey} · season+playoffs`,
  };

  // リーグ表に Last 10 は出さない。team last10 は空のまま。
  teamBundle.last10 = [];

  const logPlayers = await listPlayerGameLogsForLeaders(db, dataSeasonKey);
  const seasonCounts = buildSeasonCountLeadersFromGameLogs(logPlayers);
  if (seasonCountBoardHasRows(seasonCounts)) {
    for (const id of Object.keys(seasonCounts) as Array<
      keyof typeof seasonCounts
    >) {
      playerBundle.season[id] = seasonCounts[id];
    }
    if (!playerBundle.asOfLabel.includes("count")) {
      playerBundle.asOfLabel = `${playerBundle.asOfLabel} · count from game logs`;
    }
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
    playerRegular.playerMetrics
  );

  return {
    seasonKey,
    seasonYear,
    dataSeasonKey,
    teamCount: teamBundle.season.length,
    teamPlayoffsCount: teamBundle.playoffs.length,
    playerLeaderStatTypes: Object.keys(playerBundle.season).length,
    playerPlayoffsStatTypes: playerBoardHasRows(playerBundle.playoffs) ? 1 : 0,
    playerMetricsWritten,
  };
}

export async function ingestNbaLeagueStatsFromProvider(
  db: Firestore,
  input: NbaLeagueStatsIngestInput = {}
): Promise<NbaLeagueStatsIngestResult> {
  requireBdlNbaApiKey();
  const anchor = (input.seasonKey ?? CURRENT_NBA_SEASON_KEY).trim();
  const lookback =
    typeof input.lookbackSeasons === "number" &&
    Number.isFinite(input.lookbackSeasons)
      ? Math.max(1, Math.floor(input.lookbackSeasons))
      : 1;
  const keys =
    lookback > 1
      ? nbaSeasonKeysLookingBack(anchor, lookback)
      : [anchor || CURRENT_NBA_SEASON_KEY];

  const seasons: NbaLeagueStatsIngestSeasonResult[] = [];
  for (const key of keys) {
    seasons.push(await ingestOneLeagueStatsSeason(db, key));
  }

  return { ok: true, seasons };
}

/** 日次 cron 用: 今季のみ（lookback なし） */
export async function ingestNbaLeagueStatsCurrentSeason(
  db: Firestore,
  seasonKey?: string
): Promise<NbaLeagueStatsIngestSeasonResult & { ok: true }> {
  const result = await ingestNbaLeagueStatsFromProvider(db, {
    seasonKey,
    lookbackSeasons: 1,
  });
  const one = result.seasons[0]!;
  return { ok: true, ...one };
}

export { NBA_LEAGUE_STATS_SEASON_LOOKBACK };
