/**
 * プレイヤー複数年契約 — Firestore 読み書き。
 * 公開 API はここだけ読む（BDL ライブ禁止）。
 */
import type { Firestore } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import { CURRENT_NBA_SEASON_KEY, previousNbaSeasonKey } from "@/lib/rankings/nbaSeason";
import type { NbaPlayerContractSummary } from "@/lib/predict/nbaPlayerDetailPreviewMocks";
import {
  NBA_PLAYER_CONTRACTS_COLLECTION,
  NBA_PLAYER_CONTRACTS_PLAYERS_SUB,
  type NbaPlayerContractApiPayload,
  type NbaPlayerContractDoc,
} from "@/lib/nba/playerContract/playerContractTypes";

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

  const snap = await playerContractDocRef(db, season, id).get();
  if (!snap.exists) {
    // 今季キー未投入時は前シーズン snapshot を試す（オフシーズンの穴埋め）
    const prev = previousNbaSeasonKey(season);
    if (prev && prev !== season) {
      const prevSnap = await playerContractDocRef(db, prev, id).get();
      if (prevSnap.exists) {
        const prevData = prevSnap.data() as NbaPlayerContractDoc;
        const prevContract =
          prevData.contract && typeof prevData.contract === "object"
            ? prevData.contract
            : null;
        const prevUpdated = prevData.updatedAt?.toDate?.() ?? null;
        if (prevContract && prevContract.seasons?.length) {
          return {
            ok: true,
            season: prev,
            playerId: id,
            contract: prevContract,
            source: "firestore",
            updatedAt: prevUpdated ? prevUpdated.toISOString() : null,
          };
        }
      }
    }
    return {
      ok: true,
      season,
      playerId: id,
      contract: null,
      source: "empty",
      updatedAt: null,
    };
  }

  const data = snap.data() as NbaPlayerContractDoc;
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
