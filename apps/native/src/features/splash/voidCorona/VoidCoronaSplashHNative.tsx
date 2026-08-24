/**
 * 案 H — 収縮 → 粒子 U のまま（ソリッド塗りなし）
 */
import { useEffect } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import {
  Easing,
  runOnJS,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { getVoidCoronaConcept } from "../../../../../../lib/splash/voidCoronaConcepts";
import VoidCoronaFieldNative from "./VoidCoronaFieldNative";
import { voidCoronaUMarkSize } from "./VoidCoronaMarkNative";

const CONCEPT = getVoidCoronaConcept("H");

type Props = {
  playKey?: number;
  forceStatic?: boolean;
  onComplete?: () => void;
};

export default function VoidCoronaSplashHNative({
  playKey = 0,
  forceStatic = false,
  onComplete,
}: Props) {
  const reduceMotion = useReducedMotion();
  const staticPose = forceStatic || reduceMotion === true;
  const { width, height } = useWindowDimensions();
  const voidD = Math.min(width, height) * 0.336;
  const { markSize } = voidCoronaUMarkSize(width, voidD * 1.15);
  const progress = useSharedValue(staticPose ? 1 : 0);

  useEffect(() => {
    if (staticPose) {
      progress.value = 1;
      onComplete?.();
      return;
    }
    progress.value = 0;
    progress.value = withTiming(
      1,
      { duration: CONCEPT.totalMs, easing: Easing.bezier(0.18, 0.04, 0.12, 1) },
      (finished) => {
        if (finished && onComplete) runOnJS(onComplete)();
      }
    );
  }, [playKey, staticPose, progress, onComplete]);

  return (
    <View style={styles.root} accessibilityLabel="UNITERZ">
      <VoidCoronaFieldNative
        width={width}
        height={height}
        progress={progress}
        mode="formU"
        formUExit="hold"
        markSize={markSize}
        staticPose={staticPose}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000",
  },
});
