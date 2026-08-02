/**
 * DataStreamBackground — Skia による多層データストリーム背景。
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
  LinearGradient,
  Oval,
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

const BG_VOID = "#020508";
const BG_NAVY = "#050a14";
const CYAN = "#22d3ee";
const BLUE = "#3b82f6";
const VIOLET = "#8b5cf6";
const PURPLE = "#a78bfa";
const MAGENTA = "#e879f9";
const WHITE = "rgba(236,254,255,0.92)";

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type LayerKind = "rear" | "mid" | "fore";

type WaveSpec = {
  offset: number;
  amp: number;
  freq: number;
  phase: number;
  /** 層ごとの S 字の深さ・位相バイアス */
  dipScale: number;
  riseBias: number;
  width: number;
  opacity: number;
  color: string;
  layer: LayerKind;
  glow?: boolean;
};

/**
 * 明確な S 字（やや上寄せ）:
 * 左 y≈0.44h → 中央で沈む → 右 y≈0.38h へ上昇
 * 下側の広がりを抑え、カード上端から十分な余白を確保する。
 */
function streamY(t: number, h: number, s: WaveSpec): number {
  const left = h * 0.44;
  const right = h * 0.38;
  const baseline = left + (right - left) * t;
  // 中央付近で下へ沈む（S 字の谷）— 下げ幅を抑える
  const dip = Math.sin(t * Math.PI) * h * (0.072 * s.dipScale);
  // レイヤー差のための二次うねり（平行束を避ける）
  const weave =
    Math.sin(t * Math.PI * 2 * s.freq + s.phase) * s.amp +
    Math.sin(t * Math.PI * (2.6 + s.riseBias) * s.freq + s.phase * 1.4) *
      s.amp *
      0.42 +
    Math.sin(t * Math.PI * 1.35 + s.phase * 0.6) * h * 0.01 * s.dipScale;
  // 下方向オフセットを圧縮し、カード境界への接触を防ぐ
  const offset =
    s.offset > 0 ? s.offset * 0.62 : s.offset;
  return baseline + dip + offset + weave;
}

function buildWavePath(w: number, h: number, s: WaveSpec, samples = 64): SkPath {
  const p = Skia.Path.Make();
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const x = t * w;
    const y = streamY(t, h, s);
    if (i === 0) p.moveTo(x, y);
    else p.lineTo(x, y);
  }
  return p;
}

function mergeWavePaths(
  w: number,
  h: number,
  specs: WaveSpec[],
  samples = 56,
): SkPath {
  const p = Skia.Path.Make();
  for (const s of specs) {
    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      const x = t * w;
      const y = streamY(t, h, s);
      if (i === 0) p.moveTo(x, y);
      else p.lineTo(x, y);
    }
  }
  return p;
}

type LineBucket = {
  path: SkPath;
  color: string;
  width: number;
  opacity: number;
};

type StreamGeo = {
  rearGlow: { path: SkPath; color: string }[];
  rearLines: LineBucket[];
  midLines: LineBucket[];
  foreLines: LineBucket[];
  particlesDots: SkPoint[];
  particlesDotsLarge: SkPoint[];
  particlesBright: SkPoint[];
  dashPath: SkPath;
  squarePath: SkPath;
  diamondPath: SkPath;
  stars: SkPoint[];
  techArcs: SkPath[];
  hudOuter: SkPath[];
  hudInner: SkPath[];
  streamCy: number;
};

const PALETTE = [MAGENTA, PURPLE, VIOLET, BLUE, CYAN] as const;

function pickColor(i: number, prev: string | null): string {
  // 隣線と同色を避けつつ左紫→右シアンの傾向
  const prefer =
    i < 5 ? [MAGENTA, PURPLE] : i < 12 ? [PURPLE, VIOLET, BLUE] : [BLUE, CYAN, VIOLET];
  for (let k = 0; k < prefer.length; k++) {
    const c = prefer[(i + k) % prefer.length]!;
    if (c !== prev) return c;
  }
  const fallback = PALETTE[(i + 2) % PALETTE.length]!;
  return fallback === prev ? PALETTE[(i + 3) % PALETTE.length]! : fallback;
}

