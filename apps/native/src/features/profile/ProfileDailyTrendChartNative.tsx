/**
 * Web `ProfileDailyTrendChart`（Daily Combo Chart）に準拠したネイティブ版。
 */
import { useId, useMemo, useState, useEffect } from "react";
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
import { Canvas, Group, Path, RoundedRect, Skia } from "@shopify/react-native-skia";
import { formatMetricDecimals } from "../../../../../lib/format/metricDecimals";
import type { ProfileDailyTrendRow } from "../../../../../lib/profile/profileDailyTrendRow";
import {
  PROFILE_SHELL_GRID_NATIVE,
  profileShellGridPathD,
} from "./profileShellGridNative";
import { normalizeDailyTrendDate } from "./profileApi";

const COLORS = {
  posts: "#F97316",
  wins: "#A855F7",
  total: "#FACC15",
  score: "#22C55E",
} as const;

const CYAN_TICK = "#67e8f9";

function clampNum(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function toInt(v: number): number {
  const n = Math.floor(clampNum(v));
  return n < 0 ? 0 : n;
}

function niceCeil(x: number): number {
  if (!Number.isFinite(x) || x <= 0) return 1;
  const exp = Math.floor(Math.log10(x));
  const f = x / 10 ** exp;
  let nf: number;
  if (f <= 1) nf = 1;
  else if (f <= 2) nf = 2;
  else if (f <= 5) nf = 5;
  else nf = 10;
  return nf * 10 ** exp;
}

function linspaceTicks(min: number, max: number, count: number): number[] {
  if (count < 2) return [min];
  const lo = clampNum(min);
  const hi = clampNum(max);
  if (hi <= lo) return [lo];
  const out: number[] = [];
  for (let i = 0; i < count; i++) {
    const t = lo + ((hi - lo) * i) / (count - 1);
    out.push(Math.round(t * 1e6) / 1e6);
  }
  return out;
}

function buildCumulative(rows: ProfileDailyTrendRow[]) {
  let p = 0;
  let sp = 0;
  return rows.map((r) => {
    p += clampNum(r.pointsV3);
    sp += clampNum(r.scorePrecision);
    return {
      ...r,
      pointsCum: p,
      scorePrecisionCum: sp,
    };
  });
}

function buildCountAxis(chartRows: ReturnType<typeof buildCumulative>) {
  let maxBar = 0;
  for (const row of chartRows) {
    maxBar = Math.max(maxBar, clampNum(row.posts), clampNum(row.wins));
  }
  const top = Math.max(1, Math.ceil(maxBar * 1.12));
  const targetSteps = 6;
  const step = Math.max(1, Math.ceil(top / (targetSteps - 1)));
  const ticks: number[] = [];
  for (let v = 0; v <= top; v += step) ticks.push(v);
  if (ticks[ticks.length - 1] < top) ticks.push(top);
  return { domainTop: top, ticks };
}

function buildPointsAxis(chartRows: ReturnType<typeof buildCumulative>) {
  let maxPt = 0;
  for (const row of chartRows) {
    maxPt = Math.max(maxPt, clampNum(row.pointsCum), clampNum(row.scorePrecisionCum));
  }
  const padded = Math.max(maxPt * 1.08, maxPt > 0 ? 0 : 1);
  const top = niceCeil(padded);
  const ticks = linspaceTicks(0, top, 7);
  return { domainTop: top, ticks, pointsTop: top };
}

function formatDateLabel(value: string): string {
  if (!value) return "";
  const parts = value.split("-");
  if (parts.length >= 3) return `${parts[1]}/${parts[2]}`;
  return value;
}

/** 折れ線に沿った破線パス（累計精度の緑線） */
function dashPolylineToPaths(
  points: Array<{ x: number; y: number }>,
  dashLen: number,
  gapLen: number
): ReturnType<typeof Skia.Path.Make>[] {
  const result: ReturnType<typeof Skia.Path.Make>[] = [];
  if (points.length < 2) return result;

  let phase: "dash" | "gap" = "dash";
  let phaseRemain = dashLen;
  let current = Skia.Path.Make();
  let started = false;

  const pushCurrent = () => {
    if (!current.isEmpty()) {
      result.push(current);
      current = Skia.Path.Make();
      started = false;
    }
  };

  let px = points[0].x;
  let py = points[0].y;

  for (let i = 1; i < points.length; i++) {
    const qx = points[i].x;
    const qy = points[i].y;
    let ax = px;
    let ay = py;
    let segLeft = Math.hypot(qx - px, qy - py);
    if (segLeft < 1e-9) {
      px = qx;
      py = qy;
      continue;
    }
    const ux = (qx - px) / segLeft;
    const uy = (qy - py) / segLeft;

    while (segLeft > 1e-9) {
      const step = Math.min(phaseRemain, segLeft);
      const bx = ax + ux * step;
      const by = ay + uy * step;

      if (phase === "dash") {
        if (!started) {
          current.moveTo(ax, ay);
          started = true;
        }
        current.lineTo(bx, by);
      }

      phaseRemain -= step;
      segLeft -= step;
      ax = bx;
      ay = by;

      if (phaseRemain <= 1e-9) {
        if (phase === "dash") pushCurrent();
        phase = phase === "dash" ? "gap" : "dash";
        phaseRemain = phase === "dash" ? dashLen : gapLen;
      }
    }
    px = qx;
    py = qy;
  }
  pushCurrent();
  return result;
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

const LEFT_AXIS_W = 26;
const RIGHT_AXIS_W = 34;
const PAD_T = 14;
const PAD_B = 26;
const PLOT_H = 168;
const CHART_H = PAD_T + PLOT_H + PAD_B;

type Props = {
  data: ProfileDailyTrendRow[];
  language: "ja" | "en";
  allowAll?: boolean;
};

export default function ProfileDailyTrendChartNative({
  data,
  language,
  allowAll = false,
}: Props) {
  const [rowW, setRowW] = useState(0);
  const [range, setRange] = useState<"7d" | "30d">("30d");
  const [detailDate, setDetailDate] = useState<string | null>(null);
  const isJa = language === "ja";
  const sid = useId().replace(/[^a-zA-Z0-9_]/g, "_");
  const gridPatternId = `daily_combo_grid_${sid}`;

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0 && Math.abs(w - rowW) > 0.5) setRowW(w);
  };

  const sorted = useMemo(() => {
    const rows = Array.isArray(data) ? data : [];
    return rows
      .map((r) => {
        const dk =
          normalizeDailyTrendDate(r.date) ||
          normalizeDailyTrendDate((r as { dateKey?: unknown }).dateKey) ||
          normalizeDailyTrendDate((r as { day?: unknown }).day) ||
          "";
        return { ...r, date: dk };
      })
      .filter((r) => /^\d{4}-\d{2}-\d{2}$/.test(r.date))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [data]);

  const limitedRows = useMemo(() => {
    if (range === "7d") return sorted.slice(-7);
    return sorted.slice(-allowAll && range === "30d" ? 30 : 10);
  }, [sorted, range, allowAll]);

  const chartData = useMemo(() => buildCumulative(limitedRows), [limitedRows]);

  const lastInWindow = limitedRows[limitedRows.length - 1]?.date ?? null;
  useEffect(() => {
    if (lastInWindow) setDetailDate(lastInWindow);
    else setDetailDate(null);
  }, [lastInWindow, range, allowAll]);

  const title = "Daily Combo Chart";
  const subtitle = useMemo(() => {
    if (isJa) {
      if (range === "7d") return "過去7日のスタッツの推移";
      if (allowAll && range === "30d") return "過去30日のスタッツの推移";
      return "過去10日のスタッツの推移";
    }
    if (range === "7d") return "Trend of stats over the last 7 days";
    if (allowAll && range === "30d") return "Trend of stats over the last 30 days";
    return "Trend of stats over the last 10 days";
  }, [isJa, range, allowAll]);
  const chartInfoTooltipMsg = isJa
    ? "オレンジ・紫の棒＝日ごとの投稿数・的中数。黄・緑の線＝累積の総合得点・スコア精度。グラフをタップすると下に内訳を表示します。"
    : "Orange / purple bars: daily posts and correct picks. Yellow / green lines: cumulative totals. Tap the chart for that day's breakdown below.";

  const postsLabel = isJa ? "投稿数" : "Posts";
  const hitsLabel = isJa ? "的中数" : "Correct Picks";
  const hitsPostsLabel = isJa ? "的中 / 投稿" : "Hits / Posts";
  const totalLabel = isJa ? "総合得点" : "Total Points";
  const scorePrecisionLabel = isJa ? "スコア精度" : "Score Precision";
  const unitCount = isJa ? "件" : "items";
  const unitPts = "pts";
  const detailSelectHint = isJa ? "グラフをタップで日付を選択" : "Tap the chart to select a day.";

  const plotInnerW = Math.max(40, rowW - LEFT_AXIS_W - RIGHT_AXIS_W);

  const model = useMemo(() => {
    const rows = limitedRows;
    const n = Math.max(rows.length, 1);
    const { domainTop: countTop, ticks: countTicks } = buildCountAxis(chartData);
    const { domainTop: pointsTop, ticks: pointTicks } = buildPointsAxis(chartData);
    const slot = plotInnerW / n;
    const barW = Math.max(3, Math.min(12, slot * 0.26));
    const gap = Math.max(1, slot * 0.07);
    const baseline = PAD_T + PLOT_H;

    const bars: {
      x: number;
      y: number;
      w: number;
      h: number;
      color: string;
    }[] = [];

    const linePts: Array<{ x: number; y: number }> = [];
    const linePrec: Array<{ x: number; y: number }> = [];

    const barTopLabels: { cx: number; y: number; text: string }[] = [];

    chartData.forEach((row, i) => {
      const cx = slot * (i + 0.5);
      const postsH = (clampNum(row.posts) / countTop) * PLOT_H;
      const winsH = (clampNum(row.wins) / countTop) * PLOT_H;
      bars.push({
        x: cx - barW - gap / 2,
        y: baseline - postsH,
        w: barW,
        h: Math.max(postsH, 0),
        color: COLORS.posts,
      });
      bars.push({
        x: cx + gap / 2,
        y: baseline - winsH,
        w: barW,
        h: Math.max(winsH, 0),
        color: COLORS.wins,
      });

      if (toInt(row.posts) > 0) {
        barTopLabels.push({
          cx: cx - gap / 2 - barW / 2,
          y: baseline - postsH - 4,
          text: `${toInt(row.posts)}`,
        });
      }
      if (toInt(row.wins) > 0) {
        barTopLabels.push({
          cx: cx + gap / 2 + barW / 2,
          y: baseline - winsH - 4,
          text: `${toInt(row.wins)}`,
        });
      }

      const pyPts = baseline - (clampNum(row.pointsCum) / pointsTop) * PLOT_H;
      const pyPrec = baseline - (clampNum(row.scorePrecisionCum) / pointsTop) * PLOT_H;
      linePts.push({ x: cx, y: pyPts });
      linePrec.push({ x: cx, y: pyPrec });
    });

    const ptsPath = Skia.Path.Make();
    linePts.forEach((pt, i) => {
      if (i === 0) ptsPath.moveTo(pt.x, pt.y);
      else ptsPath.lineTo(pt.x, pt.y);
    });

    const precDashPaths = dashPolylineToPaths(linePrec, 5, 3);

    const gridHPaths: ReturnType<typeof Skia.Path.Make>[] = [];
    for (const t of countTicks) {
      const gy = baseline - (t / countTop) * PLOT_H;
      gridHPaths.push(...horizontalDashedSegments(gy, plotInnerW, 3, 3));
    }

    return {
      rows,
      countTop,
      countTicks,
      pointsTop,
      pointTicks,
      baseline,
      bars,
      ptsPath,
      precDashPaths,
      gridHPaths,
      barTopLabels,
    };
  }, [chartData, limitedRows, plotInnerW]);

  const detailRow = limitedRows.find((r) => r.date === detailDate) ?? null;

  const openChartInfo = () => {
    Alert.alert(title, chartInfoTooltipMsg);
  };

  if (rowW <= 0) {
    return (
      <View style={styles.card} onLayout={onLayout}>
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
            <Pattern
              id={gridPatternId}
              width={PROFILE_SHELL_GRID_NATIVE.cellPx}
              height={PROFILE_SHELL_GRID_NATIVE.cellPx}
              patternUnits="userSpaceOnUse"
            >
              <SvgPath
                d={profileShellGridPathD(PROFILE_SHELL_GRID_NATIVE.cellPx)}
                fill="none"
                stroke={PROFILE_SHELL_GRID_NATIVE.stroke}
                strokeWidth={PROFILE_SHELL_GRID_NATIVE.strokeWidth}
              />
            </Pattern>
          </Defs>
          <Rect width="100%" height="100%" fill={`url(#${gridPatternId})`} />
        </Svg>
        <View style={styles.cardForeground}>
          <View style={styles.titleRow}>
            <Text style={styles.cardTitle}>{title}</Text>
            <Pressable
              onPress={openChartInfo}
              hitSlop={10}
              accessibilityLabel={chartInfoTooltipMsg}
              accessibilityRole="button"
            >
              <MaterialCommunityIcons name="information-outline" size={18} color="rgba(248,250,252,0.55)" />
            </Pressable>
          </View>
          <Text style={styles.cardCaption}>{subtitle}</Text>
          <View style={{ height: CHART_H + 80 }} />
        </View>
      </View>
    );
  }

  if (model.rows.length === 0) {
    return (
      <View style={styles.card} onLayout={onLayout}>
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
            <Pattern
              id={gridPatternId}
              width={PROFILE_SHELL_GRID_NATIVE.cellPx}
              height={PROFILE_SHELL_GRID_NATIVE.cellPx}
              patternUnits="userSpaceOnUse"
            >
              <SvgPath
                d={profileShellGridPathD(PROFILE_SHELL_GRID_NATIVE.cellPx)}
                fill="none"
                stroke={PROFILE_SHELL_GRID_NATIVE.stroke}
                strokeWidth={PROFILE_SHELL_GRID_NATIVE.strokeWidth}
              />
            </Pattern>
          </Defs>
          <Rect width="100%" height="100%" fill={`url(#${gridPatternId})`} />
        </Svg>
        <View style={styles.cardForeground}>
          <View style={styles.titleRow}>
            <Text style={styles.cardTitle}>{title}</Text>
            <Pressable onPress={openChartInfo} hitSlop={10} accessibilityLabel={chartInfoTooltipMsg}>
              <MaterialCommunityIcons name="information-outline" size={18} color="rgba(248,250,252,0.55)" />
            </Pressable>
          </View>
          <Text style={styles.cardCaption}>{subtitle}</Text>
          <Text style={styles.empty}>{isJa ? "まだデータがありません" : "No data yet"}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card} onLayout={onLayout}>
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
          <Pattern
            id={gridPatternId}
            width={PROFILE_SHELL_GRID_NATIVE.cellPx}
            height={PROFILE_SHELL_GRID_NATIVE.cellPx}
            patternUnits="userSpaceOnUse"
          >
            <SvgPath
              d={profileShellGridPathD(PROFILE_SHELL_GRID_NATIVE.cellPx)}
              fill="none"
              stroke={PROFILE_SHELL_GRID_NATIVE.stroke}
              strokeWidth={PROFILE_SHELL_GRID_NATIVE.strokeWidth}
            />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${gridPatternId})`} />
      </Svg>

      <View style={styles.cardForeground}>
        <View style={styles.titleRow}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Pressable
            onPress={openChartInfo}
            hitSlop={10}
            accessibilityLabel={chartInfoTooltipMsg}
            accessibilityRole="button"
          >
            <MaterialCommunityIcons name="information-outline" size={18} color="rgba(248,250,252,0.55)" />
          </Pressable>
        </View>
        <Text style={styles.cardCaption}>{subtitle}</Text>

        <View style={styles.rangeRow}>
          <Pressable
            style={[styles.rangeChip, range === "7d" && styles.rangeChipActive]}
            onPress={() => setRange("7d")}
          >
            <Text style={[styles.rangeChipText, range === "7d" && styles.rangeChipTextActive]}>7d</Text>
          </Pressable>
          <Pressable
            style={[styles.rangeChip, range === "30d" && styles.rangeChipActive]}
            onPress={() => setRange("30d")}
          >
            <Text style={[styles.rangeChipText, range === "30d" && styles.rangeChipTextActive]}>
              {allowAll ? "30d" : "10d"}
            </Text>
          </Pressable>
        </View>

        <View style={styles.chartRow}>
          <View style={[styles.leftAxis, { height: CHART_H }]}>
            {model.countTicks
              .slice()
              .reverse()
              .map((t) => {
                const topPos = PAD_T + PLOT_H - (t / model.countTop) * PLOT_H - 7;
                return (
                  <Text key={`lc-${t}`} style={[styles.axisTick, { top: topPos }]}>
                    {t}
                  </Text>
                );
              })}
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
                    color="rgba(255,255,255,0.035)"
                  />
                  {model.gridHPaths.map((gp, idx) => (
                    <Path
                      key={`gh-${idx}`}
                      path={gp}
                      style="stroke"
                      strokeWidth={1}
                      color="rgba(148,163,184,0.07)"
                    />
                  ))}
                  <Path
                    path={(() => {
                      const p = Skia.Path.Make();
                      p.moveTo(0, model.baseline);
                      p.lineTo(plotInnerW, model.baseline);
                      return p;
                    })()}
                    style="stroke"
                    strokeWidth={1}
                    color="rgba(255,255,255,0.14)"
                  />
                  {model.bars.map((b, idx) => (
                    <RoundedRect
                      key={`b-${idx}`}
                      x={b.x}
                      y={b.y}
                      width={b.w}
                      height={Math.max(b.h, 0.5)}
                      r={2}
                      color={b.color}
                    />
                  ))}
                  {model.precDashPaths.map((pp, idx) => (
                    <Path
                      key={`pd-${idx}`}
                      path={pp}
                      style="stroke"
                      strokeWidth={2}
                      color="rgba(34,197,94,0.92)"
                    />
                  ))}
                  <Path
                    path={model.ptsPath}
                    style="stroke"
                    strokeWidth={2}
                    color="rgba(250,204,21,0.95)"
                  />
                </Group>
              </Canvas>

              <View style={[StyleSheet.absoluteFill, { flexDirection: "row" }]}>
                {model.rows.map((r) => (
                  <Pressable
                    key={r.date}
                    style={{ flex: 1 }}
                    onPress={() => setDetailDate(r.date)}
                    accessibilityRole="button"
                    accessibilityLabel={formatDateLabel(r.date)}
                  />
                ))}
              </View>

              <View style={[StyleSheet.absoluteFill]} pointerEvents="none">
                {model.barTopLabels.map((bl, idx) => (
                  <Text
                    key={`btl-${idx}`}
                    style={[
                      styles.barTopLabel,
                      {
                        left: bl.cx - 14,
                        top: bl.y - 12,
                      },
                    ]}
                  >
                    {bl.text}
                  </Text>
                ))}
              </View>
            </View>

            <View style={[styles.xAxisRow, { width: plotInnerW }]}>
              {model.rows.map((r) => {
                const sel = detailDate === r.date;
                return (
                  <Text
                    key={r.date}
                    style={[styles.xTick, sel && styles.xTickSelected]}
                    numberOfLines={1}
                  >
                    {formatDateLabel(r.date)}
                  </Text>
                );
              })}
            </View>
          </View>

          <View style={[styles.rightAxis, { height: CHART_H }]}>
            {model.pointTicks
              .slice()
              .reverse()
              .map((t) => {
                const topPos = PAD_T + PLOT_H - (t / model.pointsTop) * PLOT_H - 7;
                const label =
                  model.pointsTop < 20 ? formatMetricDecimals(t, 1) : `${toInt(t)}`;
                return (
                  <Text key={`rp-${t}`} style={[styles.axisTickRight, { top: topPos }]}>
                    {label}
                  </Text>
                );
              })}
          </View>
        </View>

        {detailDate && detailRow ? (
          <View style={styles.detailBlock}>
            <Text style={styles.detailDateText}>{formatDateLabel(detailDate)}</Text>
            <View style={styles.detailGrid}>
              <View style={styles.detailCell}>
                <Text style={styles.detailCellLabel}>{hitsPostsLabel}</Text>
                <Text style={styles.detailMetricRow}>
                  <Text style={[styles.detailMetricNum, { color: COLORS.wins }]}>{toInt(detailRow.wins)}</Text>
                  <Text style={styles.detailSlash}> / </Text>
                  <Text style={[styles.detailMetricNum, { color: COLORS.posts }]}>{toInt(detailRow.posts)}</Text>
                  <Text style={[styles.detailUnit, { color: COLORS.posts }]}> {unitCount}</Text>
                </Text>
              </View>
              <Text style={styles.detailDivider}>|</Text>
              <View style={styles.detailCell}>
                <Text style={styles.detailCellLabel}>{scorePrecisionLabel}</Text>
                <Text style={[styles.detailMetricNum, { color: COLORS.score }]}>
                  {formatMetricDecimals(clampNum(detailRow.scorePrecision), 1)}
                  <Text style={[styles.detailUnit, { color: COLORS.score }]}> {unitPts}</Text>
                </Text>
              </View>
              <Text style={styles.detailDivider}>|</Text>
              <View style={styles.detailCell}>
                <Text style={styles.detailCellLabel}>{totalLabel}</Text>
                <Text style={[styles.detailMetricNum, { color: COLORS.total }]}>
                  {formatMetricDecimals(clampNum(detailRow.pointsV3), 1)}
                  <Text style={[styles.detailUnit, { color: COLORS.total }]}> {unitPts}</Text>
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <Text style={styles.detailHint}>{detailSelectHint}</Text>
        )}

        <View style={styles.legendRow}>
          <Chip label={postsLabel} hex={COLORS.posts} />
          <Chip label={hitsLabel} hex={COLORS.wins} />
          <Chip label={totalLabel} hex={COLORS.total} />
          <Chip label={scorePrecisionLabel} hex={COLORS.score} dashed />
        </View>
      </View>
    </View>
  );
}

function Chip({
  label,
  hex,
  dashed,
}: {
  label: string;
  hex: string;
  dashed?: boolean;
}) {
  return (
    <View style={styles.chip}>
      {dashed ? (
        <View style={styles.chipDashedTrack}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={[styles.chipDashSeg, { backgroundColor: hex }]} />
          ))}
        </View>
      ) : (
        <View style={[styles.chipDot, { backgroundColor: hex }]} />
      )}
      <Text style={styles.chipLabel}>{label}</Text>
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
  cardForeground: {
    position: "relative",
    zIndex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 2,
  },
  cardTitle: {
    color: "rgba(248,250,252,0.95)",
    fontSize: 18,
    fontWeight: "700",
    flexShrink: 1,
    fontFamily: Platform.select({
      ios: "Oxanium_700Bold",
      android: "Oxanium_700Bold",
      default: "sans-serif",
    }),
  },
  cardCaption: {
    color: "rgba(148,163,184,0.72)",
    fontSize: 11,
    lineHeight: 15,
    marginTop: 4,
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  rangeRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  rangeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(15,21,38,0.55)",
  },
  rangeChipActive: {
    borderColor: "rgba(103,232,249,0.55)",
    backgroundColor: "rgba(45,99,235,0.35)",
  },
  rangeChipText: {
    color: "rgba(148,163,184,0.9)",
    fontSize: 12,
    fontWeight: "700",
  },
  rangeChipTextActive: { color: "rgba(248,250,252,0.95)" },
  chartRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginHorizontal: -4,
  },
  leftAxis: {
    width: LEFT_AXIS_W,
    position: "relative",
  },
  rightAxis: {
    width: RIGHT_AXIS_W,
    position: "relative",
  },
  axisTick: {
    position: "absolute",
    right: 2,
    fontSize: 9,
    color: "rgba(148,163,184,0.88)",
    fontVariant: ["tabular-nums"],
  },
  axisTickRight: {
    position: "absolute",
    left: 0,
    fontSize: 9,
    color: "rgba(148,163,184,0.88)",
    fontVariant: ["tabular-nums"],
  },
  plotColumn: {
    flex: 1,
    alignItems: "center",
    minWidth: 0,
  },
  xAxisRow: {
    flexDirection: "row",
    marginTop: 2,
    alignSelf: "center",
  },
  xTick: {
    flex: 1,
    textAlign: "center",
    fontSize: 9,
    fontWeight: "500",
    color: "rgba(148,163,184,0.88)",
    fontVariant: ["tabular-nums"],
  },
  xTickSelected: {
    color: CYAN_TICK,
    fontWeight: "700",
    fontSize: 10,
    textShadowColor: "rgba(34,211,238,0.45)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  barTopLabel: {
    position: "absolute",
    width: 28,
    textAlign: "center",
    fontSize: 10,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
    fontFamily: Platform.select({
      ios: "Oxanium_700Bold",
      android: "Oxanium_700Bold",
      default: "sans-serif",
    }),
  },
  detailBlock: {
    marginTop: 10,
  },
  detailDateText: {
    color: CYAN_TICK,
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
    fontVariant: ["tabular-nums"],
    fontFamily: Platform.select({
      ios: "Oxanium_700Bold",
      android: "Oxanium_700Bold",
      default: "sans-serif",
    }),
    textShadowColor: "rgba(34,211,238,0.35)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  detailGrid: {
    flexDirection: "row",
    alignItems: "stretch",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(103,232,249,0.28)",
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  detailCell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 0,
  },
  detailCellLabel: {
    fontSize: 9,
    fontWeight: "600",
    color: "rgba(148,163,184,0.88)",
    textAlign: "center",
  },
  detailMetricRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "baseline",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  detailMetricNum: {
    fontSize: 22,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
    fontFamily: Platform.select({
      ios: "Oxanium_700Bold",
      android: "Oxanium_700Bold",
      default: "sans-serif",
    }),
    textShadowColor: "rgba(0,0,0,0.45)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  detailSlash: {
    color: "rgba(248,250,252,0.35)",
    fontSize: 18,
    fontWeight: "600",
  },
  detailUnit: {
    fontSize: 11,
    fontWeight: "600",
    opacity: 0.85,
  },
  detailDivider: {
    alignSelf: "stretch",
    textAlign: "center",
    color: "rgba(103,232,249,0.28)",
    marginHorizontal: 2,
    paddingTop: 14,
    fontSize: 12,
  },
  detailHint: {
    marginTop: 8,
    fontSize: 10,
    color: "rgba(100,116,139,0.95)",
    paddingHorizontal: 2,
  },
  legendRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
    alignItems: "center",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  chipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
  },
  chipDashedTrack: {
    flexDirection: "row",
    gap: 2,
    height: 2,
    alignItems: "center",
  },
  chipDashSeg: {
    width: 3,
    height: 2,
    borderRadius: 1,
  },
  chipLabel: {
    fontSize: 10,
    color: "rgba(248,250,252,0.82)",
  },
  empty: {
    color: "rgba(148,163,184,0.85)",
    fontSize: 13,
    paddingVertical: 24,
    textAlign: "center",
  },
});
