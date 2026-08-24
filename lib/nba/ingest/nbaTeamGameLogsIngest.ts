/**
 * Firestore `games` → `nbaTeamGameLogs/{seasonKey}` スナップショット。
 * クライアントは games を直接集計しない（ROSTER / PAYROLL と同じ形）。
 */
import type { Firestore } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import { bdlSeasonYearFromSeasonKey } from "@/lib/nba/bdl/bdlNbaEnv";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import { buildTeamGameLogsBundleFromGames } from "@/lib/nba/teamGameLog/buildTeamGameLogsBundleFromGames";
import { buildLast10RowsFromGames } from "@/lib/nba/leagueTeamStats/buildLast10RowsFromGames";
import { mergeLast10IntoLeagueTeamStatsSnapshot } from "@/lib/nba/leagueTeamStats/loadLeagueTeamStatsSnapshot";
import {
  normalizeTeamGameLogSeasonKey,
  writeTeamGameLogsSnapshot,
} from "@/lib/nba/teamGameLog/loadTeamGameLog";

export const NBA_TEAM_GAME_LOGS_INGEST_READY = true;

export type NbaTeamGameLogsIngestInput = {
  seasonKey?: string;
  /** 既定 1500 */
  limit?: number;
};

export type NbaTeamGameLogsIngestResult = {
  ok: true;
  seasonKey: string;
  seasonYear: number;
  gameCount: number;
  teamCount: number;
};

export async function loadNbaSeasonGameRows(
  db: Firestore,
  season: string,
  limit: number
): Promise<Array<Record<string, unknown> & { id: string }>> {
  const snap = await db
    .collection("games")
    .where("league", "==", "nba")
    .where("season", "==", season)
    .orderBy("startAtJst", "asc")
    .limit(limit)
    .get();

  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Record<string, unknown>),
  }));
}

export async function ingestNbaTeamGameLogsFromGames(
  db: Firestore,
  input: NbaTeamGameLogsIngestInput = {}
): Promise<NbaTeamGameLogsIngestResult> {
  const seasonKey = normalizeTeamGameLogSeasonKey(
    input.seasonKey ?? CURRENT_NBA_SEASON_KEY
  );
  const seasonYear = bdlSeasonYearFromSeasonKey(seasonKey);
  const limit = Math.min(2000, Math.max(1, input.limit ?? 1500));

  const rows = await loadNbaSeasonGameRows(db, seasonKey, limit);
  const { teams, teamCount, gameCount } = buildTeamGameLogsBundleFromGames({
    seasonKey,
    games: rows,
  });

  await writeTeamGameLogsSnapshot(db, seasonKey, teams, {
    seasonYear,
    gameCount,
    source: "firestore",
    serverTimestamp: FieldValue.serverTimestamp(),
  });

  const last10 = buildLast10RowsFromGames(rows);
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