function bucketize(w: number, h: number, list: WaveSpec[]): LineBucket[] {
  const map = new Map<string, WaveSpec[]>();
  for (const s of list) {
    const key = `${s.color}|${s.width.toFixed(2)}|${s.opacity.toFixed(2)}`;
    const arr = map.get(key) ?? [];
    arr.push(s);
    map.set(key, arr);
  }
  const out: LineBucket[] = [];
  for (const [key, arr] of map) {
    const [color, widthStr, opacityStr] = key.split("|");
    out.push({
      path: mergeWavePaths(w, h, arr),
      color: color!,
      width: Number(widthStr),
      opacity: Number(opacityStr),
    });
  }
  return out;
}

function addDiamond(path: SkPath, cx: number, cy: number, r: number) {
  path.moveTo(cx, cy - r);
  path.lineTo(cx + r, cy);
  path.lineTo(cx, cy + r);
  path.lineTo(cx - r, cy);
  path.close();
}

function buildStreamGeo(w: number, h: number): StreamGeo {
  const rand = mulberry32(0xd57a3e01);
  const streamCy = h * 0.46;
  // 帯幅をやや抑え、下側は特に圧縮
  const band = h * 0.18;

  const rearSpecs: WaveSpec[] = [];
  const midSpecs: WaveSpec[] = [];
  const foreSpecs: WaveSpec[] = [];

  let prevColor: string | null = null;

  // 後景: 広く・低 opacity・曲率強め（上側寄りに寄せる）
  for (let i = 0; i < 10; i++) {
    const u = i / 9;
    const side = u < 0.55 ? -1 : 1; // 上側（負オフセット）多め
    const color = pickColor(i, prevColor);
    prevColor = color;
    rearSpecs.push({
      offset: side * band * (0.35 + (u % 0.5) * 0.45) + (rand() - 0.5) * h * 0.01,
      amp: h * (0.016 + rand() * 0.018),
      freq: 0.7 + rand() * 0.55,
      phase: rand() * Math.PI * 2,
      dipScale: 1.1 + rand() * 0.2,
      riseBias: 0.35 + rand() * 0.4,
      width: 0.85 + rand() * 0.4,
      opacity: 0.08 + rand() * 0.06,
      color,
      layer: "rear",
      glow: i % 3 === 0,
    });
  }

  // 中景: メイン細線（細く・低め opacity）
  prevColor = null;
  for (let i = 0; i < 16; i++) {
    const u = (i + 0.5) / 16;
    const color = pickColor(i + 3, prevColor);
    prevColor = color;
    midSpecs.push({
      offset: (u - 0.55) * band * 0.65 + (rand() - 0.5) * h * 0.012,
      amp: h * (0.011 + rand() * 0.012),
      freq: 0.9 + rand() * 0.65,
      phase: rand() * Math.PI * 2 + 0.4,
      dipScale: 0.9 + rand() * 0.18,
      riseBias: rand() * 0.35,
      width: 0.45 + rand() * 0.75,
      opacity: 0.2 + rand() * 0.16,
      color,
      layer: "mid",
      glow: i % 4 === 1,
    });
  }

  // 前景: 支配的な明るいパスは 2–3 本のみ（幅 ~20% 減）
  prevColor = null;
  const brightCount = 3;
  for (let i = 0; i < brightCount; i++) {
    const color = pickColor(i * 3 + 1, prevColor);
    prevColor = color;
    foreSpecs.push({
      offset: ((i / (brightCount - 1)) - 0.55) * band * 0.32 + (i - 1) * h * 0.006,
      amp: h * (0.009 + rand() * 0.008),
      freq: 1.05 + rand() * 0.4,
      phase: 1.1 + i * 0.55 + rand() * 0.3,
      dipScale: 0.82 + rand() * 0.12,
      riseBias: 0.15 + i * 0.08,
      width: (2.05 + rand() * 0.7) * 0.8,
      opacity: 0.55 + rand() * 0.18,
      color,
      layer: "fore",
      glow: true,
    });
  }

  const glowSources = [
    ...rearSpecs.filter((s) => s.glow).slice(0, 3),
    ...midSpecs.filter((s) => s.glow).slice(0, 2),
    ...foreSpecs.slice(0, 2),
  ];
  const rearGlow = glowSources.map((s, i) => ({
    path: buildWavePath(w, h, { ...s, amp: s.amp * 1.05 }, 48),
    color:
      i % 2 === 0 ? "rgba(167,139,250,0.18)" : "rgba(34,211,238,0.12)",
  }));

  // 粒子（決定的）— 左端・ELITE 帯は疎、明るい粒子は中〜右
  const particlesDots: SkPoint[] = [];
  const particlesDotsLarge: SkPoint[] = [];
  const particlesBright: SkPoint[] = [];
  const dashPath = Skia.Path.Make();
  const squarePath = Skia.Path.Make();
  const diamondPath = Skia.Path.Make();

  const spineProbe: WaveSpec = {
    offset: 0,
    amp: h * 0.01,
    freq: 1.05,
    phase: 0.35,
    dipScale: 1,
    riseBias: 0.2,
    width: 1,
    opacity: 1,
    color: PURPLE,
    layer: "mid",
  };

  const inEliteZone = (x: number, y: number) =>
    x < w * 0.42 && y < h * 0.24;
  const nearLeftEdge = (x: number) => x < w * 0.14;

  for (let i = 0; i < 100; i++) {
    // 中〜右に偏った分布
    let tBias = 0.22 + rand() * 0.7;
    if (rand() < 0.18) tBias = 0.1 + rand() * 0.18; // 左は稀
    const x = tBias * w;
    const base = streamY(tBias, h, spineProbe);
    // 下側スプレッドを抑える
    const ySpread = (rand() - 0.55) * band * 0.7;
    const y = base + ySpread;

    if (nearLeftEdge(x) && rand() < 0.75) continue;
    if (inEliteZone(x, y) && rand() < 0.88) continue;

    const kind = rand();
    if (kind < 0.38) {
      if (rand() > 0.72) particlesDotsLarge.push(vec(x, y));
      else particlesDots.push(vec(x, y));
    } else if (kind < 0.58) {
      const len = 3 + rand() * 5.5;
      const ang = (rand() - 0.5) * 0.7;
      dashPath.moveTo(x - Math.cos(ang) * len * 0.5, y - Math.sin(ang) * len * 0.5);
      dashPath.lineTo(x + Math.cos(ang) * len * 0.5, y + Math.sin(ang) * len * 0.5);
    } else if (kind < 0.78) {
      const s = 1.4 + rand() * 2.2;
      squarePath.addRect(Skia.XYWHRect(x - s * 0.5, y - s * 0.5, s, s));
    } else {
      addDiamond(diamondPath, x, y, 1.6 + rand() * 2.2);
    }
  }

  // 明るい粒子は中〜右のストリーム沿い
  for (let i = 0; i < 10; i++) {
    const t = 0.48 + (i / 9) * 0.38 + (rand() - 0.5) * 0.03;
    const x = t * w;
    const y = streamY(t, h, spineProbe) + (rand() - 0.5) * h * 0.016;
    if (inEliteZone(x, y)) continue;
    particlesBright.push(vec(x, y));
  }

  const stars: SkPoint[] = [];
  for (let i = 0; i < 28; i++) {
    const x = rand() * w;
    let y = rand() * h * 0.4;
    if (rand() > 0.65) y = h * 0.78 + rand() * h * 0.18;
    if (y < h * 0.22 && rand() > 0.45) continue;
    // 右上は装飾を置かない（斜めストライプ感の防止）
    if (x > w * 0.62 && y < h * 0.22) continue;
    stars.push(vec(x, y));
  }

  // 左端と下右のみの薄い弧（右上は完全に空ける）
  const techArcs: SkPath[] = [];
  const a1 = Skia.Path.Make();
  a1.addArc(Skia.XYWHRect(-w * 0.1, h * 0.18, w * 0.34, h * 0.24), 20, 55);
  techArcs.push(a1);
  const a2 = Skia.Path.Make();
  a2.addArc(Skia.XYWHRect(w * 0.72, h * 0.78, w * 0.34, h * 0.28), 200, 60);
  techArcs.push(a2);

  const mkBracket = (
    x0: number,
    y0: number,
    sx: 1 | -1,
    sy: 1 | -1,
    arm: number,
  ) => {
    const p = Skia.Path.Make();
    p.moveTo(x0 + sx * arm, y0);
    p.lineTo(x0, y0);
    p.lineTo(x0, y0 + sy * arm);
    return p;
  };
  const insetO = 8;
  const insetI = 14;
  const hudOuter = [
    mkBracket(insetO, insetO, 1, 1, 18),
    mkBracket(w - insetO, insetO, -1, 1, 18),
    mkBracket(insetO, h - insetO, 1, -1, 18),
    mkBracket(w - insetO, h - insetO, -1, -1, 18),
  ];
  const hudInner = [
    mkBracket(insetI, insetI, 1, 1, 11),
    mkBracket(w - insetI, insetI, -1, 1, 11),
    mkBracket(insetI, h - insetI, 1, -1, 11),
    mkBracket(w - insetI, h - insetI, -1, -1, 11),
  ];

  return {
    rearGlow,
    rearLines: bucketize(w, h, rearSpecs),
    midLines: bucketize(w, h, midSpecs),
    foreLines: bucketize(w, h, foreSpecs),
    particlesDots,
    particlesDotsLarge,
    particlesBright,
    dashPath,
    squarePath,
    diamondPath,
    stars,
    techArcs,
    hudOuter,
    hudInner,
    streamCy,
  };
}

