/**
 * Web `ProfilePlayoffRankTrendChart`（Ranking Progress）に準拠。
 */
import { useId, useMemo, useState } from "react";
import {
  Alert,
  LayoutChangeEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Svg, { Defs, Pattern, Rect, Path as SvgPath } from "react-native-svg";
import { Canvas, Circle, Group, Path, RoundedRect, Skia } from "@shopify/react-native-skia";
import type { RankPlayoffTrendPointNative } from "./profileApi";
import {
  PROFILE_SHELL_GRID_NATIVE,
  profileShellGridPathD,
} from "./profileShellGridNative";
import { BlocksPulseLoader } from "../../components/BlocksPulseLoader";

const LINE = "#22d3ee";
const LINE_GLOW = "rgba(34, 211, 238, 0.45)";

type TrendState = "up" | "down" | "flat";

const TREND_THEME: Record<
  TrendState,
  {
    stroke: string;
    fill: string;
    glowRing: string;
  }
> = {
  up: {
    stroke: "#34d399",
    fill: "rgba(2, 28, 20, 0.94)",
    glowRing: "rgba(52, 211, 153, 0.45)",
  },
  down: {
    stroke: "#fb7185",
    fill: "rgba(36, 7, 17, 0.94)",
    glowRing: "rgba(251, 113, 133, 0.45)",
  },
  flat: {
    stroke: LINE,
    fill: "rgba(5,8,20,0.94)",
    glowRing: LINE_GLOW,
  },
};

/** 4桁順位が折り返されないよう確保 */
const LEFT_AXIS_W = 46;
const PAD_R = 10;
const PAD_T = 16;
const PAD_B = 28;
const PLOT_H = 168;
const CHART_H = PAD_T + PLOT_H + PAD_B;

type Props = {
  data: RankPlayoffTrendPointNative[];
  loading?: boolean;
  language: "ja" | "en";
};

function yearsInRows(rows: RankPlayoffTrendPointNative[]): Set<number> {
  const ys = new Set<number>();
  for (const r of rows) {
    const y = Number(String(r.dateKey).slice(0, 4));
    if (Number.isFinite(y)) ys.add(y);
  }
  return ys;
}

/** Web と同じ横軸ラベル */
function formatAxisDate(dateKey: string, lang: "ja" | "en", showYear: boolean): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dateKey).trim());
  if (!m) return dateKey;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const da = Number(m[3]);
  const d = new Date(Date.UTC(y, mo - 1, da));
  const locale = lang === "ja" ? "ja-JP" : "en-US";
  return new Intl.DateTimeFormat(locale, {
    ...(showYear ? { year: "numeric" as const } : {}),
    month: "numeric",
    day: "numeric",
  }).format(d);
}

function horizontalDashedSegments(
  y: number,
  width: number,
  dash: number,
  gap: number
): ReturnType<typeof Skia.Path.Make>[] {
  const paths: ReturnType<typeof Skia.Path.Make>[] = [];
  let x = 0;
  let draw = true;
  while (x < width - 1e-6) {
    const len = Math.min(draw ? dash : gap, width - x);
    if (draw && len > 0.5) {
      const p = Skia.Path.Make();
      p.moveTo(x, y);
      p.lineTo(x + len, y);
      paths.push(p);
    }
    x += len;
    draw = !draw;
  }
  return paths;
}

/** 縦グリッド（データ点の列に合わせる） */
function verticalDashedSegments(
  x: number,
  yTop: number,
  height: number,
  dash: number,
  gap: number
): ReturnType<typeof Skia.Path.Make>[] {
  const paths: ReturnType<typeof Skia.Path.Make>[] = [];
  let y = yTop;
  const yEnd = yTop + height;
  let draw = true;
  while (y < yEnd - 1e-6) {
    const len = Math.min(draw ? dash : gap, yEnd - y);
    if (draw && len > 0.5) {
      const p = Skia.Path.Make();
      p.moveTo(x, y);
      p.lineTo(x, y + len);
      paths.push(p);
    }
    y += len;
    draw = !draw;
  }
  return paths;
}

/** 桁に応じたノード半径・ラベル幅（4桁が折り返されないようにする） */
function rankGlyphLayout(rank: number): { rDot: number; labelW: number; fontSize: number } {
  if (rank >= 1000) return { rDot: 17, labelW: 52, fontSize: 9 };
  if (rank >= 100) return { rDot: 15, labelW: 44, fontSize: 10 };
  return { rDot: 14, labelW: 36, fontSize: 11 };
}

