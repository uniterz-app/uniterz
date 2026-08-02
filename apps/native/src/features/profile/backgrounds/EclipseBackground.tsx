/**
 * EclipseBackground — 参考画像準拠の Skia エクリプス背景。
 * 右下巨大惑星 + 紫マゼンタコロナ + 左の副衛星 + 交差軌道 + HUD。
 * 装飾レイヤーのみ。前景 UI には触れない。
 */
import { memo, useCallback, useMemo, useState } from "react";
import {
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import {
  BlurMask,
  Canvas,
  Circle,
  DashPathEffect,
  Group,
  Line,
  Path,
  Points,
  RadialGradient,
  Rect,
  Skia,
  vec,
  type SkPath,
  type SkPoint,
} from "@shopify/react-native-skia";
import type { ProfileBgProps } from "./types";

const BG_VOID = "#03040a";
const BG_NAVY = "#060812";
const CYAN = "#22d3ee";
const MAGENTA = "#e879f9";
const PURPLE = "#a78bfa";
const VIOLET = "#8b5cf6";
const WHITE = "rgba(236, 254, 255, 0.92)";

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeArcPath(
  cx: number,
  cy: number,
  r: number,
  startDeg: number,
  sweepDeg: number,
): SkPath {
  const p = Skia.Path.Make();
  p.addArc(Skia.XYWHRect(cx - r, cy - r, r * 2, r * 2), startDeg, sweepDeg);
  return p;
}

function makeOrbitOval(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  rotateDeg: number,
): SkPath {
  const p = Skia.Path.Make();
  p.addOval(Skia.XYWHRect(cx - rx, cy - ry, rx * 2, ry * 2));
  const m = Skia.Matrix();
  m.translate(cx, cy);
  m.rotate(rotateDeg);
  m.translate(-cx, -cy);
  p.transform(m);
  return p;
}

type StarBucket = { tiny: SkPoint[]; mid: SkPoint[]; bright: SkPoint[] };

function buildStars(w: number, h: number): StarBucket {
  const rand = mulberry32(0xec1195e);
  const tiny: SkPoint[] = [];
  const mid: SkPoint[] = [];
  const bright: SkPoint[] = [];

  for (let i = 0; i < 85; i++) {
    let x = rand() * w;
    let y = rand() * h;
    // 上〜中央に散らす（参考画像の星空）
    if (rand() > 0.3) {
      y = rand() * h * 0.62;
    }
    const dx = x - w * 0.9;
    const dy = y - h * 0.78;
    if (dx * dx + dy * dy < (w * 0.4) ** 2 && rand() > 0.55) {
      x = rand() * w * 0.55;
      y = rand() * h * 0.5;
    }
    const roll = rand();
    if (roll > 0.92) bright.push(vec(x, y));
    else if (roll > 0.7) mid.push(vec(x, y));
    else tiny.push(vec(x, y));
  }
  for (let i = 0; i < 9; i++) {
    bright.push(vec(w * (0.06 + rand() * 0.7), h * (0.05 + rand() * 0.45)));
  }
  return { tiny, mid, bright };
}

type OrbitStroke = {
  path: SkPath;
  color: string;
  width: number;
  opacity: number;
  dashed?: boolean;
};

type EclipseGeo = {
  cx: number;
  cy: number;
  r: number;
  moonCx: number;
  moonCy: number;
  moonR: number;
  coronaGlowCx: number;
  coronaGlowCy: number;
  rimBloom: SkPath;
  rimOuter: SkPath;
  rimMid: SkPath;
  rimInner: SkPath;
  moonCrescent: SkPath;
  orbits: OrbitStroke[];
  stars: StarBucket;
  hudPaths: SkPath[];
  edgeDots: SkPoint[];
  gridLines: { x1: number; y1: number; x2: number; y2: number }[];
  techLines: { x1: number; y1: number; x2: number; y2: number; color: string; o: number }[];
  crosshairs: { x: number; y: number; color: string }[];
  craterOffsets: { dx: number; dy: number; rr: number; o: number }[];
};

function buildEclipseGeo(w: number, h: number): EclipseGeo {
  // 参考: 右下を支配する巨大惑星
  const cx = w * 0.92;
  const cy = h * 0.78;
  const r = w * 0.68;

  // 左〜中央の副衛星
  const moonCx = w * 0.28;
  const moonCy = h * 0.58;
  const moonR = w * 0.085;

  // リムは惑星の左上（光源＝背後）— 紫マゼンタのコロナ
  const rimStart = 175;
  const rimSweep = 115;

  const rimBloom = makeArcPath(cx, cy, r + 4, rimStart - 6, rimSweep + 16);
  const rimOuter = makeArcPath(cx, cy, r + 1.5, rimStart, rimSweep);
  const rimMid = makeArcPath(cx, cy, r + 0.2, rimStart + 5, rimSweep - 10);
  const rimInner = makeArcPath(cx, cy, r - 2, rimStart + 12, rimSweep - 22);

  // 月の右側クレセント（エクリプス光源側）
  const moonCrescent = makeArcPath(moonCx, moonCy, moonR, -40, 95);

  const coronaGlowCx = cx - r * 0.55;
  const coronaGlowCy = cy - r * 0.48;

  const orbits: OrbitStroke[] = [
    // 主惑星まわりの広い楕円
    {
      path: makeOrbitOval(cx - r * 0.15, cy - r * 0.2, r * 1.25, r * 0.48, -38),
      color: PURPLE,
      width: 1.1,
      opacity: 0.28,
    },
    {
      path: makeOrbitOval(cx - r * 0.1, cy - r * 0.15, r * 1.45, r * 0.58, -22),
      color: MAGENTA,
      width: 0.8,
      opacity: 0.2,
      dashed: true,
    },
    {
      path: makeOrbitOval(cx - r * 0.05, cy - r * 0.25, r * 1.65, r * 0.7, -48),
      color: CYAN,
      width: 0.7,
      opacity: 0.18,
    },
    // 月を囲む交差リング
    {
      path: makeOrbitOval(moonCx, moonCy, moonR * 2.8, moonR * 1.15, -25),
      color: PURPLE,
      width: 0.9,
      opacity: 0.32,
    },
    {
      path: makeOrbitOval(moonCx, moonCy, moonR * 3.4, moonR * 1.35, 18),
      color: CYAN,
      width: 0.7,
      opacity: 0.22,
    },
    {
      path: makeOrbitOval(moonCx + moonR * 0.2, moonCy - moonR * 0.1, moonR * 4.2, moonR * 1.7, -55),
      color: MAGENTA,
      width: 0.6,
      opacity: 0.16,
      dashed: true,
    },
    // 画面を横切る細い軌道
    {
      path: makeOrbitOval(w * 0.55, h * 0.62, w * 0.55, h * 0.22, -18),
      color: VIOLET,
      width: 0.55,
      opacity: 0.14,
    },
  ];

  const inset = 9;
  const arm = 16;
  const mkBracket = (x0: number, y0: number, sx: 1 | -1, sy: 1 | -1) => {
    const p = Skia.Path.Make();
    p.moveTo(x0 + sx * arm, y0);
    p.lineTo(x0, y0);
    p.lineTo(x0, y0 + sy * arm);
    return p;
  };

  const hudPaths = [
    mkBracket(inset, inset, 1, 1),
    mkBracket(w - inset, inset, -1, 1),
    mkBracket(inset, h - inset, 1, -1),
    mkBracket(w - inset, h - inset, -1, -1),
  ];

  // 左右エッジのスキャナードット
  const edgeDots: SkPoint[] = [];
  for (let i = 0; i < 14; i++) {
    const t = (i + 1) / 15;
    edgeDots.push(vec(7, h * (0.12 + t * 0.72)));
    edgeDots.push(vec(w - 7, h * (0.12 + t * 0.72)));
  }

  // ごく薄いグリッド（暗部）
  const gridLines: EclipseGeo["gridLines"] = [];
  const step = Math.max(28, Math.round(w / 12));
  for (let x = step; x < w; x += step) {
    gridLines.push({ x1: x, y1: 0, x2: x, y2: h });
  }
  for (let y = step; y < h; y += step) {
    gridLines.push({ x1: 0, y1: y, x2: w, y2: y });
  }

  const techLines = [
    { x1: w * 0.16, y1: 12, x2: w * 0.3, y2: 12, color: CYAN, o: 0.2 },
    { x1: w * 0.58, y1: 13, x2: w * 0.74, y2: 13, color: MAGENTA, o: 0.18 },
    { x1: 11, y1: h * 0.2, x2: 11, y2: h * 0.32, color: PURPLE, o: 0.16 },
    { x1: w - 11, y1: h * 0.18, x2: w - 11, y2: h * 0.3, color: CYAN, o: 0.15 },
  ];

  const crosshairs = [
    { x: w * 0.12, y: h * 0.1, color: CYAN },
    { x: w * 0.7, y: h * 0.08, color: MAGENTA },
    { x: w * 0.88, y: h * 0.18, color: PURPLE },
    { x: w * 0.08, y: h * 0.42, color: CYAN },
    { x: w * 0.42, y: h * 0.14, color: PURPLE },
  ];

  // 惑星表面の微細クレーター風（暗い円）
  const craterOffsets = [
    { dx: -0.22, dy: -0.18, rr: 0.08, o: 0.18 },
    { dx: -0.08, dy: -0.28, rr: 0.05, o: 0.14 },
    { dx: -0.32, dy: 0.02, rr: 0.06, o: 0.16 },
    { dx: -0.15, dy: 0.12, rr: 0.09, o: 0.12 },
    { dx: 0.02, dy: -0.12, rr: 0.04, o: 0.15 },
    { dx: -0.4, dy: -0.08, rr: 0.035, o: 0.2 },
  ];

  return {
    cx,
    cy,
    r,
    moonCx,
    moonCy,
    moonR,
    coronaGlowCx,
    coronaGlowCy,
    rimBloom,
    rimOuter,
    rimMid,
    rimInner,
    moonCrescent,
    orbits,
    stars: buildStars(w, h),
    hudPaths,
    edgeDots,
    gridLines,
    techLines,
    crosshairs,
    craterOffsets,
  };
}

function EclipseSkiaArt({ width: w, height: h }: { width: number; height: number }) {
  const geo = useMemo(() => buildEclipseGeo(w, h), [w, h]);

  return (
    <Canvas style={{ width: w, height: h }} pointerEvents="none">
      {/* —— ベース —— */}
      <Rect x={0} y={0} width={w} height={h} color={BG_VOID} />
      <Rect x={0} y={0} width={w} height={h}>
        <RadialGradient
          c={vec(w * 0.7, h * 0.85)}
          r={Math.max(w, h) * 0.85}
          colors={["rgba(76, 29, 149, 0.22)", "rgba(15, 23, 42, 0.4)", BG_VOID]}
          positions={[0, 0.45, 1]}
        />
      </Rect>

      {/* 薄いグリッド */}
      <Group opacity={0.045}>
        {geo.gridLines.map((g, i) => (
          <Line
            key={`g-${i}`}
            p1={vec(g.x1, g.y1)}
            p2={vec(g.x2, g.y2)}
            color={PURPLE}
            strokeWidth={0.5}
          />
        ))}
      </Group>

      {/* 中央〜左の薄いネビュラ */}
      <Circle cx={w * 0.35} cy={h * 0.45} r={Math.min(w, h) * 0.42}>
        <RadialGradient
          c={vec(w * 0.35, h * 0.45)}
          r={Math.min(w, h) * 0.42}
          colors={["rgba(139, 92, 246, 0.16)", "rgba(232, 121, 249, 0.06)", "rgba(0,0,0,0)"]}
          positions={[0, 0.45, 1]}
        />
      </Circle>

      {/* 星 */}
      <Points points={geo.stars.tiny} mode="points" color="rgba(226,232,240,0.32)" strokeWidth={1.05} />
      <Points points={geo.stars.mid} mode="points" color="rgba(165,243,252,0.5)" strokeWidth={1.7} />
      <Points points={geo.stars.bright} mode="points" color={WHITE} strokeWidth={2.5} />
      {geo.stars.bright.slice(0, 7).map((p, i) => (
        <Circle
          key={`halo-${i}`}
          cx={p.x}
          cy={p.y}
          r={5}
          color={i % 2 === 0 ? "rgba(232,121,249,0.12)" : "rgba(34,211,238,0.12)"}
        />
      ))}

      {/* 軌道（惑星の下に一部、上に一部） */}
      {geo.orbits.map((o, i) =>
        o.dashed ? (
          <Path
            key={`orb-${i}`}
            path={o.path}
            style="stroke"
            strokeWidth={o.width}
            color={o.color}
            opacity={o.opacity}
          >
            <DashPathEffect intervals={[3, 6]} />
          </Path>
        ) : (
          <Path
            key={`orb-${i}`}
            path={o.path}
            style="stroke"
            strokeWidth={o.width}
            color={o.color}
            opacity={o.opacity}
          />
        ),
      )}

      {/* コロナ背後の紫マゼンタ・ヘイズ（参考画像の主役グロー） */}
      <Circle cx={geo.coronaGlowCx} cy={geo.coronaGlowCy} r={geo.r * 1.05}>
        <RadialGradient
          c={vec(geo.coronaGlowCx, geo.coronaGlowCy)}
          r={geo.r * 1.05}
          colors={[
            "rgba(232, 121, 249, 0.55)",
            "rgba(139, 92, 246, 0.32)",
            "rgba(59, 130, 246, 0.1)",
            "rgba(2, 4, 10, 0)",
          ]}
          positions={[0, 0.28, 0.55, 1]}
        />
      </Circle>
      <Circle cx={geo.coronaGlowCx} cy={geo.coronaGlowCy} r={geo.r * 0.55}>
        <RadialGradient
          c={vec(geo.coronaGlowCx, geo.coronaGlowCy)}
          r={geo.r * 0.55}
          colors={["rgba(253, 244, 255, 0.35)", "rgba(232, 121, 249, 0.2)", "rgba(0,0,0,0)"]}
          positions={[0, 0.4, 1]}
        />
      </Circle>

      {/* 副衛星 */}
      <Circle cx={geo.moonCx} cy={geo.moonCy} r={geo.moonR * 1.8} color="rgba(139,92,246,0.12)" />
      <Circle cx={geo.moonCx} cy={geo.moonCy} r={geo.moonR}>
        <RadialGradient
          c={vec(geo.moonCx - geo.moonR * 0.2, geo.moonCy - geo.moonR * 0.15)}
          r={geo.moonR}
          colors={["#121826", "#070a12", "#020306"]}
          positions={[0, 0.55, 1]}
        />
      </Circle>
      <Path
        path={geo.moonCrescent}
        style="stroke"
        strokeWidth={2.2}
        color="rgba(232,121,249,0.75)"
        strokeCap="round"
      >
        <BlurMask blur={1.5} style="normal" />
      </Path>
      <Path
        path={geo.moonCrescent}
        style="stroke"
        strokeWidth={1}
        color="rgba(236,254,255,0.7)"
        strokeCap="round"
      />

      {/* 巨大惑星本体 */}
      <Circle cx={geo.cx} cy={geo.cy} r={geo.r}>
        <RadialGradient
          c={vec(geo.cx - geo.r * 0.35, geo.cy - geo.r * 0.4)}
          r={geo.r}
          colors={["#101828", "#080c16", "#030508"]}
          positions={[0, 0.42, 1]}
        />
      </Circle>
      {geo.craterOffsets.map((c, i) => (
        <Circle
          key={`cr-${i}`}
          cx={geo.cx + c.dx * geo.r}
          cy={geo.cy + c.dy * geo.r}
          r={c.rr * geo.r}
          color={`rgba(0,0,0,${c.o})`}
        />
      ))}
      <Circle
        cx={geo.cx + geo.r * 0.15}
        cy={geo.cy + geo.r * 0.12}
        r={geo.r * 0.9}
        color="rgba(0,0,0,0.28)"
      />

      {/* 三重〜四重コロナリム（紫マゼンタ → シアン） */}
      <Path
        path={geo.rimBloom}
        style="stroke"
        strokeWidth={28}
        color="rgba(232,121,249,0.45)"
        strokeCap="round"
      >
        <BlurMask blur={16} style="normal" />
      </Path>
      <Path
        path={geo.rimOuter}
        style="stroke"
        strokeWidth={14}
        color="rgba(167,139,250,0.7)"
        strokeCap="round"
      >
        <BlurMask blur={8} style="normal" />
      </Path>
      <Path
        path={geo.rimMid}
        style="stroke"
        strokeWidth={6}
        color="rgba(192,132,252,0.85)"
        strokeCap="round"
      >
        <BlurMask blur={3} style="normal" />
      </Path>
      <Path
        path={geo.rimInner}
        style="stroke"
        strokeWidth={2.8}
        color="rgba(34,211,238,0.95)"
        strokeCap="round"
      >
        <BlurMask blur={1.2} style="solid" />
      </Path>
      <Path
        path={geo.rimInner}
        style="stroke"
        strokeWidth={1.2}
        color="rgba(255,255,255,0.9)"
        strokeCap="round"
      />

      {/* HUD */}
      {geo.hudPaths.map((p, i) => (
        <Path
          key={`hud-${i}`}
          path={p}
          style="stroke"
          strokeWidth={0.9}
          color={i % 2 === 0 ? CYAN : MAGENTA}
          opacity={0.34}
        />
      ))}
      <Points points={geo.edgeDots} mode="points" color="rgba(167,139,250,0.35)" strokeWidth={2.2} />
      {geo.techLines.map((l, i) => (
        <Line
          key={`tl-${i}`}
          p1={vec(l.x1, l.y1)}
          p2={vec(l.x2, l.y2)}
          color={l.color}
          strokeWidth={0.7}
          opacity={l.o}
        />
      ))}
      {geo.crosshairs.map((c, i) => (
        <Group key={`xh-${i}`} opacity={0.38}>
          <Line p1={vec(c.x - 3.5, c.y)} p2={vec(c.x + 3.5, c.y)} color={c.color} strokeWidth={0.7} />
          <Line p1={vec(c.x, c.y - 3.5)} p2={vec(c.x, c.y + 3.5)} color={c.color} strokeWidth={0.7} />
          <Circle cx={c.x} cy={c.y} r={1} color={c.color} />
        </Group>
      ))}
    </Canvas>
  );
}

function EclipseBackground({ width: widthProp, height: heightProp, style, children }: ProfileBgProps) {
  const [measured, setMeasured] = useState({ width: 0, height: 0 });

  const onLayout = useCallback(
    (e: LayoutChangeEvent) => {
      if (widthProp != null && heightProp != null) return;
      const { width, height } = e.nativeEvent.layout;
      setMeasured((prev) =>
        prev.width === width && prev.height === height ? prev : { width, height },
      );
    },
    [widthProp, heightProp],
  );

  const w = widthProp ?? measured.width;
  const h = heightProp ?? measured.height;
  const ready = w > 1 && h > 1;

  const rootStyle: StyleProp<ViewStyle> = [
    StyleSheet.absoluteFillObject,
    widthProp != null && heightProp != null
      ? { width: widthProp, height: heightProp }
      : null,
    { backgroundColor: BG_NAVY },
    style,
  ];

  return (
    <View style={rootStyle} onLayout={onLayout} pointerEvents="none">
      {ready ? <EclipseSkiaArt width={w} height={h} /> : null}
      {children ? (
        <View style={styles.overlay} pointerEvents="box-none">
          {children}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
  },
});

export default memo(EclipseBackground);
