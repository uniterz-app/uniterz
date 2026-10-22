import { type ReactNode, useEffect, useRef } from "react";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { rankingsEntranceShouldPlay } from "../../../../../lib/rankings/rankingsEntranceOnce";

type Props = {
  index: number;
  entranceKey: string | number;
  children: ReactNode;
  staggerMs?: number;
  durationMs?: number;
  /** この行数までは順番に出し、それより下は同時に出す */
  maxStaggerIndex?: number;
  /**
   * false のあいだは入場を始めない（常時マウントのタブが裏で入場を使い切らないように）。
   * true になった時点で入場するか決める。
   */
  active?: boolean;
};

/** ランキング行：上方向からフェードイン（Web TopPodium / restItem に近い） */
export default function RankingsListEntranceRowNative({
  index,
  entranceKey,
  children,
  staggerMs = 130,
  durationMs = 540,
  maxStaggerIndex = 10,
  active = true,
}: Props) {
  const reduced = useReducedMotion();
  const key = String(entranceKey);
  /** null = まだ決めていない（画面が表示されるまで待つ） */
  const skipRef = useRef<boolean | null>(null);
  if (skipRef.current == null && active) {
    skipRef.current = reduced || !rankingsEntranceShouldPlay(key);
  }
  const startHidden = skipRef.current !== true;
  const opacity = useSharedValue(startHidden ? 0 : 1);
  const translateY = useSharedValue(startHidden ? -10 : 0);
  const prevKeyRef = useRef(key);

  useEffect(() => {
    const keyChanged = prevKeyRef.current !== key;
    prevKeyRef.current = key;
    if (keyChanged) {
      /** 同じ項目へ戻ったときは IN を流さない */
      skipRef.current = active
        ? reduced || !rankingsEntranceShouldPlay(key)
        : null;
    }
    if (!active) {
      if (skipRef.current == null) {
        opacity.value = 0;
        translateY.value = -10;
      }
      return;
    }
    if (skipRef.current == null) {
      skipRef.current = reduced || !rankingsEntranceShouldPlay(key);
    }
    if (skipRef.current) {
      opacity.value = 1;
      translateY.value = 0;
      return;
    }

    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      /** 一度流したら、画面を離れて戻っても流し直さない */
      skipRef.current = true;
      cancelAnimation(opacity);
      cancelAnimation(translateY);
      opacity.value = 0;
      translateY.value = -10;
      const delay = Math.min(index, maxStaggerIndex) * staggerMs;
      opacity.value = withDelay(delay, withTiming(1, { duration: durationMs }));
      translateY.value = withDelay(delay, withTiming(0, { duration: durationMs }));
    });

    return () => {
      cancelled = true;
      cancelAnimation(opacity);
      cancelAnimation(translateY);
      /** 途中で外れたら次のマウントで止まった値から再開しないよう最終値に */
      opacity.value = 1;
      translateY.value = 0;
    };
  }, [active, durationMs, key, index, maxStaggerIndex, reduced, staggerMs]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={style}>{children}</Animated.View>;
}
