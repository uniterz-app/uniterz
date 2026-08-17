/**
 * シーズンアワード予想 — Admin / API 用（Firestore + モック名簿検証）
 */
import type { Firestore } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import {
  AWARDS_PREVIEW_COACHES,
  AWARDS_PREVIEW_PLAYERS,
  awardsPreviewCatalog,
} from "@/lib/predict/nbaSeasonAwardsPreviewMocks";
import {
  NBA_SEASON_AWARD_DEFS,
  isSeasonAwardsComplete,
  parseSeasonAwardsPicks,
  type NbaAwardCandidate,
  type NbaSeasonAwardsPicks,
  type NbaSeasonAwardsPrediction,
} from "@/lib/predict/nbaSeasonAwardsPredict";

export const SEASON_AWARDS_COLLECTION = "seasonAwardsPredictions";

export type SeasonAwardsDoc = {
  uid: string;
  season: string;
  picks: NbaSeasonAwardsPicks;
  candidates: NbaAwardCandidate[];
  isSubmitted: true;
  submittedAt?: unknown;
  updatedAt?: unknown;
};

export function seasonAwardsDocId(season: string, uid: string): string {
  return `${season}_${uid}`;
}

export function seasonAwardsDocRef(
  db: Firestore,
  season: string,
  uid: string
) {
  return db
    .collection(SEASON_AWARDS_COLLECTION)
    .doc(seasonAwardsDocId(season, uid));
}

/** 提出検証用カタログ（ゲート B まではモック） */
export function seasonAwardsSubmitCatalog(): readonly NbaAwardCandidate[] {
  return [...AWARDS_PREVIEW_PLAYERS, ...AWARDS_PREVIEW_COACHES];
}

function catalogById(
  catalog: readonly NbaAwardCandidate[]
): Map<string, NbaAwardCandidate> {
  return new Map(catalog.map((c) => [c.id, c]));
}

export type ResolveSeasonAwardsResult =
  | {
      ok: true;
      prediction: NbaSeasonAwardsPrediction;
      candidates: NbaAwardCandidate[];
    }
  | { ok: false; error: string };

/**
 * 完全提出を検証し、表示用スナップショットを組み立てる。
 * 未知 ID / 賞種不一致は拒否。
 */
export function resolveSeasonAwardsForSubmit(input: {
  season: string;
  picksRaw: unknown;
  catalog?: readonly NbaAwardCandidate[];
}): ResolveSeasonAwardsResult {
  const season = input.season.trim();
  if (!season || season.length > 32 || season.includes("/")) {
    return { ok: false, error: "invalid_season" };
  }

  const picks = parseSeasonAwardsPicks(input.picksRaw);
  const prediction: NbaSeasonAwardsPrediction = { season, picks };
  if (!isSeasonAwardsComplete(prediction)) {
    return { ok: false, error: "incomplete_picks" };
  }

  const fullCatalog = input.catalog ?? seasonAwardsSubmitCatalog();
  const byId = catalogById(fullCatalog);
  const kindCatalog =
    input.catalog == null
      ? {
          player: new Set(awardsPreviewCatalog("player").map((c) => c.id)),
          coach: new Set(awardsPreviewCatalog("coach").map((c) => c.id)),
        }
      : null;
  const candidates: NbaAwardCandidate[] = [];
  const seen = new Set<string>();

  for (const def of NBA_SEASON_AWARD_DEFS) {
    const id = picks[def.id];
    if (typeof id !== "string" || !id) {
      return { ok: false, error: "incomplete_picks" };
    }
    const c = byId.get(id);
    if (!c) {
      return { ok: false, error: `unknown_candidate:${def.id}` };
    }
    if (kindCatalog && !kindCatalog[def.kind].has(id)) {
      return { ok: false, error: `kind_mismatch:${def.id}` };
    }
    if (!seen.has(c.id)) {
      seen.add(c.id);
      candidates.push({
        id: c.id,
        firstName: c.firstName,
        lastName: c.lastName,
        ...(c.teamAbbr ? { teamAbbr: c.teamAbbr } : {}),
      });
    }
  }

  return { ok: true, prediction, candidates };
}

export function predictionFromSeasonAwardsDoc(
  data: Record<string, unknown>
): {
  prediction: NbaSeasonAwardsPrediction;
  candidates: NbaAwardCandidate[];
} | null {
  const season = typeof data.season === "string" ? data.season.trim() : "";
  if (!season) return null;
  if (data.isSubmitted !== true) return null;

  const picks = parseSeasonAwardsPicks(data.picks);
  const candidates = parseCandidateSnapshots(data.candidates);
  return {
    prediction: { season, picks },
    candidates,
  };
}

function parseCandidateSnapshots(raw: unknown): NbaAwardCandidate[] {
  if (!Array.isArray(raw)) return [];
  const out: NbaAwardCandidate[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    const o = item as Record<string, unknown>;
    const id = typeof o.id === "string" ? o.id.trim() : "";
    const firstName = typeof o.firstName === "string" ? o.firstName.trim() : "";
    const lastName = typeof o.lastName === "string" ? o.lastName.trim() : "";
    if (!id || (!firstName && !lastName)) continue;
    const teamAbbr =
      typeof o.teamAbbr === "string" && o.teamAbbr.trim()
        ? o.teamAbbr.trim()
        : undefined;
    out.push({
      id,
      firstName,
      lastName,
      ...(teamAbbr ? { teamAbbr } : {}),
    });
  }
  return out;
}

export async function loadSeasonAwardsDoc(
  db: Firestore,
  uid: string,
  season: string
): Promise<{
  prediction: NbaSeasonAwardsPrediction;
  candidates: NbaAwardCandidate[];
} | null> {
  const snap = await seasonAwardsDocRef(db, season, uid).get();
  if (!snap.exists) return null;
  return predictionFromSeasonAwardsDoc((snap.data() ?? {}) as Record<string, unknown>);
}

export async function upsertSeasonAwardsDoc(
  db: Firestore,
  uid: string,
  prediction: NbaSeasonAwardsPrediction,
  candidates: NbaAwardCandidate[]
): Promise<void> {
  const ref = seasonAwardsDocRef(db, prediction.season, uid);
  const existing = await ref.get();
  const payload: Record<string, unknown> = {
    uid,
    season: prediction.season,
    picks: prediction.picks,
    candidates,
    isSubmitted: true,
    updatedAt: FieldValue.serverTimestamp(),
  };
  if (!existing.exists) {
    payload.submittedAt = FieldValue.serverTimestamp();
  }
  await ref.set(payload, { merge: true });
}
