/**
 * 試合タブ内の案内（一覧 → ピックアップ → STATS）
 */

import type { TutorialLivePhase } from "@/lib/tutorial/tutorialLivePhase";

export const TUTORIAL_GAMES_SUBSTEPS = [
  "games",
  "gamesPickup",
  "gamesStats",
] as const;

export type TutorialGamesSubstep = (typeof TUTORIAL_GAMES_SUBSTEPS)[number];

export function isTutorialGamesSubstep(
  phase: TutorialLivePhase | null | undefined
): phase is TutorialGamesSubstep {
  return (
    phase === "games" ||
    phase === "gamesPickup" ||
    phase === "gamesStats"
  );
}

/** 試合タブ上にコーチを出すフェーズ（welcome 含む） */
export function isTutorialOnGamesHome(
  phase: TutorialLivePhase | null | undefined
): boolean {
  return phase === "welcome" || isTutorialGamesSubstep(phase);
}

export function nextTutorialGamesSubstep(
  phase: TutorialGamesSubstep
): TutorialLivePhase {
  if (phase === "games") return "gamesPickup";
  if (phase === "gamesPickup") return "gamesStats";
  return "results";
}

export function prevTutorialGamesSubstep(
  phase: TutorialGamesSubstep
): TutorialLivePhase {
  if (phase === "gamesStats") return "gamesPickup";
  if (phase === "gamesPickup") return "games";
  return "welcome";
}
