/**
 * Web `ProfilePlayoffRankTrendChart`（Ranking Progress）に準拠。
 */
import { useMemo, useState } from "react";
import { cyberAlert } from "../../components/cyberAlert";
import {
  LayoutChangeEvent, Platform, Pressable, StyleSheet, Text, View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Canvas, Circle, Group, Path, Skia } from "@shopify/react-native-skia";
import type { RankPlayoffTrendPointNative } from "./profileApi";
import ProfileOverviewChartCardNative from "./ProfileOverviewChartCardNative";
import {
  profileOverviewChartEmptyHintStyle,
  profileOverviewChartNoDataStyle,
  profileOverviewChartStatLabelMutedStyle,
  profileOverviewChartStatValueMutedStyle,
  profileOverviewChartStatValueRowStyle,
  profileOverviewChartStatsGridStyle,
  profileOverviewChartStatCellBorderRStyle,
  profileOverviewChartStatCellStyle,
  profileOverviewChartStatsWrapStyle,
  profileOverviewChartSubtitleStyle,
  profileOverviewChartTitleStyle,
} from "./profileOverviewChartShell";
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

/** 左 Y 軸ラベルなし（順位はドット内表示） */
const LEFT_AXIS_W = 0;
const PAD_R = 22;
const PAD_T = 22;
const PAD_B = 32;
const PLOT_H = 154;
const CHART_H = PAD_T + PLOT_H + PAD_B;
const X_AXIS_PAD = 14;
const Y_AXIS_TOP_PAD = 18;
const MOBILE_DOT_R = 10;
const MOBILE_DOT_FONT = 9;
const MOBILE_DOT_GLOW_EXTRA = 1.5;
const MOBILE_DOT_GLOW_STROKE = 3;
const MOBILE_DOT_STROKE = 1.5;
const X_AXIS_LABEL_W = 28;

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

/** 小さめの丸に順位桁数に応じたラベル */
function rankGlyphLayout(rank: number): { rDot: number; labelW: number; fontSize: number } {
  const digits = String(rank).length;
  if (digits >= 4) {
    return { rDot: MOBILE_DOT_R, labelW: 30, fontSize: 8 };
  }
  if (digits >= 3) {
    return { rDot: MOBILE_DOT_R, labelW: 26, fontSize: MOBILE_DOT_FONT };
  }
  return { rDot: MOBILE_DOT_R, labelW: 24, fontSize: MOBILE_DOT_FONT };
}

/** Web `XAxis interval` と同じ間引き */
function xAxisIntervalForCount(rowCount: number): number {
  if (rowCount > 28) return 3;
  if (rowCount > 18) return 2;
  if (rowCount > 11) return 1;
  return 0;
}

type XAxisLabelLayout = {
  index: number;
  centerX: number;
  width: number;
};

/** 日付は各点の x に中心を合わせ、重なる場合だけ間引く */
function layoutXAxisLabels(
  dots: Array<{ x: number }>,
  rowCount: number,
  plotWidth: number
): XAxisLabelLayout[] {
  if (rowCount <= 0) return [];

  const labelW = X_AXIS_LABEL_W;
  const minGap = 6;
  const usable = Math.max(4, plotWidth - 2 * X_AXIS_PAD);
  const minSpacing = rowCount <= 1 ? usable : usable / (rowCount - 1);

  let stride = 1;
  if (minSpacing < labelW + minGap) {
    stride = Math.max(2, Math.ceil((labelW + minGap) / minSpacing));
  }
  const interval = xAxisIntervalForCount(rowCount);
  if (interval > 0) stride = Math.max(stride, interval + 1);

  const candidates: number[] = [];
  for (let i = 0; i < rowCount; i += stride) candidates.push(i);
  if (candidates[candidates.length - 1] !== rowCount - 1) {
    candidates.push(rowCount - 1);
  }

  const placed: XAxisLabelLayout[] = [];
  let lastRight = -Infinity;
  for (const index of candidates) {
    const x = dots[index]?.x;
    if (x == null) continue;
    const left = x - labelW / 2;
    const right = left + labelW;
    if (placed.length > 0 && left < lastRight + minGap) continue;
    placed.push({ index, centerX: x, width: labelW });
    lastRight = right;
  }

  if (rowCount > 1) {
    const lastIndex = rowCount - 1;
    const lastX = dots[lastIndex]?.x;
    if (lastX != null && !placed.some((label) => label.index === lastIndex)) {
      const left = lastX - labelW / 2;
      while (
        placed.length > 0 &&
        placed[placed.length - 1]!.centerX + placed[placed.length - 1]!.width / 2 + minGap >
          left
      ) {
        placed.pop();
      }
      placed.push({ index: lastIndex, centerX: lastX, width: labelW });
    }
  }

  return placed;
}

