import { useEffect, useMemo, useState } from "react";

type PendingPostLike = { startAtMillis?: number | null };

/** setTimeout の上限（約 24.8 日）を超えないよう、遠い試合は数時間ごとに再判定 */
const MAX_WAIT_MS = 6 * 60 * 60 * 1000;

/**
 * 未確定の予想のうち、キックオフ済み（または開始時刻不明）のものがあるか。
 * 全部が開始前なら、最も早いキックオフ時刻を返す。
 */
export function resolveResultPendingPollGate(
  pending: readonly PendingPostLike[],
  nowMs: number
): { pollNow: boolean; nextStartMs: number | null } {
  let nextStartMs: number | null = null;
  for (const post of pending) {
    const start = post.startAtMillis;
    if (typeof start !== "number" || !Number.isFinite(start)) {
      return { pollNow: true, nextStartMs: null };
    }
    if (start <= nowMs) return { pollNow: true, nextStartMs: null };
    if (nextStartMs == null || start < nextStartMs) nextStartMs = start;
  }
  return { pollNow: false, nextStartMs };
}

/**
 * 確定待ちポーリングを回すべきか。試合開始前の予想しか無い間は false
 * （開始前に確定することはないため）。キックオフ時刻になったら自動で true。
 */
export function useResultPendingPollActive(
  pending: readonly PendingPostLike[]
): boolean {
  const [nowMs, setNowMs] = useState(() => Date.now());
  const gate = useMemo(
    () => resolveResultPendingPollGate(pending, nowMs),
    [pending, nowMs]
  );

  useEffect(() => {
    if (gate.pollNow || gate.nextStartMs == null) return;
    const wait = Math.min(
      Math.max(gate.nextStartMs - Date.now(), 0) + 1000,
      MAX_WAIT_MS
    );
    const id = setTimeout(() => setNowMs(Date.now()), wait);
    return () => clearTimeout(id);
  }, [gate.pollNow, gate.nextStartMs]);

  return gate.pollNow;
}
