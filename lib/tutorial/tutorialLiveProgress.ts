/**
 * ライブツアーの進捗（ページ別ヒントでは進捗バーを出さない）
 */

import type { TutorialLivePhase } from "@/lib/tutorial/tutorialLivePhase";
import {
  isTutorialGamesSubstep,
  type TutorialGamesSubstep,
} from "@/lib/tutorial/tutorialGamesSubsteps";

/** @deprecated ページ別ヒント化後は常に null（互換のため残す） */
export const TUTORIAL_LIVE_PROGRESS_PHASES = [
  "welcome",
  "games",
  "rankings",
  "groups",
  "profile",
  "horizon",
] as const;

export type TutorialLiveProgressPhase =
  (typeof TUTORIAL_LIVE_PROGRESS_PHASES)[number];

export function tutorialLiveProgressIndex(
  _phase: TutorialLivePhase | null | undefined
): { current: number; total: number } | null {
  return null;
}

export function formatTutorialLiveProgress(
  _template: string,
  _phase: TutorialLivePhase | null | undefined
): string | null {
  return null;
}

export function formatTutorialGamesSubstepProgress(
  _template: string,
  _phase: TutorialGamesSubstep
): string | null {
  if (!isTutorialGamesSubstep(_phase)) return null;
  return null;
}
