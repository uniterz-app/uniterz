/**
 * ランキング1位枠と同じ光線。枠の線が動くのではなく、
 * 短いグラデの棒が各辺の上を滑って一周する。
 * 前後は弱く、中央が強く、必要なら消えたり浮き上がったりする。
 */
import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useAnimatedStyle,
  type SharedValue,
} from "react-native-reanimated";
import {
  RANK_FIRST_EDGE_H_BEAM_RATIO,
  RANK_FIRST_EDGE_H_GRADIENT,
  RANK_FIRST_LOOP_CORNER_BLEND,
} from "../../../../../../lib/rankings/rankFirstBorderEdgeScan";

export type HexPt = { x: number; y: number };

const CORE_H = 2;
const GLOW_H = 12;
const DEFAULT_LOCATIONS = [0, 0.25, 0.5, 0.75, 1] as const;
const TAPER_LOCATIONS = [0, 0.2, 0.5, 0.8, 1] as const;

function edgeBeam(
  d: number,
  peri: number,
  start: number,
  len: number,
  blend: number
): { pos: number; opacity: number } {
  "worklet";
  let bestPos = 0;
  let bestOpacity = 0;
  for (const shift of [-peri, 0, peri]) {
    const local = d + shift - start;
    if (local < -blend || local > len + blend) continue;
    const clamped = Math.max(0, Math.min(len, local));
    let opacity = 1;
    if (local < 0) opacity = 1 + local / blend;
    else if (local > len) opacity = 1 - (local - len) / blend;
    opacity = Math.max(0, Math.min(1, opacity));
    if (opacity > bestOpacity) {
      bestPos = clamped;
      bestOpacity = opacity;
    }
  }
  return { pos: bestPos, opacity: bestOpacity };
}

/** 一周のあいだに2回、消えてから浮き上がる */
function appearEnvelope(t: number): number {
  "worklet";
  const x = ((t % 1) + 1) % 1;
  const wave = 0.5 - 0.5 * Math.cos(x * Math.PI * 4);
  return Math.pow(wave, 1.55);
}

function EdgeCapsule({
  ax,
  ay,
  bx,
  by,
  edgeStart,
  edgeLen,
  peri,
  beamLen,
  progress,
  phase,
  lag,
  opacityMul,
  colors,
  locations,
  pulse,
  glow,
  glowColor,
}: {
  ax: number;
  ay: number;
  bx: number;
  by: number;
  edgeStart: number;
  edgeLen: number;
  peri: number;
  beamLen: number;
  progress: SharedValue<number>;
  phase: number;
  lag: number;
  opacityMul: number;
  colors: readonly [string, string, string, string, string];
  locations: readonly [number, number, number, number, number];
  pulse: boolean;
  glow: boolean;
  glowColor: string;
}) {
  const angle = Math.atan2(by - ay, bx - ax);
  const blend = Math.min(RANK_FIRST_LOOP_CORNER_BLEND, edgeLen * 0.4);
  const boxH = glow ? GLOW_H : CORE_H;

  const style = useAnimatedStyle(() => {
    const d = (((progress.value + phase - lag) % 1) + 1) % 1 * peri;
    const beam = edgeBeam(d, peri, edgeStart, edgeLen, blend);
    const env = pulse ? appearEnvelope(progress.value + phase) : 1;
    const t = edgeLen <= 0 ? 0 : beam.pos / edgeLen;
    const x = ax + (bx - ax) * t;
    const y = ay + (by - ay) * t;
    return {
      opacity: beam.opacity * env * opacityMul,
      transform: [
        { translateX: x - beamLen / 2 },
        { translateY: y - boxH / 2 },
        { rotate: `${angle}rad` },
        { scale: pulse ? 0.88 + 0.12 * env : 1 },
      ],
    };
  });

  const glowColors = [
    "transparent",
    glowColor,
    glowColor,
    glowColor,
    "transparent",
  ] as const;

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.beam, { width: beamLen, height: boxH }, style]}
    >
      {glow ? (
        <View
          style={[
            styles.glow,
            {
              shadowColor: glowColor,
            },
          ]}
        >
          <LinearGradient
            colors={[...glowColors]}
            locations={[...TAPER_LOCATIONS]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFillObject}
          />
        </View>
      ) : null}
      <View
        style={[
          styles.core,
          glow ? styles.coreLit : styles.coreRank,
          glow ? { top: (GLOW_H - CORE_H) / 2 } : StyleSheet.absoluteFillObject,
        ]}
      >
        <LinearGradient
          colors={[...colors]}
          locations={[...locations]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFillObject}
        />
      </View>
    </Animated.View>
  );
}

export function HexRankFirstEdgeScanNative({
  pts,
  progress,
  phase = 0,
  colors = RANK_FIRST_EDGE_H_GRADIENT,
  beamRatio = RANK_FIRST_EDGE_H_BEAM_RATIO,
  pulse = false,
  glow = false,
  glowColor = "rgba(0, 245, 255, 0.5)",
  locations = DEFAULT_LOCATIONS,
  trail = false,
}: {
  pts: HexPt[];
  progress: SharedValue<number>;
  phase?: number;
  colors?: readonly [string, string, string, string, string];
  beamRatio?: number;
  pulse?: boolean;
  glow?: boolean;
  glowColor?: string;
  locations?: readonly [number, number, number, number, number];
  trail?: boolean;
}) {
  if (pts.length < 3) return null;

  const edges = pts.map((a, i) => {
    const b = pts[(i + 1) % pts.length];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    return { ax: a.x, ay: a.y, bx: b.x, by: b.y, len };
  });
  const peri = edges.reduce((s, e) => s + e.len, 0);
  const beamLen = Math.max(22, edges[0]!.len * beamRatio);
  const trailLen = Math.max(28, edges[0]!.len * Math.min(0.92, beamRatio + 0.22));
  const trailColors = [
    "transparent",
    "rgba(0, 245, 255, 0.08)",
    "rgba(0, 245, 255, 0.32)",
    "rgba(0, 245, 255, 0.1)",
    "transparent",
  ] as const;

  const capsules = [
    { key: "head", lag: 0, len: beamLen, colors, opacityMul: 1, glow, pulse },
    ...(trail
      ? [
          {
            key: "trail",
            lag: 0.055,
            len: trailLen,
            colors: trailColors,
            opacityMul: 0.7,
            glow: true,
            pulse: false,
          },
        ]
      : []),
  ];

  let start = 0;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {edges.flatMap((e, i) => {
        const edgeStart = start;
        start += e.len;
        return capsules.map((cap) => (
          <EdgeCapsule
            key={`${cap.key}-${i}`}
            ax={e.ax}
            ay={e.ay}
            bx={e.bx}
            by={e.by}
            edgeStart={edgeStart}
            edgeLen={e.len}
            peri={peri}
            beamLen={cap.len}
            progress={progress}
            phase={phase}
            lag={cap.lag}
            opacityMul={cap.opacityMul}
            colors={cap.colors}
            locations={locations}
            pulse={cap.pulse}
            glow={cap.glow}
            glowColor={glowColor}
          />
        ));
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  beam: {
    position: "absolute",
    left: 0,
    top: 0,
    overflow: "visible",
  },
  glow: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.55,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 8,
  },
  core: {
    position: "absolute",
    left: 0,
    right: 0,
    height: CORE_H,
  },
  coreRank: {
    shadowColor: "rgba(184,255,60,0.55)",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 4,
  },
  coreLit: {
    shadowColor: "rgba(233, 253, 255, 0.5)",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
});
