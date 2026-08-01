/** Web `RankingsCyberPanel` / `RankingsCyberSectionLabel` 相当 */
import type { ReactNode } from "react";
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { communityMono } from "../leaderboards/communityCrtThemeNative";

type PanelProps = {
  children: ReactNode;
  compact?: boolean;
  subtle?: boolean;
  /** 上辺ビーム + L字ブラケット */
  decorated?: boolean;
  style?: StyleProp<ViewStyle>;
  innerStyle?: StyleProp<ViewStyle>;
};

function RankingsCyberPanelDecorNative({
  variant = "full",
}: {
  variant?: "full" | "compact";
}) {
  return (
    <>
      <View style={styles.decorTopBeam} pointerEvents="none" />
      <View style={styles.decorLeftRail} pointerEvents="none" />
      <View style={[styles.decorCorner, styles.decorCornerTL]} pointerEvents="none" />
      {variant === "full" ? (
        <View style={[styles.decorCorner, styles.decorCornerBR]} pointerEvents="none" />
      ) : null}
    </>
  );
}

export function RankingsCyberPanelNative({
  children,
  compact = false,
  subtle = true,
  decorated = false,
  style,
  innerStyle,
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
      <View style={[styles.panelInner, innerStyle]}>
        {decorated ? (
          <RankingsCyberPanelDecorNative variant={subtle ? "compact" : "full"} />
        ) : null}
        {children}
      </View>
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
    overflow: "hidden",
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
    overflow: "hidden",
  },
  decorTopBeam: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 1.5,
    backgroundColor: "rgba(140,240,255,0.92)",
    shadowColor: "#22d3ee",
    shadowOpacity: 0.7,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    zIndex: 2,
  },
  decorLeftRail: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 1.5,
    backgroundColor: "rgba(140,240,255,0.85)",
    shadowColor: "#22d3ee",
    shadowOpacity: 0.55,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    zIndex: 2,
  },
  decorCorner: {
    position: "absolute",
    width: 14,
    height: 14,
    zIndex: 3,
  },
  decorCornerTL: {
    left: 0,
    top: 0,
    borderLeftWidth: 2,
    borderTopWidth: 2,
    borderColor: "rgba(140,240,255,0.92)",
  },
  decorCornerBR: {
    right: 8,
    bottom: 8,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "rgba(140,240,255,0.45)",
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
