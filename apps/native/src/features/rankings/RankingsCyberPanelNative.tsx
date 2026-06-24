/** Web `RankingsCyberPanel` / `RankingsCyberSectionLabel` 相当 */
import type { ReactNode } from "react";
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { communityMono } from "../leaderboards/communityCrtThemeNative";

type PanelProps = {
  children: ReactNode;
  compact?: boolean;
  subtle?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function RankingsCyberPanelNative({
  children,
  compact = false,
  subtle = true,
  style,
}: PanelProps) {
  return (
    <View
      style={[
        styles.panelShadow,
        subtle ? styles.panelSubtle : styles.panelDefault,
        compact ? styles.panelCompact : styles.panelNormal,
        style,
      ]}
    >
      <View style={styles.panelInner}>{children}</View>
    </View>
  );
}

export function RankingsCyberSectionLabelNative({
  children,
  subtle = true,
  style,
}: {
  children: string;
  subtle?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      style={[
        styles.sectionRow,
        subtle ? styles.sectionBorderSubtle : styles.sectionBorderDefault,
        style,
      ]}
    >
      <View style={[styles.sectionDot, subtle ? styles.sectionDotSubtle : styles.sectionDotDefault]} />
      <Text style={[styles.sectionText, subtle ? styles.sectionTextSubtle : styles.sectionTextDefault]}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  panelShadow: {
    marginBottom: 16,
  },
  panelSubtle: {
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.18)",
    backgroundColor: "rgba(14,20,32,0.98)",
  },
  panelDefault: {
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.5)",
    backgroundColor: "rgba(22,34,54,0.98)",
  },
  panelCompact: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  panelNormal: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  panelInner: {
    position: "relative",
    zIndex: 1,
  },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
  },
  sectionBorderSubtle: {
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  sectionBorderDefault: {
    borderBottomColor: "rgba(34,211,238,0.2)",
  },
  sectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  sectionDotSubtle: {
    backgroundColor: "rgba(34,211,238,0.55)",
  },
  sectionDotDefault: {
    backgroundColor: "#22d3ee",
  },
  sectionText: {
    fontFamily: communityMono,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 2.2,
  },
  sectionTextSubtle: {
    fontSize: 10,
    color: "rgba(165,243,252,0.65)",
  },
  sectionTextDefault: {
    fontSize: 11,
    color: "rgba(165,243,252,0.85)",
  },
});
