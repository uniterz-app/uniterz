/**
 * Web `StreakTrackerCard`（Last20 Tracker）に準拠したネイティブ版。
 */
import { useMemo, useState, type ReactNode } from "react";
import { cyberAlert } from "../../components/cyberAlert";
import {
  LayoutChangeEvent, Platform, Pressable, StyleSheet, Text, View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { STREAK_TRACKER_LAST_N, type StreakTrackerPointNative } from "./useNativeStreakTracker";
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
import { streakChartLayoutMaxAbs } from "../../../../../lib/profile/streakTrackerChartLayout";
import { BlocksPulseLoader } from "../../components/BlocksPulseLoader";

type Props = {
  points: StreakTrackerPointNative[];
  loading: boolean;
  language: "ja" | "en";
};

const COL_MIN_W = 9;
const COL_MAX_W = 20;
const COL_GAP = 2;
const BLOCK_GAP_PX = 1;
/** Web mobile `yAxis` `w-9`（36px） */
const LEFT_AXIS_W = 36;
/** Web mobile `plotH` `h-[184px]` */
const PLOT_H = 184;

/** Y軸ラベル（fontSize 9）の縦方向の半分相当で数値位置と中央揃え */
const Y_TICK_CENTER_OFFSET = 5;

function valueToPlotY(value: number, plotH: number, maxAbs: number): number {
  const half = plotH / 2;
  return half * (1 - value / maxAbs);
}

function formatTick(n: number): string {
  return n > 0 ? `+${n}` : `${n}`;
}

function buildYTicks(maxAbs: number): number[] {
  const m = Math.max(1, maxAbs);
  if (m <= 6) {
    const out: number[] = [];
    for (let v = m; v >= 1; v--) out.push(v);
    out.push(0);
    for (let v = -1; v >= -m; v--) out.push(v);
    return out;
  }
  const mid = Math.max(1, Math.floor(m / 2));
  return [...new Set([m, mid, 0, -mid, -m])].sort((a, b) => b - a);
}

function computeWindowStats(points: StreakTrackerPointNative[]) {
  let curW = 0;
  let maxW = 0;
  let curL = 0;
  let maxL = 0;
  for (const p of points) {
    if (p.isWin) {
      curW += 1;
      curL = 0;
      maxW = Math.max(maxW, curW);
    } else {
      curL += 1;
      curW = 0;
      maxL = Math.max(maxL, curL);
    }
  }
  const wins = points.filter((p) => p.isWin).length;
  const losses = points.length - wins;
  return { maxWinStreak: maxW, maxLossStreak: maxL, wins, losses };
}

export default function ProfileStreakTrackerNative({ points, loading, language }: Props) {
  const isJa = language === "ja";
  const [plotInnerW, setPlotInnerW] = useState(0);
  const onPlotLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0 && Math.abs(w - plotInnerW) > 0.5) setPlotInnerW(w);
  };

  const maxAbs = useMemo(() => streakChartLayoutMaxAbs(points), [points]);
  const ticks = useMemo(() => buildYTicks(maxAbs), [maxAbs]);
  const stats = useMemo(() => computeWindowStats(points), [points]);

  const lastStreak = points.length ? points[points.length - 1]!.streakAfter : 0;
  const displayTarget =
    points.length === 0
      ? 0
      : lastStreak > 0
        ? lastStreak
        : lastStreak < 0
          ? Math.abs(lastStreak)
          : 1;

  const title = "Last20 Tracker";
  const subtitleJa = `直近${STREAK_TRACKER_LAST_N}試合の連勝・連敗を表示`;
  const subtitleEn = `Win/loss streaks from your last ${STREAK_TRACKER_LAST_N} settled picks`;
  const subtitle = isJa ? subtitleJa : subtitleEn;

  const winStreakCaption = isJa ? "連勝中" : "Win streak";
  const lossStreakCaption = isJa ? "連敗中" : "Loss streak";
  const flatCaption = isJa ? "直近" : "Last pick";
  const caption =
    lastStreak > 0 ? winStreakCaption : lastStreak < 0 ? lossStreakCaption : points.length > 0 ? flatCaption : "—";

  const statWinLabel = isJa ? "最高連勝" : "Best W streak";
  const statLossLabel = isJa ? "最高連敗" : "Best L streak";
  const statRecordLabel = isJa
    ? `直近${STREAK_TRACKER_LAST_N}試合の成績`
    : `Last ${STREAK_TRACKER_LAST_N} games`;
  const statRecordValue = `${stats.wins}-${stats.losses}`;

  const n = points.length;
  /** 横スクロールなし: 列はプロット幅に必ず収め、狭いときだけ COL_MIN_W 未満に詰める */
  const gapTotal = COL_GAP * Math.max(0, n - 1);
  const slotFloor =
    plotInnerW > 0 && n > 0
      ? Math.max(1, Math.floor(Math.max(0, plotInnerW - gapTotal) / n))
      : COL_MIN_W;
  const colW =
    n > 0 && plotInnerW > 0
      ? Math.min(COL_MAX_W, slotFloor < COL_MIN_W ? slotFloor : Math.max(COL_MIN_W, slotFloor))
      : COL_MIN_W;

  const chartTotalW = n * colW + Math.max(0, n - 1) * COL_GAP;
  /** 格子・ゼロラインの幅（レイアウト前は列幅から推定） */
  const plotChartW =
    plotInnerW > 0 ? plotInnerW : Math.max(1, chartTotalW, Math.max(1, n) * 12);

  const halfH = PLOT_H / 2;
  const blockH = Math.max(2, (halfH - (maxAbs - 1) * BLOCK_GAP_PX) / maxAbs);

  const openInfo = () => cyberAlert(title, subtitle);

  if (loading) {
    return (
      <ProfileOverviewChartCardNative>
        <View style={styles.foreground}>
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <View style={styles.titleWithInfo}>
                <Text style={styles.title}>{title}</Text>
                <Pressable onPress={openInfo} hitSlop={10} accessibilityRole="button">
                  <MaterialCommunityIcons name="information-outline" size={18} color="rgba(248,250,252,0.55)" />
                </Pressable>
              </View>
              <Text style={styles.subtitle}>{subtitle}</Text>
            </View>
          </View>
          <ChartGlassShell>
            <View style={styles.chartShellLoadingInner}>
              <BlocksPulseLoader pixelScale={0.85} labelStyle={styles.loadingLabelCyber} />
            </View>
          </ChartGlassShell>
        </View>
      </ProfileOverviewChartCardNative>
    );
  }

  if (points.length === 0) {
    return (
      <ProfileOverviewChartCardNative>
        <View style={styles.foreground}>
          <HeaderRow title={title} onInfoPress={openInfo} />
          <Text style={styles.subtitle}>{subtitle}</Text>
          <View style={[styles.noDataBox, { minHeight: PLOT_H + 40 }]}>
            <Text style={styles.noData}>NO DATA</Text>
            <Text style={styles.noDataHint}>
              {isJa ? "確定済みの予想がありません" : "No settled predictions"}
            </Text>
          </View>
        </View>
      </ProfileOverviewChartCardNative>
    );
  }

  return (
    <ProfileOverviewChartCardNative>
      <View style={styles.foreground}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <View style={styles.titleWithInfo}>
              <Text style={styles.title}>{title}</Text>
              <Pressable onPress={openInfo} hitSlop={10} accessibilityRole="button">
                <MaterialCommunityIcons name="information-outline" size={18} color="rgba(248,250,252,0.55)" />
              </Pressable>
            </View>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>
          <View style={styles.badgeCol}>
            <View
              style={[
                styles.badgeCircle,
                lastStreak > 0 && styles.badgeWin,
                lastStreak < 0 && styles.badgeLoss,
                lastStreak === 0 && styles.badgeFlat,
              ]}
            >
              <Text
                style={[
                  styles.badgeNum,
                  lastStreak > 0 && styles.badgeNumWin,
                  lastStreak < 0 && styles.badgeNumLoss,
                  lastStreak === 0 && styles.badgeNumFlat,
                ]}
                numberOfLines={1}
              >
                {displayTarget}
              </Text>
            </View>
            <Text style={styles.badgeCaption}>{caption}</Text>
          </View>
        </View>

        <ChartGlassShell>
          <View style={styles.chartInnerRow}>
            <View style={[styles.yAxis, { height: PLOT_H }]}>
              {ticks.map((t) => {
                const yCenter = valueToPlotY(t, PLOT_H, maxAbs);
                const rawTop = yCenter - Y_TICK_CENTER_OFFSET;
                const top = Math.max(0, Math.min(PLOT_H - 12, rawTop));
                return (
                  <Text key={`yt-${t}`} style={[styles.yTick, { top }]}>
                    {formatTick(t)}
                  </Text>
                );
              })}
            </View>

            <View style={styles.plotFlex} onLayout={onPlotLayout}>
              <View style={styles.plotNoScrollWrap}>
                <View style={{ width: plotChartW, minHeight: PLOT_H + 18 }}>
                  <View style={[styles.plotScrollInner, { width: plotChartW, height: PLOT_H }]}>
                    <View
                      pointerEvents="none"
                      style={[styles.plotZeroLine, { top: halfH - 0.5 }]}
                    />
                    <View style={[styles.columnsOverlay, { gap: COL_GAP }]}>
                      {points.map((p) => (
                        <View key={p.postId} style={[styles.column, { width: colW }]}>
                          <View style={[styles.plotColumn, { height: PLOT_H }]}>
                            <View style={[styles.upperHalf, { height: halfH, gap: BLOCK_GAP_PX }]}>
                              {p.streakAfter > 0 &&
                                Array.from({ length: p.streakAfter }, (_, bi) => (
                                  <View
                                    key={`u-${bi}`}
                                    style={[styles.block, styles.blockWin, { height: blockH, width: "82%" }]}
                                  />
                                ))}
                            </View>
                            <View
                              style={[styles.lowerHalf, { top: halfH, height: halfH, gap: BLOCK_GAP_PX }]}
                            >
                              {p.streakAfter < 0 &&
                                Array.from({ length: Math.abs(p.streakAfter) }, (_, bi) => (
                                  <View
                                    key={`d-${bi}`}
                                    style={[styles.block, styles.blockLoss, { height: blockH, width: "82%" }]}
                                  />
                                ))}
                              {p.streakAfter === 0 ? <View style={styles.flatDot} /> : null}
                            </View>
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>
                  <View style={[styles.xLabelRow, { width: chartTotalW, gap: COL_GAP }]}>
                    {points.map((p, i) => (
                      <View key={`xl-${p.postId}`} style={[styles.xLabelCell, { width: colW }]}>
                        <Text style={styles.xLabel}>{i + 1}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            </View>
          </View>
        </ChartGlassShell>

        <View style={profileOverviewChartStatsWrapStyle}>
          <View style={profileOverviewChartStatsGridStyle}>
            <View style={[profileOverviewChartStatCellStyle, profileOverviewChartStatCellBorderRStyle]}>
              <Text style={profileOverviewChartStatLabelMutedStyle}>{statWinLabel}</Text>
              <View style={profileOverviewChartStatValueRowStyle}>
                <Text style={profileOverviewChartStatValueMutedStyle}>{stats.maxWinStreak}</Text>
              </View>
            </View>
            <View style={[profileOverviewChartStatCellStyle, profileOverviewChartStatCellBorderRStyle]}>
              <Text style={profileOverviewChartStatLabelMutedStyle}>{statLossLabel}</Text>
              <View style={profileOverviewChartStatValueRowStyle}>
                <Text style={profileOverviewChartStatValueMutedStyle}>{stats.maxLossStreak}</Text>
              </View>
            </View>
            <View style={profileOverviewChartStatCellStyle}>
              <Text style={profileOverviewChartStatLabelMutedStyle}>{statRecordLabel}</Text>
              <View style={profileOverviewChartStatValueRowStyle}>
                <Text style={profileOverviewChartStatValueMutedStyle}>{statRecordValue}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </ProfileOverviewChartCardNative>
  );
}

/** チャート領域（背景透明・格子オーバーレイなし） */
function ChartGlassShell({ children }: { children: ReactNode }) {
  return <View style={styles.chartShellTransparent}>{children}</View>;
}

function HeaderRow({ title, onInfoPress }: { title: string; onInfoPress: () => void }) {
  return (
    <View style={styles.titleWithInfo}>
      <Text style={styles.title}>{title}</Text>
      <Pressable onPress={onInfoPress} hitSlop={10}>
        <MaterialCommunityIcons name="information-outline" size={18} color="rgba(248,250,252,0.55)" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  foreground: {
    position: "relative",
    zIndex: 1,
    minWidth: 0,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 12,
    marginBottom: 12,
  },
  headerLeft: {
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
  },
  titleWithInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  title: profileOverviewChartTitleStyle,
  subtitle: {
    ...profileOverviewChartSubtitleStyle,
    marginTop: 6,
    maxWidth: 560,
  },
  badgeCol: {
    alignItems: "center",
    minWidth: 56,
  },
  badgeCircle: {
    minWidth: 44,
    minHeight: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  badgeWin: {
    backgroundColor: "rgba(251,191,36,0.14)",
    borderWidth: 1,
    borderColor: "rgba(253,224,71,0.22)",
  },
  badgeLoss: {
    backgroundColor: "rgba(244,63,94,0.14)",
    borderWidth: 1,
    borderColor: "rgba(251,113,133,0.24)",
  },
  badgeFlat: {
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  badgeNum: {
    fontSize: 22,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
    fontFamily: Platform.select({
      ios: "Oxanium_700Bold",
      android: "Oxanium_700Bold",
      default: "sans-serif",
    }),
  },
  badgeNumWin: { color: "rgba(253,230,138,0.98)" },
  badgeNumLoss: { color: "rgba(254,205,211,0.98)" },
  badgeNumFlat: { color: "rgba(248,250,252,0.95)" },
  badgeCaption: {
    marginTop: 4,
    fontSize: 9,
    color: "rgba(148,163,184,0.88)",
    textAlign: "center",
    maxWidth: 72,
  },
  chartShellTransparent: {
    backgroundColor: "transparent",
  },
  chartShellLoadingInner: {
    minHeight: 204,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingLabelCyber: {
    fontSize: 12,
    letterSpacing: 0.38,
  },
  chartInnerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  yAxis: {
    width: LEFT_AXIS_W,
    position: "relative",
    paddingRight: 4,
  },
  yTick: {
    position: "absolute",
    right: 2,
    fontSize: 9,
    lineHeight: 12,
    color: "rgba(148,163,184,0.9)",
    fontVariant: ["tabular-nums"],
  },
  plotFlex: {
    flex: 1,
    minWidth: 0,
  },
  /** 横スクロール廃止: プロットは親幅にクリップ */
  plotNoScrollWrap: {
    width: "100%",
    overflow: "hidden",
  },
  plotScrollInner: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 8,
  },
  columnsOverlay: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "row",
    alignItems: "stretch",
    zIndex: 3,
  },
  column: {
    alignItems: "center",
  },
  plotColumn: {
    width: "100%",
    position: "relative",
    overflow: "hidden",
    borderRadius: 8,
  },
  /** Web `absolute left-0 right-0 top-1/2 z-2 h-px bg-cyan-200/45` に相当（全幅の 0 ライン） */
  plotZeroLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(165,243,252,0.45)",
    zIndex: 2,
  },
  upperHalf: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    flexDirection: "column-reverse",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingBottom: 0,
    zIndex: 3,
  },
  lowerHalf: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 0,
    zIndex: 3,
  },
  block: {
    borderRadius: 2,
    maxWidth: COL_MAX_W,
    alignSelf: "center",
  },
  blockWin: {
    /** Web `bg-emerald-400/92` + `shadow-[0_0_6px_rgba(52,211,153,0.22)]` */
    backgroundColor: "rgba(52,211,153,0.92)",
    shadowColor: "rgba(52,211,153,0.22)",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  blockLoss: {
    /** Web `bg-rose-400/92` + `shadow-[0_0_6px_rgba(251,113,133,0.18)]` */
    backgroundColor: "rgba(251,113,133,0.92)",
    shadowColor: "rgba(251,113,133,0.18)",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  /** Web ストリーク 0: `bg-white/22` のピル（0 ライン付近） */
  flatDot: {
    marginTop: -2,
    height: 4,
    width: "65%",
    maxWidth: 12,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.22)",
    alignSelf: "center",
  },
  xLabelRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginTop: 4,
    minHeight: 16,
    alignSelf: "flex-start",
  },
  xLabelCell: {
    alignItems: "center",
    justifyContent: "center",
  },
  xLabel: {
    fontSize: 8,
    color: "rgba(100,116,139,0.95)",
    fontVariant: ["tabular-nums"],
  },
  muted: {
    color: "rgba(148,163,184,0.85)",
    fontSize: 13,
    paddingVertical: 16,
  },
  noDataBox: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 24,
  },
  noData: profileOverviewChartNoDataStyle,
  noDataHint: {
    ...profileOverviewChartEmptyHintStyle,
  },
});