export default function ProfileRankTrendChartNative({
  data,
  loading,
  language,
}: Props) {
  const [rowW, setRowW] = useState(0);
  const isJa = language === "ja";
  const sid = useId().replace(/[^a-zA-Z0-9_]/g, "_");
  const gridPatternId = `rank_trend_grid_${sid}`;

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0 && Math.abs(w - rowW) > 0.5) setRowW(w);
  };

  const chartRows = useMemo(() => {
    const rows = [...data].filter((r) => r.rank > 0);
    return rows.map((row, i) => {
      if (i === 0) return { ...row, trend: "flat" as TrendState };
      const prev = rows[i - 1]!.rank;
      const trend: TrendState =
        row.rank < prev ? "up" : row.rank > prev ? "down" : "flat";
      return { ...row, trend };
    });
  }, [data]);

  const showYearOnXAxis = useMemo(
    () => yearsInRows(chartRows).size > 1,
    [chartRows]
  );

  const trendSummary = useMemo(() => {
    if (chartRows.length === 0) {
      return {
        currentRank: null as number | null,
        netDelta: null as number | null,
        bestJump: null as number | null,
        worstDrop: null as number | null,
      };
    }
    const startRank = chartRows[0]?.rank ?? null;
    const currentRank = chartRows[chartRows.length - 1]?.rank ?? null;
    const netDelta =
      startRank != null && currentRank != null ? startRank - currentRank : null;

    let bestJump: number | null = null;
    let worstDrop: number | null = null;
    for (let i = 1; i < chartRows.length; i++) {
      const prev = chartRows[i - 1]!.rank;
      const cur = chartRows[i]!.rank;
      const d = prev - cur;
      if (d > 0) bestJump = bestJump == null ? d : Math.max(bestJump, d);
      if (d < 0) worstDrop = worstDrop == null ? d : Math.min(worstDrop, d);
    }
    return { currentRank, netDelta, bestJump, worstDrop };
  }, [chartRows]);

  const plotInnerW = Math.max(24, rowW - LEFT_AXIS_W - PAD_R);

  const model = useMemo(() => {
    const rows = chartRows;
    const n = rows.length;
    if (n === 0) {
      return {
        linePath: Skia.Path.Make(),
        gridPaths: [] as ReturnType<typeof Skia.Path.Make>[],
        dots: [] as Array<{
          x: number;
          y: number;
          rank: number;
          trend: TrendState;
          rDot: number;
          labelW: number;
          fontSize: number;
        }>,
        yTicks: [] as number[],
        lo: 1,
        hi: 2,
      };
    }

    let minR = Infinity;
    let maxR = -Infinity;
    for (const r of rows) {
      if (typeof r.rank !== "number" || !Number.isFinite(r.rank)) continue;
      minR = Math.min(minR, r.rank);
      maxR = Math.max(maxR, r.rank);
    }
    if (!Number.isFinite(minR) || !Number.isFinite(maxR)) {
      minR = 1;
      maxR = 2;
    }
    const span = Math.max(1, maxR - minR);
    const pad = Math.max(1, Math.ceil(span * 0.12));
    let lo = Math.max(1, minR - pad);
    let hi = maxR + pad;
    if (lo >= hi) {
      lo = Math.max(1, minR - 1);
      hi = maxR + 1;
    }

    const step = Math.max(1, Math.ceil((hi - lo) / 5));
    const ticks: number[] = [];
    let v = Math.ceil(lo / step) * step;
    if (v < lo) v = lo;
    for (; v <= hi; v += step) ticks.push(v);
    if (ticks.length === 0) ticks.push(lo, hi);
    if (ticks[0] > lo) ticks.unshift(lo);
    if (ticks[ticks.length - 1] < hi) ticks.push(hi);
    const yTicks = [...new Set(ticks)].sort((a, b) => a - b);

    const rankToY = (rank: number) => {
      const t = (rank - lo) / (hi - lo);
      return PAD_T + t * PLOT_H;
    };

    /** 端の点で順位ラベル・ドットがカード外にはみ出さないよう、左右に余白を確保 */
    const rawEdgeInset = rows.reduce((acc, row) => {
      const gl = rankGlyphLayout(row.rank);
      return Math.max(acc, gl.labelW / 2 + gl.rDot + 6);
    }, 10);
    const maxEdgeInset = Math.max(6, plotInnerW / 2 - 4);
    const edgeInset = Math.min(rawEdgeInset, maxEdgeInset);
    const spanX = Math.max(4, plotInnerW - 2 * edgeInset);
    const xForIndex = (i: number) => {
      if (n === 1) return edgeInset + spanX / 2;
      return edgeInset + (i / (n - 1)) * spanX;
    };

    const dots = rows.map((row, i) => {
      const x = xForIndex(i);
      const y = rankToY(row.rank);
      const gl = rankGlyphLayout(row.rank);
      return {
        x,
        y,
        rank: row.rank,
        trend: row.trend,
        rDot: gl.rDot,
        labelW: gl.labelW,
        fontSize: gl.fontSize,
      };
    });

    const linePath = Skia.Path.Make();
    dots.forEach((d, i) => {
      if (i === 0) linePath.moveTo(d.x, d.y);
      else linePath.lineTo(d.x, d.y);
    });

    const gridPaths: ReturnType<typeof Skia.Path.Make>[] = [];
    for (const tick of yTicks) {
      const gy = rankToY(tick);
      gridPaths.push(...horizontalDashedSegments(gy, plotInnerW, 4, 4));
    }
    /** 各スナップショット列に縦線（単一点は中央） */
    for (let i = 0; i < n; i++) {
      const vx = xForIndex(i);
      gridPaths.push(...verticalDashedSegments(vx, PAD_T, PLOT_H, 4, 4));
    }

    return { linePath, gridPaths, dots, yTicks, lo, hi };
  }, [chartRows, plotInnerW]);

  const title = "Ranking Progress";
  const subtitle = isJa ? "最新10件のランキングの変動を表示" : "Shows ranking changes over recent snapshots";
  const chartInfoTooltipMsg = subtitle;
  const emptyHint = isJa
    ? "ランキングの日次スナップショットが溜まると表示されます"
    : "Rank snapshots appear after scheduled updates.";

  const currentRankIsTop20 =
    trendSummary.currentRank != null &&
    trendSummary.currentRank >= 1 &&
    trendSummary.currentRank <= 20;

  const openInfo = () => Alert.alert(title, chartInfoTooltipMsg);

  if (rowW <= 0) {
    return (
      <View style={styles.card}>
        <View style={styles.measureInner} onLayout={onLayout}>
          <GridBackdrop patternId={gridPatternId} />
          <View style={styles.cardForeground}>
            <HeaderRow title={title} onInfoPress={openInfo} />
            <Text style={styles.subtitle}>{subtitle}</Text>
            <View style={{ height: CHART_H + 80 }} />
          </View>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.card}>
        <View style={styles.measureInner} onLayout={onLayout}>
          <GridBackdrop patternId={gridPatternId} />
          <View style={styles.cardForeground}>
            <HeaderRow title={title} onInfoPress={openInfo} />
            <Text style={styles.subtitle}>{subtitle}</Text>
            <View style={[styles.chartArea, { height: CHART_H }]}>
              <BlocksPulseLoader pixelScale={0.85} showLabel={false} />
            </View>
          </View>
        </View>
      </View>
    );
  }

  if (chartRows.length === 0) {
    return (
      <View style={styles.card}>
        <View style={styles.measureInner} onLayout={onLayout}>
          <GridBackdrop patternId={gridPatternId} />
          <View style={styles.cardForeground}>
            <HeaderRow title={title} onInfoPress={openInfo} />
            <Text style={styles.subtitle}>{subtitle}</Text>
            <View style={[styles.chartArea, { height: CHART_H }]}>
              <Text style={styles.noData}>NO DATA</Text>
              <Text style={styles.emptyHint}>{emptyHint}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.measureInner} onLayout={onLayout}>
        <GridBackdrop patternId={gridPatternId} />

        {trendSummary.currentRank != null ? (
          <View style={styles.currentRankBadge} pointerEvents="none">
            <Text
              style={[
                styles.currentRankLabel,
                currentRankIsTop20 ? styles.currentRankLabelGold : undefined,
              ]}
            >
              {isJa ? "現在の順位" : "Current rank"}
            </Text>
            <Text
              style={[
                styles.currentRankNum,
                currentRankIsTop20 ? styles.currentRankNumGold : undefined,
              ]}
              numberOfLines={1}
            >
              {trendSummary.currentRank}
            </Text>
          </View>
        ) : null}

        <View style={styles.cardForeground}>
          <HeaderRow title={title} onInfoPress={openInfo} />
          <Text style={styles.subtitle}>{subtitle}</Text>

          <View style={styles.chartRow}>
            <View style={styles.yAxisColumn}>
              <View style={styles.yAxisLabelWrap} pointerEvents="none">
                <Text style={styles.yAxisLabelRotated}>{isJa ? "順位" : "Rank"}</Text>
              </View>
              <View style={[styles.yTicksColumn, { height: CHART_H }]}>
                {model.yTicks
                  .slice()
                  .reverse()
                  .map((t) => {
                    const topPos = PAD_T + ((t - model.lo) / (model.hi - model.lo)) * PLOT_H - 7;
                    return (
                      <Text
                        key={`yt-${t}`}
                        style={[styles.yTickText, { top: topPos }]}
                        numberOfLines={1}
                      >
                        {t}
                      </Text>
                    );
                  })}
              </View>
            </View>

            <View style={styles.plotColumn}>
              <View style={{ width: plotInnerW, height: CHART_H }}>
                <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
                  <Group>
                    <RoundedRect
                      x={0}
                      y={PAD_T}
                      width={plotInnerW}
                      height={PLOT_H}
                      r={8}
                      color="rgba(255,255,255,0.03)"
                    />
                    {model.gridPaths.map((gp, idx) => (
                      <Path
                        key={`g-${idx}`}
                        path={gp}
                        style="stroke"
                        strokeWidth={1}
                        color="rgba(148,163,184,0.20)"
                      />
                    ))}
                    <Path
                      path={(() => {
                        const p = Skia.Path.Make();
                        const yb = PAD_T + PLOT_H;
                        p.moveTo(0, yb);
                        p.lineTo(plotInnerW, yb);
                        return p;
                      })()}
                      style="stroke"
                      strokeWidth={1}
                      color="rgba(255,255,255,0.08)"
                    />
                    {chartRows.length > 1 ? (
                      <Path path={model.linePath} style="stroke" strokeWidth={2} color={LINE} />
                    ) : null}
                    {model.dots.map((d, idx) => {
                      const theme = TREND_THEME[d.trend];
                      return (
                        <Group key={`dot-${idx}`}>
                          <Circle cx={d.x} cy={d.y} r={d.rDot + 3} color={theme.glowRing} opacity={0.35} />
                          <Circle cx={d.x} cy={d.y} r={d.rDot} color={theme.fill} />
                          <Circle
                            cx={d.x}
                            cy={d.y}
                            r={d.rDot}
                            color={theme.stroke}
                            style="stroke"
                            strokeWidth={2}
                          />
                        </Group>
                      );
                    })}
                  </Group>
                </Canvas>

                {model.dots.map((d, idx) => (
                  <Text
                    key={`lbl-${idx}`}
                    style={[
                      styles.rankInCircle,
                      {
                        left: d.x - d.labelW / 2,
                        top: d.y - d.fontSize * 0.55,
                        width: d.labelW,
                        fontSize: d.fontSize,
                      },
                    ]}
                    pointerEvents="none"
                    numberOfLines={1}
                  >
                    {d.rank}
                  </Text>
                ))}
              </View>

              <View style={[styles.xAxisRow, { width: plotInnerW }]}>
                {chartRows.map((r, i) => {
                  const d = model.dots[i];
                  if (!d) return null;
                  const xTickW = 80;
                  const xTickLeft = Math.max(
                    0,
                    Math.min(d.x - xTickW / 2, plotInnerW - xTickW)
                  );
                  return (
                    <Text
                      key={r.dateKey}
                      style={[
                        styles.xTick,
                        {
                          position: "absolute",
                          left: xTickLeft,
                          width: xTickW,
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {formatAxisDate(r.dateKey, language, showYearOnXAxis)}
                    </Text>
                  );
                })}
              </View>
            </View>
          </View>

          <View style={styles.statsShell}>
            <View style={styles.statsGrid}>
              <View style={styles.statsCell}>
                <Text
                  style={[
                    styles.statsLabel,
                    trendSummary.bestJump == null
                      ? styles.statsMuted
                      : trendSummary.bestJump > 0
                        ? styles.statsGreen
                        : trendSummary.bestJump < 0
                          ? styles.statsRose
                          : styles.statsCyan,
                  ]}
                >
                  {isJa ? "最高ジャンプアップ" : "Best jump up"}
                </Text>
                <Text
                  style={[
                    styles.statsValue,
                    trendSummary.bestJump == null
                      ? styles.statsValueMuted
                      : trendSummary.bestJump > 0
                        ? styles.statsGreen
                        : trendSummary.bestJump < 0
                          ? styles.statsRose
                          : styles.statsCyan,
                  ]}
                >
                  {trendSummary.bestJump != null ? `+${trendSummary.bestJump}` : "—"}
                </Text>
              </View>
              <Text style={styles.statsDivider}>|</Text>
              <View style={styles.statsCell}>
                <Text
                  style={[
                    styles.statsLabel,
                    trendSummary.worstDrop == null
                      ? styles.statsMuted
                      : trendSummary.worstDrop > 0
                        ? styles.statsGreen
                        : trendSummary.worstDrop < 0
                          ? styles.statsRose
                          : styles.statsCyan,
                  ]}
                >
                  {isJa ? "最大ドロップ" : "Biggest drop"}
                </Text>
                <Text
                  style={[
                    styles.statsValue,
                    trendSummary.worstDrop == null
                      ? styles.statsValueMuted
                      : trendSummary.worstDrop > 0
                        ? styles.statsGreen
                        : trendSummary.worstDrop < 0
                          ? styles.statsRose
                          : styles.statsCyan,
                  ]}
                >
                  {trendSummary.worstDrop != null ? `${trendSummary.worstDrop}` : "—"}
                </Text>
              </View>
              <Text style={styles.statsDivider}>|</Text>
              <View style={styles.statsCell}>
                <Text
                  style={[
                    styles.statsLabel,
                    trendSummary.netDelta == null
                      ? styles.statsMuted
                      : trendSummary.netDelta > 0
                        ? styles.statsGreen
                        : trendSummary.netDelta < 0
                          ? styles.statsRose
                          : styles.statsCyan,
                  ]}
                >
                  {isJa ? "純増減" : "Net"}
                </Text>
                <Text
                  style={[
                    styles.statsValue,
                    trendSummary.netDelta == null
                      ? styles.statsValueMuted
                      : trendSummary.netDelta > 0
                        ? styles.statsGreen
                        : trendSummary.netDelta < 0
                          ? styles.statsRose
                          : styles.statsCyan,
                  ]}
                >
                  {trendSummary.netDelta == null
                    ? "—"
                    : trendSummary.netDelta > 0
                      ? `↑ +${trendSummary.netDelta}`
                      : trendSummary.netDelta < 0
                        ? `↓ ${trendSummary.netDelta}`
                        : "→ 0"}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

function GridBackdrop({ patternId }: { patternId: string }) {
  const c = PROFILE_SHELL_GRID_NATIVE.cellPx;
  return (
    <Svg
      width="100%"
      height="100%"
      style={[
        StyleSheet.absoluteFillObject,
        { opacity: PROFILE_SHELL_GRID_NATIVE.layerOpacity },
      ]}
      pointerEvents="none"
    >
      <Defs>
        <Pattern id={patternId} width={c} height={c} patternUnits="userSpaceOnUse">
          <SvgPath
            d={profileShellGridPathD(c)}
            fill="none"
            stroke={PROFILE_SHELL_GRID_NATIVE.stroke}
            strokeWidth={PROFILE_SHELL_GRID_NATIVE.strokeWidth}
          />
        </Pattern>
      </Defs>
      <Rect width="100%" height="100%" fill={`url(#${patternId})`} />
    </Svg>
  );
}

function HeaderRow({ title, onInfoPress }: { title: string; onInfoPress: () => void }) {
  return (
    <View style={styles.titleRow}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Pressable onPress={onInfoPress} hitSlop={10} accessibilityRole="button">
        <MaterialCommunityIcons name="information-outline" size={18} color="rgba(248,250,252,0.55)" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(5,8,20,0.55)",
    overflow: "hidden",
    padding: 12,
  },
  measureInner: {
    position: "relative",
    width: "100%",
  },
  cardForeground: {
    position: "relative",
    zIndex: 1,
  },
  currentRankBadge: {
    position: "absolute",
    right: 4,
    top: 4,
    zIndex: 4,
    alignItems: "center",
    maxWidth: 120,
  },
  currentRankLabel: {
    fontSize: 9,
    color: "rgba(207,250,254,0.72)",
    textAlign: "center",
    marginBottom: 2,
  },
  currentRankLabelGold: {
    color: "rgba(253,230,138,0.9)",
  },
  currentRankNum: {
    fontSize: 28,
    fontWeight: "700",
    color: "rgba(207,250,254,0.98)",
    fontVariant: ["tabular-nums"],
    fontFamily: Platform.select({
      ios: "Oxanium_700Bold",
      android: "Oxanium_700Bold",
      default: "sans-serif",
    }),
  },
  currentRankNumGold: {
    color: "rgba(252,211,77,0.98)",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 2,
    paddingRight: 88,
  },
  cardTitle: {
    color: "rgba(248,250,252,0.95)",
    fontSize: 18,
    fontWeight: "700",
    fontFamily: Platform.select({
      ios: "Oxanium_700Bold",
      android: "Oxanium_700Bold",
      default: "sans-serif",
    }),
  },
  subtitle: {
    color: "rgba(148,163,184,0.85)",
    fontSize: 11,
    lineHeight: 15,
    marginTop: 6,
    marginBottom: 8,
    paddingHorizontal: 2,
    maxWidth: 520,
  },
  chartRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 4,
  },
  yAxisColumn: {
    width: LEFT_AXIS_W,
    flexDirection: "row",
    alignItems: "stretch",
  },
  yAxisLabelWrap: {
    width: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  yAxisLabelRotated: {
    color: "rgba(148,163,184,0.55)",
    fontSize: 9,
    transform: [{ rotate: "-90deg" }],
    width: 80,
    textAlign: "center",
  },
  yTicksColumn: {
    flex: 1,
    position: "relative",
  },
  yTickText: {
    position: "absolute",
    right: 0,
    fontSize: 8,
    lineHeight: 10,
    color: "rgba(148,163,184,0.85)",
    fontVariant: ["tabular-nums"],
  },
  plotColumn: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
  },
  xAxisRow: {
    position: "relative",
    height: 16,
    marginTop: 4,
    alignSelf: "center",
  },
  xTick: {
    textAlign: "center",
    fontSize: 9,
    color: "rgba(148,163,184,0.88)",
    fontVariant: ["tabular-nums"],
  },
  rankInCircle: {
    position: "absolute",
    textAlign: "center",
    fontWeight: "700",
    color: "rgba(248,250,252,0.95)",
    fontVariant: ["tabular-nums"],
    fontFamily: Platform.select({
      ios: "Oxanium_700Bold",
      android: "Oxanium_700Bold",
      default: "sans-serif",
    }),
  },
  chartArea: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  noData: {
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 3,
    color: "rgba(248,250,252,0.35)",
    fontFamily: Platform.select({
      ios: "Oxanium_700Bold",
      android: "Oxanium_700Bold",
      default: "sans-serif",
    }),
  },
  emptyHint: {
    marginTop: 10,
    fontSize: 10,
    color: "rgba(248,250,252,0.42)",
    textAlign: "center",
    maxWidth: 260,
    lineHeight: 14,
  },
  statsShell: {
    marginTop: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(103,232,249,0.28)",
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  statsGrid: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  statsCell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 0,
    paddingHorizontal: 2,
  },
  statsLabel: {
    fontSize: 9,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 12,
  },
  statsValue: {
    marginTop: 6,
    fontSize: 22,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
    fontFamily: Platform.select({
      ios: "Oxanium_700Bold",
      android: "Oxanium_700Bold",
      default: "sans-serif",
    }),
  },
  statsValueMuted: {
    color: "rgba(248,250,252,0.55)",
  },
  statsMuted: { color: "rgba(248,250,252,0.55)" },
  statsGreen: { color: "rgba(110,231,183,0.95)" },
  statsRose: { color: "rgba(251,113,133,0.95)" },
  statsCyan: { color: "rgba(103,232,249,0.9)" },
  statsDivider: {
    color: "rgba(103,232,249,0.28)",
    paddingTop: 14,
    fontSize: 12,
  },
});
