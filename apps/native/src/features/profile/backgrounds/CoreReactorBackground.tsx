/**
 * CoreReactorBackground — 中央やや下のエネルギーコア＋同心リング／セグメント弧。
 */
import { memo, useId, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Circle, Defs, Path, RadialGradient, Stop } from "react-native-svg";
import ProfileBgCanvas from "./ProfileBgCanvas";
import {
  buildArcPath,
  ConcentricRings,
  GlowPath,
  RadialSpokes,
  type RingSpec,
} from "./svgHelpers";
import { FUTURISTIC_BG_THEME as T } from "./theme";
import type { ProfileBgProps } from "./types";

function CoreReactorArt({ width: w, height: h }: { width: number; height: number }) {
  const uid = useId().replace(/:/g, "");
  const glowId = `reactorGlow-${uid}`;

  const geo = useMemo(() => {
    const cx = w * 0.5;
    const cy = h * 0.56;
    const maxR = Math.min(w, h) * 0.48;

    const rings: RingSpec[] = [
      { r: maxR * 0.18, color: T.cyan, stroke: 1.2, opacity: 0.55 },
      { r: maxR * 0.28, color: T.blue, stroke: 0.7, opacity: 0.32 },
      { r: maxR * 0.4, color: T.cyan, stroke: 0.9, opacity: 0.28, dasharray: "3 7" },
      { r: maxR * 0.52, color: T.purple, stroke: 0.7, opacity: 0.22 },
      { r: maxR * 0.66, color: T.blue, stroke: 0.6, opacity: 0.16, dasharray: "2 10" },
      { r: maxR * 0.8, color: T.cyan, stroke: 0.55, opacity: 0.12 },
      { r: maxR * 0.94, color: T.purple, stroke: 0.45, opacity: 0.08 },
      { r: maxR * 1.08, color: T.blue, stroke: 0.4, opacity: 0.05 },
    ];

    const arcs = [
      { r: maxR * 0.34, a0: -2.4, a1: -1.55, color: T.cyan, stroke: 2.2, opacity: 0.55 },
      { r: maxR * 0.34, a0: 0.35, a1: 1.05, color: T.blue, stroke: 1.8, opacity: 0.4 },
      { r: maxR * 0.46, a0: 1.4, a1: 2.35, color: T.purple, stroke: 1.6, opacity: 0.42 },
      { r: maxR * 0.58, a0: -0.9, a1: -0.25, color: T.cyan, stroke: 1.4, opacity: 0.35 },
      { r: maxR * 0.72, a0: 2.6, a1: 3.35, color: T.blue, stroke: 1.2, opacity: 0.28 },
      { r: maxR * 0.86, a0: -3.0, a1: -2.35, color: T.purple, stroke: 1.1, opacity: 0.22 },
    ];

    return { cx, cy, maxR, rings, arcs };
  }, [w, h]);

  const { cx, cy, maxR, rings, arcs } = geo;

  return (
    <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <Defs>
        <RadialGradient id={glowId} cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={T.cyan} stopOpacity="0.42" />
          <Stop offset="22%" stopColor={T.blue} stopOpacity="0.18" />
          <Stop offset="48%" stopColor={T.purple} stopOpacity="0.08" />
          <Stop offset="100%" stopColor={T.background} stopOpacity="0" />
        </RadialGradient>
      </Defs>

      <Circle cx={cx} cy={cy} r={maxR * 1.05} fill={`url(#${glowId})`} />

      <RadialSpokes
        cx={cx}
        cy={cy}
        count={16}
        rInner={maxR * 0.2}
        rOuter={maxR * 0.88}
        baseOpacity={0.1}
      />

      <ConcentricRings cx={cx} cy={cy} rings={rings} />

      {arcs.map((a, i) => (
        <GlowPath
          key={`arc-${i}`}
          d={buildArcPath(cx, cy, a.r, a.a0, a.a1)}
          color={a.color}
          stroke={a.stroke}
          opacity={a.opacity}
          glowScale={2.2}
          glowOpacityScale={0.22}
        />
      ))}

      <Circle cx={cx} cy={cy} r={maxR * 0.11} fill={T.cyan} fillOpacity={0.2} />
      <Circle cx={cx} cy={cy} r={maxR * 0.055} fill={T.cyan} fillOpacity={0.55} />
      <Circle cx={cx} cy={cy} r={maxR * 0.022} fill={T.white.soft} fillOpacity={0.85} />
      <Circle
        cx={cx}
        cy={cy}
        r={maxR * 0.14}
        fill="none"
        stroke={T.cyan}
        strokeWidth={1.5}
        strokeOpacity={0.4}
      />
      <Path
        d={buildArcPath(cx, cy, maxR * 0.155, 0.2, 2.4)}
        fill="none"
        stroke={T.purple}
        strokeWidth={0.7}
        strokeOpacity={0.25}
        strokeDasharray="2 5"
      />
    </Svg>
  );
}

function CoreReactorBackground({ width, height, style, children }: ProfileBgProps) {
  return (
    <ProfileBgCanvas
      width={width}
      height={height}
      style={style}
      overlay={children ? <View style={styles.overlay} pointerEvents="box-none">{children}</View> : null}
    >
      {(size) => <CoreReactorArt {...size} />}
    </ProfileBgCanvas>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, zIndex: 2 },
});

export default memo(CoreReactorBackground);
