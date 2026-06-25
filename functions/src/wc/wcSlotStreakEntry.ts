/** Keep in sync with lib/wc/wcSlotStreakReplay.ts */

import {
  computeWcSlotStreakOutcome,
  resolveKickoffMsFromFields,
  type WcKickoffSlotGameOutcome,
} from "./wcKickoffSlot";

type TimelineUnit =
  | { kind: "single"; gameId: string; isWin: boolean }
  | {
      kind: "slot";
      kickoffMs: number;
      outcomes: WcKickoffSlotGameOutcome[];
    };

function entryActiveFootball(curF: number): number {
  return curF > 0 ? curF : 0;
}

function buildTimelineUnits(
  posts: ReadonlyArray<{
    gameId: string;
    isWin: boolean;
    kickoffMs: number;
  }>,
  gamesByKickoff: ReadonlyMap<number, string[]>
): TimelineUnit[] {
  const byKickoff = new Map<number, Map<string, boolean>>();
  for (const post of posts) {
    const perGame = byKickoff.get(post.kickoffMs) ?? new Map<string, boolean>();
    perGame.set(post.gameId, post.isWin);
    byKickoff.set(post.kickoffMs, perGame);
  }

  const kickoffs = [...byKickoff.keys()].sort((a, b) => a - b);
  const units: TimelineUnit[] = [];

  for (const kickoffMs of kickoffs) {
    const posted = byKickoff.get(kickoffMs);
    if (!posted || posted.size === 0) continue;

    const slotGameIds = gamesByKickoff.get(kickoffMs) ?? [];
    if (slotGameIds.length >= 2) {
      const outcomes = [...posted.entries()]
        .map(([gameId, didWin]) => ({ gameId, didWin }))
        .sort((a, b) => a.gameId.localeCompare(b.gameId));
      units.push({ kind: "slot", kickoffMs, outcomes });
      continue;
    }

    for (const [gameId, isWin] of posted) {
      units.push({ kind: "single", gameId, isWin });
    }
  }

  return units;
}

function replayFootballStreakWithSlots(units: ReadonlyArray<TimelineUnit>): number {
  let curF = 0;

  for (const unit of units) {
    if (unit.kind === "single") {
      if (unit.isWin) curF = curF > 0 ? curF + 1 : 1;
      else curF = curF < 0 ? curF - 1 : -1;
      continue;
    }

    const entry = entryActiveFootball(curF);
    const slot = computeWcSlotStreakOutcome(entry, unit.outcomes);
    curF = slot.finalCurF;
  }

  return entryActiveFootball(curF);
}

async function loadWcGamesByKickoff(
  db: FirebaseFirestore.Firestore
): Promise<Map<number, string[]>> {
  const snap = await db.collection("games").where("league", "==", "wc").get();
  const out = new Map<number, string[]>();

  for (const doc of snap.docs) {
    const ms = resolveKickoffMsFromFields(doc.data());
    if (ms == null) continue;
    const list = out.get(ms) ?? [];
    list.push(doc.id);
    out.set(ms, list);
  }

  for (const [ms, ids] of out) {
    out.set(
      ms,
      [...ids].sort((a, b) => a.localeCompare(b))
    );
  }

  return out;
}

let wcGamesByKickoffCache: Map<number, string[]> | null = null;

async function getWcGamesByKickoff(
  db: FirebaseFirestore.Firestore
): Promise<Map<number, string[]>> {
  if (!wcGamesByKickoffCache) {
    wcGamesByKickoffCache = await loadWcGamesByKickoff(db);
  }
  return wcGamesByKickoffCache;
}

/** 同スロット試合を除き、キックオフ前までの football 連勝をリプレイする */
export async function replayFootballEntryBeforeKickoff(
  db: FirebaseFirestore.Firestore,
  uid: string,
  beforeKickoffMs: number,
  excludeGameIds: ReadonlySet<string>
): Promise<number> {
  const postsSnap = await db
    .collection("posts")
    .where("authorUid", "==", uid)
    .where("league", "==", "wc")
    .where("schemaVersion", "==", 2)
    .get();

  const gamesByKickoff = await getWcGamesByKickoff(db);
  const replayPosts: { gameId: string; isWin: boolean; kickoffMs: number }[] =
    [];

  for (const doc of postsSnap.docs) {
    const p = doc.data();
    const gameId = String(p.gameId ?? "").trim();
    if (!gameId || excludeGameIds.has(gameId)) continue;

    const gameSnap = await db.doc(`games/${gameId}`).get();
    if (!gameSnap.exists || gameSnap.get("final") !== true) continue;

    const kickoffMs = resolveKickoffMsFromFields(gameSnap.data());
    if (kickoffMs == null || kickoffMs >= beforeKickoffMs) continue;

    const stats = (p.stats ?? {}) as Record<string, unknown>;
    if (typeof stats.isWin !== "boolean") continue;

    replayPosts.push({ gameId, isWin: stats.isWin, kickoffMs });
  }

  const units = buildTimelineUnits(replayPosts, gamesByKickoff);
  return replayFootballStreakWithSlots(units);
}

/** テスト用: キャッシュをクリア */
export function clearWcGamesByKickoffCacheForTests(): void {
  wcGamesByKickoffCache = null;
}
