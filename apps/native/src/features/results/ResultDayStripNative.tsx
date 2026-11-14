/** Web `ResultDayPipeGroup` の日付帯（日付 / hit / 合計 pt）相当 */
import { Platform, StyleSheet, Text, View } from "react-native";
import Animated, { useReducedMotion } from "react-native-reanimated";
import { MATCH_CARD_METRIC_FONT } from "../games/matchCardTypography";
import { MATCH_LINE_FRAME_GOLD } from "../../../../../lib/games/matchListLineFrame";
import type { NativeDayPointsHeader } from "./nativeResultDaySummary";
import { dayStripNumberText, resultDayStripPanelNative } from "./resultMobileUiNative";
import { useResultDayHeaderEntrance } from "./useResultHomeEntrance";

export default function ResultDayStripNative({
  dateLabel,
  dayPoints,
  pickupPoints = null,
  splitByPickup = false,
  entranceActive = false,
  sectionStaggerIndex = 0,
  linesToScreenEdge = false,
  showPoints = true,
}: {
  dateLabel: string;
  dayPoints: NativeDayPointsHeader;
  /** splitByPickup のとき、同じ日の PICK UP 集計。null は対象なし */
  pickupPoints?: NativeDayPointsHeader;
  /** 日付帯の ALL と PICK UP を上下2段にする */
  splitByPickup?: boolean;
  entranceActive?: boolean;
  sectionStaggerIndex?: number;
  /** 日付を画面中央に置き、両側の線を画面端まで伸ばす */
  linesToScreenEdge?: boolean;
  /** false のとき日付だけ。合計点は出さない */
  showPoints?: boolean;
}) {
  const reduceMotion = useReducedMotion() ?? false;
  const { clipStyle, dateClusterStyle, rightClusterStyle } = useResultDayHeaderEntrance(
    entranceActive,
    reduceMotion,
    sectionStaggerIndex
  );
  const stats = !showPoints ? null : splitByPickup ? (
          <Animated.View style={[styles.splitTrack, rightClusterStyle]}>
            <DaySplitCell label="ALL" points={dayPoints} />
            <View style={styles.splitRule} />
            <DaySplitCell label="PICK UP" points={pickupPoints} />
          </Animated.View>
        ) : dayPoints?.variant === "total" ? (
          <Animated.View style={[styles.statsRow, rightClusterStyle]}>
            {typeof dayPoints.hitTotal === "number" && dayPoints.hitTotal > 0 ? (
              <View style={styles.dayHitWrap}>
                <Text style={styles.dayHitLabel}>hit</Text>
                <Text style={styles.dayHitNums}>
                  {dayPoints.hitWins ?? 0}/{dayPoints.hitTotal}
                </Text>
              </View>
            ) : null}
            <View style={styles.dayTotalWrap}>
              <Text style={styles.dayTotalPrefix}>{dayPoints.prefix}</Text>
              <Text style={styles.dayTotalValue}>{dayPoints.value}</Text>
              <Text style={styles.dayTotalUnit}>{dayPoints.unit}</Text>
            </View>
          </Animated.View>
        ) : dayPoints?.variant === "pending" ? (
          <Animated.View style={[styles.pendingRow, rightClusterStyle]}>
            <View style={styles.pendingPill}>
              <Text style={styles.pendingPillText}>{dayPoints.line}</Text>
            </View>
          </Animated.View>
        ) : null;

  const dateRow = (
    <View style={styles.cutRow}>
      <View style={styles.cutLine} />
      <Animated.View style={dateClusterStyle}>
        <Text style={styles.cutDate}>{dateLabel}</Text>
      </Animated.View>
      <View style={styles.cutLine} />
    </View>
  );

  if (linesToScreenEdge) {
    return (
      <Animated.View style={[styles.screenBand, clipStyle]}>
        {dateRow}
        <View style={resultDayStripPanelNative.outer}>{stats}</View>
      </Animated.View>
    );
  }

  return (
    <View style={resultDayStripPanelNative.outer}>
      <Animated.View style={[resultDayStripPanelNative.panel, styles.panelOpen, clipStyle]}>
        {dateRow}
        {stats}
      </Animated.View>
    </View>
  );
}

