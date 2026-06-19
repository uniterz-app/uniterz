import type { TextStyle, ViewStyle } from "react-native";

/** Web `resultLiveBadgeClass` / Native `badgeUpset` に寄せた LIVE ピル */
export const liveMarkPillCyberBase: ViewStyle = {
  position: "relative",
  overflow: "hidden",
  paddingHorizontal: 10,
  paddingVertical: 3,
  borderRadius: 2,
  borderWidth: 1,
  borderColor: "rgba(239,68,68,0.78)",
  backgroundColor: "rgba(185,28,28,0.52)",
  shadowColor: "#ef4444",
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.28,
  shadowRadius: 10,
  elevation: 5,
};

export const liveMarkTextCyberBase: TextStyle = {
  color: "#fef2f2",
  fontSize: 9,
  fontWeight: "900",
  letterSpacing: 1.26,
  textTransform: "uppercase",
  includeFontPadding: false,
  textShadowColor: "rgba(254,202,202,0.75)",
  textShadowOffset: { width: 0, height: 0 },
  textShadowRadius: 4,
};

/** リザルト一覧右上（Web resultMobile + hitBadgeSubtle） */
export const liveMarkPillCyberCompact: ViewStyle = {
  ...liveMarkPillCyberBase,
  paddingHorizontal: 6,
  paddingVertical: 3,
};

export const liveMarkTextCyberCompact: TextStyle = {
  ...liveMarkTextCyberBase,
  fontSize: 8,
  letterSpacing: 0.4,
};
