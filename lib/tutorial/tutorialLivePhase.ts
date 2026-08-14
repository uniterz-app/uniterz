/**
 * 本番画面上チュートリアルのフェーズ（sessionStorage）
 */

export type TutorialLivePhase =
  | "welcome"
  | "games"
  | "gamesPickup"
  | "gamesStats"
  | "results"
  | "rankings"
  | "groups"
  | "profile"
  | "horizon"
  | "done";

export const TUTORIAL_LIVE_PHASES: readonly TutorialLivePhase[] = [
  "welcome",
  "games",
  "gamesPickup",
  "gamesStats",
  "results",
  "rankings",
  "groups",
  "profile",
  "horizon",
  "done",
] as const;

/** 旧ライブツアーの値 → 新フェーズ */
const LEGACY_PHASE_MAP: Record<string, TutorialLivePhase> = {
  tapCard: "games",
  predictWait: "games",
  posted: "games",
  resolving: "games",
  gotoResults: "results",
  resultDetail: "results",
  gotoRankings: "rankings",
  gotoGroups: "groups",
  gotoProfile: "profile",
};

export const TUTORIAL_LIVE_PHASE_KEY = "uniterz:tutorialLivePhase:v1";
export const TUTORIAL_LIVE_PHASE_EVENT = "uniterz-tutorial-live-phase";

export function normalizeTutorialLivePhase(
  raw: string | null | undefined
): TutorialLivePhase | null {
  if (!raw) return null;
  if ((TUTORIAL_LIVE_PHASES as readonly string[]).includes(raw)) {
    return raw as TutorialLivePhase;
  }
  return LEGACY_PHASE_MAP[raw] ?? null;
}

export function readTutorialLivePhase(): TutorialLivePhase | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.sessionStorage.getItem(TUTORIAL_LIVE_PHASE_KEY);
    return normalizeTutorialLivePhase(v);
  } catch {
    return null;
  }
}

export function writeTutorialLivePhase(phase: TutorialLivePhase | null): void {
  if (typeof window === "undefined") return;
  try {
    if (!phase || phase === "done") {
      window.sessionStorage.removeItem(TUTORIAL_LIVE_PHASE_KEY);
    } else {
      window.sessionStorage.setItem(TUTORIAL_LIVE_PHASE_KEY, phase);
    }
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(TUTORIAL_LIVE_PHASE_EVENT));
}
