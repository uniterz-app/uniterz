import { Platform, StyleSheet, type TextStyle, type ViewStyle } from "react-native";

export const CRT_CYAN = "#22d3ee";
export const CRT_CYAN_BORDER = "rgba(34,211,238,0.45)";
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
  borderColor: "rgba(255,255,255,0.1)",
  backgroundColor: "rgba(255,255,255,0.03)",
  ...Platform.select({
    ios: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.32,
      shadowRadius: 14,
    },
    android: { elevation: 4 },
    default: {},
  }),
};

export const communityEmptySlotStyle: ViewStyle = {
  borderWidth: 1,
  borderStyle: "dashed",
  borderColor: "rgba(34,211,238,0.2)",
  backgroundColor: "rgba(255,255,255,0.012)",
};

export const communityEmptyJoinSlotStyle: ViewStyle = {
  borderWidth: 1,
  borderStyle: "dashed",
  borderColor: "rgba(251,191,36,0.28)",
  backgroundColor: "rgba(255,255,255,0.012)",
};

export const communityModalCardStyle: ViewStyle = {
  borderRadius: 16,
  borderWidth: 1,
  borderColor: "rgba(255,255,255,0.12)",
  backgroundColor: "rgba(12,20,25,0.95)",
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
    borderTopColor: "rgba(34,211,238,0.28)",
  },
  sectionLineRight: {
    backgroundColor: "transparent",
    borderTopWidth: 1,
    borderTopColor: "rgba(34,211,238,0.08)",
  },
  sectionLabel: {
    fontSize: 12,
    letterSpacing: 3.2,
    color: "rgba(186,230,253,0.86)",
    fontWeight: "600",
  },
  sectionSuffix: {
    fontSize: 11,
    letterSpacing: 1.2,
    color: "rgba(165,243,252,0.5)",
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.18)",
    backgroundColor: "rgba(34,211,238,0.04)",
    paddingHorizontal: 6,
    paddingVertical: 1,
    fontFamily: communityMono,
  },
  roleBadgeOwner: {
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.65)",
    backgroundColor: "rgba(4,8,18,0.82)",
    paddingHorizontal: 6,
    paddingVertical: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.55,
    shadowRadius: 6,
    elevation: 4,
  },
  roleBadgeMember: {
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.45)",
    backgroundColor: "rgba(4,8,18,0.82)",
    paddingHorizontal: 6,
    paddingVertical: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.55,
    shadowRadius: 6,
    elevation: 4,
  },
  roleBadgeTextOwner: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.6,
    color: "#fde68a",
    textShadowColor: "rgba(0,0,0,0.85)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  roleBadgeTextMember: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.6,
    color: "#e0f2fe",
    textShadowColor: "rgba(0,0,0,0.85)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
