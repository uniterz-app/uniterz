import type { TextStyle, ViewStyle } from "react-native";

/** Web `resultLiveBadgeClass`（resultMobile / subtle）に寄せた LIVE バッジ */
export const resultLiveBadgeCompact: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  paddingHorizontal: 8,
  paddingVertical: 2,
  borderRadius: 2,
  borderWidth: 1,
  borderColor: "rgba(239,68,68,0.78)",
  borderLeftWidth: 3,
  borderLeftColor: "rgba(252,165,165,0.55)",
  backgroundColor: "rgba(69,10,10,0.88)",
  shadowColor: "#ef4444",
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.26,
  shadowRadius: 10,
  elevation: 4,
};

export const resultLiveBadgeCompactText: TextStyle = {
  color: "#fef2f2",
  fontSize: 8,
  fontWeight: "900",
  letterSpacing: 0.48,
  textTransform: "uppercase",
  includeFontPadding: false,
  textShadowColor: "rgba(254,202,202,0.75)",
  textShadowOffset: { width: 0, height: 0 },
  textShadowRadius: 4,
};
