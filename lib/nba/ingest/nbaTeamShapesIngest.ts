/**
 * games.liveStats → Firestore `nbaTeamShapeRecords/{season}`。
 */
import type { Firestore } from "firebase-admin/firestore";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import { buildAndWriteTeamShapeRecordsFromGames } from "@/lib/nba/teamShapes/loadTeamShapeRecords";
import type { NbaSeasonGameRow } from "@/lib/nba/ingest/nbaSeasonGameRows";

export type NbaTeamShapesIngestInput = {
  seasonKey?: string;
  /** 読み済みのシーズン games（渡せば読み直さない） */
  seasonGames?: NbaSeasonGameRow[];
};

export type NbaTeamShapesIngestResult = {
  ok: true;
  seasonKey: string;
  gameCount: number;
  gamesWithBox: number;
  teamCount: number;
  builtAtMs: number;
};

export async function ingestNbaTeamShapesFromGames(
  db: Firestore,
  input: NbaTeamShapesIngestInput = {}
): Promise<NbaTeamShapesIngestResult> {
  const seasonKey = (input.seasonKey ?? CURRENT_NBA_SEASON_KEY).trim();
  const bundle = await buildAndWriteTeamShapeRecordsFromGames(
    db,
    seasonKey,
    input.seasonGames
  );
  return {
    ok: true,
    seasonKey: bundle.seasonKey,
    gameCount: bundle.gameCount,
    gamesWithBox: bundle.gamesWithBox,
    teamCount: Object.keys(bundle.teams).length,
    builtAtMs: bundle.builtAtMs,
  };
}
