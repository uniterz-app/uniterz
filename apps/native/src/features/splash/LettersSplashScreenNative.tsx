/**
 * Letters スプラッシュ —
 * 文字グループ（U〜Z）を左からスタガーで出現させる基本デモ。
 */
import { useEffect } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  type SharedValue,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Svg, { G, Path } from "react-native-svg";
import {
  UNITERZ_LOGO_LETTERS,
  UNITERZ_LOGO_SPLASH_SPACE,
  UNITERZ_LOGO_SPLASH_VB_H,
  UNITERZ_LOGO_SPLASH_VB_W,
  UNITERZ_LOGO_SPLASH_VIEWBOX,
  type UniterzLogoLetter,
} from "../../../../../lib/units/uniterzLogoSplash";

const LOGO_ASPECT = UNITERZ_LOGO_SPLASH_VB_H / UNITERZ_LOGO_SPLASH_VB_W;
const TOTAL_MS = 2200;
const LETTER_COUNT = UNITERZ_LOGO_LETTERS.length;

type Props = {
  playKey?: number;
  forceStatic?: boolean;
  onComplete?: () => void;
};

function LetterGlyph({
  letter,
  index,
  progress,
  logoW,
  logoH,
  staticPose,
}: {
  letter: UniterzLogoLetter;
  index: number;
  progress: SharedValue<number>;
  logoW: number;
  logoH: number;
  staticPose: boolean;
}) {
  const delay = (index / Math.max(LETTER_COUNT - 1, 1)) * 0.38;
  const t0 = 0.12 + delay;
  const t1 = t0 + 0.18;

  const style = useAnimatedStyle(() => {
    if (staticPose) {
      return {
        opacity: 1,
        transform: [{ translateY: 0 }, { scale: 1 }],
      };
    }
    const t = progress.value;
    const opacity = interpolate(t, [t0, t1], [0, 1], "clamp");
    const translateY = interpolate(t, [t0, t1], [14, 0], "clamp");
    const scale = interpolate(t, [t0, t1, t1 + 0.06], [0.88, 1.04, 1], "clamp");
    return {
      opacity,
      transform: [{ translateY }, { scale }],
    };
  });

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, style]}
      pointerEvents="none"
    >
      <Svg width={logoW} height={logoH} viewBox={UNITERZ_LOGO_SPLASH_VIEWBOX}>
        <G fill={UNITERZ_LOGO_SPLASH_SPACE.logoWhite}>
          {letter.paths.map((d, i) => (
            <Path key={`${letter.id}-${i}`} d={d} />
          ))}
        </G>
      </Svg>
    </Animated.View>
  );
}

export default function LettersSplashScreenNative({
  playKey = 0,
  forceStatic = false,
  onComplete,
}: Props) {
  const reduceMotion = useReducedMotion();
  const staticPose = forceStatic || reduceMotion === true;
  const { width } = useWindowDimensions();
  const logoW = Math.min(width * 0.82, 380);
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
    <View style={styles.root} accessibilityLabel="読み込み中">
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: UNITERZ_LOGO_SPLASH_SPACE.bgDeep },
        ]}
      />
      <View style={styles.center} pointerEvents="none">
        <View style={{ width: logoW, height: logoH }}>
          {UNITERZ_LOGO_LETTERS.map((letter, index) => (
            <LetterGlyph
              key={letter.id}
              letter={letter}
              index={index}
              progress={progress}
              logoW={logoW}
              logoH={logoH}
              staticPose={staticPose}
            />
          ))}
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
