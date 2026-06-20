/** Web `.skeleton-scan` 相当 — シアンの走査グラデーション */
import { useEffect, useState } from "react";
import { LayoutChangeEvent, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

type SkeletonScanNativeProps = {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function SkeletonScanNative({ children, style }: SkeletonScanNativeProps) {
  const [width, setWidth] = useState(0);
  const progress = useSharedValue(0);

  useEffect(() => {
    if (width <= 0) return;
    progress.value = 0;
    progress.value = withRepeat(
      withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
      -1,
      false
    );
  }, [progress, width]);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -width + progress.value * width * 2 }],
  }));

  const onLayout = (event: LayoutChangeEvent) => {
    setWidth(event.nativeEvent.layout.width);
  };

  return (
    <View style={[styles.root, style]} onLayout={onLayout}>
      {children}
      {width > 0 ? (
        <Animated.View pointerEvents="none" style={[styles.shimmerWrap, shimmerStyle]}>
          <LinearGradient
            colors={[
              "transparent",
              "rgba(34, 211, 238, 0.12)",
              "rgba(140, 240, 255, 0.2)",
              "rgba(34, 211, 238, 0.12)",
              "transparent",
            ]}
            locations={[0.3, 0.46, 0.5, 0.54, 0.7]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={[styles.shimmer, { width }]}
          />
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: "relative",
    overflow: "hidden",
  },
  shimmerWrap: {
    ...StyleSheet.absoluteFillObject,
  },
  shimmer: {
    flex: 1,
    width: "100%",
  },
});
