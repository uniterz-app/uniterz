/**
 * ライブツアーの進捗（主要フェーズ数）
 */

import type { TutorialLivePhase } from "@/lib/tutorial/tutorialLivePhase";

/** ユーザーに見せる主要ステップ順（goto* は到着先へマップ） */
export const TUTORIAL_LIVE_PROGRESS_PHASES = [
  "welcome",
  "tapCard",
  "predictWait",
  "posted",
  "resolving",
  "results",
  "resultDetail",
  "rankings",
  "groups",
  "profile",
  "horizon",
] as const;

export type TutorialLiveProgressPhase =
  (typeof TUTORIAL_LIVE_PROGRESS_PHASES)[number];

const GOTO_TO_PROGRESS: Partial<
  Record<TutorialLivePhase, TutorialLiveProgressPhase>
> = {
  gotoResults: "results",
  gotoRankings: "rankings",
  gotoGroups: "groups",
  gotoProfile: "profile",
};

export function tutorialLiveProgressIndex(
  phase: TutorialLivePhase | null | undefined
): { current: number; total: number } | null {
  if (!phase || phase === "done") return null;
  const key =
    GOTO_TO_PROGRESS[phase] ??
    (TUTORIAL_LIVE_PROGRESS_PHASES.includes(
      phase as TutorialLiveProgressPhase
    )
      ? (phase as TutorialLiveProgressPhase)
      : null);
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
