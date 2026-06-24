/** WC 同時キックオフスロット — 連勝判定の共有ロジック（functions と同期） */

export type WcKickoffSlotGameOutcome = {
  gameId: string;
  didWin: boolean;
};

export function resolveKickoffMsFromFields(
  game?: {
    startAtJst?: unknown;
    startAt?: unknown;
    kickoffJst?: unknown;
  } | null
): number | null {
  if (!game) return null;
  for (const v of [game.startAtJst, game.startAt, game.kickoffJst]) {
    const ms = timestampLikeToMs(v);
    if (ms != null) return ms;
  }
  return null;
}

function timestampLikeToMs(v: unknown): number | null {
  if (v == null) return null;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (v instanceof Date) return v.getTime();
  if (typeof v === "object" && v !== null && "toDate" in v) {
    const d = (v as { toDate: () => Date }).toDate();
    if (d instanceof Date && !Number.isNaN(d.getTime())) return d.getTime();
  }
  if (typeof v === "object" && v !== null && "seconds" in v) {
    const sec = Number((v as { seconds: number }).seconds);
    if (Number.isFinite(sec)) return sec * 1000;
  }
  return null;
}

export function kickoffSlotKey(kickoffMs: number): string {
  return `wc-kickoff:${kickoffMs}`;
}

/** 同キックオフに2試合以上あるか */
export function hasConcurrentKickoffSlot(
  games: ReadonlyArray<{ kickoffMs: number | null }>
): boolean {
  const counts = new Map<number, number>();
  for (const g of games) {
    if (g.kickoffMs == null) continue;
    counts.set(g.kickoffMs, (counts.get(g.kickoffMs) ?? 0) + 1);
  }
  return [...counts.values()].some((n) => n >= 2);
}

export function groupByKickoffMs<T extends { kickoffMs: number | null }>(
  games: ReadonlyArray<T>
): Map<number, T[]> {
  const out = new Map<number, T[]>();
  for (const g of games) {
    if (g.kickoffMs == null) continue;
    const list = out.get(g.kickoffMs) ?? [];
    list.push(g);
    out.set(g.kickoffMs, list);
  }
  return out;
}

/**
 * WC 同時開催スロットの連勝結果。
 * - 投稿した試合がすべて勝ち → 試合数ぶん +1（gameId 昇順）
 * - 1 つでも外れ → activeWinStreak は 0、curF は -1
 */
export function computeWcSlotStreakOutcome(
  entryCurF: number,
  postedOutcomes: ReadonlyArray<WcKickoffSlotGameOutcome>
): {
  finalCurF: number;
  finalActiveWinStreak: number;
  perGameActiveWinStreak: Map<string, number>;
} {
  const sorted = [...postedOutcomes].sort((a, b) =>
    a.gameId.localeCompare(b.gameId)
  );

  const perGame = new Map<string, number>();
  const anyLoss = sorted.some((o) => !o.didWin);

  if (anyLoss) {
    for (const o of sorted) perGame.set(o.gameId, 0);
    return {
      finalCurF: -1,
      finalActiveWinStreak: 0,
      perGameActiveWinStreak: perGame,
    };
  }

  let curF = entryCurF;
  for (const o of sorted) {
    curF = curF > 0 ? curF + 1 : 1;
    perGame.set(o.gameId, curF);
  }

  return {
    finalCurF: curF,
    finalActiveWinStreak: curF > 0 ? curF : 0,
    perGameActiveWinStreak: perGame,
  };
}
