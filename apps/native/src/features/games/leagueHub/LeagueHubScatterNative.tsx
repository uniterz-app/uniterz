import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
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
};

type RangeTick = { v: number; at: number };

const PAD = { l: 6, r: 6, t: 8, b: 20 } as const;
const DOT_R = 4.2;
const STAR_R = 7.5;
const LABEL_W = 160;
const TAP_RADIUS = 24;
const LABEL_TAP_SLOP = 8;

type Box = { x0: number; y0: number; x1: number; y1: number };

function overlaps(a: Box, b: Box): boolean {
  return a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;
}

function distToBox(b: Box, x: number, y: number): number {
  const dx = Math.max(b.x0 - x, 0, x - b.x1);
  const dy = Math.max(b.y0 - y, 0, y - b.y1);
  return Math.hypot(dx, dy);
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
}: Props) {
  const isSel = (id: string) => id === selectedId || (secondId != null && id === secondId);
  const [width, setWidth] = useState(0);
  const height = Math.round(width * (marker === "jersey" ? 0.95 : 1.05));
  const plotW = Math.max(0, width - PAD.l - PAD.r);
  const plotH = Math.max(0, height - PAD.t - PAD.b);

  const layout = useMemo(() => {
    if (width <= 0 || points.length === 0) return null;
    const base = points.some((p) => !p.pinned) ? points.filter((p) => !p.pinned) : points;
    const dx = domain(base.map((p) => p.x));
    const dy = domain(base.map((p) => p.y));
    const px = (v: number) =>
      PAD.l + ((xAxis.invert ? dx.max - v : v - dx.min) / (dx.max - dx.min)) * plotW;
    const py = (v: number) =>
      PAD.t + ((yAxis.invert ? v - dy.min : dy.max - v) / (dy.max - dy.min)) * plotH;
    const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

    const placed = points.map((p) => {
      const size =
        marker === "jersey" ? 20 + (p.scale ?? 0.5) * 12 : p.star ? STAR_R * 2 : DOT_R * 2;
      const half = size / 2;
      return {
        p,
        cx: clamp(px(p.x), PAD.l + half, PAD.l + plotW - half),
        cy: clamp(py(p.y), PAD.t + half, PAD.t + plotH - half),
        size,
      };
    });
    const avgX = px(dx.avg);
    const avgY = py(dy.avg);

    const markerBoxes: Box[] = placed.map((m) => ({
      x0: m.cx - m.size / 2,
      y0: m.cy - m.size / 2,
      x1: m.cx + m.size / 2,
      y1: m.cy + m.size / 2,
    }));

    const fontSize = marker === "jersey" ? 9 : 10;
    const order = placed
      .map((m, i) => ({
        i,
        d: ((m.cx - avgX) / plotW) ** 2 + ((m.cy - avgY) / plotH) ** 2,
        sel: isSel(m.p.id),
        star: !!m.p.star || !!m.p.highlight,
      }))
      .sort(
        (a, b) => Number(b.sel) - Number(a.sel) || Number(b.star) - Number(a.star) || b.d - a.d
      );

    const labelBoxes: Box[] = [
      { x0: PAD.l, y0: avgY - 14, x1: PAD.l + 46, y1: avgY - 1 },
    ];
    const cornerW = (k: keyof LeagueHubQuadrants) =>
      quadrants[k][lang].length * (lang === "ja" ? 10.5 : 7) + 8;
    const top0 = PAD.t + 2;
    const bot1 = PAD.t + plotH - 2;
    labelBoxes.push(
      { x0: PAD.l, y0: top0, x1: PAD.l + cornerW("tl"), y1: top0 + 14 },
      { x0: PAD.l + plotW - cornerW("tr"), y0: top0, x1: PAD.l + plotW, y1: top0 + 14 },
      { x0: PAD.l, y0: bot1 - 14, x1: PAD.l + cornerW("bl"), y1: bot1 },
      { x0: PAD.l + plotW - cornerW("br"), y0: bot1 - 14, x1: PAD.l + plotW, y1: bot1 }
    );

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
        labelBoxes.push({ x0: PAD.l, y0: at - 6, x1: PAD.l + 40, y1: at + 6 });
      }
    }
    const labels: Array<{
      i: number;
      x: number;
      y: number;
      anchor: "start" | "middle" | "end";
      box: Box;
    }> = [];
    for (const { i, sel } of order) {
      const m = placed[i]!;
      const w = m.p.label.length * fontSize * 0.68 + 2;
      const h = fontSize + 2;
      const half = m.size / 2;
      const cands: Array<{ box: Box; x: number; y: number; anchor: "start" | "middle" | "end" }> =
        [
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
      if (marker === "jersey") cands.unshift(cands.splice(1, 1)[0]!);
      const isInside = (c: (typeof cands)[number]) =>
        c.box.x0 >= PAD.l - 2 &&
        c.box.x1 <= width - 2 &&
        c.box.y0 >= 0 &&
        c.box.y1 <= PAD.t + plotH + 2;
      const free = (c: (typeof cands)[number]) =>
        isInside(c) &&
        !labelBoxes.some((b) => overlaps(b, c.box)) &&
        !markerBoxes.some((b, j) => j !== i && overlaps(b, c.box));
      const force = sel || !!m.p.highlight;
      const pick =
        cands.find(free) ?? (force ? (cands.find(isInside) ?? cands[0]) : undefined);
      if (!pick) continue;
      labelBoxes.push(pick.box);
      labels.push({ i, x: pick.x, y: pick.y, anchor: pick.anchor, box: pick.box });
    }

    return { dx, dy, px, py, placed, avgX, avgY, labels, fontSize, xTicks, yTicks };
  }, [
    width,
    points,
    xAxis.invert,
    xAxis.format,
    yAxis.invert,
    plotW,
    plotH,
    marker,
    selectedId,
    secondId,
    showRange,
    quadrants,
    lang,
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

  return (
    <View>
      <Text style={styles.yTitle}>↑ {q(yAxis.label)}</Text>
      <Pressable
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        onPress={(e) => onPress(e.nativeEvent.locationX, e.nativeEvent.locationY)}
        style={{ height: height || 260 }}
      >
        {layout ? (
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            <Svg width={width} height={height}>
              <Rect
                x={PAD.l}
                y={PAD.t}
                width={plotW}
                height={plotH}
                fill="rgba(4,10,16,0.6)"
                stroke="rgba(0,245,255,0.18)"
                strokeWidth={1}
              />
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
              {(
                [
                  ["tr", PAD.l + plotW - 6, PAD.t + 13, "end"],
                  ["tl", PAD.l + 6, PAD.t + 13, "start"],
                  ["br", PAD.l + plotW - 6, PAD.t + plotH - 6, "end"],
                  ["bl", PAD.l + 6, PAD.t + plotH - 6, "start"],
                ] as const
              ).map(([k, x, y, anchor]) => (
                <SvgText
                  key={k}
                  x={x}
                  y={y}
                  textAnchor={anchor}
                  fontSize={10}
                  fontWeight="800"
                  fill={k === "tr" ? "rgba(110,231,183,0.55)" : "rgba(255,255,255,0.28)"}
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
                x={PAD.l + 4}
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
                    x1={PAD.l}
                    x2={PAD.l + 3}
                    y1={t.at}
                    y2={t.at}
                    stroke="rgba(255,255,255,0.35)"
                    strokeWidth={1}
                  />
                  <SvgText
                    x={PAD.l + 5}
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
                ? layout.placed.map((m) => {
                    const sel = isSel(m.p.id);
                    const k = m.size / VIEWBOX_H;
                    const tx = m.cx - (VIEWBOX_W * k) / 2;
                    const ty = m.cy - m.size / 2;
                    const black = isBlackBodyPrimary(m.p.color);
                    return (
                      <G
                        key={m.p.id}
                        transform={`translate(${tx} ${ty}) scale(${k})`}
                        opacity={hasSelection && !sel ? 0.45 : 1}
                      >
                        <Path d={JERSEY_PATH_D} fill={m.p.color} />
                        <Path d={JERSEY_PATH_D} fill="url(#hubJerseyMesh)" />
                        <Path
                          d={JERSEY_PATH_D}
                          fill="none"
                          stroke={black ? JERSEY_FRAME_WHITE : m.p.secondary ?? m.p.color}
                          strokeOpacity={black ? 0.65 : 0.9}
                          strokeWidth={1.4 / k}
                          strokeLinejoin="round"
                        />
                      </G>
                    );
                  })
                : null}
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
                      opacity: hasSelection && !sel ? 0.45 : 1,
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
      <Text style={styles.xTitle}>{q(xAxis.label)} →</Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
