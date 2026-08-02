/**
 * DigitalStadiumBackground — Skia による未来型インドア・アリーナ背景。
 * 横長の座席ボウル + 上部ライト列。HUD ワイヤフレーム感は出さない。
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
  Group,
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

const BG_TOP = "#020611";
const BG_MID = "#061226";
const BG_BOT = "#07162B";
const CYAN = "#22d3ee";
const BLUE = "#3b82f6";
const VIOLET = "#8b5cf6";

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function ellipsePt(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  a: number,
): [number, number] {
  return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)];
}

/** 楕円弧ストローク（横長ボウル用・上側寄り） */
function ellipseArcPath(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  a0: number,
  a1: number,
  samples = 48,
): SkPath {
  const p = Skia.Path.Make();
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const a = a0 + (a1 - a0) * t;
    const [x, y] = ellipsePt(cx, cy, rx, ry, a);
    if (i === 0) p.moveTo(x, y);
    else p.lineTo(x, y);
  }
  return p;
}

/**
 * 2 本の同心楕円弧の間を埋めた座席帯（塗り）。
 * 角度は上側（≈0〜π）を左→右に横切る。
 */
function seatingBandFill(
  cx: number,
  cy: number,
  rxOuter: number,
  ryOuter: number,
  rxInner: number,
  ryInner: number,
  a0: number,
  a1: number,
  samples = 36,
): SkPath {
  const p = Skia.Path.Make();
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const a = a0 + (a1 - a0) * t;
    const [x, y] = ellipsePt(cx, cy, rxOuter, ryOuter, a);
    if (i === 0) p.moveTo(x, y);
    else p.lineTo(x, y);
  }
  for (let i = samples; i >= 0; i--) {
    const t = i / samples;
    const a = a0 + (a1 - a0) * t;
    const [x, y] = ellipsePt(cx, cy, rxInner, ryInner, a);
    p.lineTo(x, y);
  }
  p.close();
  return p;
}

function beamPath(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  topHalf: number,
  botHalf: number,
): SkPath {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const p = Skia.Path.Make();
  p.moveTo(x0 + nx * topHalf, y0 + ny * topHalf);
  p.lineTo(x1 + nx * botHalf, y1 + ny * botHalf);
  p.lineTo(x1 - nx * botHalf, y1 - ny * botHalf);
  p.lineTo(x0 - nx * topHalf, y0 - ny * topHalf);
  p.close();
  return p;
}

function mkCorner(
  x0: number,
  y0: number,
  sx: 1 | -1,
  sy: 1 | -1,
  arm: number,
): SkPath {
  const p = Skia.Path.Make();
  p.moveTo(x0 + sx * arm, y0);
  p.lineTo(x0, y0);
  p.lineTo(x0, y0 + sy * arm);
  return p;
}

type LightSpec = {
  x: number;
  y: number;
  r: number;
  color: string;
  opacity: number;
};

type StadiumGeo = {
  /** 座席帯の塗り（厚みのある段） */
  bowlFills: { path: SkPath; color: string }[];
  /** 段の上縁ハイライトのみ（線だけの装飾は持たない） */
  upperHighlights: { path: SkPath; color: string; width: number; opacity: number }[];
  lampCore: SkPoint[];
  lampCyan: SkPoint[];
  lampBlue: SkPoint[];
  glowLights: LightSpec[];
  beams: { path: SkPath; color: string; opacity: number }[];
  seatTiny: SkPoint[];
  seatCyan: SkPoint[];
  seatBlue: SkPoint[];
  seatViolet: SkPoint[];
  seatBright: SkPoint[];
  floorFill: SkPath;
  floorSheen: SkPath;
  floorGlowL: { cx: number; cy: number; r: number };
  floorGlowR: { cx: number; cy: number; r: number };
  floorRings: { path: SkPath; opacity: number; width: number; color: string }[];
  floorGuides: SkPath;
  corners: { path: SkPath; color: string }[];
};

