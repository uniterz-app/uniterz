import { useEffect } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import {
  LITE_MOTE_COUNT_NATIVE,
  RISING_MOTES_NATIVE,
  type RisingMoteSpec,
} from "./risingMotesNative";

type RisingMotesLayerNativeProps = {
  lite?: boolean;
};

function RisingMote({ mote, travelY }: { mote: RisingMoteSpec; travelY: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      mote.delayMs,
      withRepeat(
        withTiming(1, { duration: mote.durationMs, easing: Easing.linear }),
        -1,
        false
      )
    );
  }, [mote.delayMs, mote.durationMs, progress]);

  const style = useAnimatedStyle(() => {
    const y = interpolate(progress.value, [0, 1], [0, -travelY]);
    const x = interpolate(progress.value, [0, 0.5, 1], [mote.startX, mote.drift, mote.endX]);
    const opacity = interpolate(
      progress.value,
      [0, 0.33, 0.5, 0.66, 1],
      [0, mote.opacityPeak * 0.82, mote.opacityPeak, mote.opacityPeak * 0.55, 0]
    );
    return {
      opacity,
      transform: [{ translateX: x }, { translateY: y }],
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.mote,
        {
          left: `${mote.leftPct}%`,
          bottom: -8,
          width: mote.size,
          height: mote.size,
          borderRadius: mote.size / 2,
          backgroundColor: mote.background,
          shadowColor: mote.shadowColor,
          shadowOpacity: 0.9,
          shadowRadius: mote.shadowRadius,
          shadowOffset: { width: 0, height: 0 },
        },
        style,
      ]}
    />
  );
}

/** Web `RisingMotesLayer` 相当 */
export default function RisingMotesLayerNative({ lite = false }: RisingMotesLayerNativeProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const { height } = useWindowDimensions();
  const travelY = height * 0.56;

  if (reduceMotion) return null;

  const motes = lite
    ? RISING_MOTES_NATIVE.slice(0, LITE_MOTE_COUNT_NATIVE)
    : RISING_MOTES_NATIVE;

  return (
    <View pointerEvents="none" style={styles.layer}>
      {motes.map((mote) => (
        <RisingMote key={mote.id} mote={mote} travelY={travelY} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 6,
    overflow: "visible",
  },
  mote: {
    position: "absolute",
    elevation: 1,
  },
});
