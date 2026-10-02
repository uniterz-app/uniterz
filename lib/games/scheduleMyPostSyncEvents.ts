/** リザルト側で投稿削除したとき、試合一覧の「予想済み」を外す */

import { removeScheduleMyPostFromCache } from "./scheduleMyPostsCache";

export const SCHEDULE_MY_POST_DELETED_EVENT = "uniterz:myPostDeleted";

export type ScheduleMyPostDeletedDetail = { gameId: string };

type Listener = (detail: ScheduleMyPostDeletedDetail) => void;

const listeners = new Set<Listener>();

/** Native / 共有 — CustomEvent が無い環境用 */
export function subscribeScheduleMyPostDeleted(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * キャッシュから外し、購読側へ通知。
 * Web では既存の window CustomEvent も飛ばす（ScheduleList 互換）。
 */
export function notifyScheduleMyPostDeleted(input: {
  gameId: string;
  uid?: string | null;
}): void {
  const gameId = String(input.gameId ?? "").trim();
  if (!gameId) return;
  const uid = typeof input.uid === "string" ? input.uid.trim() : "";
  if (uid) removeScheduleMyPostFromCache(uid, gameId);

  const detail: ScheduleMyPostDeletedDetail = { gameId };
  for (const listener of listeners) {
    try {
      listener(detail);
    } catch {
      // 購読側の例外で他リスナーを止めない
    }
  }

  if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") {
    try {
      window.dispatchEvent(
        new CustomEvent(SCHEDULE_MY_POST_DELETED_EVENT, { detail })
      );
    } catch {
      // jsdom 等
    }
  }
}
