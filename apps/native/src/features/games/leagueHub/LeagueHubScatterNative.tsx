import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import Svg, {
  Circle,
  Defs,
  G,
  Line,
  Path,
  Pattern,
  Rect,
  Text as SvgText,
} from "react-native-svg";
import type {
  LeagueHubAxis,
  LeagueHubQuadrants,
} from "../../../../../../lib/nba/leagueHub/leagueHubScatterPresets";
import { JERSEY_PATH_D, VIEWBOX_H, VIEWBOX_W } from "../jerseyHalftoneModel";
import {
  JERSEY_FRAME_WHITE,
  isBlackBodyPrimary,
} from "../../../../../../lib/jersey/jerseyThinTripleStripes";
import { CYBER_TAB_CYAN } from "../../rankings/CyberSlantedTabNative";
import { METRIC_FONT } from "../../rankings/rankingsUiTheme";
import { formatHubValue, playerNameStyle, type HubLang } from "./leagueHubUiNative";

export type HubScatterPoint = {
  id: string;
  x: number;
  y: number;
  label: string;
  color: string;
  /** ジャージの 2 色目 */
  secondary?: string;
  /** 0–1。ジャージの大きさ */
  scale?: number;
  /** お気に入り。点の代わりに ★ */
  star?: boolean;
  /** 母集団の外から足した点。軸の範囲に含めず、はみ出たら枠の端に置く */
  pinned?: boolean;
  /** 検索で足した選手。白縁で名前を優先 */
  highlight?: boolean;
};

type Props = {
  points: HubScatterPoint[];
  xAxis: LeagueHubAxis<string>;
  yAxis: LeagueHubAxis<string>;
  quadrants: LeagueHubQuadrants;
  lang: HubLang;
  marker: "jersey" | "dot";
  selectedId: string | null;
  /** 比較の 2 人目。1 人目と同じ見た目で選択扱い */
  secondId?: string | null;
  onSelect: (id: string | null) => void;
  /** 渡すと選択の切り替えをせず、タップした点（なければ null）をそのまま返す */
  onTap?: (id: string | null) => void;
  /** 各軸の両端に実データの最小・最大値を出す */
  showRange?: boolean;
  /** 選択中、選ばれていない点と名前を薄くする */
  dimOthers?: boolean;
  /** 図の隅に置く大きな薄い文字。強さの地図だけ DEF / OFF */
  watermarks?: { tl?: string; br?: string };
  /** 縦は欄の幅のまま、横だけ画面の外まではみ出させる */
  bleedPastScreen?: boolean;
  /** 暗い面と控えめな四隅の分類名（右上だけ緑）。選手のスタイルマップ */
  plainTone?: boolean;
};

type RangeTick = { v: number; at: number };

/** 画面端から、図の左右が外に出る量 */
const BLEED_PAST_SCREEN = 24;

const PAD = { l: 6, r: 6, t: 8, b: 20 } as const;
const DOT_R = 4.2;
const STAR_R = 7.5;
const LABEL_W = 160;
const TAP_RADIUS = 24;
const LABEL_TAP_SLOP = 8;
const JERSEY_ASPECT = VIEWBOX_W / VIEWBOX_H;
/** 隣に置けないときの引き出し幅 */
const CALLOUT_GAP = 12;
const TIGHT_GAP = 2;
const DIM_JERSEY = 0.32;
const LEADER_STROKE = "rgba(0,245,255,0.35)";
/** 分布図の面。シアン寄りの紺を透かし、ページのリング格子を見せる */
const PLOT_FILL = "rgba(20,50,76,0.62)";
/** 平均より良い側（上・右）の点線 */
const DASH_GOOD = "rgba(0,245,255,0.72)";
/** 平均より悪い側（下・左）の点線 */
const DASH_WEAK = "rgba(255,176,120,0.72)";
/** 大きな透かし（白）。分類名より一段奥に沈める */
const MARK_OPACITY = 0.09;
/** 四隅の分類名。白い透かしと見分けられるよう色を付ける（右上 = 両方良い / 左下 = 両方悪い） */
const QUAD_INK: Record<keyof LeagueHubQuadrants, string> = {
  tr: "rgba(110,231,183,0.85)",
  tl: "rgba(0,245,255,0.7)",
  br: "rgba(0,245,255,0.7)",
  bl: "rgba(255,176,120,0.7)",
};
const PLAIN_PLOT_FILL = "rgba(4,10,16,0.6)";
const PLAIN_QUAD_INK: Record<keyof LeagueHubQuadrants, string> = {
  tr: "rgba(110,231,183,0.55)",
  tl: "rgba(255,255,255,0.28)",
  br: "rgba(255,255,255,0.28)",
  bl: "rgba(255,255,255,0.28)",
};

