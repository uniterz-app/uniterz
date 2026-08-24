/**
 * プレイヤー shot zones — Firestore 読み書き。
 * 公開 API はここだけ読む（BDL ライブ禁止）。
 */
import type { Firestore } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import type { NbaPlayerShotZone } from "@/lib/predict/nbaPlayerDetailPreviewMocks";
import {
  NBA_PLAYER_SHOT_ZONES_COLLECTION,
  NBA_PLAYER_SHOT_ZONES_PLAYERS_SUB,
  type NbaPlayerShotZonesApiPayload,
  type NbaPlayerShotZonesDoc,
} from "@/lib/nba/playerShotZones/playerShotZonesTypes";

export function normalizePlayerShotZonesSeasonKey(
  raw: string | null | undefined
): string {
  const trimmed = (raw ?? "").trim();
  return trimmed || CURRENT_NBA_SEASON_KEY;
}

function playerShotZonesDocRef(
  db: Firestore,
  seasonKey: string,
  playerId: string
) {
  return db
    .collection(NBA_PLAYER_SHOT_ZONES_COLLECTION)
    .doc(seasonKey)
    .collection(NBA_PLAYER_SHOT_ZONES_PLAYERS_SUB)
    .doc(playerId);
}

function resolveShotZones(raw: unknown): NbaPlayerShotZone[] {
  if (!Array.isArray(raw)) return [];
  const out: NbaPlayerShotZone[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as NbaPlayerShotZone;
    if (!row.id) continue;
    out.push(row);
  }
  return out;
}

export async function writePlayerShotZonesSnapshot(
  db: Firestore,
  input: {
    seasonKey: string;
    playerId: string;
    teamId: string | null;
    shotZones: NbaPlayerShotZone[];
  }
): Promise<void> {
  const seasonKey = normalizePlayerShotZonesSeasonKey(input.seasonKey);
  const playerId = String(input.playerId).trim();
  const payload: Omit<NbaPlayerShotZonesDoc, "updatedAt"> & {
    updatedAt: FirebaseFirestore.FieldValue;
  } = {
    playerId,
    teamId: input.teamId,
    seasonKey,
    shotZones: input.shotZones,
    source: "firestore",
    updatedAt: FieldValue.serverTimestamp(),
  };
  await playerShotZonesDocRef(db, seasonKey, playerId).set(payload, {
    merge: true,
  });
}

export async function loadPlayerShotZonesSnapshot(
  db: Firestore,
  seasonKey: string,
  playerId: string
): Promise<NbaPlayerShotZonesApiPayload> {
  const season = normalizePlayerShotZonesSeasonKey(seasonKey);
  const id = String(playerId ?? "").trim();
  if (!id) {
    return {
      ok: true,
      season,
      playerId: id,
      shotZones: [],
      source: "empty",
      updatedAt: null,
    };
  }

  const snap = await playerShotZonesDocRef(db, season, id).get();
  if (!snap.exists) {
    return {
      ok: true,
      season,
      playerId: id,
      shotZones: [],
      source: "empty",
      updatedAt: null,
    };
  }

  const data = snap.data() as NbaPlayerShotZonesDoc;
  const shotZones = resolveShotZones(data.shotZones);
  const updatedAt = data.updatedAt?.toDate?.() ?? null;

  return {
    ok: true,
    season,
    playerId: id,
    shotZones,
    source: shotZones.length > 0 ? "firestore" : "empty",
    updatedAt: updatedAt ? updatedAt.toISOString() : null,
  };
}
