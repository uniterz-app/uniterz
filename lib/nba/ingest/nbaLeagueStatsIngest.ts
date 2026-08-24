/**
 * NBA リーグ表スナップショット ingest。
 *
 * クライアント / Native は BallDontLie を叩かない。
 * ここから `nbaLeagueTeamStats` と `nbaLeaguePlayerStats` を書く。
 * last10 は試合ログ（firestore `games`）から集計。
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
import { buildLast10RowsFromGames } from "@/lib/nba/leagueTeamStats/buildLast10RowsFromGames";
import { writeLeagueTeamStatsSnapshot } from "@/lib/nba/leagueTeamStats/loadLeagueTeamStatsSnapshot";
import { writePlayerStatLeadersSnapshot } from "@/lib/nba/playerStatLeaders/loadPlayerStatLeadersSnapshot";
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
};

function seasonKeyFromBdlYear(year: number): string {
  return `${year}-${String((year + 1) % 100).padStart(2, "0")}`;
}

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
 * 行数の多さではなく gp / W–L を見る（開幕直後に 26-27 へ切り替えるため）。
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

/**
 * 要求シーズンに出場データがあればそれを使う。
 * まだ 0 試合なら直前シーズンへフォールバック（オフシーズン表示）。
 */
async function resolveBdlSeasonYearForIngest(
  seasonKey: string
): Promise<number> {
  let year = bdlSeasonYearFromSeasonKey(seasonKey);
  for (let i = 0; i < 3; i += 1) {
    if (await bdlSeasonYearHasPlayData(year)) return year;
    year -= 1;
  }
  return bdlSeasonYearFromSeasonKey(seasonKey);
}

export async function ingestNbaLeagueStatsFromProvider(
  db: Firestore,
  input: NbaLeagueStatsIngestInput = {}
): Promise<NbaLeagueStatsIngestResult> {
  requireBdlNbaApiKey();
  const seasonKey = (input.seasonKey ?? CURRENT_NBA_SEASON_KEY).trim();
  const seasonYear = await resolveBdlSeasonYearForIngest(seasonKey);
  const dataSeasonKey = seasonKeyFromBdlYear(seasonYear);

  const [teamBundle, playerBundle] = await Promise.all([
    buildLeagueTeamStatsBundleFromBdl({
      seasonKey: dataSeasonKey,
      seasonYear,
    }),
    buildPlayerStatLeadersBundleFromBdl({
      seasonKey: dataSeasonKey,
      seasonYear,
    }),
  ]);

  const gameRows = await loadNbaSeasonGameRows(db, dataSeasonKey, 1500);
  teamBundle.last10 = buildLast10RowsFromGames(gameRows);
  if (teamBundle.last10.some((r) => r.wins + r.losses > 0)) {
    teamBundle.asOfLabel = teamBundle.asOfLabel.replace(
      "last10 pending",
      "last10 from games"
    );
  }

  const ts = FieldValue.serverTimestamp();
  // 実データのシーズン doc だけ書く。オフシーズンで data≠要求キーのときだけ
  // CURRENT キーにもミラーし、前季 doc を新季データで汚さない。
  const writeKeys = new Set<string>([dataSeasonKey]);
  if (seasonKey !== dataSeasonKey) writeKeys.add(seasonKey);

  for (const key of writeKeys) {
    await writeLeagueTeamStatsSnapshot(
      db,
      key,
      teamBundle,
      "firestore",
      ts
    );
    await writePlayerStatLeadersSnapshot(
      db,
      key,
      playerBundle,
      "firestore",
      ts
    );
  }

  return {
    ok: true,
    seasonKey,
    seasonYear,
    dataSeasonKey,
    teamCount: teamBundle.season.length,
    playerLeaderStatTypes: Object.keys(playerBundle.season).length,
  };
}
