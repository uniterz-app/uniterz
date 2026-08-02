/**
 * GalacticNebulaBackground — グラデ＋半透明シェイプのみの宇宙ネビュラ。
 * purple / blue / magenta の雲レイヤー、星、細い星座線。中央は可読性を残す。
 */
import { memo, useId, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import Svg, {
  Circle,
  Defs,
  Ellipse,
  Line,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";
import ProfileBgCanvas from "./ProfileBgCanvas";
import { generateStars, StarsLayer } from "./svgHelpers";
import { FUTURISTIC_BG_THEME as T } from "./theme";
import type { ProfileBgProps } from "./types";

type Link = { a: number; b: number };

function GalacticNebulaArt({ width: w, height: h }: { width: number; height: number }) {
  const uid = useId().replace(/:/g, "");
  const ids = {
    purpleA: `gnPurpA-${uid}`,
    purpleB: `gnPurpB-${uid}`,
    blueA: `gnBlueA-${uid}`,
    blueB: `gnBlueB-${uid}`,
    magentaA: `gnMagA-${uid}`,
    magentaB: `gnMagB-${uid}`,
    mist: `gnMist-${uid}`,
    centerClear: `gnClear-${uid}`,
  };

  const { stars, links } = useMemo(() => {
    const stars = generateStars({
      width: w,
      height: h,
      count: 48,
      seed: 91,
      avoidCenter: true,
      colors: [T.white.soft, T.purple, T.blue, T.magenta, T.cyan],
    });

    const edgeIdx = stars
      .map((s, i) => ({ s, i }))
      .filter(
        ({ s }) =>
          s.x < w * 0.28 ||
          s.x > w * 0.72 ||
          s.y < h * 0.26 ||
          s.y > h * 0.74,
      )
      .sort((a, b) => a.s.x + a.s.y - (b.s.x + b.s.y));

    const links: Link[] = [];
    const take = edgeIdx.slice(0, 14);
    for (let i = 0; i < take.length - 1; i++) {
      if (i % 2 === 0 || i % 3 === 0) {
        links.push({ a: take[i].i, b: take[i + 1].i });
      }
    }
    if (take.length >= 6) {
      links.push({ a: take[0].i, b: take[2].i });
      links.push({ a: take[2].i, b: take[5].i });
      links.push({ a: take[take.length - 1].i, b: take[take.length - 3].i });
    }

    return { stars, links };
  }, [w, h]);

  const m = Math.min(w, h);

  return (
    <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <Defs>
        {/* 雲レイヤー用 radial（紫 / 青 / マゼンタ） */}
        <RadialGradient id={ids.purpleA} cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={T.purple} stopOpacity="0.38" />
          <Stop offset="45%" stopColor={T.purple} stopOpacity="0.12" />
          <Stop offset="100%" stopColor={T.background} stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id={ids.purpleB} cx="40%" cy="55%" r="50%">
          <Stop offset="0%" stopColor="#7c3aed" stopOpacity="0.22" />
          <Stop offset="100%" stopColor={T.background} stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id={ids.blueA} cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={T.blue} stopOpacity="0.32" />
          <Stop offset="50%" stopColor={T.blue} stopOpacity="0.1" />
          <Stop offset="100%" stopColor={T.background} stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id={ids.blueB} cx="55%" cy="40%" r="50%">
          <Stop offset="0%" stopColor="#60a5fa" stopOpacity="0.16" />
          <Stop offset="100%" stopColor={T.background} stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id={ids.magentaA} cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={T.magenta} stopOpacity="0.3" />
          <Stop offset="48%" stopColor={T.magenta} stopOpacity="0.1" />
          <Stop offset="100%" stopColor={T.background} stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id={ids.magentaB} cx="45%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#f0abfc" stopOpacity="0.14" />
          <Stop offset="100%" stopColor={T.background} stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id={ids.mist} cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={T.cyan} stopOpacity="0.1" />
          <Stop offset="100%" stopColor={T.background} stopOpacity="0" />
        </RadialGradient>
        {/* 中央を少し沈めてカード可読性 */}
        <RadialGradient id={ids.centerClear} cx="50%" cy="48%" r="42%">
          <Stop offset="0%" stopColor={T.background} stopOpacity="0.62" />
          <Stop offset="55%" stopColor={T.background} stopOpacity="0.22" />
          <Stop offset="100%" stopColor={T.background} stopOpacity="0" />
        </RadialGradient>
      </Defs>

      {/* —— ネビュラ雲（半透明レイヤー重ね） —— */}
      {/* 左上: purple 主雲 */}
      <Ellipse
        cx={w * 0.14}
        cy={h * 0.12}
        rx={m * 0.48}
        ry={m * 0.36}
        fill={`url(#${ids.purpleA})`}
      />
      <Ellipse
        cx={w * 0.22}
        cy={h * 0.2}
        rx={m * 0.28}
        ry={m * 0.22}
        fill={`url(#${ids.purpleB})`}
      />
      {/* 上〜右: blue 雲 */}
      <Ellipse
        cx={w * 0.78}
        cy={h * 0.1}
        rx={m * 0.4}
        ry={m * 0.3}
        fill={`url(#${ids.blueA})`}
      />
      <Circle cx={w * 0.92} cy={h * 0.28} r={m * 0.26} fill={`url(#${ids.blueB})`} />
      {/* 右下〜下: magenta 雲 */}
      <Ellipse
        cx={w * 0.86}
        cy={h * 0.88}
        rx={m * 0.42}
        ry={m * 0.34}
        fill={`url(#${ids.magentaA})`}
      />
      <Ellipse
        cx={w * 0.7}
        cy={h * 0.82}
        rx={m * 0.3}
        ry={m * 0.22}
        fill={`url(#${ids.magentaB})`}
      />
      {/* 左下: purple + blue の薄い尾 */}
      <Ellipse
        cx={w * 0.1}
        cy={h * 0.78}
        rx={m * 0.32}
        ry={m * 0.28}
        fill={`url(#${ids.blueA})`}
        opacity={0.75}
      />
      <Circle cx={w * 0.18} cy={h * 0.9} r={m * 0.22} fill={`url(#${ids.purpleB})`} />
      {/* ごく薄いシアンミスト（端のみ） */}
      <Ellipse
        cx={w * 0.5}
        cy={h * 0.06}
        rx={m * 0.55}
        ry={m * 0.18}
        fill={`url(#${ids.mist})`}
      />
      <Ellipse
        cx={w * 0.95}
        cy={h * 0.55}
        rx={m * 0.18}
        ry={m * 0.35}
        fill={`url(#${ids.mist})`}
        opacity={0.7}
      />

      {/* 中央クリアベール */}
      <Rect x={0} y={0} width={w} height={h} fill={`url(#${ids.centerClear})`} />

      {/* —— 星座線 —— */}
      {links.map((l, i) => {
        const a = stars[l.a];
        const b = stars[l.b];
        if (!a || !b) return null;
        return (
          <Line
            key={`link-${i}`}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            stroke={T.purple}
            strokeWidth={0.45}
            strokeOpacity={0.22}
          />
        );
      })}

      <StarsLayer stars={stars} />

      {/* 焦点星（角・端、控えめグロー） */}
      <Circle cx={w * 0.1} cy={h * 0.11} r={7} fill={T.purple} fillOpacity={0.12} />
      <Circle cx={w * 0.1} cy={h * 0.11} r={2.2} fill={T.white.soft} fillOpacity={0.75} />
      <Circle cx={w * 0.9} cy={h * 0.14} r={5.5} fill={T.blue} fillOpacity={0.1} />
      <Circle cx={w * 0.9} cy={h * 0.14} r={1.8} fill={T.white.soft} fillOpacity={0.65} />
      <Circle cx={w * 0.88} cy={h * 0.88} r={8} fill={T.magenta} fillOpacity={0.12} />
      <Circle cx={w * 0.88} cy={h * 0.88} r={2.4} fill={T.magenta} fillOpacity={0.7} />
    </Svg>
  );
}

function GalacticNebulaBackground({ width, height, style, children }: ProfileBgProps) {
  return (
    <ProfileBgCanvas
      width={width}
      height={height}
      style={style}
      overlay={children ? <View style={styles.overlay} pointerEvents="box-none">{children}</View> : null}
    >
      {(size) => <GalacticNebulaArt {...size} />}
    </ProfileBgCanvas>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, zIndex: 2 },
});

export default memo(GalacticNebulaBackground);
