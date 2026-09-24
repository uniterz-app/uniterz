/**
 * タブごとの初回ヒント既読（まとめてツアーではなく、各ページ初訪問時）。
 * 端末 localStorage。uid 付き。
 */

export type TutorialPageTipId =
  | "games"
  | "results"
  | "rankings"
  | "groups"
  | "profile";

export const TUTORIAL_PAGE_TIP_IDS: readonly TutorialPageTipId[] = [
  "games",
  "results",
  "rankings",
  "groups",
  "profile",
] as const;

const LS_PREFIX = "uniterz:tutorialPageTip:v1";
/** プロフィールは UNIT/キャリア手順追加のため版上げ（既存の短い既読を無効化） */
const PROFILE_TIP_PREFIX = "uniterz:tutorialPageTip:v2";

function tipKey(uid: string, tip: TutorialPageTipId): string {
  const prefix = tip === "profile" ? PROFILE_TIP_PREFIX : LS_PREFIX;
  return `${prefix}:${uid}:${tip}`;
}

export function readTutorialPageTipSeen(
  uid: string,
  tip: TutorialPageTipId
): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(tipKey(uid, tip)) === "1";
  } catch {
    return true;
  }
}

export function markTutorialPageTipSeen(
  uid: string | null | undefined,
  tip: TutorialPageTipId
): void {
  if (!uid || typeof window === "undefined") return;
  try {
    window.localStorage.setItem(tipKey(uid, tip), "1");
  } catch {
    /* ignore */
  }
}

export function clearTutorialPageTipsSeen(uid?: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (uid) {
      for (const tip of TUTORIAL_PAGE_TIP_IDS) {
        window.localStorage.removeItem(tipKey(uid, tip));
      }
      return;
    }
    const toRemove: string[] = [];
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const k = window.localStorage.key(i);
      if (
        k?.startsWith(`${LS_PREFIX}:`) ||
        k?.startsWith(`${PROFILE_TIP_PREFIX}:`)
      ) {
        toRemove.push(k);
      }
    }
    for (const k of toRemove) window.localStorage.removeItem(k);
  } catch {
    /* ignore */
  }
}

export function markAllTutorialPageTipsSeen(
  uid: string | null | undefined
): void {
  if (!uid) return;
  for (const tip of TUTORIAL_PAGE_TIP_IDS) {
    markTutorialPageTipSeen(uid, tip);
  }
}
