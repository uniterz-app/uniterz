/**
 * チュートリアル予想の一時保存（リザルト画面で HIT/MISS を出すため）
 */

import type {
  TutorialGrade,
  TutorialPredictPick,
} from "@/lib/tutorial/tutorialNbaMock";

export const TUTORIAL_LIVE_PICK_KEY = "uniterz:tutorialLivePick:v1";

export type TutorialLivePickPayload = {
  pick: TutorialPredictPick;
  grade: TutorialGrade;
};

export function readTutorialLivePick(): TutorialLivePickPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(TUTORIAL_LIVE_PICK_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as TutorialLivePickPayload;
    if (!parsed?.pick || !parsed?.grade) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeTutorialLivePick(
  pick: TutorialPredictPick,
  grade: TutorialGrade
): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(
      TUTORIAL_LIVE_PICK_KEY,
      JSON.stringify({ pick, grade } satisfies TutorialLivePickPayload)
    );
  } catch {
    /* ignore */
  }
}

export function clearTutorialLivePick(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(TUTORIAL_LIVE_PICK_KEY);
  } catch {
    /* ignore */
  }
}
