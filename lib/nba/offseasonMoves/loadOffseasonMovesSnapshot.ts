import type { Firestore } from "firebase-admin/firestore";
import {
  NBA_PLAYER_SEASON_FINAL_TEAMS_COLLECTION,
  NBA_TEAM_OFFSEASON_MOVES_COLLECTION,
  type NbaOffseasonMove,
  type NbaPlayerSeasonFinalTeam,
  type NbaPlayerSeasonFinalTeamsDoc,
  type NbaTeamOffseasonMoves,
  type NbaTeamOffseasonMovesDoc,
} from "./offseasonMovesTypes";

export async function loadPlayerSeasonFinalTeams(
  db: Firestore,
  seasonKey: string
): Promise<NbaPlayerSeasonFinalTeamsDoc | null> {
  const snap = await db
    .collection(NBA_PLAYER_SEASON_FINAL_TEAMS_COLLECTION)
    .doc(seasonKey)
    .get();
  if (!snap.exists) return null;
  const data = snap.data() as Partial<NbaPlayerSeasonFinalTeamsDoc>;
  if (!data.players || typeof data.players !== "object") return null;
  const players = data.players as Record<string, NbaPlayerSeasonFinalTeam>;
  return {
    seasonKey,
    players,
    playerCount: Object.keys(players).length,
  };
}

export async function writePlayerSeasonFinalTeams(
  db: Firestore,
  seasonKey: string,
  players: Record<string, NbaPlayerSeasonFinalTeam>,
  serverTimestamp: unknown
): Promise<number> {
  const playerCount = Object.keys(players).length;
  await db
    .collection(NBA_PLAYER_SEASON_FINAL_TEAMS_COLLECTION)
    .doc(seasonKey)
    .set({ seasonKey, players, playerCount, updatedAt: serverTimestamp });
  return playerCount;
}

export async function writeTeamOffseasonMoves(
  db: Firestore,
  doc: NbaTeamOffseasonMovesDoc,
  serverTimestamp: unknown
): Promise<void> {
  await db
    .collection(NBA_TEAM_OFFSEASON_MOVES_COLLECTION)
    .doc(doc.seasonKey)
    .set({ ...doc, updatedAt: serverTimestamp });
}

function isMoveArray(raw: unknown): raw is NbaOffseasonMove[] {
  return Array.isArray(raw);
}

export async function loadTeamOffseasonMoves(
  db: Firestore,
  seasonKey: string,
  teamId: string
): Promise<{ moves: NbaTeamOffseasonMoves | null; updatedAt: string | null }> {
  const snap = await db
    .collection(NBA_TEAM_OFFSEASON_MOVES_COLLECTION)
    .doc(seasonKey)
    .get();
  if (!snap.exists) return { moves: null, updatedAt: null };
  const data = snap.data() as Partial<NbaTeamOffseasonMovesDoc> & {
    updatedAt?: { toDate(): Date };
  };
  const row = data.teams?.[teamId];
  const updatedAt = data.updatedAt?.toDate?.()?.toISOString() ?? null;
  if (!row) return { moves: null, updatedAt };
  const incoming = isMoveArray(row.incoming) ? row.incoming : [];
  const outgoing = isMoveArray(row.outgoing) ? row.outgoing : [];
  if (incoming.length === 0 && outgoing.length === 0) {
    return { moves: null, updatedAt };
  }
  return {
    moves: {
      seasonKey,
      priorSeasonKey:
        typeof data.priorSeasonKey === "string" ? data.priorSeasonKey : "",
      incoming,
      outgoing,
    },
    updatedAt,
  };
}
