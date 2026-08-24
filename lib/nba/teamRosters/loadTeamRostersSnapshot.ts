import type { Firestore } from "firebase-admin/firestore";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import type {
  NbaMatchupRosterApiPayload,
  NbaPlayerRosterHitApiPayload,
  NbaTeamRosterDocTeam,
  NbaTeamRosterSliceApiPayload,
  NbaTeamRostersApiPayload,
  NbaTeamRostersBundle,
  NbaTeamRostersFirestoreDoc,
  NbaTeamRostersSnapshotSource,
} from "./teamRosterTypes";

export const NBA_TEAM_ROSTERS_COLLECTION = "nbaTeamRosters";

export function normalizeTeamRostersSeasonKey(
  raw: string | null | undefined
): string {
  const trimmed = (raw ?? "").trim();
  return trimmed || CURRENT_NBA_SEASON_KEY;
}

function isPlayerArray(raw: unknown): raw is NbaTeamRosterDocTeam["players"] {
  return Array.isArray(raw);
}

function resolveTeam(
  teamId: string,
  raw: unknown
): NbaTeamRosterDocTeam | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  if (!isPlayerArray(row.players)) return null;
  const teamName =
    typeof row.teamName === "string" && row.teamName.trim()
      ? row.teamName.trim()
      : teamId;
  return {
    teamId:
      typeof row.teamId === "string" && row.teamId.trim()
        ? row.teamId.trim()
        : teamId,
    teamName,
    players: row.players,
  };
}

export function resolveTeamRostersFromFirestore(
  data: NbaTeamRostersFirestoreDoc | undefined | null,
  seasonKey: string
): {
  bundle: NbaTeamRostersBundle;
  source: NbaTeamRostersSnapshotSource;
  updatedAt: Date | null;
  playerCount: number;
  teamCount: number;
} | null {
  if (!data || typeof data.teams !== "object" || data.teams == null) {
    return null;
  }
  const teams: Record<string, NbaTeamRosterDocTeam> = {};
  let playerCount = 0;
  for (const [teamId, raw] of Object.entries(
    data.teams as Record<string, unknown>
  )) {
    const team = resolveTeam(teamId, raw);
    if (!team || team.players.length === 0) continue;
    teams[teamId] = team;
    playerCount += team.players.length;
  }
  const teamCount = Object.keys(teams).length;
  if (teamCount < 1) return null;

  const sourceRaw = typeof data.source === "string" ? data.source : "firestore";
  const source: NbaTeamRostersSnapshotSource =
    sourceRaw === "mock" || sourceRaw === "empty" || sourceRaw === "firestore"
      ? sourceRaw
      : "firestore";

  return {
    bundle: { seasonKey, teams },
    source,
    updatedAt: data.updatedAt?.toDate?.() ?? null,
    playerCount,
    teamCount,
  };
}

export async function loadTeamRostersSnapshot(
  db: Firestore,
  seasonKey: string
): Promise<NbaTeamRostersApiPayload> {
  const key = normalizeTeamRostersSeasonKey(seasonKey);
  const snap = await db.collection(NBA_TEAM_ROSTERS_COLLECTION).doc(key).get();
  const data = snap.exists
    ? (snap.data() as NbaTeamRostersFirestoreDoc)
    : null;
  const resolved = data
    ? resolveTeamRostersFromFirestore(data, key)
    : null;
  const averagesSeasonKey =
    typeof data?.averagesSeasonKey === "string" && data.averagesSeasonKey.trim()
      ? data.averagesSeasonKey.trim()
      : key;

  if (!resolved) {
    return {
      ok: true,
      season: key,
      averagesSeasonKey: key,
      bundle: { seasonKey: key, teams: {} },
      source: "empty",
      updatedAt: null,
      playerCount: 0,
      teamCount: 0,
    };
  }

  return {
    ok: true,
    season: key,
    averagesSeasonKey,
    bundle: resolved.bundle,
    source: resolved.source,
    updatedAt: resolved.updatedAt?.toISOString() ?? null,
    playerCount: resolved.playerCount,
    teamCount: resolved.teamCount,
  };
}

export async function loadMatchupRosters(
  db: Firestore,
  seasonKey: string,
  homeTeamId: string,
  awayTeamId: string
): Promise<NbaMatchupRosterApiPayload> {
  const payload = await loadTeamRostersSnapshot(db, seasonKey);
  return {
    ok: true,
    season: payload.season,
    homeTeamId,
    awayTeamId,
    home: payload.bundle.teams[homeTeamId] ?? null,
    away: payload.bundle.teams[awayTeamId] ?? null,
    source: payload.source,
    updatedAt: payload.updatedAt,
  };
}

export async function loadTeamRosterSlice(
  db: Firestore,
  seasonKey: string,
  teamId: string
): Promise<NbaTeamRosterSliceApiPayload> {
  const payload = await loadTeamRostersSnapshot(db, seasonKey);
  const id = teamId.trim();
  return {
    ok: true,
    season: payload.season,
    averagesSeasonKey: payload.averagesSeasonKey,
    teamId: id,
    team: payload.bundle.teams[id] ?? null,
    source: payload.source,
    updatedAt: payload.updatedAt,
  };
}

export async function loadPlayerRosterHit(
  db: Firestore,
  seasonKey: string,
  playerId: string
): Promise<NbaPlayerRosterHitApiPayload> {
  const payload = await loadTeamRostersSnapshot(db, seasonKey);
  const want = String(playerId).trim();
  let hit: NbaPlayerRosterHitApiPayload["hit"] = null;
  if (want) {
    for (const team of Object.values(payload.bundle.teams)) {
      const player = team.players.find((p) => String(p.id) === want);
      if (!player) continue;
      hit = {
        teamId: team.teamId,
        teamName: team.teamName,
        player,
      };
      break;
    }
  }
  return {
    ok: true,
    season: payload.season,
    averagesSeasonKey: payload.averagesSeasonKey,
    playerId: want,
    hit,
    source: payload.source,
    updatedAt: payload.updatedAt,
  };
}

export async function writeTeamRostersSnapshot(
  db: Firestore,
  seasonKey: string,
  teams: Record<string, NbaTeamRosterDocTeam>,
  source: NbaTeamRostersSnapshotSource,
  serverTimestamp: unknown,
  extra?: { averagesSeasonKey?: string }
): Promise<{ teamCount: number; playerCount: number }> {
  const key = normalizeTeamRostersSeasonKey(seasonKey);
  let playerCount = 0;
  for (const t of Object.values(teams)) {
    playerCount += t.players.length;
  }
  const teamCount = Object.keys(teams).length;
  await db.collection(NBA_TEAM_ROSTERS_COLLECTION).doc(key).set({
    seasonKey: key,
    averagesSeasonKey: extra?.averagesSeasonKey ?? key,
    source,
    teamCount,
    playerCount,
    teams,
    updatedAt: serverTimestamp,
  });
  return { teamCount, playerCount };
}
