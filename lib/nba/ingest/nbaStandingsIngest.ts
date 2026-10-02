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
import { fetchBdlGames } from "@/lib/nba/bdl/fetchBdlGames";
import { mapBdlGameToNbaGameDoc } from "@/lib/nba/bdl/mapBdlGameToNbaGameDoc";
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

/** 過去シーズン: Firestore `games` が無いとき BDL のレギュラー試合で L10 / 連勝を組む */
async function loadBdlRegularSeasonGameRows(
  seasonKey: string
): Promise<Array<Record<string, unknown> & { id: string }>> {
  const games = await fetchBdlGames({
    seasonYears: [bdlSeasonYearFromSeasonKey(seasonKey)],
    postseason: false,
  });
  const rows: Array<Record<string, unknown> & { id: string }> = [];
  for (const g of games) {
    const doc = mapBdlGameToNbaGameDoc(g, { seasonType: "regular" });
    if (!doc) continue;
    rows.push({ ...doc, startAtJst: new Date(doc.startAtMs) });
  }
  return rows;
}

async function resolveTeamGameLogsForStandingsEnrichment(
  db: Firestore,
  seasonKey: string
): Promise<Record<string, NbaTeamGameLogSlice>> {
  const snapshot = await loadTeamGameLogsSnapshot(db, seasonKey);
  const fromDoc = snapshot.bundle.teams;
  if (Object.keys(fromDoc).length > 0) return fromDoc;

  const isPastSeason = seasonKey < CURRENT_NBA_SEASON_KEY;
  let rows = await loadNbaSeasonGameRows(db, seasonKey, 1500);
  if (rows.length === 0 && isPastSeason) {
    rows = await loadBdlRegularSeasonGameRows(seasonKey);
  }
  // 確定した過去季の順位表はレギュラーのみ（プレーオフで L10 / 連勝が動かない）
  if (isPastSeason) {
    rows = rows.filter(
      (r) => String(r.seasonPhase ?? "").toLowerCase() === "regular"
    );
  }
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
