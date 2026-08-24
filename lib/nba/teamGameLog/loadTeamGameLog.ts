import type { Firestore } from "firebase-admin/firestore";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import { bdlSeasonYearFromSeasonKey } from "@/lib/nba/bdl/bdlNbaEnv";
import { emptyTeamGameLog } from "@/lib/nba/teamGameLog/buildTeamGameLogFromGames";
import {
  NBA_TEAM_GAME_LOGS_COLLECTION,
  type NbaTeamGameLogApiPayload,
  type NbaTeamGameLogSlice,
  type NbaTeamGameLogWl,
  type NbaTeamHeadToHeadEntry,
  type NbaTeamGameLogsApiPayload,
  type NbaTeamGameLogsBundle,
  type NbaTeamGameLogsFirestoreDoc,
  type NbaTeamGameLogsSnapshotSource,
} from "@/lib/nba/teamGameLog/teamGameLogTypes";

export function normalizeTeamGameLogSeasonKey(
  raw: string | null | undefined
): string {
  const trimmed = (raw ?? "").trim();
  return trimmed || CURRENT_NBA_SEASON_KEY;
}

function isFiniteNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function resolveWl(raw: unknown): NbaTeamGameLogWl {
  if (!raw || typeof raw !== "object") return { wins: 0, losses: 0 };
  const row = raw as Record<string, unknown>;
  return {
    wins: isFiniteNumber(row.wins) ? row.wins : 0,
    losses: isFiniteNumber(row.losses) ? row.losses : 0,
  };
}

function resolveHeadToHead(raw: unknown): NbaTeamHeadToHeadEntry[] {
  if (!Array.isArray(raw)) return [];
  const out: NbaTeamHeadToHeadEntry[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const oppTeamId =
      typeof row.oppTeamId === "string" ? row.oppTeamId.trim() : "";
    const oppAbbr =
      typeof row.oppAbbr === "string" ? row.oppAbbr.trim() : "";
    if (!oppTeamId || !oppAbbr) continue;
    out.push({
      oppTeamId,
      oppAbbr,
      wins: isFiniteNumber(row.wins) ? row.wins : 0,
      losses: isFiniteNumber(row.losses) ? row.losses : 0,
    });
  }
  return out.sort(
    (a, b) =>
      b.wins + b.losses - (a.wins + a.losses) ||
      a.oppAbbr.localeCompare(b.oppAbbr)
  );
}

function resolveTeamLog(
  teamId: string,
  season: string,
  raw: unknown
): NbaTeamGameLogSlice | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const streakRaw =
    row.streak && typeof row.streak === "object"
      ? (row.streak as Record<string, unknown>)
      : null;
  const kind =
    streakRaw?.kind === "L" || streakRaw?.kind === "W"
      ? streakRaw.kind
      : "W";
  const homeAway =
    row.homeAwaySplit && typeof row.homeAwaySplit === "object"
      ? (row.homeAwaySplit as Record<string, unknown>)
      : {};
  const conf =
    row.conferenceSplit && typeof row.conferenceSplit === "object"
      ? (row.conferenceSplit as Record<string, unknown>)
      : {};

  return {
    teamId:
      typeof row.teamId === "string" && row.teamId.trim()
        ? row.teamId.trim()
        : teamId,
    season:
      typeof row.season === "string" && row.season.trim()
        ? row.season.trim()
        : season,
    seasonRecord: resolveWl(row.seasonRecord),
    last10Record: resolveWl(row.last10Record),
    streak: {
      kind,
      count: isFiniteNumber(streakRaw?.count) ? streakRaw!.count : 0,
    },
    recentGames: Array.isArray(row.recentGames)
      ? (row.recentGames as NbaTeamGameLogSlice["recentGames"])
      : [],
    upcomingGames: Array.isArray(row.upcomingGames)
      ? (row.upcomingGames as NbaTeamGameLogSlice["upcomingGames"])
      : [],
    homeAwaySplit: {
      home: resolveWl(homeAway.home),
      away: resolveWl(homeAway.away),
    },
    conferenceSplit: {
      vsEast: resolveWl(conf.vsEast),
      vsWest: resolveWl(conf.vsWest),
    },
    headToHead: resolveHeadToHead(row.headToHead),
    finalCount: isFiniteNumber(row.finalCount) ? row.finalCount : 0,
    scheduledCount: isFiniteNumber(row.scheduledCount)
      ? row.scheduledCount
      : 0,
  };
}

