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
};

/** 最初の画面に見える行だけ順番に出す（それより下は同時） */
const MAX_STAGGER_INDEX = 10;

/** ランキング行：上方向からフェードイン（Web TopPodium / restItem に近い） */
export default function RankingsListEntranceRowNative({
  index,
  entranceKey,
  children,
  staggerMs = 130,
  durationMs = 540,
}: Props) {
  const reduced = useReducedMotion();
  const key = String(entranceKey);
  const skipRef = useRef<boolean | null>(null);
  if (skipRef.current == null) {
    skipRef.current = reduced || !rankingsEntranceShouldPlay(key);
  }
  const opacity = useSharedValue(skipRef.current ? 1 : 0);
  const translateY = useSharedValue(skipRef.current ? 0 : -10);
  const prevKeyRef = useRef(key);

  useEffect(() => {
    const keyChanged = prevKeyRef.current !== key;
    prevKeyRef.current = key;
    if (keyChanged) {
      /** 同じ項目へ戻ったときは IN を流さない */
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
      cancelAnimation(opacity);
      cancelAnimation(translateY);
      opacity.value = 0;
      translateY.value = -10;
      const delay = Math.min(index, MAX_STAGGER_INDEX) * staggerMs;
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
  }, [durationMs, key, index, reduced, staggerMs]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={style}>{children}</Animated.View>;
}
