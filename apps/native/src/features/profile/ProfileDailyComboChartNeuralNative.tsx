/**
 * Web `ProfileDailyComboChartNeural` の React Native 移植（mobile / compact レイアウト）。
 */
import { useEffect, useMemo, useState } from "react";
import { cyberAlert } from "../../components/cyberAlert";
import {
  Pressable, StyleSheet, Text, useWindowDimensions, View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText } from "react-native-svg";
import { formatMetricDecimals } from "../../../../../lib/format/metricDecimals";
import type { ProfileDailyTrendRow } from "../../../../../lib/profile/profileDailyTrendRow";
import type { RankingLeagueSource } from "../../../../../lib/rankings/rankingLeagueSource";
import { METRIC_FONT, RANK_DISPLAY_FONT, RANKING_NAME_FONT_EN } from "../rankings/rankingsUiTheme";
import {
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

export type ProfileDailyComboChartPoint = ProfileDailyTrendRow;

function clampNum(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function buildCumulative(rows: ProfileDailyComboChartPoint[]) {
  let p = 0;
  return rows.map((r) => {
    p += clampNum(r.pointsV3);
    return { ...r, pointsCum: p };
  });
}

function formatDateLabel(value: string): string {
  const parts = value.split("-");
  if (parts.length >= 3) return `${parts[1]}/${parts[2]}`;
  return value;
}

function formatXSlot(index: number): string {
  return `X-${String(index + 1).padStart(2, "0")}`;
}

function linspaceTicks(min: number, max: number, count: number): number[] {
  if (count < 2) return [min];
  const out: number[] = [];
  for (let i = 0; i < count; i++) {
    out.push(min + ((max - min) * i) / (count - 1));
  }
  return out;
}

function formatLineAxisTick(value: number, top: number): string {
  const n = clampNum(value);
  if (top < 20) return formatMetricDecimals(n, 1);
  return String(Math.floor(n));
}

function niceCeil(x: number): number {
  if (!Number.isFinite(x) || x <= 0) return 1;
  const exp = Math.floor(Math.log10(x));
  const f = x / 10 ** exp;
  let nf = 1;
  if (f <= 1) nf = 1;
  else if (f <= 2) nf = 2;
  else if (f <= 5) nf = 5;
  else nf = 10;
  return nf * 10 ** exp;
}

function segmentFill(t: number): string {
  const clamped = Math.max(0, Math.min(1, t));
  if (clamped < 0.45) {
    const u = clamped / 0.45;
    const r = Math.round(6 + u * (192 - 6));
    const g = Math.round(182 + u * (38 - 182));
    const b = Math.round(212 + u * (211 - 212));
    return `rgb(${r},${g},${b})`;
  }
  if (clamped < 0.78) {
    const u = (clamped - 0.45) / 0.33;
    const r = Math.round(192 + u * (255 - 192));
    const g = Math.round(38 + u * (255 - 38));
    const b = Math.round(211 + u * (255 - 211));
    return `rgb(${r},${g},${b})`;
  }
  const u = (clamped - 0.78) / 0.22;
  const v = Math.round(220 + u * 35);
  return `rgb(${v},${v},${Math.min(255, v + 8)})`;
}

function barHeightPx(value: number, maxValue: number, plotMaxH: number): number {
  if (value <= 0 || maxValue <= 0 || plotMaxH <= 0) return 0;
  return (value / maxValue) * plotMaxH;
}

const BAR_LABEL_GAP = 5;
const W = 640;
const H = 300;
const padL = 36;
const padR = 46;
const padT = 4;
const barLabelLane = 20;
const padB = 28;

type SegBarProps = {
  x: number;
  barW: number;
  plotBottom: number;
  plotMaxH: number;
  value: number;
  maxValue: number;
  segmentCount?: number;
  selected?: boolean;
};

function SegmentedBar({
  x,
  barW,
  plotBottom,
  plotMaxH,
  value,
  maxValue,
  segmentCount = 8,
  selected = false,
}: SegBarProps) {
  const barH = barHeightPx(value, maxValue, plotMaxH);
  if (barH < 1) return null;

  const ratio = value / maxValue;
  const litCount = Math.max(1, Math.round(ratio * segmentCount));
  const gap = litCount > 1 ? 2 : 0;
  const segH = (barH - gap * (litCount - 1)) / litCount;
  if (segH <= 0) return null;

  const segs = [];
  for (let i = 0; i < litCount; i++) {
    const segY = plotBottom - (i + 1) * segH - i * gap;
    const t = litCount > 1 ? i / (litCount - 1) : 1;
    segs.push(
      <Rect
        key={i}
        x={x}
        y={segY}
        width={barW}
        height={segH}
        rx={0.5}
        fill={segmentFill(t)}
        opacity={(0.92 + t * 0.08) * (selected ? 1.08 : 1)}
      />
    );
  }
  return <G>{segs}</G>;
}

function BarValueLabel({
  x,
  barW,
  plotBottom,
  plotMaxH,
  value,
  maxValue,
  selected,
}: SegBarProps) {
  const barH = barHeightPx(value, maxValue, plotMaxH);
  if (barH < 1 || value <= 0) return null;
  const barTopY = plotBottom - barH;
  return (
    <SvgText
      x={x + barW / 2}
      y={barTopY - BAR_LABEL_GAP}
      textAnchor="middle"
      fill={selected ? "#a5f3fc" : "rgba(248,250,252,0.94)"}
      fontSize={10}
      fontWeight="700"
      fontFamily={RANKING_NAME_FONT_EN}
    >
      {Math.floor(value)}
    </SvgText>
  );
}

function buildLinePath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  let d = `M ${points[0]!.x} ${points[0]!.y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]!;
    const curr = points[i]!;
    const cx = (prev.x + curr.x) / 2;
    d += ` C ${cx} ${prev.y}, ${cx} ${curr.y}, ${curr.x} ${curr.y}`;
  }
  return d;
}

function profileCopy(language: "ja" | "en", isWc: boolean) {
  const isJa = language === "ja";
  return {
    title: "Daily Combo Chart",
    subtitle: isJa ? "過去10日のスタッツの推移" : "Trend of stats over the last 10 days",
    chartInfo: isJa
      ? "カラーバー＝日ごとの投稿数・的中数。黄緑の線＝累積の総合得点。棒をタップすると下に内訳を表示します。"
      : "Color bars: daily posts and correct picks. Lime line: cumulative total points. Tap a bar for that day's breakdown.",
    hitsPosts: isJa ? "的中 / 投稿" : "Hits / Posts",
    scorePrec: isWc
      ? isJa
        ? "完全的中"
        : "Exact Score Hits"
      : isJa
        ? "スコア精度"
        : "Score Precision",
    scorePrecUnit: isWc ? (isJa ? "試合" : "matches") : "pts",
    scorePrecDecimals: isWc ? 0 : 1,
    totalPts: isJa ? "総合得点" : "Total Points",
    upset: isJa ? "アップセット" : "Upset",
    unitCount: isJa ? "件" : "items",
    unitPts: "pts",
    legendBars: isJa ? "投稿数 / 的中" : "Posts / Correct Picks",
    legendLine: isJa ? "累積 総合得点" : "Cumulative Total Points",
  };
}

type Props = {
  data: ProfileDailyComboChartPoint[];
  language?: "ja" | "en";
  rankingLeague?: RankingLeagueSource;
};

export default function ProfileDailyComboChartNeuralNative({
  data,
  language = "ja",
  rankingLeague = "worldcup",
}: Props) {
  const { width: screenW } = useWindowDimensions();
  const isWcTrend = rankingLeague === "worldcup";
  const copy = profileCopy(language, isWcTrend);
  const rows = useMemo(() => (Array.isArray(data) ? data : []), [data]);
  const chartRows = useMemo(() => buildCumulative(rows), [rows]);

  const [selectedIdx, setSelectedIdx] = useState(() =>
    Math.max(0, chartRows.length - 1)
  );

  useEffect(() => {
    if (chartRows.length === 0) return;
    setSelectedIdx((prev) => Math.min(prev, chartRows.length - 1));
  }, [chartRows.length]);

  const selectedRow = chartRows[selectedIdx] ?? chartRows[chartRows.length - 1];

  const maxBar = useMemo(() => {
    let m = 0;
    for (const r of chartRows) {
      m = Math.max(m, clampNum(r.posts), clampNum(r.wins));
    }
    return Math.max(1, m);
  }, [chartRows]);

  const maxLine = useMemo(() => {
    let m = 1;
    for (const r of chartRows) {
      m = Math.max(m, clampNum(r.pointsCum));
    }
    return niceCeil(m * 1.06);
  }, [chartRows]);

  const lineAxisTicks = useMemo(() => linspaceTicks(0, maxLine, 5), [maxLine]);

  const chartW = W - padL - padR;
  const plotBottom = H - padB;
  const plotTop = padT + barLabelLane;
  const plotH = plotBottom - plotTop;
  const colCount = chartRows.length;
  const groupW = colCount > 0 ? chartW / colCount : chartW;
  const barGap = 3;
  const barW = Math.min(14, Math.max(6, groupW * 0.22));
  const pairW = barW * 2 + barGap;
  const yPctTicks = [0, 25, 50, 75, 100];

  const linePoints = chartRows.map((row, i) => {
    const cx = padL + groupW * i + groupW / 2;
    const ratio = maxLine > 0 ? clampNum(row.pointsCum) / maxLine : 0;
    const cy = plotBottom - ratio * plotH;
    return { x: cx, y: cy, row, i };
  });

  const linePath = buildLinePath(linePoints);
  const svgHeight = (screenW * H) / W;

  const openChartInfo = () => {
    cyberAlert(copy.title, copy.chartInfo);
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{copy.title}</Text>
          <Pressable onPress={openChartInfo} hitSlop={10} accessibilityLabel={copy.chartInfo}>
            <MaterialCommunityIcons name="information-outline" size={18} color="rgba(248,250,252,0.55)" />
          </Pressable>
        </View>
        <Text style={styles.subtitle}>{copy.subtitle}</Text>
      </View>

      <View style={styles.chartZone}>
        <Svg width="100%" height={svgHeight} viewBox={`0 0 ${W} ${H}`}>
          {yPctTicks.map((pct) => {
            const y = plotBottom - (pct / 100) * plotH;
            return (
              <G key={`grid-${pct}`}>
                <Line
                  x1={padL}
                  y1={y}
                  x2={W - padR}
                  y2={y}
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth={1}
                />
                <SvgText
                  x={padL - 6}
                  y={y + 3}
                  textAnchor="end"
                  fill="rgba(148,163,184,0.72)"
                  fontSize={8}
                >
                  {pct}%
                </SvgText>
              </G>
            );
          })}

          {lineAxisTicks.map((tick) => {
            const ratio = maxLine > 0 ? tick / maxLine : 0;
            const y = plotBottom - ratio * plotH;
            return (
              <SvgText
                key={`r-${tick}`}
                x={W - padR + 6}
                y={y + 3}
                textAnchor="start"
                fill="rgba(204,255,0,0.72)"
                fontSize={7.5}
                fontWeight="600"
                fontFamily={METRIC_FONT}
              >
                {formatLineAxisTick(tick, maxLine)}
              </SvgText>
            );
          })}

          {chartRows.map((row, i) => {
            const gx = padL + groupW * i + (groupW - pairW) / 2;
            const selected = i === selectedIdx;
            return (
              <G key={row.date} onPress={() => setSelectedIdx(i)}>
                <SegmentedBar
                  x={gx}
                  barW={barW}
                  plotBottom={plotBottom}
                  plotMaxH={plotH}
                  value={clampNum(row.posts)}
                  maxValue={maxBar}
                  selected={selected}
                />
                <SegmentedBar
                  x={gx + barW + barGap}
                  barW={barW}
                  plotBottom={plotBottom}
                  plotMaxH={plotH}
                  value={clampNum(row.wins)}
                  maxValue={maxBar}
                  selected={selected}
                />
              </G>
            );
          })}

          {linePath ? (
            <Path
              d={linePath}
              fill="none"
              stroke="#ccff00"
              strokeWidth={1.75}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : null}

          {chartRows.map((row, i) => {
            const gx = padL + groupW * i + (groupW - pairW) / 2;
            const selected = i === selectedIdx;
            return (
              <G key={`lbl-${row.date}`}>
                <BarValueLabel
                  x={gx}
                  barW={barW}
                  plotBottom={plotBottom}
                  plotMaxH={plotH}
                  value={clampNum(row.posts)}
                  maxValue={maxBar}
                  selected={selected}
                />
                <BarValueLabel
                  x={gx + barW + barGap}
                  barW={barW}
                  plotBottom={plotBottom}
                  plotMaxH={plotH}
                  value={clampNum(row.wins)}
                  maxValue={maxBar}
                  selected={selected}
                />
              </G>
            );
          })}

          {linePoints.map((pt) => {
            if (pt.i !== selectedIdx) return null;
            return <Circle key={pt.i} cx={pt.x} cy={pt.y} r={3.5} fill="#ccff00" />;
          })}

          {chartRows.map((row, i) => {
            const cx = padL + groupW * i + groupW / 2;
            const selected = i === selectedIdx;
            return (
              <SvgText
                key={`x-${row.date}`}
                x={cx}
                y={H - 6}
                textAnchor="middle"
                fill={selected ? "#22d3ee" : "rgba(148,163,184,0.72)"}
                fontSize={8}
                fontWeight={selected ? "700" : "400"}
                fontFamily={METRIC_FONT}
                rotation={-90}
                origin={`${cx}, ${H - 6}`}
              >
                {formatXSlot(i)}
              </SvgText>
            );
          })}
        </Svg>
      </View>

      {selectedRow ? (
        <View style={styles.statsWrap}>
          <Text style={styles.statsDate}>{formatDateLabel(selectedRow.date)}</Text>
          <View style={styles.statsGrid}>
            <View style={[styles.statCell, styles.statCellBorderR]}>
              <Text style={styles.statLabel}>{copy.hitsPosts}</Text>
              <View style={styles.statValueRow}>
                <Text style={styles.statValue}>
                  {formatMetricDecimals(clampNum(selectedRow.wins), 0)}
                  <Text style={styles.statSlash}>/</Text>
                  {formatMetricDecimals(clampNum(selectedRow.posts), 0)}
                </Text>
                <Text style={styles.statUnit}>{copy.unitCount}</Text>
              </View>
            </View>
            <View style={[styles.statCell, styles.statCellBorderR]}>
              <Text style={styles.statLabel}>{copy.scorePrec}</Text>
              <View style={styles.statValueRow}>
                <Text style={styles.statValue}>
                  {formatMetricDecimals(
                    clampNum(selectedRow.scorePrecision),
                    copy.scorePrecDecimals
                  )}
                </Text>
                <Text style={styles.statUnit}>{copy.scorePrecUnit}</Text>
              </View>
            </View>
            <View style={[styles.statCell, styles.statCellBorderR]}>
              <Text style={styles.statLabel}>{copy.totalPts}</Text>
              <View style={styles.statValueRow}>
                <Text style={styles.statValue}>
                  {formatMetricDecimals(clampNum(selectedRow.pointsV3), 1)}
                </Text>
                <Text style={styles.statUnit}>{copy.unitPts}</Text>
              </View>
            </View>
            <View style={styles.statCell}>
              <Text style={styles.statLabel}>{copy.upset}</Text>
              <View style={styles.statValueRow}>
                <Text style={styles.statValue}>
                  {formatMetricDecimals(clampNum(selectedRow.upsetPoints), 1)}
                </Text>
                <Text style={styles.statUnit}>{copy.unitPts}</Text>
              </View>
            </View>
          </View>
        </View>
      ) : null}

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={styles.legendBarSwatch} />
          <Text style={styles.legendText}>{copy.legendBars}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={styles.legendLineSwatch} />
          <Text style={styles.legendText}>{copy.legendLine}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { width: "100%" },
  header: { marginBottom: 8, paddingHorizontal: 2 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: profileOverviewChartTitleStyle,
  subtitle: {
    ...profileOverviewChartSubtitleStyle,
    marginTop: 6,
    marginBottom: 8,
  },
  chartZone: { overflow: "hidden" },
  statsWrap: profileOverviewChartStatsWrapStyle,
  statsDate: {
    marginBottom: 8,
    color: "rgba(165,243,252,0.9)",
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.4,
    fontFamily: RANKING_NAME_FONT_EN,
  },
  statsGrid: profileOverviewChartStatsGridStyle,
  statCell: profileOverviewChartStatCellStyle,
  statCellBorderR: profileOverviewChartStatCellBorderRStyle,
  statLabel: profileOverviewChartStatLabelMutedStyle,
  statValueRow: profileOverviewChartStatValueRowStyle,
  statValue: profileOverviewChartStatValueMutedStyle,
  statSlash: { color: "rgba(255,255,255,0.3)" },
  statUnit: {
    color: "#b8ff3c",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.6,
    fontFamily: METRIC_FONT,
  },
  legend: {
    marginTop: 8,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendBarSwatch: {
    width: 8,
    height: 8,
    borderRadius: 1,
    backgroundColor: "#c026d3",
  },
  legendLineSwatch: {
    width: 16,
    height: 2,
    borderRadius: 1,
    backgroundColor: "#ccff00",
  },
  legendText: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 8,
    fontWeight: "600",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    fontFamily: METRIC_FONT,
  },
});
