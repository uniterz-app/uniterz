/**
 * Web `SummaryCardReveal` に近い、概要ブロックの順番入場（軽量）。
 */
import { type ReactNode, useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

type Props = {
  /** 0 始まり。遅延 = index * staggerMs */
  index: number;
  /** 親が再計測したときに入場をやり直すキー */
  entranceKey: string | number;
  children: ReactNode;
  staggerMs?: number;
  durationMs?: number;
};

export default function ProfileOverviewEntranceBlock({
  index,
  entranceKey,
  children,
  staggerMs = 55,
  durationMs = 380,
}: Props) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(14);

  // React 19 / RN: コミット直後の共有値一括更新が performWorkOnRoot と重なると
  // 「Should not already be working」になるため、 Effect 内はマイクロタスクに逃がす。
  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      cancelAnimation(opacity);
      cancelAnimation(translateY);
      opacity.value = 0;
      translateY.value = 14;
      opacity.value = withDelay(
        index * staggerMs,
        withTiming(1, { duration: durationMs })
      );
      translateY.value = withDelay(
        index * staggerMs,
        withTiming(0, { duration: durationMs })
      );
    });
    return () => {
      cancelled = true;
      cancelAnimation(opacity);
      cancelAnimation(translateY);
    };
  }, [entranceKey, index, staggerMs, durationMs]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  // 幅は外側の View で確定。transform 付き Animated.View に任せると
  // 中身が短いカード（Result Drop 空状態）だけ縮むことがある。
  return (
    <View style={styles.stretch}>
      <Animated.View style={[styles.stretch, style]}>{children}</Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  stretch: {
    alignSelf: "stretch",
    width: "100%",
  },
});
