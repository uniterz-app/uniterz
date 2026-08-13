/**
 * Form スプラッシュ —
 * 確定ロゴ path に沿って線が走り、輪郭を形成したあと白塗りで確定する。
 * path 形状は変更しない。
 */
import { useEffect } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  type SharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Svg, { G, Path } from "react-native-svg";
import {
  UNITERZ_LOGO_SPLASH_LTR_ORDER,
  UNITERZ_LOGO_SPLASH_PATHS,
  UNITERZ_LOGO_SPLASH_SPACE,
  UNITERZ_LOGO_SPLASH_STROKE_LEN,
  UNITERZ_LOGO_SPLASH_VB_H,
  UNITERZ_LOGO_SPLASH_VB_W,
  UNITERZ_LOGO_SPLASH_VIEWBOX,
} from "../../../../../lib/units/uniterzLogoSplash";

const AnimatedPath = Animated.createAnimatedComponent(Path);

const LOGO_ASPECT = UNITERZ_LOGO_SPLASH_VB_H / UNITERZ_LOGO_SPLASH_VB_W;
const TOTAL_MS = 2400;
const STROKE_LEN = UNITERZ_LOGO_SPLASH_STROKE_LEN;
/** 先頭を走るトレーサーの長さ（viewBox 単位） */
const TRACE_LEN = 140;

type Props = {
  playKey?: number;
  forceStatic?: boolean;
  onComplete?: () => void;
};

function LogoFillPaths({ fill }: { fill: string }) {
  return (
    <G fill={fill}>
      {UNITERZ_LOGO_SPLASH_PATHS.map((d, i) => (
        <Path key={i} d={d} />
      ))}
    </G>
  );
}

/** 左→右の描画順に基づく遅延（0〜約 0.22） */
function delayForPathIndex(pathIndex: number): number {
  const order = (UNITERZ_LOGO_SPLASH_LTR_ORDER as readonly number[]).indexOf(
    pathIndex
  );
  const rank = order < 0 ? pathIndex : order;
  return (rank / Math.max(UNITERZ_LOGO_SPLASH_LTR_ORDER.length - 1, 1)) * 0.22;
}

/**
 * path に沿って走る線。
 * 1) 短いトレーサーが輪郭を走る
 * 2) 同じ path の輪郭ストロークが残る
 */