function DaySplitCell({
  label,
  points,
}: {
  label: string;
  points: NativeDayPointsHeader;
}) {
  const hit =
    points?.variant === "total" &&
    typeof points.hitTotal === "number" &&
    points.hitTotal > 0
      ? `${points.hitWins ?? 0}/${points.hitTotal}`
      : null;
  return (
    <View style={styles.splitCell}>
      <Text style={styles.splitKind} numberOfLines={1}>
        {label}
      </Text>
      {points?.variant === "total" ? (
        <View style={styles.splitNums}>
          {hit ? <Text style={styles.splitHitNums}>{hit}</Text> : null}
          <Text style={styles.splitValue}>{points.value}</Text>
          <Text style={styles.splitUnit}>{points.unit}</Text>
        </View>
      ) : (
        <Text style={styles.splitPending} numberOfLines={1}>
          {points?.variant === "pending" ? "未確定" : "—"}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screenBand: {
    width: "100%",
    overflow: "visible",
  },
  panelOpen: {
    overflow: "visible",
  },
  cutRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 28,
  },
  /** カード上辺の REGULAR SEASON と同じ Oxanium。斜体のスコア書体は使わない */
  cutDate: {
    flexShrink: 0,
    fontFamily: MATCH_CARD_METRIC_FONT,
    fontWeight: "700",
    fontSize: 16,
    lineHeight: 20,
    letterSpacing: 0.8,
    includeFontPadding: false,
    fontVariant: ["tabular-nums"],
    color: MATCH_LINE_FRAME_GOLD,
  },
  /** 一覧の金枠・白数字・シアンに無い色。スクロール中の境 */
  cutLine: {
    flex: 1,
    height: 4,
    backgroundColor: "#C8FF3D",
  },
  splitTrack: {
    alignSelf: "stretch",
    minWidth: 0,
    justifyContent: "center",
    paddingTop: 6,
    paddingBottom: 2,
    gap: 3,
  },
  splitRule: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.12)",
    marginLeft: 72,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "flex-end",
    gap: 14,
    paddingTop: 6,
    paddingBottom: 2,
  },
  pendingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingTop: 6,
    paddingBottom: 2,
  },
  splitCell: {
    minHeight: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  splitKind: {
    width: 64,
    flexShrink: 0,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.3,
    color: "rgba(255,255,255,0.72)",
  },
  splitNums: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "flex-end",
    gap: 6,
  },
  splitHitNums: {
    ...dayStripNumberText,
    flexShrink: 0,
    fontSize: 14,
    color: "rgba(255,255,255,0.95)",
    letterSpacing: -0.4,
    lineHeight: 16,
  },
  splitValue: {
    ...dayStripNumberText,
    flexShrink: 0,
    fontSize: 15,
    color: "rgba(255,255,255,0.98)",
    letterSpacing: -0.4,
    lineHeight: 17,
  },
  splitUnit: {
    flexShrink: 0,
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255,255,255,0.92)",
  },
  splitPending: {
    flex: 1,
    minWidth: 0,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.2,
    color: "rgba(248,250,252,0.88)",
  },
  dayHitWrap: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
    flexShrink: 0,
  },
  dayHitLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "rgba(255,255,255,0.82)",
    letterSpacing: 0.3,
  },
  dayHitNums: {
    ...dayStripNumberText,
    fontSize: 16,
    color: "rgba(255,255,255,0.95)",
    letterSpacing: -0.4,
    lineHeight: 18,
  },
  dayTotalWrap: {
    flexShrink: 0,
    flexDirection: "row",
    flexWrap: "nowrap",
    alignItems: "baseline",
    justifyContent: "flex-end",
    gap: 4,
  },
  dayTotalPrefix: {
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(255,255,255,0.92)",
  },
  dayTotalValue: {
    ...dayStripNumberText,
    fontSize: 17,
    color: "rgba(255,255,255,0.98)",
    letterSpacing: -0.4,
    lineHeight: 19,
  },
  dayTotalUnit: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255,255,255,0.92)",
  },
  /** 得点未確定ピル — 白黒・グローなし */
  pendingPill: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(255,255,255,0.45)",
    backgroundColor: "rgba(0,0,0,0.72)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 0,
  },
  pendingPillText: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.35,
    color: "rgba(248,250,252,0.88)",
    backgroundColor: "transparent",
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "monospace",
    }),
  },
});
