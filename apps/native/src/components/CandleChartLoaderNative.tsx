/** Web `CandleChartLoader` 相当 */
import { useEffect, useState } from "react";
import { AccessibilityInfo, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import {
  CANDLE_CHART_LOADER_DURATION_MS,
  CANDLE_CHART_LOADER_SPECS,
  type CandleChartSpec,
} from "../../../../lib/loading/candleChartLoaderSpecs";

const CHART_HEIGHT = 80;
const CANDLE_WIDTH = 6;
const CANDLE_GAP = 4;
const CANDLE_HEIGHT = CHART_HEIGHT * 1.1;
const CANDLE_COLOR = "#ffffff";

type CandleChartLoaderNativeProps = {
  style?: StyleProp<ViewStyle>;
  /** スクリーンリーダー用（Web と同様、画面上には表示しない） */
  label?: string;
  /** フッター等のインライン表示向け（0.78〜0.9） */
  scale?: number;
};

function CandleBar({ spec, reducedMotion }: { spec: CandleChartSpec; reducedMotion: boolean }) {
  const progress = useSharedValue(reducedMotion ? 0.5 : 0);

  useEffect(() => {
    if (reducedMotion) {
      progress.value = 0.5;
      return;
    }
    progress.value = 0;
    progress.value = withDelay(
      spec.delaySec * 1000,
      withRepeat(
        withTiming(1, {
          duration: CANDLE_CHART_LOADER_DURATION_MS,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        false
      )
    );
  }, [progress, reducedMotion, spec.delaySec]);

  const animatedStyle = useAnimatedStyle(() => {
    if (reducedMotion) {
      return {
        opacity: 0.85,
        transform: [{ scaleY: 1 }],
      };
    }
    const opacity = interpolate(progress.value, [0, 0.1, 0.5, 0.7, 1], [0, 1, 1, 0, 0]);
    const scaleY = interpolate(progress.value, [0, 0.1, 0.5, 0.7, 1], [0, 1.5, 1.35, 1.5, 0]);
    return {
      opacity,
      transform: [
        { translateY: CANDLE_HEIGHT / 2 },
        { scaleY },
        { translateY: -CANDLE_HEIGHT / 2 },
      ],
    };
  });

  return (
    <View style={styles.candleSlot}>
      <Animated.View style={[styles.candleInner, animatedStyle]}>
        <View
          style={[
            styles.wick,
            {
              bottom: `${spec.wickBottomPct}%`,
              height: `${spec.wickHeightPct}%`,
            },
          ]}
        />
        <View
          style={[
            styles.body,
            {
              bottom: `${spec.bodyBottomPct}%`,
              height: `${spec.bodyHeightPct}%`,
            },
          ]}
        />
      </Animated.View>
    </View>
  );
}

export function CandleChartLoaderNative({
  style,
  label = "読み込み中",
  scale = 1,
}: CandleChartLoaderNativeProps) {
  const [reduceMotionEnabled, setReduceMotionEnabled] = useState(false);

  useEffect(() => {
    let alive = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (alive) setReduceMotionEnabled(enabled);
    });
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotionEnabled);
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);

  return (
    <View
      style={[styles.wrapper, style]}
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityLiveRegion="polite"
    >
      <View style={[styles.chart, { transform: [{ scale }] }]}>
        {CANDLE_CHART_LOADER_SPECS.map((spec, index) => (
          <CandleBar key={index} spec={spec} reducedMotion={reduceMotionEnabled} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  chart: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: CHART_HEIGHT,
    gap: CANDLE_GAP,
  },
  candleSlot: {
    width: CANDLE_WIDTH,
    height: CANDLE_HEIGHT,
    overflow: "visible",
  },
  candleInner: {
    width: "100%",
    height: "100%",
    position: "relative",
    shadowColor: CANDLE_COLOR,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 2.7,
    elevation: 2,
  },
  body: {
    position: "absolute",
    left: 0,
    width: "100%",
    backgroundColor: CANDLE_COLOR,
    borderWidth: 1,
    borderColor: CANDLE_COLOR,
  },
  wick: {
    position: "absolute",
    left: "63%",
    marginLeft: -0.5,
    width: 1,
    backgroundColor: CANDLE_COLOR,
  },
});
