/**
 * 試合タブ内の案内 — 試合カード → ピックアップの 2 段
 */

import type { TutorialLivePhase } from "@/lib/tutorial/tutorialLivePhase";

export const TUTORIAL_GAMES_SUBSTEPS = ["games", "gamesPickup"] as const;

export type TutorialGamesSubstep = (typeof TUTORIAL_GAMES_SUBSTEPS)[number];

/** welcome の「ヒントを見る」から入る最初の段 */
export const TUTORIAL_GAMES_FIRST_SUBSTEP: TutorialGamesSubstep = "games";

export function isTutorialGamesSubstep(
  phase: TutorialLivePhase | null | undefined
): phase is TutorialGamesSubstep {
  return phase === "games" || phase === "gamesPickup";
}

/** 試合タブ上にコーチを出すフェーズ（welcome 含む） */
export function isTutorialOnGamesHome(
  phase: TutorialLivePhase | null | undefined
): boolean {
  return phase === "welcome" || isTutorialGamesSubstep(phase);
}

/** 最後の段（ピックアップ）のあとはツアー連鎖なし（呼び出し側で phase クリア） */
export function nextTutorialGamesSubstep(
  phase: TutorialGamesSubstep
): TutorialLivePhase | null {
  return phase === "games" ? "gamesPickup" : null;
}
