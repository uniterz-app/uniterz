import type { Firestore } from "firebase-admin/firestore";
import { Timestamp } from "firebase-admin/firestore";

export type StreakEvent = {
  gameId: string;
  atMs: number;
  isWin: boolean;
  postId: string;
};

export type WcPostRow = {
  postId: string;
  uid: string;
  gameId: string;
  stats: Record<string, unknown>;
  detail: Record<string, unknown>;
  startAtJst: unknown;
  startAt: unknown;
  createdAt: unknown;
};

export function calcStreakBonus(activeWinStreak: number): number {
  if (!Number.isFinite(activeWinStreak) || activeWinStreak < 3) return 0;
  if (activeWinStreak >= 7) return 3;
  return activeWinStreak >= 5 ? 2 : 1;
}

export function toTimestamp(v: unknown): Timestamp | null {
  if (v instanceof Timestamp) return v;
  if (v && typeof (v as { toDate?: unknown }).toDate === "function") {
    return v as Timestamp;
  }
  return null;
}

export function toMs(v: unknown): number {
  const ts = toTimestamp(v);
  return ts ? ts.toDate().getTime() : 0;
}

export function resolveKickoffMs(
  post: Record<string, unknown>,
  game?: Record<string, unknown>
): number {
  return (
    toMs(game?.startAtJst) ||
    toMs(game?.startAt) ||
    toMs(post.startAtJst) ||
    toMs(post.startAt) ||
    toMs(post.createdAt)
  );
}

export function replayStreakAfterGame(
  events: StreakEvent[],
  targetGameId: string
): number {
  let curF = 0;
  for (const ev of events) {
    if (ev.isWin) curF = curF > 0 ? curF + 1 : 1;
    else curF = curF < 0 ? curF - 1 : -1;
    if (ev.gameId === targetGameId) return curF > 0 ? curF : 0;
  }
  throw new Error(`game ${targetGameId} not in timeline`);
}

export function replayFootballStreak(events: StreakEvent[]) {
  let curF = 0;
  let maxF = 0;
  for (const ev of events) {
    if (ev.isWin) {
      curF = curF > 0 ? curF + 1 : 1;
      if (curF > maxF) maxF = curF;
    } else {
      curF = curF < 0 ? curF - 1 : -1;
    }
  }
  return {
    football: curF,
    maxFootball: maxF,
    activeWinStreakFootball: curF > 0 ? curF : 0,
  };
}

export function buildKickoffTimeline(
  rows: WcPostRow[],
  gameById: Map<string, Record<string, unknown>>
): StreakEvent[] {
  const perGame = new Map<string, StreakEvent>();
  for (const row of rows) {
    const game = gameById.get(row.gameId);
    const atMs = resolveKickoffMs(row, game);
    const ev: StreakEvent = {
      gameId: row.gameId,
      atMs,
      isWin: row.stats.isWin === true,
      postId: row.postId,
    };
    const prev = perGame.get(row.gameId);
    if (!prev || ev.atMs >= prev.atMs) perGame.set(row.gameId, ev);
  }
  return [...perGame.values()].sort((a, b) => a.atMs - b.atMs);
}

export function expectedPostStreakFields(
  row: WcPostRow,
  events: StreakEvent[]
): {
  activeWinStreak: number;
  streakBonus: number;
  pointsV3: number;
} {
  const activeWinStreak = replayStreakAfterGame(events, row.gameId);
  const streakBonus = calcStreakBonus(activeWinStreak);
  const basePoints = Number(row.detail.basePoints ?? 0);
  const upsetBonus = Number(row.detail.upsetBonus ?? row.stats.upsetBonus ?? 0);
  const goalScorerBonus = Number(
    row.detail.goalScorerBonus ?? row.stats.goalScorerBonus ?? 0
  );
  const pointsV3 = basePoints + upsetBonus + streakBonus + goalScorerBonus;
  return { activeWinStreak, streakBonus, pointsV3 };
}

export async function loadWcPostRowsForUid(
  db: Firestore,
  uid: string
): Promise<WcPostRow[]> {
  const snap = await db
    .collection("posts")
    .where("league", "==", "wc")
    .where("status", "==", "final")
    .where("authorUid", "==", uid)
    .where("schemaVersion", "==", 2)
    .get();

  const rows: WcPostRow[] = [];
  for (const doc of snap.docs) {
    const p = doc.data() as Record<string, unknown>;
    const stats = p.stats as Record<string, unknown> | undefined;
    if (!stats || stats.countedForRanking === false) continue;
    if (typeof stats.isWin !== "boolean") continue;
    const gameId = String(p.gameId ?? "").trim();
    if (!gameId) continue;
    rows.push({
      postId: doc.id,
      uid,
      gameId,
      stats,
      detail: (stats.pointsV3Detail as Record<string, unknown>) ?? {},
      startAtJst: p.startAtJst,
      startAt: p.startAt,
      createdAt: p.createdAt,
    });
  }
  return rows;
}

export async function loadGamesById(
  db: Firestore,
  gameIds: Iterable<string>
): Promise<Map<string, Record<string, unknown>>> {
  const gameById = new Map<string, Record<string, unknown>>();
  const list = [...new Set(gameIds)];
  for (let i = 0; i < list.length; i += 300) {
    const chunk = list.slice(i, i + 300);
    const snaps = await db.getAll(...chunk.map((id) => db.doc(`games/${id}`)));
    for (const snap of snaps) {
      if (snap.exists) gameById.set(snap.id, snap.data() as Record<string, unknown>);
    }
  }
  return gameById;
}
