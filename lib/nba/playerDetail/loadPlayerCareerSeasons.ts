/**
 * プレイヤー career Season/Playoffs — Firestore スナップショット読み。
 * BDL ライブ取得は ingest 専用。
 */
import type { Firestore } from "firebase-admin/firestore";
import { loadPlayerCareerSeasonsSnapshot } from "@/lib/nba/playerCareerSeasons/loadPlayerCareerSeasonsSnapshot";
import type { NbaPlayerCareerSeasonsApiPayload } from "@/lib/nba/playerCareerSeasons/playerCareerSeasonsTypes";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";

export type LoadPlayerCareerSeasonsResult = NbaPlayerCareerSeasonsApiPayload;

export async function loadPlayerCareerSeasons(
  db: Firestore,
  opts: {
    playerId: string;
    seasonKey?: string;
  }
): Promise<LoadPlayerCareerSeasonsResult> {
  const playerId = String(opts.playerId ?? "").trim();
  const season = (opts.seasonKey ?? CURRENT_NBA_SEASON_KEY).trim();
  return loadPlayerCareerSeasonsSnapshot(db, playerId, season);
}
