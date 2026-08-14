/**
 * チュートリアルの経路（全体説明 / 新機能のみ）
 */

export type TutorialLiveTrack = "full" | "features";

export const TUTORIAL_LIVE_TRACK_KEY = "uniterz:tutorialLiveTrack:v1";

export function normalizeTutorialLiveTrack(
  raw: string | null | undefined
): TutorialLiveTrack | null {
  if (raw === "full" || raw === "features") return raw;
  return null;
}

export function readTutorialLiveTrack(): TutorialLiveTrack {
  if (typeof window === "undefined") return "full";
  try {
    return (
      normalizeTutorialLiveTrack(
        window.sessionStorage.getItem(TUTORIAL_LIVE_TRACK_KEY)
      ) ?? "full"
    );
  } catch {
    return "full";
  }
}

export function writeTutorialLiveTrack(track: TutorialLiveTrack | null): void {
  if (typeof window === "undefined") return;
  try {
    if (!track) {
      window.sessionStorage.removeItem(TUTORIAL_LIVE_TRACK_KEY);
      return;
    }
    window.sessionStorage.setItem(TUTORIAL_LIVE_TRACK_KEY, track);
  } catch {
    /* ignore */
  }
}