function DataStreamSkiaArt({
  width: w,
  height: h,
}: {
  width: number;
  height: number;
}) {
  const geo = useMemo(() => buildStreamGeo(w, h), [w, h]);

  return (
    <Canvas style={{ width: w, height: h }} pointerEvents="none">
      {/* ベース */}
      <Rect x={0} y={0} width={w} height={h}>
        <LinearGradient
          start={vec(0, 0)}
          end={vec(0, h)}
          colors={[BG_VOID, BG_NAVY, "#071018", "#0a1424"]}
          positions={[0, 0.35, 0.7, 1]}
        />
      </Rect>

      {/* 上部〜中央の淡い青紫ヘイズ（強い線は置かない） */}
      <Circle cx={w * 0.5} cy={h * 0.36} r={Math.min(w, h) * 0.4}>
        <RadialGradient
          c={vec(w * 0.5, h * 0.36)}
          r={Math.min(w, h) * 0.4}
          colors={[
            "rgba(59,130,246,0.1)",
            "rgba(139,92,246,0.08)",
            "rgba(0,0,0,0)",
          ]}
          positions={[0, 0.42, 1]}
        />
      </Circle>
      <Circle cx={w * 0.48} cy={geo.streamCy} r={Math.min(w, h) * 0.38}>
        <RadialGradient
          c={vec(w * 0.48, geo.streamCy)}
          r={Math.min(w, h) * 0.38}
          colors={[
            "rgba(88,28,135,0.16)",
            "rgba(37,99,235,0.08)",
            "rgba(0,0,0,0)",
          ]}
          positions={[0, 0.5, 1]}
        />
      </Circle>

      <Points
        points={geo.stars}
        mode="points"
        color="rgba(186,230,253,0.2)"
        strokeWidth={0.85}
      />

      {geo.techArcs.map((p, i) => (
        <Path
          key={`arc-${i}`}
          path={p}
          style="stroke"
          strokeWidth={0.55}
          color={i === 0 ? CYAN : MAGENTA}
          opacity={0.08}
        />
      ))}

      {/* 曲線に沿うグロー（矩形帯は使わない） */}
      {geo.rearGlow.map((g, i) => (
        <Path
          key={`rg-${i}`}
          path={g.path}
          style="stroke"
          strokeWidth={i < 3 ? 14 : 9}
          strokeCap="round"
          color={g.color}
        >
          <BlurMask blur={i < 3 ? 10 : 7} style="normal" />
        </Path>
      ))}

      {/* 後景: 広くぼかした淡曲線 */}
      {geo.rearLines.map((b, i) => (
        <Path
          key={`rear-${i}`}
          path={b.path}
          style="stroke"
          strokeWidth={b.width + 0.6}
          strokeCap="round"
          color={b.color}
          opacity={b.opacity}
        >
          <BlurMask blur={2} style="normal" />
        </Path>
      ))}

      {/* 中景: 細い色線 */}
      {geo.midLines.map((b, i) => (
        <Path
          key={`mid-${i}`}
          path={b.path}
          style="stroke"
          strokeWidth={b.width}
          strokeCap="round"
          strokeJoin="round"
          opacity={b.opacity}
        >
          <LinearGradient
            start={vec(0, 0)}
            end={vec(w, 0)}
            colors={[MAGENTA, PURPLE, VIOLET, BLUE, CYAN]}
            positions={[0, 0.22, 0.48, 0.72, 1]}
          />
        </Path>
      ))}

      {/* 前景: 明るいシャープ線 */}
      {geo.foreLines.map((b, i) => (
        <Path
          key={`fore-${i}`}
          path={b.path}
          style="stroke"
          strokeWidth={b.width}
          strokeCap="round"
          color={b.color}
          opacity={b.opacity}
        />
      ))}

      {/* 粒子 */}
      <Points
        points={geo.particlesDots}
        mode="points"
        color="rgba(167,139,250,0.4)"
        strokeWidth={1.3}
      />
      <Points
        points={geo.particlesDotsLarge}
        mode="points"
        color="rgba(34,211,238,0.5)"
        strokeWidth={2.4}
      />
      <Path
        path={geo.dashPath}
        style="stroke"
        strokeWidth={0.9}
        color={CYAN}
        opacity={0.38}
        strokeCap="round"
      />
      <Path path={geo.squarePath} color="rgba(232,121,249,0.38)" />
      <Path
        path={geo.diamondPath}
        style="stroke"
        strokeWidth={0.85}
        color={PURPLE}
        opacity={0.45}
      />

      {/* 明るい粒子 + ソフトグロー */}
      <Points
        points={geo.particlesBright}
        mode="points"
        color="rgba(236,254,255,0.55)"
        strokeWidth={5.5}
      >
        <BlurMask blur={3.5} style="normal" />
      </Points>
      <Points
        points={geo.particlesBright}
        mode="points"
        color={WHITE}
        strokeWidth={2.6}
      />

      {/* 上部プロフィール可読ベール */}
      <Rect x={0} y={0} width={w} height={h * 0.32}>
        <LinearGradient
          start={vec(0, 0)}
          end={vec(0, h * 0.32)}
          colors={["rgba(2,5,8,0.78)", "rgba(2,5,8,0.38)", "rgba(2,5,8,0)"]}
          positions={[0, 0.55, 1]}
        />
      </Rect>
      <Rect x={0} y={0} width={w * 0.52} height={h * 0.24}>
        <RadialGradient
          c={vec(w * 0.16, h * 0.1)}
          r={w * 0.4}
          colors={["rgba(2,5,8,0.62)", "rgba(2,5,8,0)"]}
          positions={[0, 1]}
        />
      </Rect>

      {/* 「WORLD CUP // STATS」背後のソフト楕円マスク（矩形に見えない） */}
      <Oval
        x={w * 0.08}
        y={h * 0.33}
        width={w * 0.84}
        height={h * 0.13}
        color="rgba(2,5,8,0.42)"
      >
        <BlurMask blur={16} style="normal" />
      </Oval>
      <Oval
        x={w * 0.18}
        y={h * 0.36}
        width={w * 0.64}
        height={h * 0.08}
        color="rgba(2,5,8,0.5)"
      >
        <BlurMask blur={10} style="normal" />
      </Oval>

      {/* カード帯: カード上 20–30px 相当から暗転（明るい線が縁に触れない） */}
      <Rect x={0} y={h * 0.52} width={w} height={h * 0.42}>
        <LinearGradient
          start={vec(0, h * 0.52)}
          end={vec(0, h * 0.95)}
          colors={[
            "rgba(2,5,8,0.35)",
            "rgba(2,5,8,0.82)",
            "rgba(2,5,8,0.9)",
            "rgba(2,5,8,0.55)",
            "rgba(2,5,8,0)",
          ]}
          positions={[0, 0.22, 0.5, 0.8, 1]}
        />
      </Rect>

      {/* HUD コーナー */}
      {geo.hudOuter.map((p, i) => (
        <Path
          key={`ho-${i}`}
          path={p}
          style="stroke"
          strokeWidth={0.8}
          color={PURPLE}
          opacity={0.32}
        />
      ))}
      {geo.hudInner.map((p, i) => (
        <Path
          key={`hi-${i}`}
          path={p}
          style="stroke"
          strokeWidth={1}
          color={CYAN}
          opacity={0.34}
        />
      ))}

      <Rect x={0} y={0} width={w} height={h}>
        <RadialGradient
          c={vec(w * 0.5, h * 0.48)}
          r={Math.max(w, h) * 0.84}
          colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.28)", "rgba(0,0,0,0.58)"]}
          positions={[0.38, 0.7, 1]}
        />
      </Rect>
    </Canvas>
  );
}

function DataStreamBackground({
  width: widthProp,
  height: heightProp,
  style,
  children,
}: ProfileBgProps) {
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
      {ready ? <DataStreamSkiaArt width={w} height={h} /> : null}
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

export default memo(DataStreamBackground);
