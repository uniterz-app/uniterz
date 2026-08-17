/**
 * 暗いサイバー空間背景 — グラデ・スポットライト・薄い回路/グリッド。
 * パララックス: 背景最遅、回路はやや速く。
 */
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  interpolate,
  type SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";
import Svg, { Circle, Defs, Line, RadialGradient, Rect, Stop } from "react-native-svg";
import { UNITERZ_LOGO_SPLASH_SPACE } from "../../../../../../lib/units/uniterzLogoSplash";

type Props = {
  progress: SharedValue<number>;
  width: number;
  height: number;
  staticPose: boolean;
};

type Dot = { x: number; y: number; r: number };
type Seg = { x1: number; y1: number; x2: number; y2: number };

/** 決定論シード（毎フレーム乱数禁止） */
function seeded(n: number) {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function buildDecor(w: number, h: number) {
  const dots: Dot[] = [];
  const segs: Seg[] = [];
  for (let i = 0; i < 28; i++) {
    dots.push({
      x: seeded(i * 3.1) * w,
      y: seeded(i * 7.7 + 1) * h,
      r: 0.6 + seeded(i * 2.2) * 1.2,
    });
  }
  for (let i = 0; i < 14; i++) {
    const x1 = seeded(i * 5.3 + 10) * w;
    const y1 = seeded(i * 9.1 + 11) * h;
    const horiz = seeded(i * 4.4 + 12) > 0.45;
    const len = 24 + seeded(i * 6.6 + 13) * 72;
    segs.push({
      x1,
      y1,
      x2: horiz ? x1 + len : x1,
      y2: horiz ? y1 : y1 + len * (0.4 + seeded(i) * 0.6),
    });
  }
  return { dots, segs };
}

export default function CyberBackgroundNative({
  progress,
  width,
  height,
  staticPose,
}: Props) {
  const decor = useMemo(() => buildDecor(width, height), [width, height]);
  const gridGap = Math.max(36, Math.min(width, height) * 0.08);

  const bgStyle = useAnimatedStyle(() => {
    if (staticPose) {
      return { transform: [{ scale: 1 }, { translateY: 0 }] };
    }
    const t = progress.value;
    const scale = interpolate(t, [0, 0.13, 1], [1.08, 1.0, 1.0]);
    const translateY = interpolate(t, [0, 0.13, 1], [6, 0, -2]);
    return { transform: [{ scale }, { translateY }] };
  });

  const spotStyle = useAnimatedStyle(() => {
    if (staticPose) return { opacity: 0.18 };
    const t = progress.value;
    return {
      opacity: interpolate(
        t,
        [0, 0.04, 0.13, 0.78, 1],
        [0, 0.06, 0.26, 0.18, 0.12]
      ),
    };
  });

  const circuitStyle = useAnimatedStyle(() => {
    if (staticPose) return { opacity: 0.08, transform: [{ scale: 1 }, { translateY: 0 }] };
    const t = progress.value;
    const opacity = interpolate(
      t,
      [0, 0.05, 0.13, 0.61, 0.7, 0.78, 1],
      [0, 0.04, 0.1, 0.09, 0.22, 0.1, 0.07]
    );
    const translateY = interpolate(t, [0, 1], [4, -6]);
    const scale = interpolate(t, [0, 1], [1.04, 0.98]);
    return { opacity, transform: [{ translateY }, { scale }] };
  });

  const vLines = useMemo(() => {
    const n = Math.ceil(width / gridGap) + 1;
    return Array.from({ length: n }, (_, i) => i * gridGap);
  }, [width, gridGap]);

  const hLines = useMemo(() => {
    const n = Math.ceil(height / gridGap) + 1;
    return Array.from({ length: n }, (_, i) => i * gridGap);
  }, [height, gridGap]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: UNITERZ_LOGO_SPLASH_SPACE.bgDeep },
        ]}
      />
      <Animated.View style={[StyleSheet.absoluteFill, bgStyle]}>
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: UNITERZ_LOGO_SPLASH_SPACE.bgMid, opacity: 0.5 },
          ]}
        />
        <Animated.View style={[StyleSheet.absoluteFill, spotStyle]}>
          <Svg width={width} height={height}>
            <Defs>
              <RadialGradient
                id="splashSpot"
                cx="50%"
                cy="26%"
                rx="52%"
                ry="40%"
              >
                <Stop
                  offset="0%"
                  stopColor={UNITERZ_LOGO_SPLASH_SPACE.accentBright}
                  stopOpacity={0.4}
                />
                <Stop
                  offset="45%"
                  stopColor={UNITERZ_LOGO_SPLASH_SPACE.accent}
                  stopOpacity={0.1}
                />
                <Stop
                  offset="100%"
                  stopColor={UNITERZ_LOGO_SPLASH_SPACE.accentBlue}
                  stopOpacity={0}
                />
              </RadialGradient>
            </Defs>
            <Rect
              x={0}
              y={0}
              width={width}
              height={height}
              fill="url(#splashSpot)"
            />
          </Svg>
        </Animated.View>
      </Animated.View>

      <Animated.View
        style={[StyleSheet.absoluteFill, circuitStyle]}
        pointerEvents="none"
      >
        <Svg width={width} height={height}>
          {vLines.map((x) => (
            <Line
              key={`gv-${x}`}
              x1={x}
              y1={0}
              x2={x}
              y2={height}
              stroke={UNITERZ_LOGO_SPLASH_SPACE.accent}
              strokeWidth={0.5}
              opacity={0.35}
            />
          ))}
          {hLines.map((y) => (
            <Line
              key={`gh-${y}`}
              x1={0}
              y1={y}
              x2={width}
              y2={y}
              stroke={UNITERZ_LOGO_SPLASH_SPACE.accent}
              strokeWidth={0.5}
              opacity={0.28}
            />
          ))}
          {decor.segs.map((s, i) => (
            <Line
              key={`seg-${i}`}
              x1={s.x1}
              y1={s.y1}
              x2={s.x2}
              y2={s.y2}
              stroke={UNITERZ_LOGO_SPLASH_SPACE.accentBright}
              strokeWidth={0.8}
              opacity={0.55}
            />
          ))}
          {decor.dots.map((d, i) => (
            <Circle
              key={`dot-${i}`}
              cx={d.x}
              cy={d.y}
              r={d.r}
              fill={UNITERZ_LOGO_SPLASH_SPACE.accentBright}
              opacity={0.7}
            />
          ))}
        </Svg>
      </Animated.View>
    </View>
  );
}
