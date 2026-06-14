import type { TextStyle, ViewStyle } from "react-native";

/** Web `resultLiveBadgeClass` / Native `badgeUpset` に寄せた LIVE ピル */
export const liveMarkPillCyberBase: ViewStyle = {
  paddingHorizontal: 6,
  paddingVertical: 3,
  borderRadius: 6,
  borderWidth: 1,
  borderColor: "rgba(248,113,113,0.72)",
  backgroundColor: "rgba(220,38,38,0.94)",
  shadowColor: "#ef4444",
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.32,
  shadowRadius: 8,
  elevation: 5,
};

export const liveMarkTextCyberBase: TextStyle = {
  color: "#fef2f2",
  fontSize: 9,
  fontWeight: "900",
  letterSpacing: 0.4,
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
