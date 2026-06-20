import type { ReactNode } from "react";
import { Platform, Pressable, StyleSheet, Text, View, type ViewStyle } from "react-native";
import {
  hasJaScript,
  rankingFontSizePx,
} from "../../../../../lib/rankings/rankingJaTextSize";
import { METRIC_FONT } from "./rankingsUiTheme";

export const CYBER_TAB_CYAN = "#00F5FF";

/** Web `.cyber-slanted-tab__scan` — 2px 透明 + 1px 線の 3px 周期 */
const SCAN_LINE_STEP = 3;
const SCAN_LINE_COUNT = 18;

type TabProps = {
  label: string;
  active: boolean;
  onPress: () => void;
  compact?: boolean;
  fill?: boolean;
  accessibilityRole?: "tab";
  accessibilityState?: { selected?: boolean };
};

function TabScanOverlay() {
  return (
    <View pointerEvents="none" style={styles.scanOverlay}>
      {Array.from({ length: SCAN_LINE_COUNT }, (_, i) => (
        <View key={i} style={[styles.scanLine, { top: 2 + i * SCAN_LINE_STEP }]} />
      ))}
    </View>
  );
}

/** Web `CyberSlantedTab` のネイティブ版 */
export function CyberSlantedTabNative({
  label,
  active,
  onPress,
  compact = false,
  fill = false,
  accessibilityRole,
  accessibilityState,
}: TabProps) {
  const jaLabel = hasJaScript(label);
  const fontSize = rankingFontSizePx(compact ? 9 : 10, label);

  return (
    <Pressable
      accessibilityRole={accessibilityRole}
      accessibilityState={accessibilityState}
      onPress={onPress}
      style={({ pressed }) => [
        fill ? styles.tabOuterFill : styles.tabOuter,
        pressed ? styles.tabPressed : null,
      ]}
    >
      <View
        style={[
          styles.tabSkew,
          fill ? styles.tabSkewFill : null,
          compact
            ? fill
              ? styles.tabFillCompact
              : styles.tabCompact
            : fill
              ? styles.tabFillDefault
              : null,
          active ? styles.tabActive : styles.tabInactive,
        ]}
      >
        {active ? <TabScanOverlay /> : null}
        <Text
          numberOfLines={1}
          maxFontSizeMultiplier={1.1}
          style={[
            styles.tabText,
            active ? styles.tabTextActive : null,
            {
              fontSize,
              lineHeight: Math.round(fontSize * 1.1),
              letterSpacing: jaLabel ? 0.4 : 1.1,
              transform: [{ skewX: "14deg" }],
            },
            !jaLabel ? styles.tabTextUpper : null,
          ]}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

export function CyberSlantedTabBarNative({
  children,
  fill = false,
  gridColumns,
  style,
}: {
  children: ReactNode;
  fill?: boolean;
  gridColumns?: 3;
  style?: ViewStyle;
}) {
  return (
    <View
      style={[
        gridColumns === 3 ? styles.barGrid3 : fill ? styles.barFill : styles.barScroll,
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function CyberSlantedTabGridItemNative({
  children,
  columns = 3,
}: {
  children: ReactNode;
  columns?: 3;
}) {
  return <View style={columns === 3 ? styles.gridItem3 : styles.gridItemFill}>{children}</View>;
}

const styles = StyleSheet.create({
  barFill: {
    flexDirection: "row",
    gap: 8,
    width: "100%",
    paddingBottom: 2,
    alignItems: "center",
  },
  barScroll: {
    flexDirection: "row",
    gap: 8,
    paddingBottom: 2,
    alignItems: "center",
  },
  barGrid3: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: 8,
    rowGap: 4,
    width: "100%",
    paddingBottom: 2,
    alignItems: "flex-start",
  },
  gridItem3: {
    width: "31%",
    flexGrow: 0,
    flexShrink: 0,
    alignSelf: "flex-start",
  },
  gridItemFill: {
    flex: 1,
    minWidth: 0,
  },
  tabOuter: {
    alignSelf: "flex-start",
  },
  tabOuterFill: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    minWidth: 0,
    alignSelf: "stretch",
  },
  tabSkew: {
    position: "relative",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 8,
    transform: [{ skewX: "-14deg" }],
  },
  tabSkewFill: {
    width: "100%",
  },
  tabFillDefault: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  tabFillCompact: {
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  tabCompact: {
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  tabInactive: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: CYBER_TAB_CYAN,
  },
  tabActive: {
    backgroundColor: CYBER_TAB_CYAN,
    borderWidth: 0,
    ...Platform.select({
      ios: {
        shadowColor: "rgba(0,245,255,0.45)",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 18,
      },
      android: { elevation: 4 },
      default: {},
    }),
  },
  tabPressed: {
    opacity: 0.92,
  },
  scanOverlay: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  scanLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(0, 0, 0, 0.14)",
  },
  tabText: {
    position: "relative",
    zIndex: 1,
    color: CYBER_TAB_CYAN,
    fontWeight: "700",
    fontFamily: METRIC_FONT,
    textAlign: "center",
  },
  tabTextActive: {
    color: "#050508",
  },
  tabTextUpper: {
    textTransform: "uppercase",
  },
});
