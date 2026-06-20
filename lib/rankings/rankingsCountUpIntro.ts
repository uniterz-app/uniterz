const SESSION_KEY = "uniterz.rankingsCountUpIntro.v1";

/** このセッションでランキングのカウントアップ演出を既に見たか */
export function hasRankingsCountUpIntroPlayed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

/** 初回演出済みとして記録（プロフィールへ離脱時・Top3 カウント完了時） */
export function markRankingsCountUpIntroPlayed(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(SESSION_KEY, "1");
  } catch {
    /* sessionStorage 不可時は無視 */
  }
}
