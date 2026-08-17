/**
 * Result detail / overlay: short TTL + inflight for games / teams.
 * Firestore インスタンスは呼び出し側から渡す（Web / Native 共用）。
 */

import {
  doc,
  getDoc,
  type Firestore,
} from "firebase/firestore";
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
const gameDocInflight = new Map<
  string,
  Promise<{ exists: boolean; data: Record<string, unknown> | null }>
>();

export async function getCachedGameDocForResult(
  gameId: string,
  firestore: Firestore
): Promise<{ exists: boolean; data: Record<string, unknown> | null }> {
  const safeId = gameId.trim();
  if (!safeId) return { exists: false, data: null };

  const hit = gameDocCache.get(safeId);
  const now = Date.now();
  if (hit && now - hit.at < GAME_DOC_TTL_MS) {
    return { exists: hit.exists, data: hit.data };
  }

  const pending = gameDocInflight.get(safeId);
  if (pending) return pending;

  const promise = getDoc(doc(firestore, "games", safeId))
    .then((snap) => {
      const exists = snap.exists();
      const data = exists ? (snap.data() as Record<string, unknown>) : null;
      gameDocCache.set(safeId, { at: Date.now(), exists, data });
      return { exists, data };
    })
    .finally(() => {
      gameDocInflight.delete(safeId);
    });

  gameDocInflight.set(safeId, promise);
  return promise;
}

export type TeamRecordSnapshot = {
  wins: number;
  losses: number;
  rank?: number;
};

type TeamCacheEntry = { at: number; rec: TeamRecordSnapshot | null };
const teamRecordCache = new Map<string, TeamCacheEntry>();
const teamRecordInflight = new Map<
  string,
  Promise<TeamRecordSnapshot | null>
>();

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
  teamId: string,
  firestore: Firestore
): Promise<TeamRecordSnapshot | null> {
  const safeId = teamId.trim();
  if (!safeId) return null;

  const hit = teamRecordCache.get(safeId);
  const now = Date.now();
  if (hit && now - hit.at < TEAM_RECORD_TTL_MS) {
    return hit.rec;
  }

  const pending = teamRecordInflight.get(safeId);
  if (pending) return pending;

  const promise = getDoc(doc(firestore, "teams", safeId))
    .then((snap) => {
      if (!snap.exists()) {
        teamRecordCache.set(safeId, { at: Date.now(), rec: null });
        return null;
      }
      const d = snap.data() as NbaTeamRecordFields & {
        league?: string;
        rank?: number;
      };
      const rec = teamRecordFromDoc(d);
      teamRecordCache.set(safeId, { at: Date.now(), rec });
      return rec;
    })
    .finally(() => {
      teamRecordInflight.delete(safeId);
    });

  teamRecordInflight.set(safeId, promise);
  return promise;
}
