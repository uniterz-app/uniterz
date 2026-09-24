/**
 * 試合タブ内の案内 — ピックアップ説明のみ（簡略化）
 */

import type { TutorialLivePhase } from "@/lib/tutorial/tutorialLivePhase";

export const TUTORIAL_GAMES_SUBSTEPS = ["gamesPickup"] as const;

export type TutorialGamesSubstep = (typeof TUTORIAL_GAMES_SUBSTEPS)[number];

export function isTutorialGamesSubstep(
  phase: TutorialLivePhase | null | undefined
): phase is TutorialGamesSubstep {
  return phase === "gamesPickup";
}

/** 試合タブ上にコーチを出すフェーズ（welcome 含む） */
export function isTutorialOnGamesHome(
  phase: TutorialLivePhase | null | undefined
): boolean {
  return phase === "welcome" || isTutorialGamesSubstep(phase);
}

/** ピックアップ完了 → ツアー連鎖なし（呼び出し側で phase クリア） */
export function nextTutorialGamesSubstep(
  _phase: TutorialGamesSubstep
): TutorialLivePhase | null {
  return null;
}

export function prevTutorialGamesSubstep(
  _phase: TutorialGamesSubstep
): TutorialLivePhase {
  return "welcome";
}
