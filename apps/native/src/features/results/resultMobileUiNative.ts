import { Platform, StyleSheet, type TextStyle, type ViewStyle } from "react-native";
import { MATCH_CARD_SCORE_FONT } from "../games/matchCardTypography";
import { PANEL_BG } from "../profile/reports/reportThemeNative";
import { resultStreakTier } from "../../../../../lib/result/resultGlass";

/** Web `mobileListCardLayout` / `/mobile/result` */
export const MOBILE_RESULT_PAGE_PAD_X = 18;
export const MOBILE_RESULT_PAGE_PAD_Y = 16;
export const MOBILE_RESULT_SECTION_GAP = 6;
export const MOBILE_RESULT_CARD_GAP = 8;
/** 日付帯→先頭カード / 最終カード→次の日付帯 */
export const MOBILE_RESULT_DAY_HEADER_TO_CARD_GAP = 4;
/** Web `MOBILE_LIST_CARD_MAX_W_CLASS`（23rem）= 試合カードと同じ */
export const MOBILE_RESULT_CARD_MAX_W = 368;

/** Web `ResultCard` scheduleDense（モバイル一覧） */
export const MOBILE_RESULT_JERSEY_SIZE = 52;
/** リザルトカードのジャージだけ幅をわずかに詰める（高さは size のまま） */
export const MOBILE_RESULT_JERSEY_WIDTH_SCALE = 0.9;
/** モバイル一覧：国旗列と中央スコアの間（px） */
export const MOBILE_RESULT_MATCH_SIDE_SCORE_PAD = 36;
export const MOBILE_RESULT_CARD_PAD_TOP = 28;
export const MOBILE_RESULT_CARD_PAD_X = 8;
export const MOBILE_RESULT_CARD_PAD_BOTTOM = 6;

/** Web `RESULT_STAT_ROW_GRID_COMPACT`（5rem / 1fr / 1.75rem, gap-x-1.5） */
export const MOBILE_RESULT_STAT_LABEL_W = 80;
export const MOBILE_RESULT_STAT_VALUE_W = 28;
export const MOBILE_RESULT_STAT_ROW_GAP = 6;

/** Web overlay `ResultStatsRows` comfortable（5.5rem / 1fr / 2.25rem, gap-x-2） */
export const OVERLAY_RESULT_STAT_LABEL_W = 88;
export const OVERLAY_RESULT_STAT_VALUE_W = 36;
export const OVERLAY_RESULT_STAT_ROW_GAP = 8;

export const NUMERIC_FONT = Platform.select({
  ios: "Oxanium_700Bold",
  android: "Oxanium_700Bold",
  default: "Oxanium_700Bold",
});

export const DISPLAY_FONT = Platform.select({
  ios: "BebasNeue_400Regular",
  android: "BebasNeue_400Regular",
  default: "BebasNeue_400Regular",
});

/** 日付帯の数字 — リザルトカードスコアと同じ Montserrat Black Italic */
export const dayStripNumberText: TextStyle = {
  fontFamily: MATCH_CARD_SCORE_FONT,
  fontWeight: "900",
  fontStyle: "italic",
  fontVariant: ["tabular-nums"],
};

export const MONO_FONT = Platform.select({
  ios: "Menlo",
  android: "monospace",
  default: "monospace",
});

const cyberBadgeBase: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  alignSelf: "flex-start",
  borderRadius: 0,
  paddingHorizontal: 8,
  paddingVertical: 2,
  borderWidth: 1,
};

const cyberBadgeTextBase: TextStyle = {
  fontSize: 8,
  fontWeight: "800",
  letterSpacing: 1,
  textTransform: "uppercase",
  color: "#fff",
};

/** Web `resultHitBadgeClass(compact, { subtle: true })` */
export function resultHitBadgeStyleNative(): ViewStyle {
  return {
    ...cyberBadgeBase,
    borderColor: "rgba(251,191,36,0.62)",
    borderLeftWidth: 3,
    borderLeftColor: "rgba(253,224,71,0.5)",
    backgroundColor: "rgba(69,26,3,0.42)",
  };
}

export function resultPerfectBadgeStyleNative(): ViewStyle {
  return {
    ...cyberBadgeBase,
    borderColor: "rgba(167,139,250,0.78)",
    borderLeftWidth: 3,
    borderLeftColor: "rgba(196,181,253,0.6)",
    backgroundColor: "rgba(30,27,75,0.48)",
  };
}

