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
import { NAME_SVG_FONT, formatHubValue, type HubLang } from "./leagueHubUiNative";

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
};

type Props = {
  points: HubScatterPoint[];
  xAxis: LeagueHubAxis<string>;
  yAxis: LeagueHubAxis<string>;
  quadrants: LeagueHubQuadrants;
  lang: HubLang;
  marker: "jersey" | "dot";
  selectedId: string | null;
  onSelect: (id: string | null) => void;
};

const PAD = { l: 38, r: 10, t: 8, b: 20 } as const;
const DOT_R = 4.2;
const TAP_RADIUS = 24;

type Box = { x0: number; y0: number; x1: number; y1: number };

function overlaps(a: Box, b: Box): boolean {
  return a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;
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

export default function LeagueHubScatterNative({
  points,
  xAxis,
  yAxis,
  quadrants,
  lang,
  marker,
  selectedId,
  onSelect,
}: Props) {
  const [width, setWidth] = useState(0);
  const height = Math.round(width * (marker === "jersey" ? 0.95 : 1.05));
  const plotW = Math.max(0, width - PAD.l - PAD.r);
  const plotH = Math.max(0, height - PAD.t - PAD.b);

  const layout = useMemo(() => {
    if (width <= 0 || points.length === 0) return null;
    const dx = domain(points.map((p) => p.x));
    const dy = domain(points.map((p) => p.y));
    const px = (v: number) =>
      PAD.l + ((xAxis.invert ? dx.max - v : v - dx.min) / (dx.max - dx.min)) * plotW;
    const py = (v: number) =>
      PAD.t + ((yAxis.invert ? v - dy.min : dy.max - v) / (dy.max - dy.min)) * plotH;

    const placed = points.map((p) => {
      const size = marker === "jersey" ? 20 + (p.scale ?? 0.5) * 12 : DOT_R * 2;
      return { p, cx: px(p.x), cy: py(p.y), size };
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
        sel: m.p.id === selectedId,
      }))
      .sort((a, b) => Number(b.sel) - Number(a.sel) || b.d - a.d);

    const labelBoxes: Box[] = [];
    const labels: Array<{ i: number; x: number; y: number; anchor: "start" | "middle" | "end" }> =
      [];
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
      for (const c of cands) {
        const inside =
          c.box.x0 >= PAD.l - 2 &&
          c.box.x1 <= width - 2 &&
          c.box.y0 >= 0 &&
          c.box.y1 <= PAD.t + plotH + 2;
        if (!inside && !sel) continue;
        if (!sel && labelBoxes.some((b) => overlaps(b, c.box))) continue;
        if (!sel && markerBoxes.some((b, j) => j !== i && overlaps(b, c.box))) continue;
        labelBoxes.push(c.box);
        labels.push({ i, x: c.x, y: c.y, anchor: c.anchor });
        break;
      }
    }

    return { dx, dy, px, py, placed, avgX, avgY, labels, fontSize };
  }, [width, points, xAxis.invert, yAxis.invert, plotW, plotH, marker, selectedId]);

  const hasSelection = selectedId != null && points.some((p) => p.id === selectedId);

  const onPress = (lx: number, ly: number) => {
    if (!layout) return;
    let best: { id: string; d: number } | null = null;
    for (const m of layout.placed) {
      const d = Math.hypot(m.cx - lx, m.cy - ly);
      if (d <= Math.max(TAP_RADIUS, m.size / 2 + 6) && (!best || d < best.d)) {
        best = { id: m.p.id, d };
      }
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
                x={PAD.l - 3}
                y={layout.avgY + 3}
                textAnchor="end"
                fontSize={9}
                fill="rgba(0,245,255,0.6)"
                fontFamily={METRIC_FONT}
              >
                {formatHubValue(layout.dy.avg, yAxis.format)}
              </SvgText>
              {marker === "dot"
                ? layout.placed.map((m) => {
                    const sel = m.p.id === selectedId;
                    return (
                      <Circle
                        key={m.p.id}
                        cx={m.cx}
                        cy={m.cy}
                        r={sel ? DOT_R + 1.5 : DOT_R}
                        fill={m.p.color}
                        stroke="#050508"
                        strokeWidth={1}
                        opacity={hasSelection && !sel ? 0.4 : 1}
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
                    const sel = m.p.id === selectedId;
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
                .filter((m) => m.p.id === selectedId)
                .map((m) => (
                  <Circle
                    key="ring"
                    cx={m.cx}
                    cy={m.cy}
                    r={m.size / 2 + 5}
                    fill="none"
                    stroke={CYBER_TAB_CYAN}
                    strokeWidth={1.6}
                  />
                ))}
              {layout.labels.map(({ i, x, y, anchor }) => {
                const m = layout.placed[i]!;
                const sel = m.p.id === selectedId;
                return (
                  <SvgText
                    key={`l-${m.p.id}`}
                    x={x}
                    y={y}
                    textAnchor={anchor}
                    fontSize={layout.fontSize}
                    fontFamily={NAME_SVG_FONT}
                    fontWeight="600"
                    fill={sel ? CYBER_TAB_CYAN : "rgba(255,255,255,0.82)"}
                    opacity={hasSelection && !sel ? 0.45 : 1}
                  >
                    {m.p.label.toUpperCase()}
                  </SvgText>
                );
              })}
            </Svg>
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
  xTitle: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.6)",
    fontSize: 10,
    fontWeight: "700",
    textAlign: "right",
    marginTop: 2,
  },
});
