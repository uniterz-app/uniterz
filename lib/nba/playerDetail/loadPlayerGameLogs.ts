/**
 * プレイヤー試合ログ — Firestore スナップショット読み。
 * BDL ライブ取得は ingest 専用。
 */
import type { Firestore } from "firebase-admin/firestore";
import { loadPlayerGameLogsSnapshot } from "@/lib/nba/playerGameLogs/loadPlayerGameLogsSnapshot";
import type { NbaPlayerGameLogsApiPayload } from "@/lib/nba/playerGameLogs/playerGameLogsTypes";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";

export type LoadPlayerGameLogsResult = NbaPlayerGameLogsApiPayload;

export async function loadPlayerGameLogs(
  db: Firestore,
  opts: {
    playerId: string;
    seasonKey?: string;
  }
): Promise<LoadPlayerGameLogsResult> {
  const playerId = String(opts.playerId ?? "").trim();
  const season = (opts.seasonKey ?? CURRENT_NBA_SEASON_KEY).trim();
  return loadPlayerGameLogsSnapshot(db, season, playerId);
}