export function resultMissBadgeStyleNative(): ViewStyle {
  return {
    ...cyberBadgeBase,
    borderColor: "rgba(148,163,184,0.5)",
    borderLeftWidth: 3,
    borderLeftColor: "rgba(148,163,184,0.42)",
    backgroundColor: "rgba(0,0,0,0.44)",
  };
}

export function resultUpsetBadgeStyleNative(): ViewStyle {
  return {
    ...cyberBadgeBase,
    borderColor: "rgba(248,113,113,0.72)",
    borderLeftWidth: 3,
    borderLeftColor: "rgba(252,165,165,0.58)",
    backgroundColor: "rgba(69,10,10,0.48)",
  };
}

export function resultStreakBadgeStyleNative(activeWinStreak: unknown): ViewStyle | null {
  const tier = resultStreakTier(activeWinStreak);
  if (!tier) return null;
  if (tier === "gold") {
    return {
      ...cyberBadgeBase,
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderColor: "rgba(251,191,36,0.84)",
      borderLeftWidth: 3,
      borderLeftColor: "rgba(255,237,180,0.72)",
      backgroundColor: "rgba(69,26,3,0.5)",
    };
  }
  if (tier === "platinum") {
    return {
      ...cyberBadgeBase,
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderColor: "rgba(34,211,238,0.82)",
      borderLeftWidth: 3,
      borderLeftColor: "rgba(186,250,255,0.68)",
      backgroundColor: "rgba(15,23,42,0.5)",
    };
  }
  return {
    ...cyberBadgeBase,
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderColor: "rgba(226,232,240,0.78)",
    borderLeftWidth: 3,
    borderLeftColor: "rgba(248,250,252,0.62)",
    backgroundColor: "rgba(15,23,42,0.5)",
  };
}

export function resultStreakBadgeTextNative(): TextStyle {
  return {
    ...cyberBadgeTextBase,
    fontSize: 9,
    letterSpacing: 1.1,
    maxWidth: 120,
  };
}

export const resultOutcomeBadgeTextNative = StyleSheet.create({
  hit: {
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "#fffbeb",
  },
  perfect: {
    fontSize: 7,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: "#f5f3ff",
  },
  miss: {
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "#f1f5f9",
  },
  upset: {
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "#fef2f2",
  },
});

/** Web `resultDayStripPanelClass(true)` + RESULT_GLASS モバイル */
export const resultDayStripPanelNative = StyleSheet.create({
  outer: {
    width: "100%",
    maxWidth: MOBILE_RESULT_CARD_MAX_W,
    alignSelf: "center",
  },
  panel: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 0,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: PANEL_BG,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  row: {
    position: "relative",
    zIndex: 3,
    flexDirection: "row",
    alignItems: "stretch",
    minHeight: 40,
  },
  dateCol: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
    alignItems: "flex-start",
    paddingLeft: 12,
    paddingRight: 6,
    paddingVertical: 6,
  },
  date: {
    flexShrink: 0,
    ...dayStripNumberText,
    fontSize: 15,
    lineHeight: 17,
    color: "rgba(236,254,255,0.95)",
    letterSpacing: -0.4,
  },
  divider: {
    width: 1,
    alignSelf: "stretch",
    marginVertical: 5,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  /** 確定日: hit を中央列 */
  hitCol: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  /** 確定日: 総合スコアを右列 */
  totalCol: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingRight: 10,
    paddingLeft: 4,
    paddingVertical: 6,
  },
  /** 未確定日: 得点未確定ピルを右寄せ */
  rightCol: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
});

/** Web `.cyber-filter-bar` */
export const resultFilterBarNative = StyleSheet.create({
  bar: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 0,
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.2)",
    backgroundColor: "#000",
    paddingVertical: 10,
    paddingHorizontal: 12,
    shadowColor: "#00f5ff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
  },
  barPressed: {
    opacity: 0.9,
    borderColor: "rgba(0,245,255,0.38)",
  },
  text: {
    color: "rgba(255,255,255,0.92)",
    fontSize: 11,
    fontWeight: "600",
  },
});

/** Web `ResultGlassShell` dense — 塗りと角切りは `ResultGlassShellNative` 側 */
export const resultCardShellNative = StyleSheet.create({
  shell: {
    position: "relative",
    overflow: "hidden",
  },
  body: {
    position: "relative",
    zIndex: 1,
    paddingHorizontal: MOBILE_RESULT_CARD_PAD_X,
    paddingTop: MOBILE_RESULT_CARD_PAD_TOP,
    paddingBottom: MOBILE_RESULT_CARD_PAD_BOTTOM,
  },
});
