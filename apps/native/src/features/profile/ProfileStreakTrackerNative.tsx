/**
 * Web `StreakTrackerCard`（Last20 Tracker）に準拠したネイティブ版。
 */
import { useId, useMemo, useState, type ReactNode } from "react";
import {
  Alert,
  LayoutChangeEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { BlurView } from "expo-blur";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Svg, { Defs, Line, Pattern, Rect, Path as SvgPath } from "react-native-svg";
import { STREAK_TRACKER_LAST_N, type StreakTrackerPointNative } from "./useNativeStreakTracker";
import {
  PROFILE_SHELL_GRID_NATIVE,
  profileShellGridPathD,
} from "./profileShellGridNative";
import { streakChartLayoutMaxAbs } from "../../../../../lib/profile/streakTrackerChartLayout";
import { BlocksPulseLoader } from "../../components/BlocksPulseLoader";
import { nativeBlurViewExtraProps } from "../../ui/nativeBlurProps";

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
/** Web `sm:` 相当でフッターを 3 列に */
const FOOTER_WIDE_BREAKPOINT = 640;

/** Web `StreakTrackerCard` の `CHART_GRID_STYLE`（18px・線色）と同一 */
const CHART_GRID_STEP = 18;
const CHART_GRID_STROKE = "rgba(148,163,184,0.22)";
/** Web 格子フェード終了時 opacity 0.5 */
const CHART_GRID_OPACITY = 0.5;
/** Y軸ラベル（fontSize 9）の縦方向の半分相当で数値位置と中央揃え */
const Y_TICK_CENTER_OFFSET = 5;

function chartGridLinePositions(max: number, step: number): number[] {
  const out: number[] = [];
  for (let v = 0; v <= max; v += step) out.push(v);
  if (out.length === 0 || out[out.length - 1] < max) out.push(max);
  return out;
}

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
  const { width: windowW } = useWindowDimensions();
  const footerWide = windowW >= FOOTER_WIDE_BREAKPOINT;
  const [plotInnerW, setPlotInnerW] = useState(0);
  const sid = useId().replace(/[^a-zA-Z0-9_]/g, "_");
  const gridPatternId = `streak_tracker_${sid}`;

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

  /** Web `CHART_GRID_STYLE` と同じ 18px 方眼（縦線・横線） */
  const chartGridLines = useMemo((): ReactNode[] => {
    const w = Math.max(1, plotChartW);
    const h = PLOT_H;
    const xs = chartGridLinePositions(w, CHART_GRID_STEP);
    const ys = chartGridLinePositions(h, CHART_GRID_STEP);
    const nodes: ReactNode[] = [];
    for (const x of xs) {
      nodes.push(
        <Line
          key={`gv-${x}`}
          x1={x}
          y1={0}
          x2={x}
          y2={h}
          stroke={CHART_GRID_STROKE}
          strokeWidth={1}
        />
      );
    }
    for (const y of ys) {
      nodes.push(
        <Line
          key={`gh-${y}`}
          x1={0}
          y1={y}
          x2={w}
          y2={y}
          stroke={CHART_GRID_STROKE}
          strokeWidth={1}
        />
      );
    }
    return nodes;
  }, [plotChartW]);

  const halfH = PLOT_H / 2;
  const blockH = Math.max(2, (halfH - (maxAbs - 1) * BLOCK_GAP_PX) / maxAbs);

  const openInfo = () => Alert.alert(title, subtitle);

  if (loading) {
    return (
      <View style={styles.card}>
        <KinetikFrameCorners />
        <ShellGridBackdrop patternId={`${gridPatternId}_shell`} />
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
      </View>
    );
  }

  if (points.length === 0) {
    return (
      <View style={styles.card}>
        <KinetikFrameCorners />
        <ShellGridBackdrop patternId={`${gridPatternId}_shell`} />
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
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <KinetikFrameCorners />
      <ShellGridBackdrop patternId={`${gridPatternId}_shell`} />
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
                    <Svg
                      width={plotChartW}
                      height={PLOT_H}
                      style={[styles.plotSvgBg, { opacity: CHART_GRID_OPACITY }]}
                      pointerEvents="none"
                    >
                      {chartGridLines}
                    </Svg>
                    {/* Web と同じ Y=0 をプロット幅全体に一本（列ごとの View では途切れる） */}
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

        {footerWide ? (
          <View style={styles.footerRowWide}>
            <View style={[styles.statCard, styles.statWinCard, styles.footerThird]}>
              <View style={styles.statLeft}>
                <MaterialCommunityIcons name="trending-up" size={20} color="rgba(110,231,183,0.95)" />
                <Text style={[styles.statLabelWin, !isJa && styles.statLabelEnUpper]}>
                  {statWinLabel}
                </Text>
              </View>
              <Text style={styles.statValueWin}>{stats.maxWinStreak}</Text>
            </View>
            <View style={[styles.statCard, styles.statLossCard, styles.footerThird]}>
              <View style={styles.statLeft}>
                <MaterialCommunityIcons name="trending-down" size={20} color="rgba(251,113,133,0.95)" />
                <Text style={[styles.statLabelLoss, !isJa && styles.statLabelEnUpper]}>
                  {statLossLabel}
                </Text>
              </View>
              <Text style={styles.statValueLoss}>{stats.maxLossStreak}</Text>
            </View>
            <View style={[styles.statCard, styles.statRecordCard, styles.footerThird]}>
              <View style={styles.statLeft}>
                <MaterialCommunityIcons name="chart-bar" size={20} color="rgba(125,211,252,0.95)" />
                <Text style={[styles.statLabelRecord, !isJa && styles.statLabelEnUpper]}>
                  {statRecordLabel}
                </Text>
              </View>
              <Text style={styles.statValueRecord}>{statRecordValue}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.footerGrid}>
            <View style={styles.footerTopRow}>
              <View style={[styles.statCard, styles.statWinCard, styles.statHalf]}>
                <View style={styles.statLeft}>
                  <MaterialCommunityIcons name="trending-up" size={18} color="rgba(110,231,183,0.95)" />
                  <Text style={[styles.statLabelWin, !isJa && styles.statLabelEnUpper]}>
                    {statWinLabel}
                  </Text>
                </View>
                <Text style={styles.statValueWin}>{stats.maxWinStreak}</Text>
              </View>
              <View style={[styles.statCard, styles.statLossCard, styles.statHalf]}>
                <View style={styles.statLeft}>
                  <MaterialCommunityIcons name="trending-down" size={18} color="rgba(251,113,133,0.95)" />
                  <Text style={[styles.statLabelLoss, !isJa && styles.statLabelEnUpper]}>
                    {statLossLabel}
                  </Text>
                </View>
                <Text style={styles.statValueLoss}>{stats.maxLossStreak}</Text>
              </View>
            </View>
            <View style={[styles.statCard, styles.statRecordCard]}>
              <View style={styles.statLeft}>
                <MaterialCommunityIcons name="chart-bar" size={18} color="rgba(125,211,252,0.95)" />
                <Text style={[styles.statLabelRecord, !isJa && styles.statLabelEnUpper]}>
                  {statRecordLabel}
                </Text>
              </View>
              <Text style={styles.statValueRecord}>{statRecordValue}</Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

/** チャート枠：背面のプロフィール格子と分離するガラス層 */
function ChartGlassShell({ children }: { children: ReactNode }) {
  return (
    <View style={styles.chartShellOuter}>
      {(Platform.OS === "ios" || Platform.OS === "android") && (
        <BlurView
          pointerEvents="none"
          style={StyleSheet.absoluteFillObject}
          tint="dark"
          intensity={Platform.OS === "ios" ? 34 : 26}
          {...nativeBlurViewExtraProps()}
        />
      )}
      <View style={styles.chartShellFilm} pointerEvents="none" />
      <View style={styles.chartShellInner}>{children}</View>
    </View>
  );
}

/** カード全面の Shell 格子（チャート直下はガラスで隠すためやや弱める） */
function ShellGridBackdrop({ patternId }: { patternId: string }) {
  const c = PROFILE_SHELL_GRID_NATIVE.cellPx;
  const opacity = PROFILE_SHELL_GRID_NATIVE.layerOpacity * 0.62;
  return (
    <Svg
      width="100%"
      height="100%"
      style={[StyleSheet.absoluteFillObject, { opacity }]}
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
    <View style={styles.titleWithInfo}>
      <Text style={styles.title}>{title}</Text>
      <Pressable onPress={onInfoPress} hitSlop={10}>
        <MaterialCommunityIcons name="information-outline" size={18} color="rgba(248,250,252,0.55)" />
      </Pressable>
    </View>
  );
}

/** Web `ProfileKinetikPanelFrame` の四隅アクセント */
function KinetikFrameCorners() {
  return (
    <View pointerEvents="none" style={styles.frameCorners}>
      <View style={[styles.frameCorner, styles.frameCornerTopLeft]} />
      <View style={[styles.frameCorner, styles.frameCornerTopRight]} />
      <View style={[styles.frameCorner, styles.frameCornerBottomLeft]} />
      <View style={[styles.frameCorner, styles.frameCornerBottomRight]} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    backgroundColor: "rgba(5,8,20,0.72)",
    padding: 12,
    overflow: "hidden",
    position: "relative",
    ...Platform.select({
      ios: {
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.45,
        shadowRadius: 30,
      },
      android: { elevation: 10 },
      default: {},
    }),
  },
  foreground: {
    position: "relative",
    zIndex: 1,
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
  title: {
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
    marginTop: 6,
    color: "rgba(148,163,184,0.85)",
    fontSize: 11,
    lineHeight: 15,
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
  chartShellOuter: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(165,243,252,0.28)",
    position: "relative",
    ...Platform.select({
      ios: {
        shadowColor: "rgba(0,0,0,0.35)",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 14,
      },
      android: { elevation: 3 },
      default: {},
    }),
  },
  chartShellFilm: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(8,12,22,0.82)",
  },
  chartShellInner: {
    position: "relative",
    zIndex: 1,
    paddingTop: 6,
    paddingBottom: 4,
    paddingHorizontal: 4,
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
  plotSvgBg: {
    position: "absolute",
    left: 0,
    top: 0,
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
  footerGrid: {
    marginTop: 10,
    gap: 8,
  },
  footerRowWide: {
    marginTop: 10,
    flexDirection: "row",
    gap: 12,
    alignItems: "stretch",
  },
  footerThird: {
    flex: 1,
    minWidth: 0,
  },
  footerTopRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "stretch",
  },
  statHalf: {
    flex: 1,
    minWidth: 0,
  },
  statCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  statWinCard: {
    borderWidth: 1,
    borderColor: "rgba(52,211,153,0.25)",
    backgroundColor: "rgba(16,185,129,0.07)",
  },
  statLossCard: {
    borderWidth: 1,
    borderColor: "rgba(251,113,133,0.25)",
    backgroundColor: "rgba(244,63,94,0.07)",
  },
  statRecordCard: {
    borderWidth: 1,
    borderColor: "rgba(56,189,248,0.2)",
    backgroundColor: "rgba(14,165,233,0.06)",
  },
  statLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  statLabelWin: {
    flex: 1,
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(167,243,208,0.92)",
  },
  statLabelLoss: {
    flex: 1,
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(254,205,211,0.92)",
  },
  statLabelRecord: {
    flex: 1,
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(226,232,240,0.9)",
  },
  /** Web EN: `uppercase tracking-[0.14em]` */
  statLabelEnUpper: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  statValueWin: {
    fontSize: 28,
    fontWeight: "700",
    color: "rgba(167,243,208,0.98)",
    fontVariant: ["tabular-nums"],
    fontFamily: Platform.select({
      ios: "Oxanium_700Bold",
      android: "Oxanium_700Bold",
      default: "sans-serif",
    }),
  },
  statValueLoss: {
    fontSize: 28,
    fontWeight: "700",
    color: "rgba(254,205,211,0.98)",
    fontVariant: ["tabular-nums"],
    fontFamily: Platform.select({
      ios: "Oxanium_700Bold",
      android: "Oxanium_700Bold",
      default: "sans-serif",
    }),
  },
  statValueRecord: {
    fontSize: 28,
    fontWeight: "700",
    color: "rgba(248,250,252,0.95)",
    fontVariant: ["tabular-nums"],
    fontFamily: Platform.select({
      ios: "Oxanium_700Bold",
      android: "Oxanium_700Bold",
      default: "sans-serif",
    }),
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
  noData: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 3,
    color: "rgba(248,250,252,0.35)",
    fontFamily: Platform.select({
      ios: "Oxanium_700Bold",
      android: "Oxanium_700Bold",
      default: "sans-serif",
    }),
  },
  noDataHint: {
    marginTop: 10,
    fontSize: 11,
    color: "rgba(248,250,252,0.42)",
    textAlign: "center",
  },
  frameCorners: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 3,
  },
  frameCorner: {
    position: "absolute",
    width: 18,
    height: 18,
    borderColor: "rgba(255,255,255,0.88)",
  },
  frameCornerTopLeft: {
    left: -1,
    top: -1,
    borderLeftWidth: 2,
    borderTopWidth: 2,
  },
  frameCornerTopRight: {
    right: -1,
    top: -1,
    borderRightWidth: 2,
    borderTopWidth: 2,
  },
  frameCornerBottomLeft: {
    left: -1,
    bottom: -1,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
  },
  frameCornerBottomRight: {
    right: -1,
    bottom: -1,
    borderRightWidth: 2,
    borderBottomWidth: 2,
  },
});