type Box = { x0: number; y0: number; x1: number; y1: number };
type Anchor = "start" | "middle" | "end";
type LabelGeom = {
  i: number;
  x: number;
  y: number;
  anchor: Anchor;
  /** 名前タップの当たり判定 */
  box: Box;
  line: { x1: number; y1: number; x2: number; y2: number } | null;
};
type Side = { ax: -1 | 0 | 1; ay: -1 | 0 | 1; pri: number };

const LABEL_SIDES: Side[] = [
  { ax: 0, ay: 1, pri: 0 },
  { ax: 1, ay: 0, pri: 1 },
  { ax: -1, ay: 0, pri: 2 },
  { ax: 0, ay: -1, pri: 3 },
  { ax: 1, ay: 1, pri: 4 },
  { ax: -1, ay: 1, pri: 5 },
  { ax: 1, ay: -1, pri: 6 },
  { ax: -1, ay: -1, pri: 7 },
];

function overlaps(a: Box, b: Box): boolean {
  return a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;
}

function distToBox(b: Box, x: number, y: number): number {
  const dx = Math.max(b.x0 - x, 0, x - b.x1);
  const dy = Math.max(b.y0 - y, 0, y - b.y1);
  return Math.hypot(dx, dy);
}

function insidePlot(box: Box, right: number, plotH: number, left = PAD.l - 4): boolean {
  return (
    box.x0 >= left &&
    box.x1 <= right - 2 &&
    box.y0 >= 0 &&
    box.y1 <= PAD.t + plotH + 2
  );
}

type QuadSpec = readonly [keyof LeagueHubQuadrants, number, number, "start" | "end"];

/** 四隅の分類名の位置。透かしとは重なってよい（色で見分ける） */
function quadrantSpecs(originX: number, plotW: number, plotH: number): QuadSpec[] {
  return [
    ["tr", originX + plotW - 6, PAD.t + 13, "end"],
    ["tl", originX + 6, PAD.t + 13, "start"],
    ["br", originX + plotW - 6, PAD.t + plotH - 6, "end"],
    ["bl", originX + 6, PAD.t + plotH - 6, "start"],
  ];
}

function quadrantObstacles(
  quadrants: LeagueHubQuadrants,
  lang: HubLang,
  specs: QuadSpec[]
): Box[] {
  return specs.map(([key, x, y, anchor]) => {
    const w = quadrants[key][lang].length * (lang === "ja" ? 10.5 : 7) + 8;
    const x0 = anchor === "end" ? x - w : x;
    return { x0, y0: y - 12, x1: x0 + w, y1: y + 3 };
  });
}

function outwardOf(
  placed: Array<{ cx: number; cy: number; size: number }>,
  index: number
): { x: number; y: number } {
  const m = placed[index]!;
  let ox = 0;
  let oy = 0;
  for (let j = 0; j < placed.length; j++) {
    if (j === index) continue;
    const n = placed[j]!;
    const dx = m.cx - n.cx;
    const dy = m.cy - n.cy;
    const reach = (m.size + n.size) * 0.75;
    const d2 = dx * dx + dy * dy;
    if (d2 < 4 || d2 > reach * reach) continue;
    const d = Math.sqrt(d2);
    ox += dx / d;
    oy += dy / d;
  }
  return { x: ox, y: oy };
}

function jerseySlot(
  cx: number,
  cy: number,
  size: number,
  gap: number,
  side: Side,
  fontSize: number,
  w: number,
  h: number
): { box: Box; x: number; y: number; anchor: Anchor } {
  const halfW = (size * JERSEY_ASPECT) / 2;
  const halfH = size / 2;
  const anchor: Anchor = side.ax > 0 ? "start" : side.ax < 0 ? "end" : "middle";
  if (side.ax === 0) {
    const y0 = side.ay > 0 ? cy + halfH + gap : cy - halfH - gap - h;
    return {
      box: { x0: cx - w / 2, y0, x1: cx + w / 2, y1: y0 + h },
      x: cx,
      y: y0 + fontSize,
      anchor,
    };
  }
  const yShift = side.ay === 0 ? 0 : side.ay * (halfH * 0.45 + gap * 0.35);
  const y0 = cy - h / 2 + yShift;
  const xEdge = side.ax > 0 ? cx + halfW + gap : cx - halfW - gap;
  const box =
    side.ax > 0
      ? { x0: xEdge, y0, x1: xEdge + w, y1: y0 + h }
      : { x0: xEdge - w, y0, x1: xEdge, y1: y0 + h };
  return { box, x: xEdge, y: y0 + fontSize, anchor };
}

