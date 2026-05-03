import { Easing, FadeInDown } from "react-native-reanimated";

/**
 * Web `app/component/result/resultDetailEntrance.ts` の `RESULT_DETAIL_ENTRANCE` と同一値（ms に換算）。
 */
export const RESULT_DETAIL_ENTRANCE = {
  durationMs: 500,
  /** Web `ease: [0.22, 1, 0.36, 1]` */
  easeBezier: [0.22, 1, 0.36, 1] as const,
  translateY: 20,
  delayHeaderMs: 0,
  delayMarketMs: 80,
  delayDistributionMs: 170,
  delayStatsMs: 280,
  donutDrawDelayMs: 320,
} as const;

/** Web `MobileResultDetail` の `m.div` fadeUp（`useReducedMotion` 時は無アニメ） */
export function resultDetailSectionEnter(delayMs: number, reduceMotion: boolean) {
  if (reduceMotion) return undefined;
  const [x1, y1, x2, y2] = RESULT_DETAIL_ENTRANCE.easeBezier;
  return FadeInDown.duration(RESULT_DETAIL_ENTRANCE.durationMs)
    .delay(delayMs)
    .easing(Easing.bezier(x1, y1, x2, y2))
    .withInitialValues({
      transform: [{ translateY: RESULT_DETAIL_ENTRANCE.translateY }],
    });
}
