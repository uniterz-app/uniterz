import { useCallback, useEffect, useRef } from "react";
import type { ReactNode } from "react";
import type { RefObject } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

/** 一覧試合カードの `measureInWindow` 結果（ヒーロー遷移の起点） */
export type PredictHeroFromRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const SPRING = {
  damping: 20,
  stiffness: 320,
  mass: 0.85,
};

type PredictHeroOverlayProps = {
  fromRect: PredictHeroFromRect;
  /** 遷移先のプレビュー外枠 `View`（`toRect` 未指定時に使用） */
  targetRef?: RefObject<View | null>;
  /** 固定終点。戻りアニメ（プレビュー→一覧）で使用 */
  toRect?: PredictHeroFromRect | null;
  /** プレビュー `onLayout` のたびにインクリメントして再測定 */
  layoutTick: number;
  reduceMotion: boolean;
  onMorphComplete: () => void;
  /** 指定時は黒シェルの代わりにその見た目をモーフ対象にする（戻り時のカード再現用） */
  children?: ReactNode;
};

/**
 * 一覧カード矩形 → プレビュー矩形へ spring でモーフ。モーダル `root` 直下に置く（全画面座標）。
 */
export function PredictHeroOverlay({
  fromRect,
  targetRef,
  toRect,
  layoutTick,
  reduceMotion,
  onMorphComplete,
  children,
}: PredictHeroOverlayProps) {
  const progress = useSharedValue(0);
  const fromX = useSharedValue(fromRect.x);
  const fromY = useSharedValue(fromRect.y);
  const fromW = useSharedValue(fromRect.width);
  const fromH = useSharedValue(fromRect.height);
  const toX = useSharedValue(fromRect.x);
  const toY = useSharedValue(fromRect.y);
  const toW = useSharedValue(fromRect.width);
  const toH = useSharedValue(fromRect.height);
  const animationStartedRef = useRef(false);
  const didCompleteRef = useRef(false);

  const complete = useCallback(() => {
    if (didCompleteRef.current) return;
    didCompleteRef.current = true;
    onMorphComplete();
  }, [onMorphComplete]);

  const startIfNeeded = useCallback(() => {
    if (animationStartedRef.current) return;
    animationStartedRef.current = true;
    progress.value = 0;
    requestAnimationFrame(() => {
      progress.value = withSpring(1, SPRING, (finished) => {
        if (finished) {
          runOnJS(complete)();
        }
      });
    });
  }, [progress, complete]);

  useEffect(() => {
    fromX.value = fromRect.x;
    fromY.value = fromRect.y;
    fromW.value = fromRect.width;
    fromH.value = fromRect.height;
    toX.value = fromRect.x;
    toY.value = fromRect.y;
    toW.value = fromRect.width;
    toH.value = fromRect.height;
    progress.value = 0;
    animationStartedRef.current = false;
    didCompleteRef.current = false;
    if (reduceMotion) {
      complete();
    }
  }, [
    fromRect,
    reduceMotion,
    complete,
    progress,
    fromX,
    fromY,
    fromW,
    fromH,
    toX,
    toY,
    toW,
    toH,
  ]);

  const tryMeasureAndStart = useCallback(() => {
    if (reduceMotion) return;
    if (
      toRect &&
      toRect.width > 1 &&
      toRect.height > 1 &&
      Number.isFinite(toRect.x) &&
      Number.isFinite(toRect.y)
    ) {
      toX.value = toRect.x;
      toY.value = toRect.y;
      toW.value = toRect.width;
      toH.value = toRect.height;
      startIfNeeded();
      return;
    }
    if (!targetRef?.current) return;
    targetRef.current?.measureInWindow((x, y, w, h) => {
      if (w < 2 || h < 2) return;
      toX.value = x;
      toY.value = y;
      toW.value = w;
      toH.value = h;
      startIfNeeded();
    });
  }, [
    targetRef,
    toRect,
    reduceMotion,
    toX,
    toY,
    toW,
    toH,
    startIfNeeded,
  ]);

  useEffect(() => {
    if (reduceMotion) return;
    requestAnimationFrame(() => tryMeasureAndStart());
  }, [layoutTick, tryMeasureAndStart, reduceMotion]);

  /** measure が届かない端末向けに、一定時間後はプレビューを出す */
  useEffect(() => {
    if (reduceMotion) return;
    const t = setTimeout(() => {
      if (!didCompleteRef.current) {
        complete();
      }
    }, 600);
    return () => clearTimeout(t);
  }, [fromRect, reduceMotion, complete]);

  const ghostStyle = useAnimatedStyle(() => {
    const t = progress.value;
    const x = interpolate(t, [0, 1], [fromX.value, toX.value], Extrapolation.CLAMP);
    const y = interpolate(t, [0, 1], [fromY.value, toY.value], Extrapolation.CLAMP);
    const w = interpolate(t, [0, 1], [fromW.value, toW.value], Extrapolation.CLAMP);
    const h = interpolate(t, [0, 1], [fromH.value, toH.value], Extrapolation.CLAMP);
    const borderRadius = interpolate(t, [0, 1], [20, 16], Extrapolation.CLAMP);
    const opacity = interpolate(t, [0, 0.1, 0.88, 1], [1, 1, 0.5, 0], Extrapolation.CLAMP);
    return {
      position: "absolute" as const,
      left: x,
      top: y,
      width: w,
      height: h,
      borderRadius,
      opacity,
      overflow: "hidden" as const,
    };
  }, []);

  if (reduceMotion) {
    return null;
  }

  return (
    <Animated.View style={[StyleSheet.absoluteFillObject, { zIndex: 50 }]} pointerEvents="none">
      <Animated.View style={ghostStyle}>
        {children ?? (
          <>
            <LinearGradient
              pointerEvents="none"
              colors={[
                "rgba(14,18,28,0.96)",
                "rgba(10,13,22,0.9)",
                "rgba(7,10,17,0.95)",
              ]}
              locations={[0, 0.52, 1]}
              style={StyleSheet.absoluteFillObject}
            />
            <View
              pointerEvents="none"
              style={[
                StyleSheet.absoluteFillObject,
                { borderWidth: 1, borderColor: "rgba(255,255,255,0.12)" },
              ]}
            />
          </>
        )}
      </Animated.View>
    </Animated.View>
  );
}
