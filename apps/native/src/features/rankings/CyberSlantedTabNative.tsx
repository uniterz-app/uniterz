import type { ReactNode } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Platform, Pressable, StyleSheet, Text, View, type ViewStyle } from "react-native";
import {
  hasJaScript,
  rankingFontSizePx,
} from "../../../../../lib/rankings/rankingJaTextSize";
import { METRIC_FONT } from "./rankingsUiTheme";

export const CYBER_TAB_CYAN = "#00F5FF";

const SCAN_LINES = Array.from({ length: 18 }, (_, i) => i);

type TabProps = {
  label: string;
  active: boolean;
  onPress: () => void;
  compact?: boolean;
  fill?: boolean;
  accessibilityRole?: "tab";
  accessibilityState?: { selected?: boolean };
};

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
        styles.tab,
        fill ? styles.tabFill : null,
        compact ? styles.tabCompact : null,
        active ? styles.tabActive : styles.tabInactive,
        pressed ? styles.tabPressed : null,
      ]}
    >
      {active ? (
        <View pointerEvents="none" style={styles.scanOverlay}>
          {SCAN_LINES.map((line) => (
            <View
              key={line}
              style={[
                styles.scanLine,
                { top: line * 3, opacity: line % 2 === 0 ? 0.14 : 0 },
              ]}
            />
          ))}
        </View>
      ) : null}
      <Text
        numberOfLines={1}
        maxFontSizeMultiplier={1.1}
        style={[
          styles.tabText,
          active ? styles.tabTextActive : null,
          {
            fontSize,
            letterSpacing: jaLabel ? 0.6 : 1.4,
            transform: [{ skewX: "14deg" }],
          },
          !jaLabel ? styles.tabTextUpper : null,
        ]}
      >
        {label}
      </Text>
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
  },
  barScroll: {
    flexDirection: "row",
    gap: 8,
    paddingBottom: 2,
  },
  barGrid3: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    width: "100%",
    paddingBottom: 2,
  },
  gridItem3: {
    width: "31%",
    flexGrow: 1,
  },
  gridItemFill: {
    flex: 1,
    minWidth: 0,
  },
  tab: {
    position: "relative",
    overflow: "hidden",
    minHeight: 36,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    transform: [{ skewX: "-14deg" }],
  },
  tabFill: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 8,
  },
  tabCompact: {
    minHeight: 34,
    paddingHorizontal: 6,
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
      android: { elevation: 6 },
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
    backgroundColor: "#000",
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
