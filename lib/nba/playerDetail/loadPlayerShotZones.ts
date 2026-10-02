/**
 * プレイヤー shot zones — Firestore スナップショット読み。
 * BDL ライブ取得は ingest 専用。
 */
import type { Firestore } from "firebase-admin/firestore";
import { loadPlayerShotZonesSnapshot } from "@/lib/nba/playerShotZones/loadPlayerShotZonesSnapshot";
import type { NbaPlayerShotZonesApiPayload } from "@/lib/nba/playerShotZones/playerShotZonesTypes";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";

export type LoadPlayerShotZonesResult = NbaPlayerShotZonesApiPayload;

export async function loadPlayerShotZones(
  db: Firestore,
  opts: {
    playerId: string;
    seasonKey?: string;
  }
): Promise<LoadPlayerShotZonesResult> {
  const playerId = String(opts.playerId ?? "").trim();
  const season = (opts.seasonKey ?? CURRENT_NBA_SEASON_KEY).trim();
  return loadPlayerShotZonesSnapshot(db, season, playerId);
}
