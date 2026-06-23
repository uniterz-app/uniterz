import { Easing } from "react-native-reanimated";

/** Web `TopPodium` cardVariants（Native は体感速度優先で短縮） */
export const RANKINGS_PODIUM_CARD_DELAY_BASE_MS = 50;
export const RANKINGS_PODIUM_CARD_DELAY_STEP_MS = 45;
export const RANKINGS_PODIUM_CARD_DURATION_MS = 280;
export const RANKINGS_PODIUM_CARD_FROM_Y = 8;

/** Web TopPodium Crown motion */
export const RANKINGS_CROWN_DELAY_MS = 120;
export const RANKINGS_CROWN_DURATION_MS = 200;
export const RANKINGS_CROWN_FROM_Y = 3;
export const RANKINGS_CROWN_FROM_SCALE = 0.94;

/** 4位以降リスト解放 — 1位カード開始から（フル完了を待たない） */
export const RANKINGS_REST_UNLOCK_AFTER_RANK1_MS = 140;

/** Web `anim.ts` restItem / restContainer */
export const RANKINGS_REST_ROW_DURATION_MS = 140;
export const RANKINGS_REST_ROW_STAGGER_MS = 12;
export const RANKINGS_REST_ROW_STAGGER_CAP_MS = 72;
export const RANKINGS_REST_ROW_FROM_Y = 4;
export const RANKINGS_REST_CONTAINER_DIM_OPACITY = 0.55;

export const rankingsPodiumEase = Easing.bezier(0.16, 0.82, 0.32, 1);
export const rankingsRestEase = Easing.bezier(0.22, 1, 0.36, 1);
export const rankingsCrownEase = Easing.bezier(0.22, 1, 0.36, 1);

export function rankingsPodiumCardDelayMs(stepIndex: number): number {
  return RANKINGS_PODIUM_CARD_DELAY_BASE_MS + stepIndex * RANKINGS_PODIUM_CARD_DELAY_STEP_MS;
}

export function rankingsRestRowDelayMs(rowIndex: number): number {
  return Math.min(rowIndex * RANKINGS_REST_ROW_STAGGER_MS, RANKINGS_REST_ROW_STAGGER_CAP_MS);
}
