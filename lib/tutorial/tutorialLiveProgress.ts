/**
 * ライブツアーの進捗（主要フェーズ数）
 */

import type { TutorialLivePhase } from "@/lib/tutorial/tutorialLivePhase";
import {
  isTutorialGamesSubstep,
  type TutorialGamesSubstep,
} from "@/lib/tutorial/tutorialGamesSubsteps";

/** ユーザーに見せる主要ステップ順 */
export const TUTORIAL_LIVE_PROGRESS_PHASES = [
  "welcome",
  "games",
  "results",
  "rankings",
  "groups",
  "profile",
  "horizon",
] as const;

export type TutorialLiveProgressPhase =
  (typeof TUTORIAL_LIVE_PROGRESS_PHASES)[number];

/** 試合タブ内サブステップは進捗バー上「試合」と同じ枠 */
function progressPhaseKey(
  phase: TutorialLivePhase
): TutorialLiveProgressPhase | null {
  if (phase === "gamesPickup" || phase === "gamesStats") return "games";
  if (
    (TUTORIAL_LIVE_PROGRESS_PHASES as readonly string[]).includes(phase)
  ) {
    return phase as TutorialLiveProgressPhase;
  }
  return null;
}

export function tutorialLiveProgressIndex(
  phase: TutorialLivePhase | null | undefined
): { current: number; total: number } | null {
  if (!phase || phase === "done") return null;
  const key = progressPhaseKey(phase);
  if (!key) return null;
  const idx = TUTORIAL_LIVE_PROGRESS_PHASES.indexOf(key);
  if (idx < 0) return null;
  return {
    current: idx + 1,
    total: TUTORIAL_LIVE_PROGRESS_PHASES.length,
  };
}

/** `progressLabel` テンプレ（`{current} / {total}`）を埋める */
export function formatTutorialLiveProgress(
  template: string,
  phase: TutorialLivePhase | null | undefined
): string | null {
  const idx = tutorialLiveProgressIndex(phase);
  if (!idx) return null;
  return template
    .replace("{current}", String(idx.current))
    .replace("{total}", String(idx.total));
}

/** 試合タブ内サブステップも主要進捗のみ（`2 / 7`）。` · 2/3` は出さない */
export function formatTutorialGamesSubstepProgress(
  template: string,
  phase: TutorialGamesSubstep
): string | null {
  if (!isTutorialGamesSubstep(phase)) return null;
  return formatTutorialLiveProgress(template, "games");
}
