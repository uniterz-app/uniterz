import { useEffect, useState } from "react";
import {
  Easing,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

/** 初回入場アニメを切るまでの猶予（スクロールで遅延マウントされたヘッダが誤爆しないよう余裕） */
export const RESULT_HOME_ENTRANCE_ARM_MS = 4200;

const easeOutCubic = Easing.out(Easing.cubic);

// --- フィルター（控えめ） ---
const FILTER_DURATION_MS = 290;
const FILTER_FROM_Y = -8;

// --- 日付ヘッダー（scan panel） ---
const DAY_HEADER_FRAME_MS = 300;
const DAY_HEADER_RIGHT_EXTRA_DELAY_MS = 100;
const DAY_HEADER_DATE_SLIDE_X = 12;
const DAY_HEADER_BORDER_PULSE_MS = 160;
const DAY_HEADER_SETTLE_DELAY_MS = 380;

// --- 結果カード（analytics / scan / lock-in。試合一覧の bottom-up とは別系統） ---
export const RESULT_CARD_STAGGER_MS = 70;

const GRID_LEAD_MS = 0;
const GRID_FADE_MS = 180;

const SHELL_TY_FROM = 5;
const SHELL_OPACITY_MS = 400;
const SHELL_SCALEY_MS = 360;
const SHELL_TY_MS = 320;

const BODY_GATE_DELAY_MS = 100;
const BODY_GATE_MS = 300;

const JERSEY_DELAY_AFTER_CARD = 100;
const JERSEY_MS = 240;
const JERSEY_FROM_SCALE = 0.98;

const SCORE_DATE_DELAY_MS = 130;
const SCORE_PRED_DELAY_MS = 150;
const SCORE_PRED_MS = 260;
const FINAL_AFTER_PRED_MS = 100;

const SUB_BADGES_DELAY_MS = 200;
const HIT_MISS_DELAY_MS = 280;

const BAR_BASE_DELAY_MS = 260;
const BAR_ROW_STAGGER_MS = 42;
const BAR_GROW_MS = 300;
const BAR_TO_VALUE_GAP_MS = 40;

/** HIT 枠の一瞬ブライト */
const HIT_FRAME_FLASH_DELAY_AFTER_UI_MS = 200;
const HIT_FRAME_FLASH_IN_MS = 120;
const HIT_FRAME_FLASH_OUT_MS = 200;

export type ResultPostEntranceBadge =
  | "hit"
  | "perfect"
  | "miss"
  | "upset"
  | "streak"
  | null;

export type ResultStatRowEntranceMeta = {
  /** true のときバーは伸ばさず数値のみフェード */
  skipBarGrow: boolean;
};

/**
 * 結果タブ初回表示の入場アニメを一定時間だけ有効にする。
 */
export function useResultEntranceArmed(totalMs: number = RESULT_HOME_ENTRANCE_ARM_MS) {
  const [armed, setArmed] = useState(true);
  useEffect(() => {
    const id = setTimeout(() => setArmed(false), totalMs);
    return () => clearTimeout(id);
  }, [totalMs]);
  return armed;
}

/**
 * フィルター欄：控えめフェード＋短い上方向。
 */
export function useResultFilterBarEntrance(entranceEnabled: boolean, reduceMotion: boolean) {
  const skip = !entranceEnabled || reduceMotion;
  const opacity = useSharedValue(skip ? 1 : 0);
  const translateY = useSharedValue(skip ? 0 : FILTER_FROM_Y);

  useEffect(() => {
    if (skip) {
      opacity.value = 1;
      translateY.value = 0;
      return;
    }
    opacity.value = withTiming(1, { duration: FILTER_DURATION_MS, easing: easeOutCubic });
    translateY.value = withTiming(0, { duration: FILTER_DURATION_MS, easing: easeOutCubic });
  }, [skip]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return style;
}

/**
 * 日付ヘッダー：scan panel、cyan 枠パルス、右クラスタ遅延、ロック時の軽い settle。
 */
export function useResultDayHeaderEntrance(
  entranceEnabled: boolean,
  reduceMotion: boolean,
  sectionStaggerIndex: number
) {
  const skip = !entranceEnabled || reduceMotion;
  const baseDelay = sectionStaggerIndex * 40;

  const frameOpacity = useSharedValue(skip ? 1 : 0);
  const borderPulse = useSharedValue(0);
  const dateSlide = useSharedValue(skip ? 1 : 0);
  const rightOpacity = useSharedValue(skip ? 1 : 0);
  const lockSettle = useSharedValue(skip ? 1 : 0);

  useEffect(() => {
    if (skip) {
      frameOpacity.value = 1;
      borderPulse.value = 0;
      dateSlide.value = 1;
      rightOpacity.value = 1;
      lockSettle.value = 1;
      return;
    }
    frameOpacity.value = withDelay(
      baseDelay,
      withTiming(1, { duration: DAY_HEADER_FRAME_MS, easing: easeOutCubic })
    );
    borderPulse.value = withDelay(
      baseDelay,
      withSequence(
        withTiming(1, { duration: DAY_HEADER_BORDER_PULSE_MS * 0.5, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: DAY_HEADER_BORDER_PULSE_MS * 0.5, easing: Easing.in(Easing.quad) })
      )
    );
    dateSlide.value = withDelay(
      baseDelay,
      withTiming(1, { duration: DAY_HEADER_FRAME_MS + 24, easing: easeOutCubic })
    );
    rightOpacity.value = withDelay(
      baseDelay + DAY_HEADER_RIGHT_EXTRA_DELAY_MS,
      withTiming(1, { duration: 260, easing: easeOutCubic })
    );
    lockSettle.value = withDelay(
      baseDelay + DAY_HEADER_SETTLE_DELAY_MS,
      withSpring(1, { damping: 18, stiffness: 260, mass: 0.42 })
    );
  }, [skip, baseDelay]);

  const clipStyle = useAnimatedStyle(() => {
    const baseBorder = "rgba(34,211,238,0.55)";
    const peakBorder = "rgba(34,211,238,0.9)";
    const borderColor = interpolateColor(borderPulse.value, [0, 1], [baseBorder, peakBorder]);
    const settleScale = interpolate(lockSettle.value, [0, 1], [0.988, 1]);
    return {
      opacity: frameOpacity.value,
      borderColor,
      transform: [{ scale: settleScale }],
    };
  });

  const dateClusterStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: (1 - dateSlide.value) * -DAY_HEADER_DATE_SLIDE_X }],
    opacity: interpolate(dateSlide.value, [0, 0.12, 1], [0, 1, 1]),
  }));

  const rightClusterStyle = useAnimatedStyle(() => ({
    opacity: rightOpacity.value,
    transform: [{ scale: interpolate(rightOpacity.value, [0, 1], [0.99, 1]) }],
  }));

  return { clipStyle, dateClusterStyle, rightClusterStyle };
}

