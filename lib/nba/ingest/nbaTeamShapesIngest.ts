/**
 * games.liveStats → Firestore `nbaTeamShapeRecords/{season}`。
 */
import type { Firestore } from "firebase-admin/firestore";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import { buildAndWriteTeamShapeRecordsFromGames } from "@/lib/nba/teamShapes/loadTeamShapeRecords";

export type NbaTeamShapesIngestInput = {
  seasonKey?: string;
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
  const bundle = await buildAndWriteTeamShapeRecordsFromGames(db, seasonKey);
  return {
    ok: true,
    seasonKey: bundle.seasonKey,
    gameCount: bundle.gameCount,
    gamesWithBox: bundle.gamesWithBox,
    teamCount: Object.keys(bundle.teams).length,
    builtAtMs: bundle.builtAtMs,
  };
}