function leaderLine(
  cx: number,
  cy: number,
  size: number,
  box: Box
): { x1: number; y1: number; x2: number; y2: number } | null {
  const halfW = (size * JERSEY_ASPECT) / 2;
  const halfH = size / 2;
  const lx = (box.x0 + box.x1) / 2;
  const ly = (box.y0 + box.y1) / 2;
  const dx = lx - cx;
  const dy = ly - cy;
  const len = Math.hypot(dx, dy);
  if (len < 1) return null;
  const ux = dx / len;
  const uy = dy / len;
  const jerseyHit = Math.min(
    Math.abs(ux) < 1e-6 ? Infinity : halfW / Math.abs(ux),
    Math.abs(uy) < 1e-6 ? Infinity : halfH / Math.abs(uy)
  );
  const labelHit = Math.min(
    Math.abs(ux) < 1e-6 ? Infinity : (box.x1 - box.x0) / 2 / Math.abs(ux),
    Math.abs(uy) < 1e-6 ? Infinity : (box.y1 - box.y0) / 2 / Math.abs(uy)
  );
  const x1 = cx + ux * jerseyHit;
  const y1 = cy + uy * jerseyHit;
  const x2 = lx - ux * labelHit;
  const y2 = ly - uy * labelHit;
  if (Math.hypot(x2 - x1, y2 - y1) < 4) return null;
  return { x1, y1, x2, y2 };
}

function lineCrossesMarker(
  line: { x1: number; y1: number; x2: number; y2: number },
  index: number,
  markerBoxes: Box[]
): boolean {
  for (const t of [0.35, 0.65]) {
    const x = line.x1 + (line.x2 - line.x1) * t;
    const y = line.y1 + (line.y2 - line.y1) * t;
    if (
      markerBoxes.some(
        (b, j) => j !== index && x >= b.x0 && x <= b.x1 && y >= b.y0 && y <= b.y1
      )
    ) {
      return true;
    }
  }
  return false;
}

/** Oxanium Bold 700 の実測（em）。インクの右端と左端 */
const MARK_GLYPH: Record<string, { lsb: number; xMax: number }> = {
  A: { lsb: 0.018, xMax: 0.648 },
  B: { lsb: 0.082, xMax: 0.596 },
  C: { lsb: 0.072, xMax: 0.574 },
  D: { lsb: 0.082, xMax: 0.626 },
  E: { lsb: 0.082, xMax: 0.554 },
  F: { lsb: 0.082, xMax: 0.554 },
  G: { lsb: 0.072, xMax: 0.616 },
  H: { lsb: 0.082, xMax: 0.626 },
  I: { lsb: 0.082, xMax: 0.226 },
  J: { lsb: 0.052, xMax: 0.536 },
  K: { lsb: 0.082, xMax: 0.644 },
  L: { lsb: 0.082, xMax: 0.524 },
  M: { lsb: 0.082, xMax: 0.814 },
  N: { lsb: 0.082, xMax: 0.656 },
  O: { lsb: 0.072, xMax: 0.636 },
  P: { lsb: 0.082, xMax: 0.586 },
  Q: { lsb: 0.072, xMax: 0.636 },
  R: { lsb: 0.082, xMax: 0.606 },
  S: { lsb: 0.052, xMax: 0.536 },
  T: { lsb: 0.024, xMax: 0.588 },
  U: { lsb: 0.076, xMax: 0.62 },
  V: { lsb: 0.018, xMax: 0.638 },
  W: { lsb: 0.028, xMax: 0.928 },
  X: { lsb: 0.028, xMax: 0.618 },
  Y: { lsb: 0.018, xMax: 0.598 },
  Z: { lsb: 0.042, xMax: 0.566 },
  "&": { lsb: 0.062, xMax: 0.636 },
  "0": { lsb: 0.052, xMax: 0.526 },
  "1": { lsb: 0.08, xMax: 0.514 },
  "2": { lsb: 0.052, xMax: 0.526 },
  "3": { lsb: 0.062, xMax: 0.526 },
  "4": { lsb: 0.052, xMax: 0.526 },
  "5": { lsb: 0.042, xMax: 0.526 },
  "6": { lsb: 0.052, xMax: 0.526 },
  "7": { lsb: 0.052, xMax: 0.526 },
  "8": { lsb: 0.052, xMax: 0.526 },
  "9": { lsb: 0.052, xMax: 0.526 },
  /** 語間。前後のインクの空きと合わせて送り幅 0.24 em 相当 */
  " ": { lsb: 0, xMax: 0.13 },
};
/** インクとインクのあいだ。字幅に関係なく同じ空き */
const MARK_INK_GAP = 0.055;

/** 1 em あたりのインク幅（先頭の左端から末尾の右端まで） */
function markInkEm(text: string): number {
  const chars = Array.from(text);
  if (chars.length === 0) return 0;
  const first = MARK_GLYPH[chars[0]!] ?? { lsb: 0.08, xMax: 0.56 };
  const last = MARK_GLYPH[chars[chars.length - 1]!] ?? { lsb: 0.08, xMax: 0.56 };
  let em = last.xMax - first.lsb;
  for (let i = 0; i < chars.length - 1; i++) em += gapBeforeNext(chars[i]!, chars[i + 1]!, 1);
  return em;
}

function gapBeforeNext(prev: string, next: string, size: number): number {
  const a = MARK_GLYPH[prev] ?? { lsb: 0.08, xMax: 0.56 };
  const b = MARK_GLYPH[next] ?? { lsb: 0.08, xMax: 0.56 };
  return size * (a.xMax + MARK_INK_GAP - b.lsb);
}