/**
 * 結果カード：グリッド先行 → シェル微動（scaleY）→ 本体フェード、ジャージはフェード＋微 scale、スコア lock-in、バー→数値。
 */
export function useResultPostCardEntrance({
  rowIndex,
  entranceEnabled,
  reduceMotion,
  badge,
  hasFinalScore,
  statRowMeta,
}: {
  rowIndex: number;
  entranceEnabled: boolean;
  reduceMotion: boolean;
  badge: ResultPostEntranceBadge;
  hasFinalScore: boolean;
  statRowMeta: readonly [ResultStatRowEntranceMeta, ResultStatRowEntranceMeta, ResultStatRowEntranceMeta];
}) {
  const skip = !entranceEnabled || reduceMotion;
  const isHit = badge === "hit" || badge === "perfect";
  const isMiss = badge === "miss";
  const d = rowIndex * RESULT_CARD_STAGGER_MS;

  const gridOp = useSharedValue(skip ? 1 : 0);
  const shellOp = useSharedValue(skip ? 1 : 0);
  const shellTy = useSharedValue(skip ? 0 : SHELL_TY_FROM);
  const shellScaleY = useSharedValue(skip ? 1 : 0.985);
  const bodyGate = useSharedValue(skip ? 1 : 0);

  const homeOp = useSharedValue(skip ? 1 : 0);
  const homeSc = useSharedValue(skip ? 1 : JERSEY_FROM_SCALE);
  const awayOp = useSharedValue(skip ? 1 : 0);
  const awaySc = useSharedValue(skip ? 1 : JERSEY_FROM_SCALE);

  const scoreDateOp = useSharedValue(skip ? 1 : 0);
  const predOp = useSharedValue(skip ? 1 : 0);
  const predSc = useSharedValue(skip ? 1 : 0.96);
  const finalOp = useSharedValue(skip || !hasFinalScore ? 1 : 0);
  const finalSc = useSharedValue(skip || !hasFinalScore ? 1 : 0.96);

  const subBadgeOp = useSharedValue(skip ? 1 : 0);
  const hitMissOp = useSharedValue(skip ? 1 : 0);
  const hitMissSc = useSharedValue(skip ? 1 : isHit ? 0.85 : isMiss ? 0.95 : 1);

  const bar0 = useSharedValue(skip ? 1 : 0);
  const bar1 = useSharedValue(skip ? 1 : 0);
  const bar2 = useSharedValue(skip ? 1 : 0);
  const val0 = useSharedValue(skip ? 1 : 0);
  const val1 = useSharedValue(skip ? 1 : 0);
  const val2 = useSharedValue(skip ? 1 : 0);

  const hitFrameFlash = useSharedValue(0);

  useEffect(() => {
    if (skip) {
      gridOp.value = 1;
      shellOp.value = 1;
      shellTy.value = 0;
      shellScaleY.value = 1;
      bodyGate.value = 1;
      homeOp.value = 1;
      homeSc.value = 1;
      awayOp.value = 1;
      awaySc.value = 1;
      scoreDateOp.value = 1;
      predOp.value = 1;
      predSc.value = 1;
      finalOp.value = 1;
      finalSc.value = 1;
      subBadgeOp.value = 1;
      hitMissOp.value = 1;
      hitMissSc.value = 1;
      bar0.value = 1;
      bar1.value = 1;
      bar2.value = 1;
      val0.value = 1;
      val1.value = 1;
      val2.value = 1;
      hitFrameFlash.value = 0;
      return;
    }

    const tGrid = d + GRID_LEAD_MS;
    gridOp.value = withDelay(tGrid, withTiming(1, { duration: GRID_FADE_MS, easing: easeOutCubic }));

    shellOp.value = withDelay(d, withTiming(1, { duration: SHELL_OPACITY_MS, easing: easeOutCubic }));
    shellTy.value = withDelay(d, withTiming(0, { duration: SHELL_TY_MS, easing: easeOutCubic }));
    shellScaleY.value = withDelay(d, withTiming(1, { duration: SHELL_SCALEY_MS, easing: easeOutCubic }));

    bodyGate.value = withDelay(
      d + BODY_GATE_DELAY_MS,
      withTiming(1, { duration: BODY_GATE_MS, easing: easeOutCubic })
    );

    const jt = d + JERSEY_DELAY_AFTER_CARD;
    homeOp.value = withDelay(jt, withTiming(1, { duration: JERSEY_MS, easing: easeOutCubic }));
    homeSc.value = withDelay(jt, withTiming(1, { duration: JERSEY_MS, easing: easeOutCubic }));
    awayOp.value = withDelay(jt, withTiming(1, { duration: JERSEY_MS, easing: easeOutCubic }));
    awaySc.value = withDelay(jt, withTiming(1, { duration: JERSEY_MS, easing: easeOutCubic }));

    scoreDateOp.value = withDelay(
      d + SCORE_DATE_DELAY_MS,
      withTiming(1, { duration: 220, easing: easeOutCubic })
    );

    const pt = d + SCORE_PRED_DELAY_MS;
    predOp.value = withDelay(pt, withTiming(1, { duration: SCORE_PRED_MS, easing: easeOutCubic }));
    predSc.value = withDelay(
      pt,
      withSequence(
        withTiming(1.02, { duration: 130, easing: Easing.out(Easing.cubic) }),
        withTiming(0.97, { duration: 90, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 110, easing: Easing.out(Easing.quad) })
      )
    );

    if (hasFinalScore) {
      const ft = pt + FINAL_AFTER_PRED_MS;
      finalOp.value = withDelay(ft, withTiming(1, { duration: 240, easing: easeOutCubic }));
      finalSc.value = withDelay(
        ft,
        withSequence(
          withTiming(1.012, { duration: 100, easing: Easing.out(Easing.cubic) }),
          withTiming(1, { duration: 130, easing: Easing.out(Easing.quad) })
        )
      );
    } else {
      finalOp.value = 1;
      finalSc.value = 1;
    }

    subBadgeOp.value = withDelay(
      d + SUB_BADGES_DELAY_MS,
      withTiming(1, { duration: 220, easing: easeOutCubic })
    );

    const hm = d + HIT_MISS_DELAY_MS;
    if (isHit) {
      hitMissOp.value = withDelay(hm, withTiming(1, { duration: 200, easing: easeOutCubic }));
      hitMissSc.value = withDelay(
        hm,
        withSpring(1, { damping: 14, stiffness: 280, mass: 0.5 })
      );
    } else if (isMiss) {
      hitMissOp.value = withDelay(hm, withTiming(1, { duration: 240, easing: easeOutCubic }));
      hitMissSc.value = withDelay(hm, withTiming(1, { duration: 220, easing: easeOutCubic }));
    } else {
      hitMissOp.value = 1;
      hitMissSc.value = 1;
    }

    const bars = [bar0, bar1, bar2] as const;
    const vals = [val0, val1, val2] as const;
    for (let i = 0; i < 3; i++) {
      const meta = statRowMeta[i];
      const tBar = d + BAR_BASE_DELAY_MS + i * BAR_ROW_STAGGER_MS;
      if (meta.skipBarGrow) {
        bars[i].value = 1;
        vals[i].value = withDelay(tBar, withTiming(1, { duration: 220, easing: easeOutCubic }));
      } else {
        bars[i].value = withDelay(tBar, withTiming(1, { duration: BAR_GROW_MS, easing: easeOutCubic }));
        vals[i].value = withDelay(
          tBar + BAR_GROW_MS + BAR_TO_VALUE_GAP_MS,
          withTiming(1, { duration: 200, easing: easeOutCubic })
        );
      }
    }

    const lastBarEnd =
      d + BAR_BASE_DELAY_MS + 2 * BAR_ROW_STAGGER_MS + (statRowMeta[2].skipBarGrow ? 0 : BAR_GROW_MS) + BAR_TO_VALUE_GAP_MS + 200;
    if (isHit) {
      const flashAt = Math.max(lastBarEnd, d + HIT_MISS_DELAY_MS + 120) + HIT_FRAME_FLASH_DELAY_AFTER_UI_MS;
      hitFrameFlash.value = withDelay(
        flashAt,
        withSequence(
          withTiming(1, { duration: HIT_FRAME_FLASH_IN_MS, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: HIT_FRAME_FLASH_OUT_MS, easing: Easing.in(Easing.quad) })
        )
      );
    } else {
      hitFrameFlash.value = 0;
    }
  }, [skip, d, hasFinalScore, isHit, isMiss, statRowMeta]);

  const cardShellMotionStyle = useAnimatedStyle(() => ({
    opacity: shellOp.value,
    transform: [{ translateY: shellTy.value }, { scaleY: shellScaleY.value }],
  }));

  const gridUnderlayStyle = useAnimatedStyle(() => ({
    opacity: gridOp.value,
  }));

  const cardBodyGateStyle = useAnimatedStyle(() => ({
    opacity: bodyGate.value,
  }));

  const homeJerseyMarkStyle = useAnimatedStyle(() => ({
    opacity: homeOp.value,
    transform: [{ scale: homeSc.value }],
  }));

  const awayJerseyMarkStyle = useAnimatedStyle(() => ({
    opacity: awayOp.value,
    transform: [{ scale: awaySc.value }],
  }));

  const homeTeamLabelStyle = useAnimatedStyle(() => ({
    opacity: homeOp.value,
  }));

  const awayTeamLabelStyle = useAnimatedStyle(() => ({
    opacity: awayOp.value,
  }));

  const scoreDateStyle = useAnimatedStyle(() => ({
    opacity: scoreDateOp.value,
  }));

  const predictedScoreStyle = useAnimatedStyle(() => ({
    opacity: predOp.value,
    transform: [{ scale: predSc.value }],
  }));

  const finalScoreStyle = useAnimatedStyle(() => ({
    opacity: finalOp.value,
    transform: [{ scale: finalSc.value }],
  }));

  const subBadgesStyle = useAnimatedStyle(() => ({
    opacity: subBadgeOp.value,
  }));

  const hitMissBadgeStyle = useAnimatedStyle(() => ({
    opacity: hitMissOp.value,
    transform: [{ scale: hitMissSc.value }],
  }));

  const statBarSlotStyle0 = useAnimatedStyle(() => ({
    transform: [{ scaleX: bar0.value }],
    transformOrigin: ["0%", "50%", 0],
  }));
  const statBarSlotStyle1 = useAnimatedStyle(() => ({
    transform: [{ scaleX: bar1.value }],
    transformOrigin: ["0%", "50%", 0],
  }));
  const statBarSlotStyle2 = useAnimatedStyle(() => ({
    transform: [{ scaleX: bar2.value }],
    transformOrigin: ["0%", "50%", 0],
  }));

  const statValueStyle0 = useAnimatedStyle(() => ({ opacity: val0.value }));
  const statValueStyle1 = useAnimatedStyle(() => ({ opacity: val1.value }));
  const statValueStyle2 = useAnimatedStyle(() => ({ opacity: val2.value }));

  const hitFrameFlashStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      hitFrameFlash.value,
      [0, 0.5, 1],
      ["rgba(250,204,21,0)", "rgba(250,204,21,0.5)", "rgba(250,204,21,0)"]
    ),
  }));

  const statBarSlotStyles = [statBarSlotStyle0, statBarSlotStyle1, statBarSlotStyle2] as const;
  const statValueStyles = [statValueStyle0, statValueStyle1, statValueStyle2] as const;

  return {
    cardShellMotionStyle,
    gridUnderlayStyle,
    cardBodyGateStyle,
    homeJerseyMarkStyle,
    awayJerseyMarkStyle,
    homeTeamLabelStyle,
    awayTeamLabelStyle,
    scoreDateStyle,
    predictedScoreStyle,
    finalScoreStyle,
    subBadgesStyle,
    hitMissBadgeStyle,
    statBarSlotStyles,
    statValueStyles,
    hitFrameFlashStyle,
    showHitFrameFlash: isHit && !skip,
  };
}
