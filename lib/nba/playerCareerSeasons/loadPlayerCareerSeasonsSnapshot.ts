/**
 * プレイヤー career Season/Playoffs — Firestore 読み書き。
 * 公開 API はここだけ読む（BDL ライブ禁止）。
 */
import type { Firestore } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import type { NbaPlayerCareerSeasonRow } from "@/lib/predict/nbaPlayerDetailPreviewMocks";
import {
  NBA_PLAYER_CAREER_SEASONS_COLLECTION,
  type NbaPlayerCareerSeasonsApiPayload,
  type NbaPlayerCareerSeasonsDoc,
} from "@/lib/nba/playerCareerSeasons/playerCareerSeasonsTypes";

function careerDocRef(db: Firestore, playerId: string) {
  return db.collection(NBA_PLAYER_CAREER_SEASONS_COLLECTION).doc(playerId);
}

function resolveRows(raw: unknown): NbaPlayerCareerSeasonRow[] {
  if (!Array.isArray(raw)) return [];
  const out: NbaPlayerCareerSeasonRow[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as NbaPlayerCareerSeasonRow;
    if (
      typeof row.seasonStart !== "number" ||
      !Number.isFinite(row.seasonStart)
    ) {
      continue;
    }
    out.push(row);
  }
  return out;
}

export async function writePlayerCareerSeasonsSnapshot(
  db: Firestore,
  input: {
    playerId: string;
    teamId: string | null;
    asOfSeasonKey: string;
    regular: NbaPlayerCareerSeasonRow[];
    playoffs: NbaPlayerCareerSeasonRow[];
  }
): Promise<void> {
  const playerId = String(input.playerId).trim();
  const payload = {
    playerId,
    teamId: input.teamId,
    asOfSeasonKey:
      (input.asOfSeasonKey ?? "").trim() || CURRENT_NBA_SEASON_KEY,
    regular: input.regular,
    playoffs: input.playoffs,
    source: "firestore" as const,
    updatedAt: FieldValue.serverTimestamp(),
  };
  await careerDocRef(db, playerId).set(payload, { merge: true });
}

export async function loadPlayerCareerSeasonsSnapshot(
  db: Firestore,
  playerId: string,
  seasonKey?: string
): Promise<NbaPlayerCareerSeasonsApiPayload> {
  const season =
    (seasonKey ?? "").trim() || CURRENT_NBA_SEASON_KEY;
  const id = String(playerId ?? "").trim();
  if (!id) {
    return {
      ok: true,
      season,
      playerId: id,
      careerSeasons: { regular: [], playoffs: [] },
      source: "empty",
      updatedAt: null,
    };
  }

  const snap = await careerDocRef(db, id).get();
  if (!snap.exists) {
    return {
      ok: true,
      season,
      playerId: id,
      careerSeasons: { regular: [], playoffs: [] },
      source: "empty",
      updatedAt: null,
    };
  }

  const data = snap.data() as NbaPlayerCareerSeasonsDoc;
  const regular = resolveRows(data.regular);
  const playoffs = resolveRows(data.playoffs);
  const updatedAt = data.updatedAt?.toDate?.() ?? null;
  const hasRows = regular.length > 0 || playoffs.length > 0;

  return {
    ok: true,
    season,
    playerId: id,
    careerSeasons: { regular, playoffs },
    source: hasRows ? "firestore" : "empty",
    updatedAt: updatedAt ? updatedAt.toISOString() : null,
  };
}
