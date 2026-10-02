import { FieldValue, type Firestore } from "firebase-admin/firestore";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import { loadTeamsByLeague } from "@/lib/games/server/loadTeamsByLeague";
import {
  buildNbaConferenceStandings,
  EMPTY_NBA_CONFERENCE_STANDINGS,
  type NbaConferenceStandingsBoard,
} from "@/lib/nba/nbaConferenceStandings";
import { enrichConferenceStandingsFromTeamGameLogs } from "@/lib/nba/standings/enrichConferenceStandingsFromTeamGameLogs";
import {
  buildPreseasonConferenceStandingsBoard,
  preseasonStandingsAsOfLabel,
} from "@/lib/nba/standings/buildPreseasonConferenceStandingsBoard";
import { loadTeamGameLogsSnapshot } from "@/lib/nba/teamGameLog/loadTeamGameLog";
import { buildTeamGameLogsBundleFromGames } from "@/lib/nba/teamGameLog/buildTeamGameLogsBundleFromGames";
import { loadNbaSeasonGameRows } from "@/lib/nba/ingest/nbaTeamGameLogsIngest";
import { nbaSeasonStatsReady } from "@/lib/predict/nbaSeasonStatsReady";
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
  const sourceRaw = typeof data.source === "string" ? data.source : "firestore";
  const source: NbaConferenceStandingsApiPayload["source"] =
    sourceRaw === "bdl" ||
    sourceRaw === "preseason" ||
    sourceRaw === "teams_fallback" ||
    sourceRaw === "firestore"
      ? sourceRaw
      : "firestore";

  return {
    ok: true,
    season: seasonKey,
    board,
    asOfLabel: asOf,
    source,
    updatedAt: updatedMs != null ? new Date(updatedMs).toISOString() : null,
  };
}

/**
 * Firestore `nbaStandings/{season}` を読む。
 * 未 ingest 時: 開幕前の当季 → 30 チーム 0-0 スキャフォールド。それ以外 → teams フォールバック。
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

  const usePreseasonScaffold =
    seasonKey === CURRENT_NBA_SEASON_KEY && !nbaSeasonStatsReady();

  let board: NbaConferenceStandingsBoard;
  let source: NbaConferenceStandingsApiPayload["source"];
  let label: string;

  if (usePreseasonScaffold) {
    board = buildPreseasonConferenceStandingsBoard(seasonKey);
    source = "preseason";
    label = preseasonStandingsAsOfLabel(seasonKey);
  } else {
    const { teams } = await loadTeamsByLeague(db, "nba");
    board = buildNbaConferenceStandings(teams);
    source = "teams_fallback";
    let maxMs: number | null = null;
    for (const row of teams) {
      const ms = readUpdatedAtMs(row.updatedAt);
      if (ms != null && (maxMs == null || ms > maxMs)) maxMs = ms;
    }
    label = asOfLabel(seasonKey, maxMs);
  }

  const gameLogSnap = await loadTeamGameLogsSnapshot(db, seasonKey);
  let teamLogs = gameLogSnap.bundle.teams;
  if (Object.keys(teamLogs).length === 0) {
    const rows = await loadNbaSeasonGameRows(db, seasonKey, 1500);
    if (rows.length > 0) {
      teamLogs = buildTeamGameLogsBundleFromGames({ seasonKey, games: rows }).teams;
    }
  }
  if (Object.keys(teamLogs).length > 0) {
    board = enrichConferenceStandingsFromTeamGameLogs(board, teamLogs);
  }

  const resolved =
    board.east.length || board.west.length ? board : EMPTY_NBA_CONFERENCE_STANDINGS;

  await writeNbaConferenceStandingsSnapshot(
    db,
    seasonKey,
    resolved,
    FieldValue.serverTimestamp(),
    label,
    source
  );

  return {
    ok: true,
    season: seasonKey,
    board: resolved,
    asOfLabel: label,
    source,
    updatedAt: null,
  };
}

/** ingest / 初回保存が同じドキュメントに書く */
export async function writeNbaConferenceStandingsSnapshot(
  db: Firestore,
  seasonKey: string,
  board: NbaConferenceStandingsBoard,
  serverTimestamp: unknown,
  asOf?: string,
  source: NbaConferenceStandingsApiPayload["source"] = "firestore"
): Promise<void> {
  await db.collection(NBA_CONFERENCE_STANDINGS_COLLECTION).doc(seasonKey).set({
    season: seasonKey,
    board,
    asOfLabel: asOf ?? seasonKey,
    source,
    updatedAt: serverTimestamp,
  });
}

export function nbaConferenceStandingsCacheControl(): string {
  return "public, s-maxage=120, stale-while-revalidate=600";
}