/** 大きな透かし。SvgText の letterSpacing は乗らないので1文字ずつ置く */
function TightCornerMark({
  text,
  edgeX,
  y,
  size,
  align,
}: {
  text: string;
  edgeX: number;
  y: number;
  size: number;
  align: "start" | "end";
}) {
  const chars = Array.from(text);
  const xs: number[] = [];
  if (align === "start") {
    let x = edgeX;
    chars.forEach((ch, i) => {
      xs.push(x);
      const next = chars[i + 1];
      if (next) x += gapBeforeNext(ch, next, size);
    });
  } else {
    const last = chars[chars.length - 1] ?? "F";
    const lastBox = MARK_GLYPH[last] ?? { lsb: 0.08, xMax: 0.55 };
    let x = edgeX - size * lastBox.xMax;
    for (let i = chars.length - 1; i >= 0; i--) {
      xs[i] = x;
      const prev = chars[i - 1];
      if (prev) x -= gapBeforeNext(prev, chars[i]!, size);
    }
  }
  return chars.map((ch, i) => (
    <SvgText
      key={`${align}-${i}`}
      x={xs[i]}
      y={y}
      fontSize={size}
      fontWeight="800"
      fontFamily={METRIC_FONT}
      fill="#FFFFFF"
    >
      {ch}
    </SvgText>
  ));
}

function domain(values: number[]): { min: number; max: number; avg: number } {
  let min = Math.min(...values);
  let max = Math.max(...values);
  const avg = values.reduce((s, v) => s + v, 0) / values.length;
  if (max - min < 1e-9) {
    min -= 1;
    max += 1;
  }
  const pad = (max - min) * 0.08;
  return { min: min - pad, max: max + pad, avg };
}

function starPath(cx: number, cy: number, r: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * 0.45;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    pts.push(`${(cx + rad * Math.cos(a)).toFixed(2)},${(cy + rad * Math.sin(a)).toFixed(2)}`);
  }
  return `M${pts.join("L")}Z`;
}

