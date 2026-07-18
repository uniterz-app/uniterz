/**
 * Web `MyRankRankingProgress` 相当 — My Rank カード内の総合得点順位推移（compact）。
 * Free 3 / Pro 10 スナップショットまで。データ未蓄積時は NO DATA。
 */
import { useMemo, useState } from "react";
import { LayoutChangeEvent, StyleSheet, Text, View } from "react-native";
import { Canvas, Circle, Group, Path, Skia } from "@shopify/react-native-skia";
import Svg, { Line as SvgLine } from "react-native-svg";
import type { MyRankProgressPoint } from "../../../../../lib/rankings/myRankRankingProgress";
import { PROFILE_CHART_CYBER } from "../../../../../lib/profile/profileOverviewChartCyberTheme";

/** Web 固定ラベル */
export const MY_RANK_RANKING_PROGRESS_TITLE = "RANKING PROGRESS · TOTAL PTS";

type TrendState = "up" | "down" | "flat";

const TREND_THEME: Record<TrendState, { stroke: string; fill: string; glow: string }> = {
  up: {
    stroke: PROFILE_CHART_CYBER.lime,
    fill: PROFILE_CHART_CYBER.limeFill,
    glow: PROFILE_CHART_CYBER.limeGlow,
  },
  down: {
    stroke: PROFILE_CHART_CYBER.magenta,
    fill: PROFILE_CHART_CYBER.magentaFill,
    glow: PROFILE_CHART_CYBER.magentaGlow,
  },
  flat: {
    stroke: PROFILE_CHART_CYBER.cyan,
    fill: "rgba(5,8,20,0.92)",
    glow: PROFILE_CHART_CYBER.cyanSoft,
  },
};

const PAD_L = 24;
const PAD_R = 12;
const PAD_T = 14;
const PAD_B = 16;
const DOT_R = 9;

function formatAxisDate(dateKey: string, language: "ja" | "en"): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey.trim());
  if (!m) return dateKey;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return new Intl.DateTimeFormat(language === "ja" ? "ja-JP" : "en-US", {
    month: "numeric",
    day: "numeric",
  }).format(d);
}

type Props = {
  points: MyRankProgressPoint[];
  maxSnapshots: number;
  loading?: boolean;
  language: "ja" | "en";
  emptyHint: string;
  layout?: "mobile" | "web";
};

