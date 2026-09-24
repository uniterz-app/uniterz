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
  type NbaPlayerCareerBio,
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

function numOrNull(raw: unknown): number | null {
  if (typeof raw !== "number" || !Number.isFinite(raw)) return null;
  return Math.trunc(raw);
}

function bioFromDoc(data: NbaPlayerCareerSeasonsDoc): NbaPlayerCareerBio {
  return {
    playerName: String(data.playerName ?? "").trim() || null,
    position: String(data.position ?? "").trim() || null,
    jerseyNumber: String(data.jerseyNumber ?? "").replace(/^#/, "").trim() || null,
    height: String(data.height ?? "").trim() || null,
    weight: String(data.weight ?? "").trim() || null,
    country: String(data.country ?? "").trim() || null,
    college: String(data.college ?? "").trim() || null,
    draftYear: numOrNull(data.draftYear),
    draftRound: numOrNull(data.draftRound),
    draftNumber: numOrNull(data.draftNumber),
  };
}

export async function writePlayerCareerSeasonsSnapshot(
  db: Firestore,
  input: {
    playerId: string;
    teamId: string | null;
    playerName?: string | null;
    position?: string | null;
    jerseyNumber?: string | null;
    height?: string | null;
    weight?: string | null;
    country?: string | null;
    college?: string | null;
    draftYear?: number | null;
    draftRound?: number | null;
    draftNumber?: number | null;
    asOfSeasonKey: string;
    regular: NbaPlayerCareerSeasonRow[];
    playoffs: NbaPlayerCareerSeasonRow[];
  }
): Promise<void> {
  const playerId = String(input.playerId).trim();
  const playerName = String(input.playerName ?? "").trim() || null;
  const payload = {
    playerId,
    teamId: input.teamId,
    playerName,
    position: String(input.position ?? "").trim() || null,
    jerseyNumber:
      String(input.jerseyNumber ?? "")
        .replace(/^#/, "")
        .trim() || null,
    height: String(input.height ?? "").trim() || null,
    weight: String(input.weight ?? "").trim() || null,
    country: String(input.country ?? "").trim() || null,
    college: String(input.college ?? "").trim() || null,
    draftYear: input.draftYear ?? null,
    draftRound: input.draftRound ?? null,
    draftNumber: input.draftNumber ?? null,
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
  const empty = (): NbaPlayerCareerSeasonsApiPayload => ({
    ok: true,
    season,
    playerId: id,
    playerName: null,
    bio: null,
    careerSeasons: { regular: [], playoffs: [] },
    source: "empty",
    updatedAt: null,
  });
  if (!id) return empty();

  const snap = await careerDocRef(db, id).get();
  if (!snap.exists) return empty();

  const data = snap.data() as NbaPlayerCareerSeasonsDoc;
  const regular = resolveRows(data.regular);
  const playoffs = resolveRows(data.playoffs);
  const updatedAt = data.updatedAt?.toDate?.() ?? null;
  const hasRows = regular.length > 0 || playoffs.length > 0;
  const bio = bioFromDoc(data);

  return {
    ok: true,
    season,
    playerId: id,
    playerName: bio.playerName,
    bio,
    careerSeasons: { regular, playoffs },
    source: hasRows ? "firestore" : "empty",
    updatedAt: updatedAt ? updatedAt.toISOString() : null,
  };
}
