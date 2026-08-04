/**
 * シーズン順位予想 — Admin / API 用
 */
import type { Firestore } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import {
  parseSeasonStandingsPrediction,
  validateSeasonStandingsForSubmit,
  type NbaSeasonStandingsPrediction,
} from "@/lib/predict/nbaSeasonStandingsPredict";

export const SEASON_STANDINGS_COLLECTION = "seasonStandingsPredictions";

export function seasonStandingsDocId(season: string, uid: string): string {
  return `${season}_${uid}`;
}

export function seasonStandingsDocRef(
  db: Firestore,
  season: string,
  uid: string
) {
  return db
    .collection(SEASON_STANDINGS_COLLECTION)
    .doc(seasonStandingsDocId(season, uid));
}

export function predictionFromSeasonStandingsDoc(
  data: Record<string, unknown>
): NbaSeasonStandingsPrediction | null {
  const season = typeof data.season === "string" ? data.season.trim() : "";
  if (!season) return null;
  if (data.isSubmitted !== true) return null;
  return parseSeasonStandingsPrediction(season, data);
}

export async function loadSeasonStandingsDoc(
  db: Firestore,
  uid: string,
  season: string
): Promise<NbaSeasonStandingsPrediction | null> {
  const snap = await seasonStandingsDocRef(db, season, uid).get();
  if (!snap.exists) return null;
  return predictionFromSeasonStandingsDoc(
    (snap.data() ?? {}) as Record<string, unknown>
  );
}

export function resolveSeasonStandingsForSubmit(input: {
  season: string;
  east: unknown;
  west: unknown;
}):
  | { ok: true; prediction: NbaSeasonStandingsPrediction }
  | { ok: false; error: string } {
  const prediction = parseSeasonStandingsPrediction(input.season, {
    east: input.east,
    west: input.west,
  });
  const checked = validateSeasonStandingsForSubmit(prediction);
  if (!checked.ok) return checked;
  return { ok: true, prediction };
}

export async function upsertSeasonStandingsDoc(
  db: Firestore,
  uid: string,
  prediction: NbaSeasonStandingsPrediction
): Promise<void> {
  const ref = seasonStandingsDocRef(db, prediction.season, uid);
  const existing = await ref.get();
  const payload: Record<string, unknown> = {
    uid,
    season: prediction.season,
    east: prediction.east,
    west: prediction.west,
    isSubmitted: true,
    updatedAt: FieldValue.serverTimestamp(),
  };
  if (!existing.exists) {
    payload.submittedAt = FieldValue.serverTimestamp();
  }
  await ref.set(payload, { merge: true });
}
