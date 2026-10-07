/** Web `ResultDayPipeGroup` の日付帯（日付 / hit / 合計 pt）相当 */
import { Platform, StyleSheet, Text, View } from "react-native";
import Animated, { useReducedMotion } from "react-native-reanimated";
import type { NativeDayPointsHeader } from "./nativeResultDaySummary";
import { dayStripNumberText, resultDayStripPanelNative } from "./resultMobileUiNative";
import { useResultDayHeaderEntrance } from "./useResultHomeEntrance";

export default function ResultDayStripNative({
  dateLabel,
  dayPoints,
  entranceActive = false,
  sectionStaggerIndex = 0,
}: {
  dateLabel: string;
  dayPoints: NativeDayPointsHeader;
  entranceActive?: boolean;
  sectionStaggerIndex?: number;
}) {
  const reduceMotion = useReducedMotion() ?? false;
  const { clipStyle, dateClusterStyle, rightClusterStyle } = useResultDayHeaderEntrance(
    entranceActive,
    reduceMotion,
    sectionStaggerIndex
  );
  return (
    <View style={resultDayStripPanelNative.outer}>
      <Animated.View style={[resultDayStripPanelNative.panel, clipStyle]}>
        <View style={resultDayStripPanelNative.row}>
          <Animated.View style={[resultDayStripPanelNative.dateCol, dateClusterStyle]}>
            <Text style={resultDayStripPanelNative.date}>{dateLabel}</Text>
          </Animated.View>
          {dayPoints?.variant === "total" ? (
            <>
              <Animated.View style={[resultDayStripPanelNative.hitCol, rightClusterStyle]}>
                {typeof dayPoints.hitTotal === "number" && dayPoints.hitTotal > 0 ? (
                  <View style={styles.dayHitWrap}>
                    <Text style={styles.dayHitLabel}>hit</Text>
                    <Text style={styles.dayHitNums}>
                      {dayPoints.hitWins ?? 0}/{dayPoints.hitTotal}
                    </Text>
                  </View>
                ) : null}
              </Animated.View>
              <Animated.View style={[resultDayStripPanelNative.totalCol, rightClusterStyle]}>
                <View style={styles.dayTotalWrap}>
                  <Text style={styles.dayTotalPrefix}>{dayPoints.prefix}</Text>
                  <Text style={styles.dayTotalValue}>{dayPoints.value}</Text>
                  <Text style={styles.dayTotalUnit}>{dayPoints.unit}</Text>
                </View>
              </Animated.View>
            </>
          ) : dayPoints?.variant === "pending" ? (
            <>
              <View style={resultDayStripPanelNative.divider} />
              <Animated.View style={[resultDayStripPanelNative.rightCol, rightClusterStyle]}>
                <View style={styles.pendingPill}>
                  <Text style={styles.pendingPillText}>{dayPoints.line}</Text>
                </View>
              </Animated.View>
            </>
          ) : null}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
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