function PathAlongStroke({
  d,
  pathIndex,
  progress,
  staticPose,
  role,
}: {
  d: string;
  pathIndex: number;
  progress: SharedValue<number>;
  staticPose: boolean;
  role: "trace" | "outline" | "glow";
}) {
  const delay = delayForPathIndex(pathIndex);

  const animatedProps = useAnimatedProps(() => {
    if (staticPose) {
      return {
        strokeDashoffset: 0,
        opacity: role === "outline" ? 0 : 0,
      };
    }
    const t = progress.value;
    // 描画区間: 全体の ~0.12〜0.62（path ごとに遅延）
    const t0 = 0.1 + delay;
    const t1 = 0.58 + delay * 0.35;
    const draw = interpolate(t, [t0, t1], [0, 1], "clamp");

    if (role === "trace") {
      // 短いダッシュが path 上を移動（offset が減ると先端が進む）
      const opacity = interpolate(
        t,
        [t0, t0 + 0.02, t1 - 0.04, t1],
        [0, 1, 1, 0],
        "clamp"
      );
      return {
        strokeDashoffset: STROKE_LEN * (1 - draw),
        opacity,
      };
    }

    if (role === "glow") {
      const opacity = interpolate(
        t,
        [t0, t0 + 0.04, 0.68, 0.82],
        [0, 0.55, 0.45, 0],
        "clamp"
      );
      return {
        strokeDashoffset: STROKE_LEN * (1 - draw),
        opacity,
      };
    }

    // outline: 輪郭が残り、fill 確定で消える
    const opacity = interpolate(
      t,
      [t0, t0 + 0.03, 0.7, 0.84],
      [0, 1, 1, 0],
      "clamp"
    );
    return {
      strokeDashoffset: STROKE_LEN * (1 - draw),
      opacity,
    };
  });

  if (role === "trace") {
    return (
      <AnimatedPath
        d={d}
        fill="none"
        stroke={UNITERZ_LOGO_SPLASH_SPACE.accentBright}
        strokeWidth={4.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={[TRACE_LEN, STROKE_LEN]}
        animatedProps={animatedProps}
      />
    );
  }

  if (role === "glow") {
    return (
      <AnimatedPath
        d={d}
        fill="none"
        stroke={UNITERZ_LOGO_SPLASH_SPACE.accent}
        strokeWidth={7}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={[STROKE_LEN, STROKE_LEN]}
        animatedProps={animatedProps}
      />
    );
  }

  return (
    <AnimatedPath
      d={d}
      fill="none"
      stroke={UNITERZ_LOGO_SPLASH_SPACE.accentBright}
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={[STROKE_LEN, STROKE_LEN]}
      animatedProps={animatedProps}
    />
  );
}

export default function LineFormSplashScreenNative({
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

  const fillStyle = useAnimatedStyle(() => {
    if (staticPose) {
      return {
        opacity: 1,
        transform: [{ scale: 1 }],
      };
    }
    const t = progress.value;
    return {
      opacity: interpolate(t, [0.66, 0.82], [0, 1], "clamp"),
      transform: [
        {
          scale: interpolate(t, [0.66, 0.78, 0.88], [0.97, 1.02, 1], "clamp"),
        },
      ],
    };
  });

  const stageStyle = useAnimatedStyle(() => {
    if (staticPose) return { opacity: 1 };
    const t = progress.value;
    return {
      opacity: interpolate(t, [0.06, 0.14], [0, 1], "clamp"),
    };
  });

  const spotStyle = useAnimatedStyle(() => {
    if (staticPose) return { opacity: 0.1 };
    const t = progress.value;
    return {
      opacity: interpolate(t, [0, 0.15, 0.7, 1], [0, 0.18, 0.12, 0.08], "clamp"),
    };
  });

  return (
    <View style={styles.root} accessibilityLabel="読み込み中">
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: UNITERZ_LOGO_SPLASH_SPACE.bgDeep },
        ]}
      />
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          spotStyle,
          { backgroundColor: UNITERZ_LOGO_SPLASH_SPACE.accentBlue },
        ]}
        pointerEvents="none"
      />

      <View style={styles.center} pointerEvents="none">
        <Animated.View style={[{ width: logoW, height: logoH }, stageStyle]}>
          {/* path に沿うグロー → 輪郭 → トレーサー */}
          <Svg
            width={logoW}
            height={logoH}
            viewBox={UNITERZ_LOGO_SPLASH_VIEWBOX}
            style={StyleSheet.absoluteFill}
          >
            {UNITERZ_LOGO_SPLASH_PATHS.map((d, i) => (
              <PathAlongStroke
                key={`glow-${i}`}
                d={d}
                pathIndex={i}
                progress={progress}
                staticPose={staticPose}
                role="glow"
              />
            ))}
            {UNITERZ_LOGO_SPLASH_PATHS.map((d, i) => (
              <PathAlongStroke
                key={`outline-${i}`}
                d={d}
                pathIndex={i}
                progress={progress}
                staticPose={staticPose}
                role="outline"
              />
            ))}
            {UNITERZ_LOGO_SPLASH_PATHS.map((d, i) => (
              <PathAlongStroke
                key={`trace-${i}`}
                d={d}
                pathIndex={i}
                progress={progress}
                staticPose={staticPose}
                role="trace"
              />
            ))}
          </Svg>

          {/* 白塗り確定 */}
          <Animated.View style={[StyleSheet.absoluteFill, fillStyle]}>
            <Svg
              width={logoW}
              height={logoH}
              viewBox={UNITERZ_LOGO_SPLASH_VIEWBOX}
            >
              <LogoFillPaths fill={UNITERZ_LOGO_SPLASH_SPACE.logoWhite} />
            </Svg>
          </Animated.View>
        </Animated.View>
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
