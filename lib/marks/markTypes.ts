/**
 * MARK — 気になる予想者の個人リスト（フォローグラフではない）。
 * Firestore: users/{uid}/marks/{targetUid}
 * 被マーク: users/{uid}/markedBy/{fromUid}
 */

export const MARKS_SUBCOLLECTION = "marks";
export const MARKED_BY_SUBCOLLECTION = "markedBy";

export const MAX_MARKS_FREE = 20;
export const MAX_MARKS_PRO = 50;
/** @deprecated Free 上限。plan 付きは maxMarksForPlan を使う */
export const MAX_MARKS = MAX_MARKS_FREE;

export function maxMarksForPlan(isPro: boolean): number {
  return isPro ? MAX_MARKS_PRO : MAX_MARKS_FREE;
}

export function markedByCollectionPath(uid: string): string {
  return `users/${uid}/${MARKED_BY_SUBCOLLECTION}`;
}

export function markedByDocPath(targetUid: string, fromUid: string): string {
  return `${markedByCollectionPath(targetUid)}/${fromUid}`;
}

export type UserMark = {
  targetUid: string;
  handle: string;
  displayName: string;
  photoURL: string | null;
  createdAtMs: number;
};

export type UserMarkWrite = {
  targetUid: string;
  handle: string;
  displayName: string;
  photoURL: string | null;
};

export function marksCollectionPath(uid: string): string {
  return `users/${uid}/${MARKS_SUBCOLLECTION}`;
}

export function markDocPath(uid: string, targetUid: string): string {
  return `${marksCollectionPath(uid)}/${targetUid}`;
}

export function parseUserMark(
  targetUid: string,
  data: Record<string, unknown> | undefined
): UserMark | null {
  const uid = targetUid.trim();
  if (!uid) return null;
  const handle =
    typeof data?.handle === "string" ? data.handle.trim() : "";
  const displayName =
    (typeof data?.displayName === "string" && data.displayName.trim()) ||
    handle ||
    "User";
  const photoURL =
    typeof data?.photoURL === "string" && data.photoURL.trim()
      ? data.photoURL.trim()
      : null;
  const createdAt = data?.createdAt as
    | { toMillis?: () => number; seconds?: number }
    | number
    | null
    | undefined;
  let createdAtMs = 0;
  if (typeof data?.createdAtMs === "number" && Number.isFinite(data.createdAtMs)) {
    createdAtMs = data.createdAtMs;
  } else if (createdAt && typeof createdAt === "object" && typeof createdAt.toMillis === "function") {
    createdAtMs = createdAt.toMillis();
  } else if (createdAt && typeof createdAt === "object" && typeof createdAt.seconds === "number") {
    createdAtMs = createdAt.seconds * 1000;
  } else if (typeof createdAt === "number" && Number.isFinite(createdAt)) {
    createdAtMs = createdAt > 10_000_000_000 ? createdAt : createdAt * 1000;
  }
  return {
    targetUid: uid,
    handle,
    displayName,
    photoURL,
    createdAtMs,
  };
}
