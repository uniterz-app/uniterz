import { type ReactNode, useEffect, useRef } from "react";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

type Props = {
  index: number;
  entranceKey: string | number;
  children: ReactNode;
  staggerMs?: number;
  durationMs?: number;
};

/** 最初の画面に見える行だけ順番に出す（それより下は同時） */
const MAX_STAGGER_INDEX = 10;
/**
 * entranceKey の入場開始からこれ以上経って初めてマウントされた行
 * （スクロールで仮想リストが作り直した行）はアニメーションせずそのまま出す
 */
const ENTRANCE_WINDOW_MS = 1500;

/** entranceKey → 入場開始時刻 */
const entranceStartedAt = new Map<string, number>();
/** 直近に入場を始めた key。別の key から戻ってきたマウントは新しい入場として扱う */
let latestEntranceKey: string | null = null;

function startEntrance(key: string) {
  entranceStartedAt.set(key, Date.now());
  latestEntranceKey = key;
}

function isLateMount(key: string): boolean {
  const startedAt = entranceStartedAt.get(key);
  if (startedAt == null || latestEntranceKey !== key) {
    startEntrance(key);
    return false;
  }
  return Date.now() - startedAt > ENTRANCE_WINDOW_MS;
}

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
  if (skipRef.current == null) skipRef.current = reduced || isLateMount(key);
  const opacity = useSharedValue(skipRef.current ? 1 : 0);
  const translateY = useSharedValue(skipRef.current ? 0 : -10);
  const prevKeyRef = useRef(key);

  useEffect(() => {
    const keyChanged = prevKeyRef.current !== key;
    prevKeyRef.current = key;
    if (keyChanged) {
      /** マウント済みの行で切替（同じ行を使い回すリスト）→ 新しい入場として流し直す */
      if (latestEntranceKey !== key) startEntrance(key);
      skipRef.current = reduced;
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
