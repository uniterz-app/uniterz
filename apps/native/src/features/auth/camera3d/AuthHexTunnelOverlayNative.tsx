/**
 * ランディング背景 — 金＋銀の二重枠。内側は透明で、色つきの点がパルスする。
 */
import { useEffect, useMemo } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  BlurMask,
  Canvas,
  Circle,
  Group,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Skia,
  vec,
} from "@shopify/react-native-skia";
import {
  cancelAnimation,
  Easing,
  useDerivedValue,
  useReducedMotion,
  useSharedValue,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";

const GOLD = "#C6A45E";
const SILVER = "#E6E8EC";
const INSET_X = 12;
/** セーフエリア外側の上下余白（見た目で同じ幅にする） */
const INSET_Y_SAFE = 54;
const GAP = 7;
const STROKE = 1.15;
const DOT_COLORS = [
  "#C6A45E",
  "#E6E8EC",
  "#00F5FF",
  "#7AF6FF",
  "#F4D19B",
  "#8A6A3A",
  "#D4A017",
  "#FF8A5B",
  "#B8C4CC",
  "#A78BFA",
  "#34D399",
];

type Speck = {
  x: number;
  y: number;
  r: number;
  a: number;
  color: string;
  period: number;
  phase: number;
};

function specks(width: number, height: number): Speck[] {
  const out: Speck[] = [];
  let s = 7;
  const rand = () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
  for (let i = 0; i < 160; i += 1) {
    out.push({
      x: rand() * width,
      y: rand() * height,
      r: 0.55 + rand() * 1.35,
      a: 0.28 + rand() * 0.55,
      color: DOT_COLORS[Math.floor(rand() * DOT_COLORS.length)]!,
      period: 1.4 + rand() * 4.2,
      phase: rand(),
    });
  }
  return out;
}

function PulseDot({
  speck,
  clock,
}: {
  speck: Speck;
  clock: SharedValue<number>;
}) {
  const opacity = useDerivedValue(() => {
    const wave =
      0.5 +
      0.5 * Math.sin((clock.value / speck.period + speck.phase) * Math.PI * 2);
    return speck.a * (0.18 + 0.82 * wave);
  });
  return (
    <Circle
      cx={speck.x}
      cy={speck.y}
      r={speck.r}
      color={speck.color}
      opacity={opacity}
    />
  );
}

type Meteor = {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  period: number;
  delay: number;
  fly: number;
  trail: string;
};

function meteors(width: number, height: number): Meteor[] {
  return [
    {
      x0: width * 0.04,
      y0: height * 0.14,
      x1: width * 0.78,
      y1: height * 0.42,
      period: 8.6,
      delay: 0.8,
      fly: 0.52,
      trail: "rgba(198,164,94,0.55)",
    },
    {
      x0: width * 0.96,
      y0: height * 0.16,
      x1: width * 0.28,
      y1: height * 0.4,
      period: 11.4,
      delay: 5.2,
      fly: 0.48,
      trail: "rgba(230,232,236,0.5)",
    },
  ];
}

function starProgress(clock: number, meteor: Meteor) {
  "worklet";
  const t = Math.max(0, clock - meteor.delay);
  const cycle = t / meteor.period;
  const u = cycle - Math.floor(cycle);
  const window = meteor.fly / meteor.period;
  if (u <= 0 || u >= window) return -1;
  const raw = u / window;
  return 1 - (1 - raw) * (1 - raw);
}

function lerp(a: number, b: number, t: number) {
  "worklet";
  return a + (b - a) * t;
}

function cometShape(
  hx: number,
  hy: number,
  tx: number,
  ty: number,
  headHalf: number,
  tailHalf: number,
) {
  "worklet";
  const dx = hx - tx;
  const dy = hy - ty;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const path = Skia.Path.Make();
  path.moveTo(hx + nx * headHalf, hy + ny * headHalf);
  path.lineTo(hx - nx * headHalf, hy - ny * headHalf);
  path.lineTo(tx - nx * tailHalf, ty - ny * tailHalf);
  path.lineTo(tx + nx * tailHalf, ty + ny * tailHalf);
  path.close();
  return path;
}

function ShootingStar({
  meteor,
  clock,
}: {
  meteor: Meteor;
  clock: SharedValue<number>;
}) {
  const head = useDerivedValue(() => {
    const p = starProgress(clock.value, meteor);
    if (p < 0) return vec(meteor.x0, meteor.y0);
    return vec(
      lerp(meteor.x0, meteor.x1, p),
      lerp(meteor.y0, meteor.y1, p),
    );
  });
  const tail = useDerivedValue(() => {
    const p = starProgress(clock.value, meteor);
    if (p < 0) return vec(meteor.x0, meteor.y0);
    const grow = Math.min(0.42, 0.08 + p * 0.55);
    const shrink = p > 0.72 ? (1 - p) / 0.28 : 1;
    const span = grow * shrink;
    return vec(
      lerp(meteor.x0, meteor.x1, Math.max(0, p - span)),
      lerp(meteor.y0, meteor.y1, Math.max(0, p - span)),
    );
  });
  const body = useDerivedValue(() =>
    cometShape(head.value.x, head.value.y, tail.value.x, tail.value.y, 1.05, 0.04),
  );
  const veil = useDerivedValue(() =>
    cometShape(head.value.x, head.value.y, tail.value.x, tail.value.y, 2.4, 0.2),
  );
  const opacity = useDerivedValue(() => {
    const p = starProgress(clock.value, meteor);
    if (p < 0) return 0;
    const fadeIn = Math.min(1, p / 0.06);
    const fadeOut = Math.min(1, (1 - p) / 0.2);
    return fadeIn * fadeOut;
  });
  const headX = useDerivedValue(() => head.value.x);
  const headY = useDerivedValue(() => head.value.y);

  return (
    <Group opacity={opacity}>
      <Path path={veil} style="fill">
        <LinearGradient
          start={tail}
          end={head}
          colors={["transparent", meteor.trail, "rgba(255,252,245,0.22)"]}
          positions={[0, 0.55, 1]}
        />
      </Path>
      <Path path={body} style="fill">
        <LinearGradient
          start={tail}
          end={head}
          colors={["transparent", meteor.trail, "#FFF8EC", "#FFFFFF"]}
          positions={[0, 0.42, 0.82, 1]}
        />
      </Path>
      <Circle cx={headX} cy={headY} r={9}>
        <RadialGradient
          c={head}
          r={9}
          colors={["rgba(255,252,245,0.42)", "rgba(198,164,94,0.1)", "transparent"]}
          positions={[0, 0.32, 1]}
        />
      </Circle>
      <Circle cx={headX} cy={headY} r={1.15} color="#FFFDF8" />
    </Group>
  );
}

export default function AuthHexTunnelOverlayNative() {
  const { width, height } = Dimensions.get("window");
  const insets = useSafeAreaInsets();
  const padX = INSET_X;
  const padTop = insets.top + INSET_Y_SAFE;
  const padBottom = insets.bottom + INSET_Y_SAFE;
  const reduceMotion = useReducedMotion();
  const clock = useSharedValue(0);
  const geo = useMemo(() => {
    const x = padX;
    const y = padTop;
    const w = width - padX * 2;
    const h = height - padTop - padBottom;
    return {
      gold: { x, y, w, h },
      silver: {
        x: x + GAP,
        y: y + GAP,
        w: w - GAP * 2,
        h: h - GAP * 2,
      },
      dust: specks(width, height),
      stars: meteors(width, height),
    };
  }, [height, padBottom, padTop, padX, width]);

  useEffect(() => {
    if (reduceMotion) {
      cancelAnimation(clock);
      clock.value = 0.25;
      return;
    }
    clock.value = 0;
    clock.value = withTiming(1e6, {
      duration: 1e6 * 1000,
      easing: Easing.linear,
    });
    return () => cancelAnimation(clock);
  }, [clock, reduceMotion]);

  return (
    <View style={styles.root} pointerEvents="none">
      <Canvas style={{ width, height }}>
        <Rect x={0} y={0} width={width} height={height} color="#000000" />
        <Group>
          {geo.dust.map((d, i) => (
            <PulseDot key={i} speck={d} clock={clock} />
          ))}
        </Group>
        {reduceMotion
          ? null
          : geo.stars.map((star, i) => (
              <ShootingStar key={`star-${i}`} meteor={star} clock={clock} />
            ))}
        <Rect
          x={geo.gold.x}
          y={geo.gold.y}
          width={geo.gold.w}
          height={geo.gold.h}
          color={GOLD}
          style="stroke"
          strokeWidth={STROKE * 1.6}
          opacity={0.42}
        >
          <BlurMask blur={4.2} style="solid" />
        </Rect>
        <Rect
          x={geo.gold.x}
          y={geo.gold.y}
          width={geo.gold.w}
          height={geo.gold.h}
          color={GOLD}
          style="stroke"
          strokeWidth={STROKE}
        />
        <Rect
          x={geo.silver.x}
          y={geo.silver.y}
          width={geo.silver.w}
          height={geo.silver.h}
          color={SILVER}
          style="stroke"
          strokeWidth={STROKE * 1.5}
          opacity={0.38}
        >
          <BlurMask blur={3.6} style="solid" />
        </Rect>
        <Rect
          x={geo.silver.x}
          y={geo.silver.y}
          width={geo.silver.w}
          height={geo.silver.h}
          color={SILVER}
          style="stroke"
          strokeWidth={STROKE}
        />
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 4,
  },
});