export function resolveTeamGameLogsFromFirestore(
  data: NbaTeamGameLogsFirestoreDoc | undefined | null,
  seasonKey: string
): {
  bundle: NbaTeamGameLogsBundle;
  source: NbaTeamGameLogsSnapshotSource;
  updatedAt: Date | null;
  teamCount: number;
} | null {
  if (!data || typeof data.teams !== "object" || data.teams == null) {
    return null;
  }
  const teams: Record<string, NbaTeamGameLogSlice> = {};
  for (const [id, raw] of Object.entries(
    data.teams as Record<string, unknown>
  )) {
    const log = resolveTeamLog(id, seasonKey, raw);
    if (!log) continue;
    teams[id] = log;
  }
  const teamCount = Object.keys(teams).length;
  if (teamCount < 1) return null;

  const sourceRaw = typeof data.source === "string" ? data.source : "firestore";
  const source: NbaTeamGameLogsSnapshotSource =
    sourceRaw === "mock" || sourceRaw === "empty" || sourceRaw === "firestore"
      ? sourceRaw
      : "firestore";

  return {
    bundle: {
      seasonKey,
      seasonYear: isFiniteNumber(data.seasonYear) ? data.seasonYear : 0,
      gameCount: isFiniteNumber(data.gameCount) ? data.gameCount : 0,
      teams,
    },
    source,
    updatedAt: data.updatedAt?.toDate?.() ?? null,
    teamCount,
  };
}

export async function loadTeamGameLogsSnapshot(
  db: Firestore,
  seasonKey: string
): Promise<NbaTeamGameLogsApiPayload> {
  const key = normalizeTeamGameLogSeasonKey(seasonKey);
  const snap = await db.collection(NBA_TEAM_GAME_LOGS_COLLECTION).doc(key).get();
  const resolved = snap.exists
    ? resolveTeamGameLogsFromFirestore(
        snap.data() as NbaTeamGameLogsFirestoreDoc,
        key
      )
    : null;

  if (!resolved) {
    return {
      ok: true,
      season: key,
      bundle: {
        seasonKey: key,
        seasonYear: 0,
        gameCount: 0,
        teams: {},
      },
      source: "empty",
      updatedAt: null,
      teamCount: 0,
    };
  }

  return {
    ok: true,
    season: key,
    bundle: resolved.bundle,
    source: resolved.source,
    updatedAt: resolved.updatedAt?.toISOString() ?? null,
    teamCount: resolved.teamCount,
  };
}

export async function loadTeamGameLog(
  db: Firestore,
  seasonRaw: string | null | undefined,
  teamIdRaw: string
): Promise<NbaTeamGameLogApiPayload> {
  const season = normalizeTeamGameLogSeasonKey(seasonRaw);
  const teamId = teamIdRaw.trim();
  const payload = await loadTeamGameLogsSnapshot(db, season);
  return {
    ok: true,
    season,
    teamId,
    log: payload.bundle.teams[teamId] ?? emptyTeamGameLog(teamId, season),
    source: payload.source,
    updatedAt: payload.updatedAt,
  };
}

export async function writeTeamGameLogsSnapshot(
  db: Firestore,
  seasonKey: string,
  teams: Record<string, NbaTeamGameLogSlice>,
  meta: {
    seasonYear?: number;
    gameCount: number;
    source: NbaTeamGameLogsSnapshotSource;
    serverTimestamp: unknown;
  }
): Promise<{ teamCount: number; gameCount: number }> {
  const key = normalizeTeamGameLogSeasonKey(seasonKey);
  const teamCount = Object.keys(teams).length;
  const seasonYear =
    typeof meta.seasonYear === "number" && Number.isFinite(meta.seasonYear)
      ? meta.seasonYear
      : bdlSeasonYearFromSeasonKey(key);

  await db.collection(NBA_TEAM_GAME_LOGS_COLLECTION).doc(key).set({
    seasonKey: key,
    seasonYear,
    gameCount: meta.gameCount,
    source: meta.source,
    teamCount,
    teams,
    updatedAt: meta.serverTimestamp,
  });

  return { teamCount, gameCount: meta.gameCount };
}
