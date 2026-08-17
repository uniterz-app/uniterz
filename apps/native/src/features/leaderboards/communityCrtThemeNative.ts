import { Platform, StyleSheet, type TextStyle, type ViewStyle } from "react-native";

export const CRT_CYAN = "#00F5FF";
export const CRT_CYAN_BORDER = "rgba(0,245,255,0.45)";
export const CRT_AMBER_BORDER = "rgba(251,191,36,0.35)";

/** Web `CommunityPressable` active:scale-[0.995] / hover:brightness-110 */
export const communityPressableFilledStyle = (pressed: boolean): ViewStyle => ({
  opacity: pressed ? 0.92 : 1,
  transform: [{ scale: pressed ? 0.995 : 1 }],
});

export const communityPressableTapStyle = (pressed: boolean): ViewStyle => ({
  opacity: pressed ? 0.88 : 1,
  transform: [{ scale: pressed ? 0.98 : 1 }],
});

export const communitySlotGlassStyle: ViewStyle = {
  borderWidth: 1,
  borderColor: "rgba(0,245,255,0.16)",
  backgroundColor: "rgba(9,13,20,0.95)",
  ...Platform.select({
    ios: {
      shadowColor: "#00F5FF",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.08,
      shadowRadius: 14,
    },
    android: { elevation: 4 },
    default: {},
  }),
};

export const communityEmptySlotStyle: ViewStyle = {
  borderWidth: 1,
  borderStyle: "dashed",
  borderColor: "rgba(0,245,255,0.22)",
  backgroundColor: "rgba(0,245,255,0.02)",
};

export const communityEmptyJoinSlotStyle: ViewStyle = {
  borderWidth: 1,
  borderStyle: "dashed",
  borderColor: "rgba(251,191,36,0.28)",
  backgroundColor: "rgba(255,255,255,0.012)",
};

export const communityModalCardStyle: ViewStyle = {
  borderRadius: 0,
  borderWidth: 1,
  borderColor: "rgba(0,245,255,0.22)",
  backgroundColor: "rgba(5,11,20,0.97)",
  overflow: "hidden",
  ...Platform.select({
    ios: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 18 },
      shadowOpacity: 0.55,
      shadowRadius: 22,
    },
    android: { elevation: 12 },
    default: {},
  }),
};

export const communityFieldStyle: ViewStyle = {
  borderWidth: 1,
  borderColor: "rgba(255,255,255,0.12)",
  backgroundColor: "rgba(0,0,0,0.4)",
  paddingHorizontal: 10,
  paddingVertical: 8,
};

export const communityFieldLabelStyle: TextStyle = {
  fontSize: 10,
  fontWeight: "600",
  letterSpacing: 1.4,
  textTransform: "uppercase",
  color: "rgba(255,255,255,0.5)",
  marginBottom: 6,
};

export const communityMono = Platform.select({
  ios: "Menlo",
  android: "monospace",
  default: "monospace",
});

export const communityCrtStyles = StyleSheet.create({
  sectionLine: {
    height: 1,
    flex: 1,
    minWidth: 20,
  },
  sectionLineLeft: {
    backgroundColor: "transparent",
    borderTopWidth: 1,
    borderTopColor: "rgba(0,245,255,0.28)",
  },
  sectionLineRight: {
    backgroundColor: "transparent",
    borderTopWidth: 1,
    borderTopColor: "rgba(0,245,255,0.08)",
  },
  sectionLabel: {
    fontSize: 11,
    letterSpacing: 2.4,
    color: "rgba(165,243,252,0.7)",
    fontWeight: "700",
    textTransform: "uppercase",
  },
  sectionSuffix: {
    fontSize: 10,
    letterSpacing: 1.2,
    color: "rgba(165,243,252,0.5)",
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.18)",
    backgroundColor: "rgba(0,245,255,0.04)",
    paddingHorizontal: 6,
    paddingVertical: 1,
    fontFamily: communityMono,
  },
  roleBadgeOwner: {
    alignSelf: "flex-end",
  },
  roleBadgeMember: {
    alignSelf: "flex-end",
  },
  roleBadgeTextOwner: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    color: "#fbbf24",
    textShadowColor: "rgba(251,191,36,0.45)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  roleBadgeTextMember: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    color: "#00F5FF",
    textShadowColor: "rgba(0,245,255,0.45)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
});
