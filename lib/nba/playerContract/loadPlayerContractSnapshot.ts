/**
 * プレイヤー複数年契約 — Firestore 読み書き。
 * 公開 API はここだけ読む（BDL ライブ禁止）。
 */
import type { Firestore } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import type { NbaPlayerContractSummary } from "@/lib/predict/nbaPlayerDetailPreviewMocks";
import {
  NBA_PLAYER_CONTRACTS_COLLECTION,
  NBA_PLAYER_CONTRACTS_PLAYERS_SUB,
  type NbaPlayerContractApiPayload,
  type NbaPlayerContractDoc,
} from "@/lib/nba/playerContract/playerContractTypes";
import { playerIdLookupSet } from "@/lib/nba/playerIdAliases";

export function normalizePlayerContractSeasonKey(
  raw: string | null | undefined
): string {
  const trimmed = (raw ?? "").trim();
  return trimmed || CURRENT_NBA_SEASON_KEY;
}

function playerContractDocRef(
  db: Firestore,
  seasonKey: string,
  playerId: string
) {
  return db
    .collection(NBA_PLAYER_CONTRACTS_COLLECTION)
    .doc(seasonKey)
    .collection(NBA_PLAYER_CONTRACTS_PLAYERS_SUB)
    .doc(playerId);
}

export async function writePlayerContractSnapshot(
  db: Firestore,
  input: {
    seasonKey: string;
    playerId: string;
    teamId: string | null;
    contract: NbaPlayerContractSummary;
  }
): Promise<void> {
  const seasonKey = normalizePlayerContractSeasonKey(input.seasonKey);
  const playerId = String(input.playerId).trim();
  const payload: Omit<NbaPlayerContractDoc, "updatedAt"> & {
    updatedAt: FirebaseFirestore.FieldValue;
  } = {
    playerId,
    teamId: input.teamId,
    seasonKey,
    contract: input.contract,
    source: "firestore",
    updatedAt: FieldValue.serverTimestamp(),
  };
  await playerContractDocRef(db, seasonKey, playerId).set(payload, {
    merge: true,
  });
}

export async function loadPlayerContractSnapshot(
  db: Firestore,
  seasonKey: string,
  playerId: string
): Promise<NbaPlayerContractApiPayload> {
  const season = normalizePlayerContractSeasonKey(seasonKey);
  const id = String(playerId ?? "").trim();
  if (!id) {
    return {
      ok: true,
      season,
      playerId: id,
      contract: null,
      source: "empty",
      updatedAt: null,
    };
  }

  let data: NbaPlayerContractDoc | null = null;
  for (const cand of playerIdLookupSet(id)) {
    const snap = await playerContractDocRef(db, season, cand).get();
    if (!snap.exists) continue;
    const row = snap.data() as NbaPlayerContractDoc;
    if (row.contract && typeof row.contract === "object") {
      data = row;
      break;
    }
  }

  if (!data) {
    return {
      ok: true,
      season,
      playerId: id,
      contract: null,
      source: "empty",
      updatedAt: null,
    };
  }

  const contract =
    data.contract && typeof data.contract === "object"
      ? data.contract
      : null;
  const updatedAt = data.updatedAt?.toDate?.() ?? null;

  return {
    ok: true,
    season,
    playerId: id,
    contract,
    source: contract ? "firestore" : "empty",
    updatedAt: updatedAt ? updatedAt.toISOString() : null,
  };
}
