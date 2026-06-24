/** Top3 入場 — 3位→2位→1位の順（step 0 が最初） */
export function podiumEntranceStepForRank(rank: 1 | 2 | 3): number {
  return 3 - rank;
}

/** Web TopPodium cardVariants と同系 */
export const PODIUM_ENTRANCE_DELAY_BASE_S = 0.14;
export const PODIUM_ENTRANCE_DELAY_STEP_S = 0.14;

export function podiumEntranceDelayS(stepIndex: number): number {
  return PODIUM_ENTRANCE_DELAY_BASE_S + stepIndex * PODIUM_ENTRANCE_DELAY_STEP_S;
}

/** 1位カード表示後のグロー開始 */
export function podiumFirstPlaceGlowDelayS(): number {
  return podiumEntranceDelayS(podiumEntranceStepForRank(1)) + 0.35;
}

/** 1位カード表示後の王冠 */
export function podiumCrownDelayS(): number {
  return podiumEntranceDelayS(podiumEntranceStepForRank(1)) + 0.18;
}