function buildStadiumGeo(w: number, h: number): StadiumGeo {
  const rand = mulberry32(0xd8a21c07);

  // ボウルを左右へ強く巻き込む（端が中央へ内曲）
  const bowlCx = w * 0.5;
  const bowlCy = -h * 0.02;
  const aLeft = 0.02;
  const aRight = Math.PI - 0.02;

  // —— 座席 4 段: 塗り帯が主役。内側=前縁（ライト列）、外側=上縁ハイライト ——
  const tiers: {
    rx: number;
    ry: number;
    thick: number;
    fill: string;
    hiColor: string;
    hiO: number;
    lamps: boolean;
    crowd: number;
  }[] = [
    {
      rx: w * 1.28,
      ry: h * 0.64,
      thick: 0.11,
      fill: "rgba(14,40,88,0.48)",
      hiColor: CYAN,
      hiO: 0.42,
      lamps: true,
      crowd: 220,
    },
    {
      rx: w * 1.08,
      ry: h * 0.53,
      thick: 0.105,
      fill: "rgba(12,36,78,0.44)",
      hiColor: BLUE,
      hiO: 0.36,
      lamps: true,
      crowd: 200,
    },
    {
      rx: w * 0.9,
      ry: h * 0.43,
      thick: 0.1,
      fill: "rgba(14,32,70,0.36)",
      hiColor: CYAN,
      hiO: 0.22,
      lamps: false,
      crowd: 150,
    },
    {
      rx: w * 0.74,
      ry: h * 0.35,
      thick: 0.095,
      fill: "rgba(24,34,72,0.28)",
      hiColor: VIOLET,
      hiO: 0.14,
      lamps: false,
      crowd: 110,
    },
  ];

  const bowlFills: StadiumGeo["bowlFills"] = [];
  const upperHighlights: StadiumGeo["upperHighlights"] = [];
  const lampCore: SkPoint[] = [];
  const lampCyan: SkPoint[] = [];
  const lampBlue: SkPoint[] = [];
  const glowLights: LightSpec[] = [];
  const seatTiny: SkPoint[] = [];
  const seatCyan: SkPoint[] = [];
  const seatBlue: SkPoint[] = [];
  const seatViolet: SkPoint[] = [];
  const seatBright: SkPoint[] = [];

  const inHeaderText = (x: number, y: number) =>
    y < h * 0.17 && x > w * 0.16 && x < w * 0.9;
  const inTitleZone = (x: number, y: number) =>
    y > h * 0.3 && y < h * 0.47 && x > w * 0.18 && x < w * 0.82;

  for (const tier of tiers) {
    const rxIn = tier.rx * (1 - tier.thick);
    const ryIn = tier.ry * (1 - tier.thick * 1.12);

    bowlFills.push({
      path: seatingBandFill(bowlCx, bowlCy, tier.rx, tier.ry, rxIn, ryIn, aLeft, aRight, 56),
      color: tier.fill,
    });

    // 上縁ハイライトのみ（帯の外側）
    upperHighlights.push({
      path: ellipseArcPath(bowlCx, bowlCy, tier.rx, tier.ry, aLeft, aRight, 58),
      color: tier.hiColor,
      width: tier.lamps ? 2.1 : 1.35,
      opacity: tier.hiO,
    });

    // 前縁ライト列（2 主段のみ・高密度）
    if (tier.lamps) {
      const lampCount = 56;
      for (let i = 0; i < lampCount; i++) {
        const t = i / (lampCount - 1);
        const a = aLeft + 0.04 + (aRight - aLeft - 0.08) * t;
        const [x, y] = ellipsePt(bowlCx, bowlCy, rxIn, ryIn, a);
        if (x < -3 || x > w + 3 || y < -2 || y > h * 0.42) continue;
        if (inTitleZone(x, y)) continue;
        if (inHeaderText(x, y) && Math.abs(x - w * 0.5) < w * 0.24) continue;

        const sideL = x < w * 0.48;
        const color = sideL
          ? i % 3 === 0
            ? CYAN
            : BLUE
          : i % 4 === 0
            ? CYAN
            : BLUE;
        const bright = i % 2 === 0 || i % 5 === 0;
        if (bright) {
          glowLights.push({
            x,
            y,
            r: 1.9 + rand() * 0.4,
            color,
            opacity: 0.92,
          });
          lampCore.push(vec(x, y));
        } else if (color === CYAN) {
          lampCyan.push(vec(x, y));
        } else {
          lampBlue.push(vec(x, y));
        }

        // わずかにずらした二列目で「列」感
        if (i % 2 === 0) {
          const [x2, y2] = ellipsePt(
            bowlCx,
            bowlCy,
            rxIn * 1.012,
            ryIn * 1.012,
            a + 0.008,
          );
          if (!inTitleZone(x2, y2) && !(inHeaderText(x2, y2) && Math.abs(x2 - w * 0.5) < w * 0.24)) {
            lampCyan.push(vec(x2, y2));
          }
        }
      }
    }

    // 観客テクスチャ（帯の内側を埋める）
    for (let i = 0; i < tier.crowd; i++) {
      const t = i / (tier.crowd - 1);
      const a = aLeft + 0.05 + (aRight - aLeft - 0.1) * t;
      const depth = rand() * tier.thick * 0.92;
      const rr = 1 - depth;
      const [x, y] = ellipsePt(bowlCx, bowlCy, tier.rx * rr, tier.ry * rr, a);
      const jx = x + (rand() - 0.5) * 1.6;
      const jy = y + (rand() - 0.5) * 1.2;
      if (jx < 1 || jx > w - 1 || jy < 1 || jy > h * 0.5) continue;
      if (inTitleZone(jx, jy)) continue;
      if (inHeaderText(jx, jy) && Math.abs(jx - w * 0.5) < w * 0.22) continue;
      if (Math.abs(jx / w - 0.5) < 0.09 && rand() > 0.18) continue;

      const pt = vec(jx, jy);
      const roll = rand();
      if (roll > 0.99) seatBright.push(pt);
      else if (roll > 0.78) seatCyan.push(pt);
      else if (roll > 0.55) seatBlue.push(pt);
      else if (roll > 0.42) seatViolet.push(pt);
      else seatTiny.push(pt);
    }
  }

  // —— 体積ビーム ——
  const beamEnd = h * 0.44;
  const beams = [
    {
      path: beamPath(w * 0.0, h * 0.01, w * 0.32, beamEnd, w * 0.15, w * 0.02),
      color: "rgba(59,130,246,0.14)",
      opacity: 0.9,
    },
    {
      path: beamPath(w * 0.12, -h * 0.02, w * 0.38, beamEnd * 0.92, w * 0.1, w * 0.014),
      color: "rgba(34,211,238,0.11)",
      opacity: 0.85,
    },
    {
      path: beamPath(w * 1.0, h * 0.01, w * 0.68, beamEnd, w * 0.15, w * 0.02),
      color: "rgba(59,130,246,0.1)",
      opacity: 0.88,
    },
    {
      path: beamPath(w * 0.88, -h * 0.02, w * 0.62, beamEnd * 0.92, w * 0.1, w * 0.014),
      color: "rgba(139,92,246,0.08)",
      opacity: 0.8,
    },
  ];

  // —— アリーナ床 ——
  const floorCx = w * 0.5;
  const floorCy = h * 0.8;
  const floorRx = w * 0.82;
  const floorRy = h * 0.2;

  const floorFill = Skia.Path.Make();
  floorFill.addOval(
    Skia.XYWHRect(floorCx - floorRx, floorCy - floorRy, floorRx * 2, floorRy * 2),
  );

  // オーバヘッド反射の横長シーン
  const floorSheen = seatingBandFill(
    floorCx,
    floorCy - h * 0.02,
    floorRx * 0.92,
    floorRy * 0.55,
    floorRx * 0.35,
    floorRy * 0.18,
    0.35,
    Math.PI - 0.35,
    24,
  );

  const floorRings: StadiumGeo["floorRings"] = [];
  for (let i = 0; i < 3; i++) {
    const s = 1 - i * 0.22;
    const p = Skia.Path.Make();
    p.addOval(
      Skia.XYWHRect(
        floorCx - floorRx * s,
        floorCy - floorRy * s,
        floorRx * 2 * s,
        floorRy * 2 * s,
      ),
    );
    floorRings.push({
      path: p,
      opacity: 0.22 - i * 0.04,
      width: i === 0 ? 1.7 : 0.95,
      color: i === 1 ? BLUE : CYAN,
    });
  }

  const floorGuides = Skia.Path.Make();
  const vanishY = h * 0.66;
  for (const gt of [-0.4, -0.16, 0.16, 0.4]) {
    floorGuides.moveTo(floorCx + gt * w * 0.06, vanishY);
    floorGuides.lineTo(floorCx + gt * w * 0.68, h + 4);
  }

  const corners = [
    { path: mkCorner(10, 10, 1, 1, 16), color: CYAN },
    { path: mkCorner(w - 10, 10, -1, 1, 16), color: VIOLET },
    { path: mkCorner(10, h - 10, 1, -1, 16), color: CYAN },
    { path: mkCorner(w - 10, h - 10, -1, -1, 16), color: BLUE },
  ];

  return {
    bowlFills,
    upperHighlights,
    lampCore,
    lampCyan,
    lampBlue,
    glowLights,
    beams,
    seatTiny,
    seatCyan,
    seatBlue,
    seatViolet,
    seatBright,
    floorFill,
    floorSheen,
    floorGlowL: { cx: w * 0.3, cy: h * 0.82, r: w * 0.3 },
    floorGlowR: { cx: w * 0.7, cy: h * 0.82, r: w * 0.28 },
    floorRings,
    floorGuides,
    corners,
  };
}

