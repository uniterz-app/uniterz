/**
 * Firestore `games` → `nbaTeamGameLogs/{seasonKey}` スナップショット。
 * クライアントは games を直接集計しない（ROSTER / PAYROLL と同じ形）。
 */
import type { Firestore } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import { bdlSeasonYearFromSeasonKey } from "@/lib/nba/bdl/bdlNbaEnv";
import { CURRENT_NBA_SEASON_KEY, previousNbaSeasonKey } from "@/lib/rankings/nbaSeason";
import { buildTeamGameLogsBundleFromGames } from "@/lib/nba/teamGameLog/buildTeamGameLogsBundleFromGames";
import {
  buildLast10RowsFromGames,
  seasonPaceByTeamIdFromRows,
} from "@/lib/nba/leagueTeamStats/buildLast10RowsFromGames";
import {
  loadLeagueTeamStatsSnapshot,
  mergeLast10IntoLeagueTeamStatsSnapshot,
} from "@/lib/nba/leagueTeamStats/loadLeagueTeamStatsSnapshot";
import {
  normalizeTeamGameLogSeasonKey,
  writeTeamGameLogsSnapshot,
} from "@/lib/nba/teamGameLog/loadTeamGameLog";
import { writeTeamGameLogDetails } from "@/lib/nba/teamGameLog/loadTeamGameLogDetail";
import {
  loadNbaSeasonGameRows,
  NBA_SEASON_GAME_ROWS_LIMIT,
  type NbaSeasonGameRow,
} from "@/lib/nba/ingest/nbaSeasonGameRows";

export { loadNbaSeasonGameRows };
import { buildTeamGameLogDetailsFromGames } from "@/lib/nba/teamGameLog/teamGameLogDetail";

export const NBA_TEAM_GAME_LOGS_INGEST_READY = true;

export type NbaTeamGameLogsIngestInput = {
  seasonKey?: string;
  /** 既定 NBA_SEASON_GAME_ROWS_LIMIT */
  limit?: number;
  /** 日次 / 試合後監視が読み済みのシーズン games（渡せば読み直さない） */
  seasonGames?: NbaSeasonGameRow[];
};

export type NbaTeamGameLogsIngestResult = {
  ok: true;
  seasonKey: string;
  seasonYear: number;
  gameCount: number;
  teamCount: number;
};

export async function ingestNbaTeamGameLogsFromGames(
  db: Firestore,
  input: NbaTeamGameLogsIngestInput = {}
): Promise<NbaTeamGameLogsIngestResult> {
  const seasonKey = normalizeTeamGameLogSeasonKey(
    input.seasonKey ?? CURRENT_NBA_SEASON_KEY
  );
  const seasonYear = bdlSeasonYearFromSeasonKey(seasonKey);
  const limit = Math.min(
    NBA_SEASON_GAME_ROWS_LIMIT,
    Math.max(1, input.limit ?? NBA_SEASON_GAME_ROWS_LIMIT)
  );

  const rows =
    input.seasonGames ?? (await loadNbaSeasonGameRows(db, seasonKey, limit));
  const priorSeasonRows = (
    await loadLeagueTeamStatsSnapshot(db, previousNbaSeasonKey(seasonKey))
  ).bundle.season;
  const priorMarginByTeam = Object.fromEntries(
    priorSeasonRows
      .filter((row) => Number.isFinite(row.diff))
      .map((row) => [row.teamId, row.diff] as const)
  );
  const { teams, teamCount, gameCount } = buildTeamGameLogsBundleFromGames({
    seasonKey,
    games: rows,
    priorMarginByTeam,
  });

  await writeTeamGameLogsSnapshot(db, seasonKey, teams, {
    seasonYear,
    gameCount,
    source: "firestore",
    serverTimestamp: FieldValue.serverTimestamp(),
  });

  await writeTeamGameLogDetails(
    db,
    seasonKey,
    buildTeamGameLogDetailsFromGames({ seasonKey, games: rows }),
    FieldValue.serverTimestamp()
  );

  const last10 = buildLast10RowsFromGames(rows, {
    seasonPaceByTeamId: seasonPaceByTeamIdFromRows(
      (await loadLeagueTeamStatsSnapshot(db, seasonKey)).bundle.season
    ),
  });
  await mergeLast10IntoLeagueTeamStatsSnapshot(
    db,
    seasonKey,
    last10,
    FieldValue.serverTimestamp()
  );

  return {
    ok: true,
    seasonKey,
    seasonYear,
    gameCount,
    teamCount,
  };
}
