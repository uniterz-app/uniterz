import { FieldValue, type Firestore } from "firebase-admin/firestore";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import {
  EMPTY_NBA_CUP_STANDINGS,
  NBA_CUP_STANDINGS_COLLECTION,
  type NbaCupStandingsApiPayload,
  type NbaCupStandingsBoard,
} from "./nbaCupStandingsTypes";

export function normalizeCupStandingsSeasonKey(
  raw: string | null | undefined
): string {
  const trimmed = (raw ?? "").trim();
  return trimmed || CURRENT_NBA_SEASON_KEY;
}

function readUpdatedAtMs(v: unknown): number | null {
  if (v == null) return null;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "object") {
    const o = v as {
      __ts?: unknown;
      toMillis?: () => number;
      toDate?: () => Date;
    };
    if (typeof o.__ts === "number" && Number.isFinite(o.__ts)) return o.__ts;
    if (typeof o.toMillis === "function") {
      const n = o.toMillis();
      return Number.isFinite(n) ? n : null;
    }
    if (typeof o.toDate === "function") {
      const n = o.toDate().getTime();
      return Number.isFinite(n) ? n : null;
    }
  }
  return null;
}

function parseBoard(raw: unknown): NbaCupStandingsBoard | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (!Array.isArray(o.groups)) return null;
  return { groups: o.groups as NbaCupStandingsBoard["groups"] };
}

export async function writeNbaCupStandingsSnapshot(
  db: Firestore,
  seasonKey: string,
  board: NbaCupStandingsBoard,
  updatedAt: ReturnType<typeof FieldValue.serverTimestamp> | number,
  asOfLabel: string,
  source: NbaCupStandingsApiPayload["source"]
): Promise<void> {
  await db.collection(NBA_CUP_STANDINGS_COLLECTION).doc(seasonKey).set(
    {
      season: seasonKey,
      board,
      asOfLabel,
      source,
      updatedAt,
    },
    { merge: true }
  );
}

export async function loadNbaCupStandings(
  db: Firestore,
  seasonKey: string
): Promise<NbaCupStandingsApiPayload> {
  const season = normalizeCupStandingsSeasonKey(seasonKey);
  const snap = await db
    .collection(NBA_CUP_STANDINGS_COLLECTION)
    .doc(season)
    .get();

  if (!snap.exists) {
    return {
      ok: true,
      season,
      board: EMPTY_NBA_CUP_STANDINGS,
      asOfLabel: season,
      source: "firestore",
      updatedAt: null,
    };
  }

  const data = snap.data() as Record<string, unknown>;
  const board = parseBoard(data.board) ?? EMPTY_NBA_CUP_STANDINGS;
  const updatedAt = readUpdatedAtMs(data.updatedAt);
  const asOfLabel =
    typeof data.asOfLabel === "string" && data.asOfLabel.trim()
      ? data.asOfLabel.trim()
      : season;
  const sourceRaw = typeof data.source === "string" ? data.source : "firestore";
  const source: NbaCupStandingsApiPayload["source"] =
    sourceRaw === "bdl" || sourceRaw === "games" || sourceRaw === "firestore"
      ? sourceRaw
      : "firestore";

  return {
    ok: true,
    season,
    board,
    asOfLabel,
    source,
    updatedAt,
  };
}

export function nbaCupStandingsCacheControl(): string {
  return "public, s-maxage=120, stale-while-revalidate=600";
}

export { FieldValue };
