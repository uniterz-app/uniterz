/**
 * Space スプラッシュ — 暗いサイバー空間に白い UNITERZ ロゴが起動する。
 * 単一 progress(0→1 / 2300ms) で全レイヤを同期。
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
import {
  UNITERZ_LOGO_SPLASH_SPACE,
  UNITERZ_LOGO_SPLASH_VB_H,
  UNITERZ_LOGO_SPLASH_VB_W,
} from "../../../../../lib/units/uniterzLogoSplash";
import CyberBackgroundNative from "./components/CyberBackgroundNative";
import EnergyPulseNative from "./components/EnergyPulseNative";
import GlitchLogoNative from "./components/GlitchLogoNative";
import ParticleFieldNative from "./components/ParticleFieldNative";
import ScanLineNative from "./components/ScanLineNative";

const LOGO_ASPECT = UNITERZ_LOGO_SPLASH_VB_H / UNITERZ_LOGO_SPLASH_VB_W;
const TOTAL_MS = UNITERZ_LOGO_SPLASH_SPACE.totalMs;

type Props = {
  playKey?: number;
  forceStatic?: boolean;
  onComplete?: () => void;
};

export default function SplashScreenNative({
  playKey = 0,
  forceStatic = false,
  onComplete,
}: Props) {
  const reduceMotion = useReducedMotion();
  const staticPose = forceStatic || reduceMotion === true;
  const { width, height } = useWindowDimensions();
  const logoW = Math.min(width * 0.78, 360);
  const logoH = logoW * LOGO_ASPECT;

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
      { duration: TOTAL_MS, easing: Easing.linear },
      (finished) => {
        if (finished && onComplete) {
          runOnJS(onComplete)();
        }
      }
    );
  }, [playKey, staticPose, progress, onComplete]);

  return (
    <View
      style={styles.root}
      accessibilityLabel="読み込み中"
    >
      <CyberBackgroundNative
        progress={progress}
        width={width}
        height={height}
        staticPose={staticPose}
      />
      <ParticleFieldNative
        progress={progress}
        width={width}
        height={height}
        staticPose={staticPose}
      />
      <View style={styles.center} pointerEvents="none">
        <EnergyPulseNative
          progress={progress}
          size={logoW}
          staticPose={staticPose}
        />
        <View style={{ width: logoW, height: logoH }}>
          <GlitchLogoNative
            progress={progress}
            logoW={logoW}
            logoH={logoH}
            staticPose={staticPose}
          />
          <ScanLineNative
            progress={progress}
            logoW={logoW}
            logoH={logoH}
            staticPose={staticPose}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: UNITERZ_LOGO_SPLASH_SPACE.bgDeep,
    overflow: "hidden",
  },
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
});
