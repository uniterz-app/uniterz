import { useEffect } from "react";
import {
  Easing,
  cancelAnimation,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";

/** 複数カードの縦スタッガー（ms）— 枚ごとにも間を空ける（初回・リーグ切替のフル入場） */
export const GAME_CARD_ROW_STAGGER_MS = 100;
/** 日付変更のみの軽い入場：枚間隔 */
const LIGHT_ROW_STAGGER_MS = 40;
/** 日付変更のみの軽い入場：フェード＋わずかな bottom-up */
const LIGHT_ENTRANCE_MS = 200;

const CARD_DURATION_MS = 520;
/** 背景グリッドをカード本体より先に出す（リードをやや長めに） */
const GRID_LEAD_MS = 72;
const GRID_DURATION_MS = 280;
/** 枠線はカード transform と同時だと詰まるので少しずらす */
const BORDER_DELAY_MS = 36;
const BORDER_DURATION_MS = 480;
/** カード本体の動きが始まってから HOME ジャージ */
const JERSEY_HOME_DELAY_MS = 175;
/** HOME のあと AWAY（左右で順番に） */
const JERSEY_AWAY_AFTER_HOME_MS = 70;
const JERSEY_DURATION_MS = 400;
const CENTER_DELAY_MS = 330;
const DIVIDER_DELAY_MS = 430;
const DIVIDER_DURATION_MS = 380;
const FOOTER_DELAY_MS = 540;
const FOOTER_DURATION_MS = 420;

const easeOut = Easing.out(Easing.cubic);

export type GameCardEntranceVariant = "full" | "light";

export type GameCardListRowEntranceParams = {
  rowIndex: number;
  enteringAnimationEnabled: boolean;
  reduceMotion: boolean;
  /** `light` = 日付変更など：全体の短いフェード＋軽い上昇のみ */
  entranceVariant?: GameCardEntranceVariant;
  /** 枠線の最終色（一覧の predicted 枠） */
  isPredicted: boolean;
  /** 「予想をする」系の青 CTA か（控えめ glow 用） */
  showPredictPrimaryGlow: boolean;
};

/**
 * 試合一覧カードの cyber 風 bottom-up / depth reveal 入場。
 * 外枠は transform＋枠線のみ、フェードは内側ラッパーで子の opacity と乗算しすぎないようにする。
 */
export function useGameCardListRowEntrance({
  rowIndex,
  enteringAnimationEnabled,
  reduceMotion,
  entranceVariant = "full",
  isPredicted,
  showPredictPrimaryGlow,
}: GameCardListRowEntranceParams) {
  const isLight = entranceVariant === "light";
  const base = rowIndex * (isLight ? LIGHT_ROW_STAGGER_MS : GAME_CARD_ROW_STAGGER_MS);
  const skip = !enteringAnimationEnabled || reduceMotion;
  const startLight = !skip && isLight;

  const cardOpacity = useSharedValue(skip ? 1 : startLight ? 0.88 : 0);
  const cardTranslateY = useSharedValue(skip ? 0 : startLight ? 10 : 28);
  const cardScale = useSharedValue(skip ? 1 : startLight ? 1 : 0.96);

  const gridOpacity = useSharedValue(skip || startLight ? 1 : 0);
  const borderReveal = useSharedValue(skip || startLight ? 1 : 0);

  const homeJerseyTx = useSharedValue(skip || startLight ? 0 : -16);
  const homeJerseyOpacity = useSharedValue(skip || startLight ? 1 : 0);
  const homeJerseyScale = useSharedValue(skip || startLight ? 1 : 0.94);

  const awayJerseyTx = useSharedValue(skip || startLight ? 0 : 16);
  const awayJerseyOpacity = useSharedValue(skip || startLight ? 1 : 0);
  const awayJerseyScale = useSharedValue(skip || startLight ? 1 : 0.94);

  const centerOpacity = useSharedValue(skip || startLight ? 1 : 0);
  const centerScale = useSharedValue(skip || startLight ? 1 : 0.85);

  const dividerScaleX = useSharedValue(skip || startLight ? 1 : 0);

  const footerOpacity = useSharedValue(skip || startLight ? 1 : 0);
  const footerTranslateY = useSharedValue(skip || startLight ? 0 : 12);
  const footerGlow = useSharedValue(skip ? 1 : 0);

  const pressed = useSharedValue(0);

  useEffect(() => {
    if (skip) {
      cardOpacity.value = 1;
      cardTranslateY.value = 0;
      cardScale.value = 1;
      gridOpacity.value = 1;
      borderReveal.value = 1;
      homeJerseyTx.value = 0;
      homeJerseyOpacity.value = 1;
      homeJerseyScale.value = 1;
      awayJerseyTx.value = 0;
      awayJerseyOpacity.value = 1;
      awayJerseyScale.value = 1;
      centerOpacity.value = 1;
      centerScale.value = 1;
      dividerScaleX.value = 1;
      footerOpacity.value = 1;
      footerTranslateY.value = 0;
      footerGlow.value = showPredictPrimaryGlow ? 1 : 0;
      return;
    }

    /** 日付変更：内訳アニメは付けず、軽いフェード＋短い上昇のみ */
    if (isLight) {
      cardOpacity.value = withDelay(
        base,
        withTiming(1, { duration: LIGHT_ENTRANCE_MS, easing: easeOut })
      );
      cardTranslateY.value = withDelay(
        base,
        withTiming(0, { duration: LIGHT_ENTRANCE_MS + 24, easing: easeOut })
      );
      if (showPredictPrimaryGlow) {
        footerGlow.value = withDelay(
          base + 48,
          withTiming(1, { duration: 200, easing: easeOut })
        );
      }
      return () => {
        cancelAnimation(cardOpacity);
        cancelAnimation(cardTranslateY);
        cancelAnimation(cardScale);
        cancelAnimation(gridOpacity);
        cancelAnimation(borderReveal);
        cancelAnimation(homeJerseyTx);
        cancelAnimation(homeJerseyOpacity);
        cancelAnimation(homeJerseyScale);
        cancelAnimation(awayJerseyTx);
        cancelAnimation(awayJerseyOpacity);
        cancelAnimation(awayJerseyScale);
        cancelAnimation(centerOpacity);
        cancelAnimation(centerScale);
        cancelAnimation(dividerScaleX);
        cancelAnimation(footerOpacity);
        cancelAnimation(footerTranslateY);
        cancelAnimation(footerGlow);
      };
    }

    const gridStart = Math.max(0, base - GRID_LEAD_MS);
    gridOpacity.value = withDelay(
      gridStart,
      withTiming(1, { duration: GRID_DURATION_MS, easing: easeOut })
    );

    cardOpacity.value = withDelay(
      base,
      withTiming(1, { duration: CARD_DURATION_MS, easing: easeOut })
    );
    cardTranslateY.value = withDelay(
      base,
      withTiming(0, { duration: CARD_DURATION_MS, easing: easeOut })
    );
    cardScale.value = withDelay(
      base,
      withTiming(1, { duration: CARD_DURATION_MS, easing: easeOut })
    );

    borderReveal.value = withDelay(
      base + BORDER_DELAY_MS,
      withTiming(1, { duration: BORDER_DURATION_MS, easing: easeOut })
    );

    const jHome = base + JERSEY_HOME_DELAY_MS;
    homeJerseyTx.value = withDelay(
      jHome,
      withTiming(0, { duration: JERSEY_DURATION_MS, easing: easeOut })
    );
    homeJerseyOpacity.value = withDelay(
      jHome,
      withTiming(1, { duration: JERSEY_DURATION_MS * 0.72, easing: easeOut })
    );
    homeJerseyScale.value = withDelay(
      jHome,
      withTiming(1, { duration: JERSEY_DURATION_MS, easing: easeOut })
    );

    const jAway = jHome + JERSEY_AWAY_AFTER_HOME_MS;
    awayJerseyTx.value = withDelay(
      jAway,
      withTiming(0, { duration: JERSEY_DURATION_MS, easing: easeOut })
    );
    awayJerseyOpacity.value = withDelay(
      jAway,
      withTiming(1, { duration: JERSEY_DURATION_MS * 0.72, easing: easeOut })
    );
    awayJerseyScale.value = withDelay(
      jAway,
      withTiming(1, { duration: JERSEY_DURATION_MS, easing: easeOut })
    );

    const c0 = base + CENTER_DELAY_MS;
    centerOpacity.value = withDelay(c0, withTiming(1, { duration: 300, easing: easeOut }));
    centerScale.value = withDelay(
      c0,
      withSpring(1, { damping: 15, stiffness: 210, mass: 0.85 })
    );

    dividerScaleX.value = withDelay(
      base + DIVIDER_DELAY_MS,
      withTiming(1, { duration: DIVIDER_DURATION_MS, easing: easeOut })
    );

    const f0 = base + FOOTER_DELAY_MS;
    footerOpacity.value = withDelay(f0, withTiming(1, { duration: FOOTER_DURATION_MS, easing: easeOut }));
    footerTranslateY.value = withDelay(f0, withTiming(0, { duration: FOOTER_DURATION_MS, easing: easeOut }));
    if (showPredictPrimaryGlow) {
      footerGlow.value = withDelay(f0, withTiming(1, { duration: 580, easing: easeOut }));
    } else {
      footerGlow.value = 0;
    }

    return () => {
      cancelAnimation(cardOpacity);
      cancelAnimation(cardTranslateY);
      cancelAnimation(cardScale);
      cancelAnimation(gridOpacity);
      cancelAnimation(borderReveal);
      cancelAnimation(homeJerseyTx);
      cancelAnimation(homeJerseyOpacity);
      cancelAnimation(homeJerseyScale);
      cancelAnimation(awayJerseyTx);
      cancelAnimation(awayJerseyOpacity);
      cancelAnimation(awayJerseyScale);
      cancelAnimation(centerOpacity);
      cancelAnimation(centerScale);
      cancelAnimation(dividerScaleX);
      cancelAnimation(footerOpacity);
      cancelAnimation(footerTranslateY);
      cancelAnimation(footerGlow);
    };
  }, [skip, base, isLight, showPredictPrimaryGlow]);

  const shellTransformStyle = useAnimatedStyle(() => {
    const pressS = interpolate(pressed.value, [0, 1], [1, 0.988]);
    return {
      transform: [
        { translateY: cardTranslateY.value },
        { scale: cardScale.value * pressS },
      ],
    };
  });

  const shellOpacityStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
  }));

  const borderStyle = useAnimatedStyle(() => {
    const t = borderReveal.value;
    const borderColor = isPredicted
      ? interpolateColor(t, [0, 1], ["rgba(148,163,184,0)", "rgba(148,163,184,0.46)"])
      : interpolateColor(t, [0, 1], ["rgba(255,255,255,0)", "rgba(255,255,255,0.12)"]);
    return { borderColor };
  });

  const gridLayerStyle = useAnimatedStyle(() => ({
    opacity: gridOpacity.value,
  }));

  const homeJerseyStyle = useAnimatedStyle(() => ({
    opacity: homeJerseyOpacity.value,
    transform: [
      { translateX: homeJerseyTx.value },
      { scale: homeJerseyScale.value },
    ],
  }));

  const awayJerseyStyle = useAnimatedStyle(() => ({
    opacity: awayJerseyOpacity.value,
    transform: [
      { translateX: awayJerseyTx.value },
      { scale: awayJerseyScale.value },
    ],
  }));

  const centerBlockStyle = useAnimatedStyle(() => ({
    opacity: centerOpacity.value,
    transform: [{ scale: centerScale.value }],
  }));

  const dividerStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: dividerScaleX.value }],
    /** Reanimated / Android は [x, y, z] の 3 要素必須（z は数値） */
    transformOrigin: ["0%", "50%", 0],
  }));

  const footerStyle = useAnimatedStyle(() => {
    const glow = showPredictPrimaryGlow
      ? {
          shadowColor: "rgba(56,189,248,0.95)",
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: footerGlow.value * 0.24,
          shadowRadius: footerGlow.value * 10,
          elevation: footerGlow.value * 4,
        }
      : {};
    return {
      opacity: footerOpacity.value,
      transform: [{ translateY: footerTranslateY.value }],
      ...glow,
    };
  });

  return {
    pressed,
    shellTransformStyle,
    shellOpacityStyle,
    borderStyle,
    gridLayerStyle,
    homeJerseyStyle,
    awayJerseyStyle,
    centerBlockStyle,
    dividerStyle,
    footerStyle,
  };
}