export default function LeagueHubScatterNative({
  points,
  xAxis,
  yAxis,
  quadrants,
  lang,
  marker,
  selectedId,
  secondId = null,
  onSelect,
  onTap,
  showRange = false,
  dimOthers = true,
  watermarks,
  bleedPastScreen,
  plainTone = false,
}: Props) {
  const isSel = (id: string) => id === selectedId || (secondId != null && id === secondId);
  const screenW = useWindowDimensions().width;
  const [columnW, setColumnW] = useState(0);
  const gutter = columnW > 0 ? Math.max(0, (screenW - columnW) / 2) : 0;
  const offscreen = bleedPastScreen ? BLEED_PAST_SCREEN : 0;
  const bleed = offscreen > 0 ? gutter + offscreen : 0;
  const width = columnW + bleed * 2;
  const height = Math.round(columnW * (marker === "jersey" ? 0.95 : 1.05));
  const plotW = Math.max(0, width - PAD.l - PAD.r);
  const plotH = Math.max(0, height - PAD.t - PAD.b);
  /** 横に伸ばしても、点の置き場所は伸ばす前の幅のまま */
  const dataPlotW = Math.max(0, columnW - PAD.l - PAD.r);
  const dataX = bleed + PAD.l;
  const labelLeft = offscreen > 0 ? offscreen : PAD.l - 4;
  const labelRight = offscreen > 0 ? width - offscreen : width;
  const yAvgX = offscreen > 0 ? offscreen + 8 : PAD.l + 4;
  /** 画面内に見えている左端。軸の目盛りはここから */
  const visibleLeft = offscreen > 0 ? offscreen : PAD.l;

  const tlMark = watermarks?.tl;
  const brMark = watermarks?.br;
  /** DEF / OFF の大きさが基準。長い語は対角の語とぶつからない幅まで縮める */
  const markBase = Math.min(plotW, plotH) * 0.3;
  const markSizeOf = (text: string) => {
    const em = markInkEm(text);
    return em > 0 ? Math.min(markBase, (dataPlotW * 0.58) / em) : markBase;
  };
  const tlSize = tlMark ? markSizeOf(tlMark) : markBase;
  const brSize = brMark ? markSizeOf(brMark) : markBase;
  const quadSpecs = quadrantSpecs(dataX, dataPlotW, plotH);

  const layout = useMemo(() => {
    if (columnW <= 0 || points.length === 0) return null;
    const base = points.some((p) => !p.pinned) ? points.filter((p) => !p.pinned) : points;
    const dx = domain(base.map((p) => p.x));
    const dy = domain(base.map((p) => p.y));
    const px = (v: number) =>
      dataX + ((xAxis.invert ? dx.max - v : v - dx.min) / (dx.max - dx.min)) * dataPlotW;
    const py = (v: number) =>
      PAD.t + ((yAxis.invert ? v - dy.min : dy.max - v) / (dy.max - dy.min)) * plotH;
    const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

    const placed = points.map((p) => {
      const size =
        marker === "jersey" ? 20 + (p.scale ?? 0.5) * 12 : p.star ? STAR_R * 2 : DOT_R * 2;
      const half = size / 2;
      return {
        p,
        cx: clamp(px(p.x), dataX + half, dataX + dataPlotW - half),
        cy: clamp(py(p.y), PAD.t + half, PAD.t + plotH - half),
        size,
      };
    });
    const avgX = px(dx.avg);
    const avgY = py(dy.avg);

    const markerBoxes: Box[] = placed.map((m) => {
      const halfW = marker === "jersey" ? (m.size * JERSEY_ASPECT) / 2 : m.size / 2;
      const halfH = m.size / 2;
      return {
        x0: m.cx - halfW,
        y0: m.cy - halfH,
        x1: m.cx + halfW,
        y1: m.cy + halfH,
      };
    });

    const fontSize = marker === "jersey" ? 9 : 10;
    const order = placed
      .map((m, i) => ({
        i,
        d: ((m.cx - avgX) / dataPlotW) ** 2 + ((m.cy - avgY) / plotH) ** 2,
        sel: isSel(m.p.id),
        star: !!m.p.star || !!m.p.highlight,
      }))
      .sort(
        (a, b) => Number(b.sel) - Number(a.sel) || Number(b.star) - Number(a.star) || b.d - a.d
      );

    const labelBoxes: Box[] = [
      { x0: yAvgX, y0: avgY - 14, x1: yAvgX + 40, y1: avgY - 1 },
    ];
    labelBoxes.push(...quadrantObstacles(quadrants, lang, quadSpecs));

    const xTicks: RangeTick[] = [];
    const yTicks: RangeTick[] = [];
    if (showRange) {
      const xs = base.map((p) => p.x);
      const ys = base.map((p) => p.y);
      const avgLabelW = (`AVG ${formatHubValue(dx.avg, xAxis.format)}`.length * 9 * 0.62) / 2 + 4;
      for (const v of [Math.min(...xs), Math.max(...xs)]) {
        const at = px(v);
        const w = (formatHubValue(v, xAxis.format).length * 9 * 0.62) / 2;
        if (Math.abs(at - avgX) > avgLabelW + w) xTicks.push({ v, at });
      }
      for (const v of [Math.min(...ys), Math.max(...ys)]) {
        const at = py(v);
        if (Math.abs(at - avgY) < 16) continue;
        yTicks.push({ v, at });
        labelBoxes.push({ x0: visibleLeft, y0: at - 6, x1: visibleLeft + 40, y1: at + 6 });
      }
    }
    const labels: LabelGeom[] = [];
    const fits = (box: Box, index: number, allowMarker: boolean, allowLabel: boolean) => {
      if (!insidePlot(box, labelRight, plotH, labelLeft)) return false;
      if (!allowLabel && labelBoxes.some((b) => overlaps(b, box))) return false;
      if (!allowMarker && markerBoxes.some((b, j) => j !== index && overlaps(b, box))) return false;
      return true;
    };
    for (const { i, sel } of order) {
      const m = placed[i]!;
      const w = m.p.label.length * fontSize * 0.68 + 2;
      const h = fontSize + 2;
      if (marker !== "jersey") {
        const half = m.size / 2;
        const cands: Array<{ box: Box; x: number; y: number; anchor: Anchor }> = [
          {
            box: { x0: m.cx + half + 2, y0: m.cy - h / 2, x1: m.cx + half + 2 + w, y1: m.cy + h / 2 },
            x: m.cx + half + 2,
            y: m.cy + fontSize * 0.35,
            anchor: "start",
          },
          {
            box: { x0: m.cx - w / 2, y0: m.cy + half + 1, x1: m.cx + w / 2, y1: m.cy + half + 1 + h },
            x: m.cx,
            y: m.cy + half + fontSize,
            anchor: "middle",
          },
          {
            box: { x0: m.cx - half - 2 - w, y0: m.cy - h / 2, x1: m.cx - half - 2, y1: m.cy + h / 2 },
            x: m.cx - half - 2,
            y: m.cy + fontSize * 0.35,
            anchor: "end",
          },
          {
            box: { x0: m.cx - w / 2, y0: m.cy - half - 1 - h, x1: m.cx + w / 2, y1: m.cy - half - 1 },
            x: m.cx,
            y: m.cy - half - 3,
            anchor: "middle",
          },
        ];
        const force = sel || !!m.p.highlight;
        const inside = (c: (typeof cands)[number]) =>
          insidePlot(c.box, labelRight, plotH, labelLeft);
        const pick =
          cands.find((c) => fits(c.box, i, false, false)) ??
          (force ? (cands.find(inside) ?? cands[0]) : undefined);
        if (!pick) continue;
        labelBoxes.push(pick.box);
        labels.push({ i, x: pick.x, y: pick.y, anchor: pick.anchor, box: pick.box, line: null });
        continue;
      }

      const away = outwardOf(placed, i);
      const crowded = Math.hypot(away.x, away.y) > 0.35;
      const sides = [...LABEL_SIDES].sort((a, b) => {
        if (!crowded) return a.pri - b.pri;
        const score = (side: Side) => {
          const len = Math.hypot(side.ax, side.ay);
          return (side.ax / len) * away.x + (side.ay / len) * away.y - side.pri * 0.02;
        };
        return score(b) - score(a);
      });
      const take = (
        gap: number,
        allowMarker: boolean,
        allowLabel: boolean,
        withLine: boolean
      ): LabelGeom | null => {
        for (const side of sides) {
          const slot = jerseySlot(m.cx, m.cy, m.size, gap, side, fontSize, w, h);
          if (!fits(slot.box, i, allowMarker, allowLabel)) continue;
          const line = withLine ? leaderLine(m.cx, m.cy, m.size, slot.box) : null;
          if (withLine && (!line || lineCrossesMarker(line, i, markerBoxes))) continue;
          return { i, ...slot, line };
        }
        return null;
      };
      const chosen =
        take(TIGHT_GAP, false, false, false) ??
        take(CALLOUT_GAP, false, false, true) ??
        take(CALLOUT_GAP, true, false, true) ??
        (() => {
          for (const side of sides) {
            const slot = jerseySlot(m.cx, m.cy, m.size, CALLOUT_GAP, side, fontSize, w, h);
            if (!insidePlot(slot.box, labelRight, plotH, labelLeft)) continue;
            return {
              i,
              ...slot,
              line: leaderLine(m.cx, m.cy, m.size, slot.box),
            };
          }
          const side = sides[0]!;
          const slot = jerseySlot(m.cx, m.cy, m.size, CALLOUT_GAP, side, fontSize, w, h);
          return {
            i,
            ...slot,
            line: leaderLine(m.cx, m.cy, m.size, slot.box),
          };
        })();
      labelBoxes.push(chosen.box);
      labels.push(chosen);
    }

    return { dx, dy, px, py, placed, avgX, avgY, labels, fontSize, xTicks, yTicks };
  }, [
    columnW,
    points,
    xAxis.invert,
    xAxis.format,
    yAxis.invert,
    plotW,
    plotH,
    dataPlotW,
    dataX,
    marker,
    selectedId,
    secondId,
    showRange,
    quadrants,
    lang,
    watermarks?.tl,
    watermarks?.br,
    labelLeft,
    labelRight,
    yAvgX,
    visibleLeft,
  ]);

  const hasSelection =
    dimOthers && selectedId != null && points.some((p) => p.id === selectedId);

  const onPress = (lx: number, ly: number) => {
    if (!layout) return;
    let best: { id: string; d: number } | null = null;
    for (const m of layout.placed) {
      const d = Math.hypot(m.cx - lx, m.cy - ly);
      if (d <= Math.max(TAP_RADIUS, m.size / 2 + 6) && (!best || d < best.d)) {
        best = { id: m.p.id, d };
      }
    }
    for (const l of layout.labels) {
      const d = distToBox(l.box, lx, ly);
      if (d <= LABEL_TAP_SLOP && (!best || d < best.d)) {
        best = { id: layout.placed[l.i]!.p.id, d };
      }
    }
    if (onTap) {
      onTap(best?.id ?? null);
      return;
    }
    onSelect(best && best.id !== selectedId ? best.id : null);
  };

  const q = (c: { ja: string; en: string }) => c[lang];

  const defX = offscreen > 0 ? offscreen - 4 : PAD.l - 4;
  const offX = offscreen > 0 ? width - offscreen - 4 : PAD.l + plotW - 2;

  return (
    <View
      style={styles.frame}
      onLayout={(e) => {
        const next = Math.round(e.nativeEvent.layout.width);
        setColumnW((prev) => (prev === next ? prev : next));
      }}
    >
      {tlMark || brMark ? null : <Text style={styles.yTitle}>↑ {q(yAxis.label)}</Text>}
      <View style={{ height: height || 260, overflow: "visible" }}>
      <Pressable
        onPress={(e) => onPress(e.nativeEvent.locationX, e.nativeEvent.locationY)}
        style={{
          position: "absolute",
          left: -bleed,
          top: 0,
          width: width || undefined,
          height: height || 260,
          overflow: "visible",
        }}
      >
        {layout ? (
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            <Svg width={width} height={height}>
              <Rect
                x={PAD.l}
                y={PAD.t}
                width={plotW}
                height={plotH}
                fill={plainTone ? PLAIN_PLOT_FILL : PLOT_FILL}
                stroke="rgba(0,245,255,0.18)"
                strokeWidth={1}
              />
              {tlMark || brMark ? (
                <>
                  <Line
                    x1={layout.avgX}
                    x2={layout.avgX}
                    y1={PAD.t}
                    y2={layout.avgY}
                    stroke={DASH_GOOD}
                    strokeDasharray="4 4"
                    strokeWidth={1}
                  />
                  <Line
                    x1={layout.avgX}
                    x2={layout.avgX}
                    y1={layout.avgY}
                    y2={PAD.t + plotH}
                    stroke={DASH_WEAK}
                    strokeDasharray="4 4"
                    strokeWidth={1}
                  />
                  <Line
                    x1={PAD.l}
                    x2={layout.avgX}
                    y1={layout.avgY}
                    y2={layout.avgY}
                    stroke={DASH_WEAK}
                    strokeDasharray="4 4"
                    strokeWidth={1}
                  />
                  <Line
                    x1={layout.avgX}
                    x2={PAD.l + plotW}
                    y1={layout.avgY}
                    y2={layout.avgY}
                    stroke={DASH_GOOD}
                    strokeDasharray="4 4"
                    strokeWidth={1}
                  />
                </>
              ) : (
                <>
                  <Line
                    x1={layout.avgX}
                    x2={layout.avgX}
                    y1={PAD.t}
                    y2={PAD.t + plotH}
                    stroke="rgba(0,245,255,0.35)"
                    strokeDasharray="4 4"
                    strokeWidth={1}
                  />
                  <Line
                    x1={PAD.l}
                    x2={PAD.l + plotW}
                    y1={layout.avgY}
                    y2={layout.avgY}
                    stroke="rgba(0,245,255,0.35)"
                    strokeDasharray="4 4"
                    strokeWidth={1}
                  />
                </>
              )}
              {tlMark || brMark ? (
                <G opacity={MARK_OPACITY}>
                  {tlMark ? (
                    <TightCornerMark
                      text={tlMark}
                      edgeX={defX}
                      y={PAD.t + tlSize * 0.72}
                      size={tlSize}
                      align="start"
                    />
                  ) : null}
                  {brMark ? (
                    <TightCornerMark
                      text={brMark}
                      edgeX={offX}
                      y={PAD.t + plotH - 4}
                      size={brSize}
                      align="end"
                    />
                  ) : null}
                </G>
              ) : null}
              {quadSpecs.map(([k, x, y, anchor]) => (
                <SvgText
                  key={k}
                  x={x}
                  y={y}
                  textAnchor={anchor}
                  fontSize={10}
                  fontWeight="800"
                  fill={(plainTone ? PLAIN_QUAD_INK : QUAD_INK)[k]}
                >
                  {q(quadrants[k])}
                </SvgText>
              ))}
              <SvgText
                x={layout.avgX}
                y={PAD.t + plotH + 14}
                textAnchor="middle"
                fontSize={9}
                fill="rgba(0,245,255,0.6)"
                fontFamily={METRIC_FONT}
              >
                {`AVG ${formatHubValue(layout.dx.avg, xAxis.format)}`}
              </SvgText>
              <SvgText
                x={yAvgX}
                y={layout.avgY - 4}
                textAnchor="start"
                fontSize={9}
                fill="rgba(0,245,255,0.6)"
                fontFamily={METRIC_FONT}
              >
                {formatHubValue(layout.dy.avg, yAxis.format)}
              </SvgText>
              {layout.xTicks.map((t, i) => (
                <G key={`xt-${i}`}>
                  <Line
                    x1={t.at}
                    x2={t.at}
                    y1={PAD.t + plotH}
                    y2={PAD.t + plotH + 3}
                    stroke="rgba(255,255,255,0.35)"
                    strokeWidth={1}
                  />
                  <SvgText
                    x={t.at}
                    y={PAD.t + plotH + 14}
                    textAnchor="middle"
                    fontSize={9}
                    fill="rgba(255,255,255,0.4)"
                    fontFamily={METRIC_FONT}
                  >
                    {formatHubValue(t.v, xAxis.format)}
                  </SvgText>
                </G>
              ))}
              {layout.yTicks.map((t, i) => (
                <G key={`yt-${i}`}>
                  <Line
                    x1={visibleLeft}
                    x2={visibleLeft + 3}
                    y1={t.at}
                    y2={t.at}
                    stroke="rgba(255,255,255,0.35)"
                    strokeWidth={1}
                  />
                  <SvgText
                    x={visibleLeft + 5}
                    y={t.at + 3}
                    textAnchor="start"
                    fontSize={9}
                    fill="rgba(255,255,255,0.4)"
                    fontFamily={METRIC_FONT}
                  >
                    {formatHubValue(t.v, yAxis.format)}
                  </SvgText>
                </G>
              ))}
              {marker === "dot"
                ? layout.placed
                    .filter((m) => !m.p.star)
                    .map((m) => {
                      const sel = isSel(m.p.id);
                      return (
                        <Circle
                          key={m.p.id}
                          cx={m.cx}
                          cy={m.cy}
                          r={sel || m.p.highlight ? DOT_R + 1.5 : DOT_R}
                          fill={m.p.color}
                          stroke={m.p.highlight ? "#fff" : "#050508"}
                          strokeWidth={m.p.highlight ? 1.5 : 1}
                          opacity={hasSelection && !sel ? 0.4 : 1}
                        />
                      );
                    })
                : null}
              {marker === "dot"
                ? layout.placed
                    .filter((m) => m.p.star)
                    .map((m) => {
                      const sel = isSel(m.p.id);
                      return (
                        <Path
                          key={`s-${m.p.id}`}
                          d={starPath(m.cx, m.cy, sel ? STAR_R + 1.5 : STAR_R)}
                          fill={m.p.color}
                          stroke="#fff"
                          strokeWidth={1}
                          strokeLinejoin="round"
                          opacity={hasSelection && !sel ? 0.5 : 1}
                        />
                      );
                    })
                : null}
              {marker === "jersey" ? (
                <Defs>
                  <Pattern
                    id="hubJerseyMesh"
                    patternUnits="userSpaceOnUse"
                    width={12}
                    height={12}
                  >
                    <Circle cx={6} cy={6} r={3.2} fill="rgba(0,0,0,0.38)" />
                  </Pattern>
                </Defs>
              ) : null}
              {marker === "jersey"
                ? [...layout.placed]
                    .sort((a, b) => Number(isSel(a.p.id)) - Number(isSel(b.p.id)))
                    .map((m) => {
                    const sel = isSel(m.p.id);
                    const k = m.size / VIEWBOX_H;
                    const tx = m.cx - (VIEWBOX_W * k) / 2;
                    const ty = m.cy - m.size / 2;
                    const black = isBlackBodyPrimary(m.p.color);
                    return (
                      <G
                        key={m.p.id}
                        transform={`translate(${tx} ${ty}) scale(${k})`}
                        opacity={hasSelection && !sel ? DIM_JERSEY : 1}
                      >
                        <Path d={JERSEY_PATH_D} fill={m.p.color} />
                        <Path d={JERSEY_PATH_D} fill="url(#hubJerseyMesh)" />
                        <Path
                          d={JERSEY_PATH_D}
                          fill="none"
                          stroke="#050508"
                          strokeWidth={1.3 / k}
                          strokeLinejoin="round"
                        />
                        <Path
                          d={JERSEY_PATH_D}
                          fill="none"
                          stroke={black ? JERSEY_FRAME_WHITE : m.p.secondary ?? m.p.color}
                          strokeOpacity={black ? 0.65 : 0.9}
                          strokeWidth={1 / k}
                          strokeLinejoin="round"
                        />
                      </G>
                    );
                  })
                : null}
              {layout.labels.map((lb) => {
                if (!lb.line) return null;
                const m = layout.placed[lb.i]!;
                const dim = hasSelection && !isSel(m.p.id);
                return (
                  <Line
                    key={`ln-${m.p.id}`}
                    x1={lb.line.x1}
                    y1={lb.line.y1}
                    x2={lb.line.x2}
                    y2={lb.line.y2}
                    stroke={LEADER_STROKE}
                    strokeWidth={1}
                    opacity={dim ? DIM_JERSEY : 1}
                  />
                );
              })}
              {layout.placed
                .filter((m) => isSel(m.p.id))
                .map((m) => (
                  <Circle
                    key={`ring-${m.p.id}`}
                    cx={m.cx}
                    cy={m.cy}
                    r={m.size / 2 + 5}
                    fill="none"
                    stroke={CYBER_TAB_CYAN}
                    strokeWidth={1.6}
                  />
                ))}
            </Svg>
            {layout.labels.map(({ i, x, y, anchor }) => {
              const m = layout.placed[i]!;
              const sel = isSel(m.p.id);
              return (
                <Text
                  key={`l-${m.p.id}`}
                  numberOfLines={1}
                  style={[
                    styles.label,
                    playerNameStyle,
                    {
                      left: anchor === "start" ? x : anchor === "end" ? x - LABEL_W : x - LABEL_W / 2,
                      top: y - layout.fontSize,
                      fontSize: layout.fontSize,
                      lineHeight: layout.fontSize + 2,
                      textAlign: anchor === "start" ? "left" : anchor === "end" ? "right" : "center",
                      color: sel ? CYBER_TAB_CYAN : "rgba(255,255,255,0.82)",
                      opacity: hasSelection && !sel ? (marker === "jersey" ? DIM_JERSEY : 0.45) : 1,
                    },
                  ]}
                >
                  {m.p.label}
                </Text>
              );
            })}
          </View>
        ) : null}
      </Pressable>
      </View>
      {tlMark || brMark ? null : <Text style={styles.xTitle}>{q(xAxis.label)} →</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    overflow: "visible",
  },
  yTitle: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.6)",
    fontSize: 10,
    fontWeight: "700",
    marginBottom: 2,
  },
  label: {
    position: "absolute",
    width: LABEL_W,
    includeFontPadding: false,
  },
  xTitle: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.6)",
    fontSize: 10,
    fontWeight: "700",
    textAlign: "right",
    marginTop: 2,
  },
});
