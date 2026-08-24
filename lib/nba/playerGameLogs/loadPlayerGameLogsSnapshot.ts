/**
 * プレイヤー試合ログ — Firestore 読み書き。
 * 公開 API はここだけ読む（BDL ライブ禁止）。
 */
import type { Firestore } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import type { NbaPlayerGameLog } from "@/lib/predict/nbaPlayerDetailPreviewMocks";
import {
  NBA_PLAYER_GAME_LOGS_COLLECTION,
  NBA_PLAYER_GAME_LOGS_PLAYERS_SUB,
  type NbaPlayerGameLogsApiPayload,
  type NbaPlayerGameLogsDoc,
} from "@/lib/nba/playerGameLogs/playerGameLogsTypes";

export function normalizePlayerGameLogsSeasonKey(
  raw: string | null | undefined
): string {
  const trimmed = (raw ?? "").trim();
  return trimmed || CURRENT_NBA_SEASON_KEY;
}

function playerGameLogsDocRef(
  db: Firestore,
  seasonKey: string,
  playerId: string
) {
  return db
    .collection(NBA_PLAYER_GAME_LOGS_COLLECTION)
    .doc(seasonKey)
    .collection(NBA_PLAYER_GAME_LOGS_PLAYERS_SUB)
    .doc(playerId);
}

function resolveGameLogs(raw: unknown): NbaPlayerGameLog[] {
  if (!Array.isArray(raw)) return [];
  const out: NbaPlayerGameLog[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as NbaPlayerGameLog;
    if (!row.gameId) continue;
    out.push(row);
  }
  return out;
}

export async function writePlayerGameLogsSnapshot(
  db: Firestore,
  input: {
    seasonKey: string;
    playerId: string;
    teamId: string | null;
    gameLogs: NbaPlayerGameLog[];
  }
): Promise<void> {
  const seasonKey = normalizePlayerGameLogsSeasonKey(input.seasonKey);
  const playerId = String(input.playerId).trim();
  const payload: Omit<NbaPlayerGameLogsDoc, "updatedAt"> & {
    updatedAt: FirebaseFirestore.FieldValue;
  } = {
    playerId,
    teamId: input.teamId,
    seasonKey,
    gameLogs: input.gameLogs,
    source: "firestore",
    updatedAt: FieldValue.serverTimestamp(),
  };
  await playerGameLogsDocRef(db, seasonKey, playerId).set(payload, {
    merge: true,
  });
}

export async function loadPlayerGameLogsSnapshot(
  db: Firestore,
  seasonKey: string,
  playerId: string
): Promise<NbaPlayerGameLogsApiPayload> {
  const season = normalizePlayerGameLogsSeasonKey(seasonKey);
  const id = String(playerId ?? "").trim();
  if (!id) {
    return {
      ok: true,
      season,
      playerId: id,
      gameLogs: [],
      source: "empty",
      updatedAt: null,
    };
  }

  const snap = await playerGameLogsDocRef(db, season, id).get();
  if (!snap.exists) {
    return {
      ok: true,
      season,
      playerId: id,
      gameLogs: [],
      source: "empty",
      updatedAt: null,
    };
  }

  const data = snap.data() as NbaPlayerGameLogsDoc;
  const gameLogs = resolveGameLogs(data.gameLogs);
  const updatedAt = data.updatedAt?.toDate?.() ?? null;

  return {
    ok: true,
    season,
    playerId: id,
    gameLogs,
    source: gameLogs.length > 0 ? "firestore" : "empty",
    updatedAt: updatedAt ? updatedAt.toISOString() : null,
  };
}
