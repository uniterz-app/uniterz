import { FieldValue, type Firestore } from "firebase-admin/firestore";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import { loadTeamsByLeague } from "@/lib/games/server/loadTeamsByLeague";
import {
  buildNbaConferenceStandings,
  EMPTY_NBA_CONFERENCE_STANDINGS,
  type NbaConferenceStandingsBoard,
} from "@/lib/nba/nbaConferenceStandings";
import type { NbaConferenceStandingsApiPayload } from "./nbaConferenceStandingsTypes";

export const NBA_CONFERENCE_STANDINGS_COLLECTION = "nbaStandings";

export function normalizeStandingsSeasonKey(raw: string | null | undefined): string {
  const trimmed = (raw ?? "").trim();
  return trimmed || CURRENT_NBA_SEASON_KEY;
}

function readUpdatedAtMs(v: unknown): number | null {
  if (v == null) return null;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "object") {
    const o = v as { __ts?: unknown; toMillis?: () => number; toDate?: () => Date };
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

function asOfLabel(season: string, updatedAtMs: number | null): string {
  if (updatedAtMs == null) return season;
  const d = new Date(updatedAtMs);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${season} · ${y}-${m}-${day}`;
}

function parseBoard(raw: unknown): NbaConferenceStandingsBoard | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (!Array.isArray(o.east) || !Array.isArray(o.west)) return null;
  return {
    east: o.east as NbaConferenceStandingsBoard["east"],
    west: o.west as NbaConferenceStandingsBoard["west"],
  };
}

function payloadFromDoc(
  seasonKey: string,
  data: Record<string, unknown>
): NbaConferenceStandingsApiPayload | null {
  const board = parseBoard(data.board) ?? parseBoard(data);
  if (!board || (board.east.length === 0 && board.west.length === 0)) return null;
  const updatedMs = readUpdatedAtMs(data.updatedAt);
  const asOf =
    typeof data.asOfLabel === "string" && data.asOfLabel.trim()
      ? data.asOfLabel.trim()
      : asOfLabel(seasonKey, updatedMs);
  return {
    ok: true,
    season: seasonKey,
    board,
    asOfLabel: asOf,
    source: "firestore",
    updatedAt: updatedMs != null ? new Date(updatedMs).toISOString() : null,
  };
}

/**
 * Firestore `nbaStandings/{season}` を読む。
 * ドキュメントが無いときだけ `teams` から組んで同じ場所に保存する（以後は読むだけ）。
 * プロバイダ ingest も `writeNbaConferenceStandingsSnapshot` でここを上書きする。
 */
export async function loadNbaConferenceStandings(
  db: Firestore,
  seasonKey: string
): Promise<NbaConferenceStandingsApiPayload> {
  const ref = db.collection(NBA_CONFERENCE_STANDINGS_COLLECTION).doc(seasonKey);
  const snap = await ref.get();
  if (snap.exists) {
    const fromDoc = payloadFromDoc(seasonKey, (snap.data() ?? {}) as Record<string, unknown>);
    if (fromDoc) return fromDoc;
  }

  const { teams } = await loadTeamsByLeague(db, "nba");
  const board = buildNbaConferenceStandings(teams);
  const resolved =
    board.east.length || board.west.length ? board : EMPTY_NBA_CONFERENCE_STANDINGS;
  let maxMs: number | null = null;
  for (const row of teams) {
    const ms = readUpdatedAtMs(row.updatedAt);
    if (ms != null && (maxMs == null || ms > maxMs)) maxMs = ms;
  }
  const label = asOfLabel(seasonKey, maxMs);

  await writeNbaConferenceStandingsSnapshot(
    db,
    seasonKey,
    resolved,
    FieldValue.serverTimestamp(),
    label
  );

  return {
    ok: true,
    season: seasonKey,
    board: resolved,
    asOfLabel: label,
    source: "firestore",
    updatedAt: maxMs != null ? new Date(maxMs).toISOString() : null,
  };
}

/** ingest / 初回保存が同じドキュメントに書く */
export async function writeNbaConferenceStandingsSnapshot(
  db: Firestore,
  seasonKey: string,
  board: NbaConferenceStandingsBoard,
  serverTimestamp: unknown,
  asOf?: string
): Promise<void> {
  await db.collection(NBA_CONFERENCE_STANDINGS_COLLECTION).doc(seasonKey).set({
    season: seasonKey,
    board,
    asOfLabel: asOf ?? seasonKey,
    source: "firestore",
    updatedAt: serverTimestamp,
  });
}

export function nbaConferenceStandingsCacheControl(): string {
  return "public, s-maxage=120, stale-while-revalidate=600";
}
