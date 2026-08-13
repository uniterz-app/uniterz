/**
 * 本番画面上チュートリアルのフェーズ（sessionStorage）
 */

export type TutorialLivePhase =
  | "welcome"
  | "tapCard"
  | "predictWait"
  | "posted"
  | "resolving"
  | "gotoResults"
  | "results"
  | "resultDetail"
  | "gotoRankings"
  | "rankings"
  | "gotoGroups"
  | "groups"
  | "gotoProfile"
  | "profile"
  | "horizon"
  | "done";

export const TUTORIAL_LIVE_PHASE_KEY = "uniterz:tutorialLivePhase:v1";

export function readTutorialLivePhase(): TutorialLivePhase | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.sessionStorage.getItem(TUTORIAL_LIVE_PHASE_KEY);
    return (v as TutorialLivePhase) || null;
  } catch {
    return null;
  }
}

export function writeTutorialLivePhase(phase: TutorialLivePhase | null): void {
  if (typeof window === "undefined") return;
  try {
    if (!phase || phase === "done") {
      window.sessionStorage.removeItem(TUTORIAL_LIVE_PHASE_KEY);
      return;
    }
    window.sessionStorage.setItem(TUTORIAL_LIVE_PHASE_KEY, phase);
  } catch {
    /* ignore */
  }
}
