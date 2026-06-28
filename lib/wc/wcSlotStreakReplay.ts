/**
 * WC 連勝のスロット単位リプレイ（lib / scripts 用）。
 * functions/src/wc/wcSlotStreakEntry.ts と同期すること。
 */

import {
  computeWcSlotStreakOutcome,
  resolveKickoffMsFromFields,
  type WcKickoffSlotGameOutcome,
} from "./wcKickoffSlot";

export type WcSlotReplayPost = {
  gameId: string;
  isWin: boolean;
  kickoffMs: number;
  wcStage?: "qualifying" | "main" | null;
};

export type WcSlotReplayGame = {
  gameId: string;
  kickoffMs: number;
  league: string;
};

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
  posts: ReadonlyArray<WcSlotReplayPost>,
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

export function replayFootballStreakWithSlots(
  units: ReadonlyArray<TimelineUnit>
): {
  football: number;
  activeWinStreakFootball: number;
  perGameActive: Map<string, number>;
} {
  const perGameActive = new Map<string, number>();
  let curF = 0;

  for (const unit of units) {
    if (unit.kind === "single") {
      if (unit.isWin) curF = curF > 0 ? curF + 1 : 1;
      else curF = curF < 0 ? curF - 1 : -1;
      perGameActive.set(unit.gameId, curF > 0 ? curF : 0);
      continue;
    }

    const entry = entryActiveFootball(curF);
    const slot = computeWcSlotStreakOutcome(entry, unit.outcomes);
    curF = slot.finalCurF;
    for (const [gameId, active] of slot.perGameActiveWinStreak) {
      perGameActive.set(gameId, active);
    }
  }

  return {
    football: curF,
    activeWinStreakFootball: curF > 0 ? curF : 0,
    perGameActive,
  };
}

export function buildWcGamesByKickoff(
  games: ReadonlyArray<WcSlotReplayGame>
): Map<number, string[]> {
  const out = new Map<number, string[]>();
  for (const game of games) {
    if (String(game.league).toLowerCase() !== "wc") continue;
    const list = out.get(game.kickoffMs) ?? [];
    list.push(game.gameId);
    out.set(game.kickoffMs, list);
  }
  for (const [ms, ids] of out) {
    out.set(
      ms,
      [...ids].sort((a, b) => a.localeCompare(b))
    );
  }
  return out;
}

export function replayFootballActiveBeforeKickoff(
  posts: ReadonlyArray<WcSlotReplayPost>,
  gamesByKickoff: ReadonlyMap<number, string[]>,
  beforeKickoffMs: number,
  wcStage?: "qualifying" | "main" | null
): number {
  const filtered = posts.filter((p) => {
    if (p.kickoffMs >= beforeKickoffMs) return false;
    if (wcStage && p.wcStage && p.wcStage !== wcStage) return false;
    return true;
  });
  const units = buildTimelineUnits(filtered, gamesByKickoff);
  return replayFootballStreakWithSlots(units).activeWinStreakFootball;
}

export function kickoffMsFromGameFields(
  game: Record<string, unknown> | undefined
): number {
  return resolveKickoffMsFromFields(game) ?? 0;
}

export { buildTimelineUnits, type TimelineUnit };
