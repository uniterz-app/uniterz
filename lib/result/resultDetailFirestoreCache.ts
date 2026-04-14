/**
 * Result detail / overlay: short TTL cache so the same game or team is not read repeatedly.
 * Same fields as a direct Firestore read; within TTL data may be slightly stale.
 */

import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  nbaRegularSeasonWinsLosses,
  type NbaTeamRecordFields,
} from "@/lib/nbaRegularSeasonRecord";

const GAME_DOC_TTL_MS = 3 * 60 * 1000;
const TEAM_RECORD_TTL_MS = 5 * 60 * 1000;

type GameCacheEntry = {
  at: number;
  exists: boolean;
  data: Record<string, unknown> | null;
};

const gameDocCache = new Map<string, GameCacheEntry>();

export async function getCachedGameDocForResult(
  gameId: string
): Promise<{ exists: boolean; data: Record<string, unknown> | null }> {
  const hit = gameDocCache.get(gameId);
  const now = Date.now();
  if (hit && now - hit.at < GAME_DOC_TTL_MS) {
    return { exists: hit.exists, data: hit.data };
  }

  const snap = await getDoc(doc(db, "games", gameId));
  const exists = snap.exists();
  const data = exists ? (snap.data() as Record<string, unknown>) : null;
  gameDocCache.set(gameId, { at: now, exists, data });
  return { exists, data };
}

export type TeamRecordSnapshot = {
  wins: number;
  losses: number;
  rank?: number;
};

type TeamCacheEntry = { at: number; rec: TeamRecordSnapshot | null };
const teamRecordCache = new Map<string, TeamCacheEntry>();

function teamRecordFromDoc(
  d: NbaTeamRecordFields & { league?: string; rank?: number }
): TeamRecordSnapshot {
  const isNba = String(d.league ?? "") === "nba";
  const wl = isNba
    ? nbaRegularSeasonWinsLosses(d)
    : { wins: Number(d.wins ?? 0), losses: Number(d.losses ?? 0) };
  return {
    wins: wl.wins,
    losses: wl.losses,
    rank: typeof d.rank === "number" ? d.rank : undefined,
  };
}

export async function getCachedTeamRecord(
  teamId: string
): Promise<TeamRecordSnapshot | null> {
  const hit = teamRecordCache.get(teamId);
  const now = Date.now();
  if (hit && now - hit.at < TEAM_RECORD_TTL_MS) {
    return hit.rec;
  }

  const snap = await getDoc(doc(db, "teams", teamId));
  if (!snap.exists()) {
    teamRecordCache.set(teamId, { at: now, rec: null });
    return null;
  }
  const d = snap.data() as NbaTeamRecordFields & {
    league?: string;
    rank?: number;
  };
  const rec = teamRecordFromDoc(d);
  teamRecordCache.set(teamId, { at: now, rec });
  return rec;
}