function DigitalStadiumSkiaArt({
  width: w,
  height: h,
}: {
  width: number;
  height: number;
}) {
  const geo = useMemo(() => buildStadiumGeo(w, h), [w, h]);

  return (
    <Canvas style={{ width: w, height: h }} pointerEvents="none">
      {/* 大気 */}
      <Rect x={0} y={0} width={w} height={h}>
        <LinearGradient
          start={vec(0, 0)}
          end={vec(0, h)}
          colors={[BG_TOP, BG_MID, BG_BOT]}
          positions={[0, 0.48, 1]}
        />
      </Rect>
      <Circle cx={w * 0.2} cy={h * 0.06} r={Math.min(w, h) * 0.4}>
        <RadialGradient
          c={vec(w * 0.2, h * 0.06)}
          r={Math.min(w, h) * 0.4}
          colors={["rgba(59,130,246,0.18)", "rgba(34,211,238,0.05)", "transparent"]}
          positions={[0, 0.45, 1]}
        />
      </Circle>
      <Circle cx={w * 0.82} cy={h * 0.07} r={Math.min(w, h) * 0.38}>
        <RadialGradient
          c={vec(w * 0.82, h * 0.07)}
          r={Math.min(w, h) * 0.38}
          colors={["rgba(139,92,246,0.12)", "transparent"]}
          positions={[0, 1]}
        />
      </Circle>

      {/* 1) 座席帯（塗りが主役） */}
      {geo.bowlFills.map((b, i) => (
        <Path key={`bf-${i}`} path={b.path} color={b.color} />
      ))}
      {/* 上縁ハイライトのみ */}
      {geo.upperHighlights.map((e, i) => (
        <Group key={`uh-${i}`}>
          <Path
            path={e.path}
            style="stroke"
            strokeWidth={e.width * 2.4}
            color={e.color}
            opacity={e.opacity * 0.28}
            strokeCap="round"
          >
            <BlurMask blur={3.2} style="normal" />
          </Path>
          <Path
            path={e.path}
            style="stroke"
            strokeWidth={e.width}
            color={e.color}
            opacity={e.opacity}
            strokeCap="round"
          />
        </Group>
      ))}

      {/* 2) 観客テクスチャ（ライト下の帯） */}
      <Points points={geo.seatTiny} mode="points" color="rgba(40,75,130,0.45)" strokeWidth={0.9} />
      <Points points={geo.seatBlue} mode="points" color="rgba(59,130,246,0.4)" strokeWidth={1.05} />
      <Points points={geo.seatCyan} mode="points" color="rgba(34,211,238,0.34)" strokeWidth={1.1} />
      <Points points={geo.seatViolet} mode="points" color="rgba(139,92,246,0.22)" strokeWidth={0.95} />
      <Points points={geo.seatBright} mode="points" color="rgba(210,230,255,0.42)" strokeWidth={1.45} />

      {/* 3) 前縁ライト列（最上） */}
      <Points points={geo.lampBlue} mode="points" color="rgba(59,130,246,0.78)" strokeWidth={2.9} />
      <Points points={geo.lampCyan} mode="points" color="rgba(34,211,238,0.82)" strokeWidth={3.05} />
      {geo.glowLights.map((l, i) => (
        <Group key={`g-${i}`}>
          <Circle cx={l.x} cy={l.y} r={l.r * 3.8} color={l.color} opacity={l.opacity * 0.3}>
            <BlurMask blur={7.5} style="normal" />
          </Circle>
          <Circle cx={l.x} cy={l.y} r={l.r * 1.7} color={l.color} opacity={l.opacity * 0.52}>
            <BlurMask blur={2.6} style="normal" />
          </Circle>
          <Circle cx={l.x} cy={l.y} r={l.r * 0.52} color="rgba(245,252,255,0.96)" opacity={0.92} />
        </Group>
      ))}
      <Points points={geo.lampCore} mode="points" color="rgba(240,250,255,0.9)" strokeWidth={3.2} />

      {/* ビーム */}
      {geo.beams.map((b, i) => (
        <Path key={`bm-${i}`} path={b.path} color={b.color} opacity={b.opacity}>
          <BlurMask blur={18} style="normal" />
        </Path>
      ))}

      {/* 中間の会場ヘイズ（暗く空だが空虚ではない） */}
      <Rect x={0} y={h * 0.28} width={w} height={h * 0.28}>
        <LinearGradient
          start={vec(0, h * 0.28)}
          end={vec(0, h * 0.56)}
          colors={[
            "rgba(20,55,120,0.1)",
            "rgba(6,14,32,0.34)",
            "rgba(4,10,24,0.18)",
            "transparent",
          ]}
          positions={[0, 0.35, 0.7, 1]}
        />
      </Rect>

      {/* 4) アリーナ床 */}
      <Path path={geo.floorFill}>
        <RadialGradient
          c={vec(w * 0.5, h * 0.8)}
          r={w * 0.68}
          colors={[
            "rgba(34,211,238,0.18)",
            "rgba(59,130,246,0.12)",
            "rgba(12,28,56,0.12)",
            "transparent",
          ]}
          positions={[0, 0.3, 0.6, 1]}
        />
      </Path>
      <Path path={geo.floorSheen} color="rgba(180,220,255,0.06)">
        <BlurMask blur={10} style="normal" />
      </Path>
      <Circle cx={geo.floorGlowL.cx} cy={geo.floorGlowL.cy} r={geo.floorGlowL.r} opacity={0.65}>
        <RadialGradient
          c={vec(geo.floorGlowL.cx, geo.floorGlowL.cy)}
          r={geo.floorGlowL.r}
          colors={["rgba(59,130,246,0.16)", "transparent"]}
          positions={[0, 1]}
        />
      </Circle>
      <Circle cx={geo.floorGlowR.cx} cy={geo.floorGlowR.cy} r={geo.floorGlowR.r} opacity={0.55}>
        <RadialGradient
          c={vec(geo.floorGlowR.cx, geo.floorGlowR.cy)}
          r={geo.floorGlowR.r}
          colors={["rgba(34,211,238,0.1)", "transparent"]}
          positions={[0, 1]}
        />
      </Circle>
      {geo.floorRings.map((r, i) => (
        <Path
          key={`fr-${i}`}
          path={r.path}
          style="stroke"
          strokeWidth={r.width}
          color={r.color}
          opacity={r.opacity}
        />
      ))}
      <Path
        path={geo.floorGuides}
        style="stroke"
        strokeWidth={0.8}
        color={CYAN}
        opacity={0.13}
        strokeCap="round"
      />

      {/* カード帯可読性（床は残す） */}
      <Rect x={0} y={h * 0.48} width={w} height={h * 0.28}>
        <LinearGradient
          start={vec(0, h * 0.48)}
          end={vec(0, h * 0.76)}
          colors={["rgba(2,6,17,0.48)", "rgba(2,6,17,0.16)", "transparent"]}
          positions={[0, 0.55, 1]}
        />
      </Rect>

      {/* 最小コーナー */}
      {geo.corners.map((c, i) => (
        <Path
          key={`c-${i}`}
          path={c.path}
          style="stroke"
          strokeWidth={1.05}
          color={c.color}
          opacity={0.28}
          strokeCap="round"
          strokeJoin="round"
        />
      ))}

      {/* 可読性 */}
      <Rect x={0} y={0} width={w} height={h * 0.24}>
        <LinearGradient
          start={vec(0, 0)}
          end={vec(0, h * 0.24)}
          colors={["rgba(2,6,17,0.68)", "rgba(2,6,17,0.32)", "transparent"]}
          positions={[0, 0.55, 1]}
        />
      </Rect>
      {/* WORLD CUP // STATS 可読マスク */}
      <Oval
        x={w * 0.1}
        y={h * 0.29}
        width={w * 0.8}
        height={h * 0.15}
        color="rgba(2,6,17,0.58)"
      >
        <BlurMask blur={18} style="normal" />
      </Oval>
      <Rect x={w * 0.04} y={h * 0.5} width={w * 0.92} height={h * 0.42}>
        <LinearGradient
          start={vec(0, h * 0.5)}
          end={vec(0, h * 0.92)}
          colors={[
            "rgba(2,6,17,0.22)",
            "rgba(2,6,17,0.5)",
            "rgba(2,6,17,0.38)",
            "rgba(2,6,17,0.1)",
          ]}
          positions={[0, 0.3, 0.72, 1]}
        />
      </Rect>
    </Canvas>
  );
}

function DigitalStadiumBackground({
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
    { backgroundColor: BG_TOP },
    style,
  ];

  return (
    <View style={rootStyle} onLayout={onLayout} pointerEvents="none">
      {ready ? <DigitalStadiumSkiaArt width={w} height={h} /> : null}
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

export default memo(DigitalStadiumBackground);
