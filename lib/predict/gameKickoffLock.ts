/**
 * 投稿のキックオフロック — 常に live games ドキュメントを正とする（fail-closed）。
 */
import type { Firestore } from "firebase-admin/firestore";

function toMillis(v: unknown): number | null {
  if (v == null) return null;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (v instanceof Date) return v.getTime();
  if (typeof v === "object" && v && typeof (v as { toMillis?: () => number }).toMillis === "function") {
    return (v as { toMillis: () => number }).toMillis();
  }
  if (typeof v === "object" && v && typeof (v as { seconds?: number }).seconds === "number") {
    return (v as { seconds: number }).seconds * 1000;
  }
  return null;
}

export type GameKickoffLockResult =
  | { ok: true; startAtMillis: number; locked: boolean; status: string | null; final: boolean }
  | { ok: false; error: "game_not_found" | "invalid_startAt" };

export async function loadGameKickoffLock(
  db: Firestore,
  gameId: string
): Promise<GameKickoffLockResult> {
  const id = String(gameId ?? "").trim();
  if (!id) return { ok: false, error: "game_not_found" };
  const snap = await db.collection("games").doc(id).get();
  if (!snap.exists) return { ok: false, error: "game_not_found" };
  const g = snap.data() ?? {};
  const startAtMillis =
    toMillis(g.startAtJst) ?? toMillis(g.startAt) ?? null;
  if (startAtMillis == null) return { ok: false, error: "invalid_startAt" };
  const status = typeof g.status === "string" ? g.status : null;
  const final = g.final === true;
  const locked =
    Date.now() >= startAtMillis ||
    final ||
    status === "live" ||
    status === "final" ||
    status === "finished";
  return { ok: true, startAtMillis, locked, status, final };
}

/** posts の決定的 ID（1 user × 1 game × schema v2） */
export function deterministicPostV2Id(uid: string, gameId: string): string {
  return `v2_${uid}_${gameId}`;
}
