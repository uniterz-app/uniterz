/**
 * BDL `/nba/v1/standings` → Firestore `nbaStandings/{seasonKey}`。
 */
import type { Firestore } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import {
  bdlSeasonYearFromSeasonKey,
  requireBdlNbaApiKey,
} from "@/lib/nba/bdl/bdlNbaEnv";
import { fetchBdlStandings } from "@/lib/nba/bdl/fetchBdlStandings";
import { buildTeamGameLogsBundleFromGames } from "@/lib/nba/teamGameLog/buildTeamGameLogsBundleFromGames";
import { loadTeamGameLogsSnapshot } from "@/lib/nba/teamGameLog/loadTeamGameLog";
import {
  buildConferenceStandingsBoardFromBdl,
} from "@/lib/nba/standings/mapBdlToConferenceStandings";
import { enrichConferenceStandingsFromTeamGameLogs } from "@/lib/nba/standings/enrichConferenceStandingsFromTeamGameLogs";
import {
  buildPreseasonConferenceStandingsBoard,
  preseasonStandingsAsOfLabel,
} from "@/lib/nba/standings/buildPreseasonConferenceStandingsBoard";
import { writeNbaConferenceStandingsSnapshot } from "@/lib/nba/standings/loadNbaConferenceStandings";
import type { NbaTeamGameLogSlice } from "@/lib/nba/teamGameLog/teamGameLogTypes";
import { loadNbaSeasonGameRows } from "@/lib/nba/ingest/nbaTeamGameLogsIngest";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";

export const NBA_STANDINGS_INGEST_READY = true;

export type NbaStandingsIngestInput = {
  seasonKey?: string;
};

export type NbaStandingsIngestResult = {
  ok: true;
  seasonKey: string;
  eastCount: number;
  westCount: number;
};

async function resolveTeamGameLogsForStandingsEnrichment(
  db: Firestore,
  seasonKey: string
): Promise<Record<string, NbaTeamGameLogSlice>> {
  const snapshot = await loadTeamGameLogsSnapshot(db, seasonKey);
  const fromDoc = snapshot.bundle.teams;
  if (Object.keys(fromDoc).length > 0) return fromDoc;

  const rows = await loadNbaSeasonGameRows(db, seasonKey, 1500);
  if (rows.length === 0) return fromDoc;

  return buildTeamGameLogsBundleFromGames({
    seasonKey,
    games: rows,
  }).teams;
}

export async function ingestNbaStandingsFromBdl(
  db: Firestore,
  input: NbaStandingsIngestInput = {}
): Promise<NbaStandingsIngestResult> {
  requireBdlNbaApiKey();
  const seasonKey = (input.seasonKey ?? CURRENT_NBA_SEASON_KEY).trim();
  const seasonYear = bdlSeasonYearFromSeasonKey(seasonKey);

  const rows = await fetchBdlStandings({ seasonYear });
  let board = buildConferenceStandingsBoardFromBdl(rows);
  let source: "bdl" | "preseason" = "bdl";
  let asOfLabel = `BDL · ${seasonKey}`;

  if (board.east.length === 0 && board.west.length === 0) {
    board = buildPreseasonConferenceStandingsBoard(seasonKey);
    source = "preseason";
    asOfLabel = preseasonStandingsAsOfLabel(seasonKey);
  }

  const teamLogs = await resolveTeamGameLogsForStandingsEnrichment(db, seasonKey);
  board = enrichConferenceStandingsFromTeamGameLogs(board, teamLogs);

  await writeNbaConferenceStandingsSnapshot(
    db,
    seasonKey,
    board,
    FieldValue.serverTimestamp(),
    asOfLabel,
    source
  );

  return {
    ok: true,
    seasonKey,
    eastCount: board.east.length,
    westCount: board.west.length,
  };
}