export default function MyRankRankingProgressNative({
  points,
  maxSnapshots,
  loading = false,
  language,
  emptyHint,
  layout = "mobile",
}: Props) {
  const [plotW, setPlotW] = useState(0);
  const chartHeight = layout === "web" ? 104 : 92;

  const rows = useMemo(() => {
    const sliced = points.slice(-Math.max(1, maxSnapshots));
    return sliced.map((row, i) => {
      if (i === 0) return { ...row, trend: "flat" as TrendState };
      const prev = sliced[i - 1]!.rank;
      const trend: TrendState =
        row.rank < prev ? "up" : row.rank > prev ? "down" : "flat";
      return { ...row, trend };
    });
  }, [points, maxSnapshots]);

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0 && Math.abs(w - plotW) > 0.5) setPlotW(w);
  };

  const model = useMemo(() => {
    const n = rows.length;
    const plotInnerW = Math.max(24, plotW - PAD_L - PAD_R);
    const plotInnerH = chartHeight - PAD_T - PAD_B;
    if (n === 0 || plotW <= 0) {
      return {
        linePath: Skia.Path.Make(),
        dots: [] as Array<{ x: number; y: number; rank: number; trend: TrendState }>,
        gridYs: [] as number[],
      };
    }
    let minR = Infinity;
    let maxR = -Infinity;
    for (const r of rows) {
      minR = Math.min(minR, r.rank);
      maxR = Math.max(maxR, r.rank);
    }
    const span = Math.max(1, maxR - minR);
    const pad = Math.max(1, Math.ceil(span * 0.15));
    const lo = Math.max(1, minR - pad);
    const hi = maxR + pad;
    const rankToY = (rank: number) =>
      PAD_T + ((rank - lo) / Math.max(1, hi - lo)) * plotInnerH;
    const xForIndex = (i: number) =>
      n === 1 ? PAD_L + plotInnerW / 2 : PAD_L + (i / (n - 1)) * plotInnerW;

    const dots = rows.map((row, i) => ({
      x: xForIndex(i),
      y: rankToY(row.rank),
      rank: row.rank,
      trend: row.trend,
    }));

    const path = Skia.Path.Make();
    if (dots.length > 0) {
      path.moveTo(dots[0]!.x, dots[0]!.y);
      for (let i = 0; i < dots.length - 1; i++) {
        const p0 = dots[i]!;
        const p1 = dots[i + 1]!;
        const mx = (p0.x + p1.x) / 2;
        path.cubicTo(mx, p0.y, mx, p1.y, p1.x, p1.y);
      }
    }

    const step = Math.max(1, Math.ceil((hi - lo) / 3));
    const gridYs: number[] = [];
    for (let v = lo; v <= hi; v += step) gridYs.push(rankToY(v));

    return { linePath: path, dots, gridYs };
  }, [rows, plotW, chartHeight]);

  const isEmpty = !loading && rows.length === 0;

  return (
    <View style={styles.section}>
      <View style={styles.titleRow}>
        <Text style={styles.title} numberOfLines={1}>
          {MY_RANK_RANKING_PROGRESS_TITLE}
        </Text>
        <Text style={styles.count}>
          {rows.length}/{maxSnapshots}
        </Text>
      </View>

      <View style={[styles.plot, { height: chartHeight }]} onLayout={onLayout}>
        {loading ? (
          <View style={styles.center}>
            <Text style={styles.loadingDots}>…</Text>
          </View>
        ) : isEmpty ? (
          <View style={styles.center}>
            <Text style={styles.noData}>NO DATA</Text>
            <Text style={styles.emptyHint} numberOfLines={2}>
              {emptyHint}
            </Text>
          </View>
        ) : plotW > 0 ? (
          <>
            <Svg
              width={plotW}
              height={chartHeight}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            >
              {model.gridYs.map((y, i) => (
                <SvgLine
                  key={`g-${i}`}
                  x1={PAD_L}
                  y1={y}
                  x2={plotW - PAD_R}
                  y2={y}
                  stroke={PROFILE_CHART_CYBER.cyanGridStrong}
                  strokeWidth={1}
                />
              ))}
            </Svg>
            <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
              <Group>
                {model.dots.length > 1 ? (
                  <>
                    <Path
                      path={model.linePath}
                      style="stroke"
                      strokeWidth={3}
                      color={PROFILE_CHART_CYBER.cyanSoft}
                      opacity={0.5}
                    />
                    <Path
                      path={model.linePath}
                      style="stroke"
                      strokeWidth={1.25}
                      color={PROFILE_CHART_CYBER.cyan}
                    />
                  </>
                ) : null}
                {model.dots.map((d, idx) => {
                  const theme = TREND_THEME[d.trend];
                  return (
                    <Group key={`d-${idx}`}>
                      <Circle
                        cx={d.x}
                        cy={d.y}
                        r={DOT_R + 2}
                        color={theme.glow}
                        style="stroke"
                        strokeWidth={3}
                        opacity={0.65}
                      />
                      <Circle cx={d.x} cy={d.y} r={DOT_R} color={theme.fill} />
                      <Circle
                        cx={d.x}
                        cy={d.y}
                        r={DOT_R}
                        color={theme.stroke}
                        style="stroke"
                        strokeWidth={1.5}
                      />
                    </Group>
                  );
                })}
              </Group>
            </Canvas>
            {model.dots.map((d, idx) => (
              <Text
                key={`n-${idx}`}
                style={[styles.dotLabel, { left: d.x - 14, top: d.y - 6, width: 28 }]}
                numberOfLines={1}
                pointerEvents="none"
              >
                {d.rank}
              </Text>
            ))}
            {rows.length > 1 ? (
              <>
                <Text style={[styles.xTick, styles.xTickLeft]} numberOfLines={1}>
                  {formatAxisDate(rows[0]!.dateKey, language)}
                </Text>
                <Text style={[styles.xTick, styles.xTickRight]} numberOfLines={1}>
                  {formatAxisDate(rows[rows.length - 1]!.dateKey, language)}
                </Text>
              </>
            ) : null}
          </>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    position: "relative",
    zIndex: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 4,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  title: {
    flexShrink: 1,
    fontSize: 8,
    letterSpacing: 1.3,
    color: "rgba(103,232,249,0.78)",
    fontFamily: "Oxanium_700Bold",
  },
  count: {
    fontSize: 7,
    letterSpacing: 1,
    color: "rgba(255,255,255,0.28)",
    fontFamily: "Oxanium_600SemiBold",
    fontVariant: ["tabular-nums"],
  },
  plot: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 2,
    backgroundColor: PROFILE_CHART_CYBER.rankPlotInnerBg,
    borderWidth: 1,
    borderColor: PROFILE_CHART_CYBER.glassBorder,
  },
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  loadingDots: {
    fontSize: 10,
    color: "rgba(255,255,255,0.45)",
  },
  noData: {
    fontSize: 16,
    letterSpacing: 2,
    color: "rgba(148,163,184,0.55)",
    fontFamily: "BebasNeue_400Regular",
  },
  emptyHint: {
    marginTop: 4,
    maxWidth: 220,
    textAlign: "center",
    fontSize: 9,
    lineHeight: 12,
    color: "rgba(255,255,255,0.4)",
  },
  dotLabel: {
    position: "absolute",
    textAlign: "center",
    fontSize: 9,
    fontWeight: "700",
    color: "rgba(248,250,252,0.95)",
    fontVariant: ["tabular-nums"],
    fontFamily: "Oxanium_700Bold",
  },
  xTick: {
    position: "absolute",
    bottom: 1,
    fontSize: 7,
    color: PROFILE_CHART_CYBER.tick,
    fontVariant: ["tabular-nums"],
  },
  xTickLeft: {
    left: PAD_L - 6,
  },
  xTickRight: {
    right: PAD_R - 6,
  },
});
