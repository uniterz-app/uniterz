/**
 * プレイヤー契約（複数年）— Firestore スナップショット読み。
 * BDL ライブ取得は ingest 専用。
 */
import type { Firestore } from "firebase-admin/firestore";
import { loadPlayerContractSnapshot } from "@/lib/nba/playerContract/loadPlayerContractSnapshot";
import type { NbaPlayerContractApiPayload } from "@/lib/nba/playerContract/playerContractTypes";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";

export type LoadPlayerContractResult = NbaPlayerContractApiPayload;

export async function loadPlayerContract(
  db: Firestore,
  opts: {
    playerId: string;
    seasonKey?: string;
  }
): Promise<LoadPlayerContractResult> {
  const playerId = String(opts.playerId ?? "").trim();
  const season = (opts.seasonKey ?? CURRENT_NBA_SEASON_KEY).trim();
  return loadPlayerContractSnapshot(db, season, playerId);
}
