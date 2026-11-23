/**
 * Cup グループ順位 → Firestore `nbaCupStandings/{seasonKey}`。
 * 優先: 今季 games の istStage。無ければ BDL `season_type=ist`。
 */
import type { Firestore } from "firebase-admin/firestore";
import {
  bdlSeasonYearFromSeasonKey,
  requireBdlNbaApiKey,
} from "@/lib/nba/bdl/bdlNbaEnv";
import { fetchBdlGames } from "@/lib/nba/bdl/fetchBdlGames";
import { mapBdlGameToNbaGameDoc } from "@/lib/nba/bdl/mapBdlGameToNbaGameDoc";
import { buildNbaCupStandingsFromGames } from "@/lib/nba/cupStandings/buildNbaCupStandingsFromGames";
import {
  FieldValue,
  writeNbaCupStandingsSnapshot,
} from "@/lib/nba/cupStandings/loadNbaCupStandings";
import type { NbaCupStandingsApiPayload } from "@/lib/nba/cupStandings/nbaCupStandingsTypes";
import {
  loadNbaSeasonGameRows,
  type NbaSeasonGameRow,
} from "@/lib/nba/ingest/nbaSeasonGameRows";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";

export type NbaCupStandingsIngestInput = {
  seasonKey?: string;
  seasonGames?: NbaSeasonGameRow[];
};

export type NbaCupStandingsIngestResult = {
  ok: true;
  seasonKey: string;
  groupTeams: number;
  source: NbaCupStandingsApiPayload["source"];
};

function countGroupTeams(
  board: ReturnType<typeof buildNbaCupStandingsFromGames>
): number {
  return board.groups.reduce((n, g) => n + g.rows.length, 0);
}

async function loadBdlIstGameRows(
  seasonKey: string
): Promise<Array<Record<string, unknown> & { id: string }>> {
  requireBdlNbaApiKey();
  const games = await fetchBdlGames({
    seasonYears: [bdlSeasonYearFromSeasonKey(seasonKey)],
    seasonType: "ist",
  });
  const rows: Array<Record<string, unknown> & { id: string }> = [];
  for (const g of games) {
    const doc = mapBdlGameToNbaGameDoc(g, { seasonType: "ist" });
    if (!doc) continue;
    rows.push({ ...doc, id: doc.id });
  }
  return rows;
}

export async function ingestNbaCupStandings(
  db: Firestore,
  input: NbaCupStandingsIngestInput = {}
): Promise<NbaCupStandingsIngestResult> {
  const seasonKey = (input.seasonKey ?? CURRENT_NBA_SEASON_KEY).trim();
  let rows: Array<Record<string, unknown> & { id: string }> =
    input.seasonGames ?? (await loadNbaSeasonGameRows(db, seasonKey));

  let board = buildNbaCupStandingsFromGames(rows);
  let source: NbaCupStandingsApiPayload["source"] = "games";

  if (countGroupTeams(board) === 0) {
    rows = await loadBdlIstGameRows(seasonKey);
    board = buildNbaCupStandingsFromGames(rows);
    source = "bdl";
  }

  const asOfLabel = `${source.toUpperCase()} · ${seasonKey}`;
  await writeNbaCupStandingsSnapshot(
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
    groupTeams: countGroupTeams(board),
    source,
  };
}