function buildMonotoneLinePath(
  points: Array<{ x: number; y: number }>
): ReturnType<typeof Skia.Path.Make> {
  const path = Skia.Path.Make();
  if (points.length === 0) return path;
  if (points.length === 1) {
    path.moveTo(points[0]!.x, points[0]!.y);
    return path;
  }
  path.moveTo(points[0]!.x, points[0]!.y);
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i]!;
    const p1 = points[i + 1]!;
    const mx = (p0.x + p1.x) / 2;
    path.cubicTo(mx, p0.y, mx, p1.y, p1.x, p1.y);
  }
  return path;
}

export default function ProfileRankTrendChartNative({
  data,
  loading,
  language,
}: Props) {
  const [rowW, setRowW] = useState(0);
  const isJa = language === "ja";
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
      return PAD_T + Y_AXIS_TOP_PAD + t * (PLOT_H - Y_AXIS_TOP_PAD);
    };

    const spanX = Math.max(4, plotInnerW - 2 * X_AXIS_PAD);
    const xForIndex = (i: number) => {
      if (n === 1) return X_AXIS_PAD + spanX / 2;
      return X_AXIS_PAD + (i / (n - 1)) * spanX;
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

    const linePath = buildMonotoneLinePath(dots);

    const gridPaths: ReturnType<typeof Skia.Path.Make>[] = [];
    for (const tick of yTicks) {
      const gy = rankToY(tick);
      gridPaths.push(...horizontalDashedSegments(gy, plotInnerW, 3, 3));
    }

    return { linePath, gridPaths, dots, yTicks, lo, hi };
  }, [chartRows, plotInnerW]);

  const xAxisLabels = useMemo(
    () => layoutXAxisLabels(model.dots, chartRows.length, plotInnerW),
    [chartRows.length, model.dots, plotInnerW]
  );

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

  const openInfo = () => cyberAlert(title, chartInfoTooltipMsg);

  if (rowW <= 0) {
    return (
      <ProfileOverviewChartCardNative>
        <View style={styles.measureInner} onLayout={onLayout}>
          <View style={styles.cardForeground}>
            <ChartHeader
              title={title}
              subtitle={subtitle}
              onInfoPress={openInfo}
              isJa={isJa}
            />
            <View style={{ height: CHART_H + 80 }} />
          </View>
        </View>
      </ProfileOverviewChartCardNative>
    );
  }

  if (loading) {
    return (
      <ProfileOverviewChartCardNative>
        <View style={styles.measureInner} onLayout={onLayout}>
          <View style={styles.cardForeground}>
            <ChartHeader
              title={title}
              subtitle={subtitle}
              onInfoPress={openInfo}
              isJa={isJa}
            />
            <View style={[styles.chartArea, { height: CHART_H }]}>
              <BlocksPulseLoader pixelScale={0.85} showLabel={false} />
            </View>
          </View>
        </View>
      </ProfileOverviewChartCardNative>
    );
  }

  if (chartRows.length === 0) {
    return (
      <ProfileOverviewChartCardNative>
        <View style={styles.measureInner} onLayout={onLayout}>
          <View style={styles.cardForeground}>
            <ChartHeader
              title={title}
              subtitle={subtitle}
              onInfoPress={openInfo}
              isJa={isJa}
            />
            <View style={[styles.chartArea, { height: CHART_H }]}>
              <Text style={styles.noData}>NO DATA</Text>
              <Text style={styles.emptyHint}>{emptyHint}</Text>
            </View>
          </View>
        </View>
      </ProfileOverviewChartCardNative>
    );
  }

  return (
    <ProfileOverviewChartCardNative>
      <View style={styles.measureInner} onLayout={onLayout}>
        <View style={styles.cardForeground}>
          <ChartHeader
            title={title}
            subtitle={subtitle}
            onInfoPress={openInfo}
            isJa={isJa}
            currentRank={trendSummary.currentRank}
            currentRankIsTop20={currentRankIsTop20}
          />

          <View style={styles.chartRow}>
            <View style={styles.plotColumn}>
              <View style={{ width: plotInnerW, height: CHART_H }}>
                <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
                  <Group>
                    {model.gridPaths.map((gp, idx) => (
                      <Path
                        key={`g-${idx}`}
                        path={gp}
                        style="stroke"
                        strokeWidth={1}
                        color="rgba(148,163,184,0.12)"
                      />
                    ))}
                    {chartRows.length > 1 ? (
                      <Path path={model.linePath} style="stroke" strokeWidth={2} color={LINE} />
                    ) : null}
                    {model.dots.map((d, idx) => {
                      const theme = TREND_THEME[d.trend];
                      return (
                        <Group key={`dot-${idx}`}>
                          <Circle
                            cx={d.x}
                            cy={d.y}
                            r={d.rDot + MOBILE_DOT_GLOW_EXTRA}
                            color={theme.glowRing}
                            style="stroke"
                            strokeWidth={MOBILE_DOT_GLOW_STROKE}
                            opacity={0.7}
                          />
                          <Circle cx={d.x} cy={d.y} r={d.rDot} color={theme.fill} />
                          <Circle
                            cx={d.x}
                            cy={d.y}
                            r={d.rDot}
                            color={theme.stroke}
                            style="stroke"
                            strokeWidth={MOBILE_DOT_STROKE}
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
                        top: d.y - d.fontSize * 0.5,
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
                {xAxisLabels.map((label) => {
                  const row = chartRows[label.index];
                  if (!row) return null;
                  return (
                    <Text
                      key={row.dateKey}
                      style={[
                        styles.xTick,
                        {
                          position: "absolute",
                          left: label.centerX - label.width / 2,
                          width: label.width,
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {formatAxisDate(row.dateKey, language, showYearOnXAxis)}
                    </Text>
                  );
                })}
              </View>
            </View>
          </View>

          <View style={profileOverviewChartStatsWrapStyle}>
            <View style={profileOverviewChartStatsGridStyle}>
              <View style={[profileOverviewChartStatCellStyle, profileOverviewChartStatCellBorderRStyle]}>
                <Text
                  style={[
                    profileOverviewChartStatLabelMutedStyle,
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
                <View style={profileOverviewChartStatValueRowStyle}>
                  <Text
                    style={[
                      profileOverviewChartStatValueMutedStyle,
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
              </View>
              <View style={[profileOverviewChartStatCellStyle, profileOverviewChartStatCellBorderRStyle]}>
                <Text
                  style={[
                    profileOverviewChartStatLabelMutedStyle,
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
                <View style={profileOverviewChartStatValueRowStyle}>
                  <Text
                    style={[
                      profileOverviewChartStatValueMutedStyle,
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
              </View>
              <View style={profileOverviewChartStatCellStyle}>
                <Text
                  style={[
                    profileOverviewChartStatLabelMutedStyle,
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
                <View style={profileOverviewChartStatValueRowStyle}>
                  <Text
                    style={[
                      profileOverviewChartStatValueMutedStyle,
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
    </ProfileOverviewChartCardNative>
  );
}

function ChartHeader({
  title,
  subtitle,
  onInfoPress,
  isJa,
  currentRank,
  currentRankIsTop20,
}: {
  title: string;
  subtitle: string;
  onInfoPress: () => void;
  isJa: boolean;
  currentRank?: number | null;
  currentRankIsTop20?: boolean;
}) {
  return (
    <>
      <View style={styles.headerRow}>
        <View style={styles.headerMain}>
          <View style={styles.titleRow}>
            <Text style={styles.cardTitle}>{title}</Text>
            <Pressable onPress={onInfoPress} hitSlop={10} accessibilityRole="button">
              <MaterialCommunityIcons name="information-outline" size={18} color="rgba(248,250,252,0.55)" />
            </Pressable>
          </View>
        </View>
        {currentRank != null ? (
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
              {currentRank}
            </Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </>
  );
}

const styles = StyleSheet.create({
  measureInner: {
    position: "relative",
    width: "100%",
  },
  cardForeground: {
    position: "relative",
    zIndex: 1,
    minWidth: 0,
  },
  currentRankBadge: {
    flexShrink: 0,
    alignItems: "flex-end",
    paddingTop: 2,
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
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  headerMain: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 2,
  },
  cardTitle: profileOverviewChartTitleStyle,
  subtitle: {
    ...profileOverviewChartSubtitleStyle,
    marginTop: 6,
    marginBottom: 8,
    paddingHorizontal: 2,
    maxWidth: 520,
  },
  chartRow: {
    alignItems: "flex-start",
    marginTop: 4,
  },
  plotColumn: {
    width: "100%",
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
  noData: profileOverviewChartNoDataStyle,
  emptyHint: {
    ...profileOverviewChartEmptyHintStyle,
    maxWidth: 260,
  },
  statsValueMuted: {
    color: "rgba(248,250,252,0.55)",
  },
  statsMuted: { color: "rgba(248,250,252,0.55)" },
  statsGreen: { color: "rgba(110,231,183,0.95)" },
  statsRose: { color: "rgba(251,113,133,0.95)" },
  statsCyan: { color: "rgba(103,232,249,0.9)" },
});
