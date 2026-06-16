import { Platform, StyleSheet, type TextStyle, type ViewStyle } from "react-native";
import { resultStreakTier } from "../../../../../lib/result/resultGlass";

/** Web `mobileListCardLayout` / `/mobile/result` */
export const MOBILE_RESULT_PAGE_PAD_X = 18;
export const MOBILE_RESULT_PAGE_PAD_Y = 16;
export const MOBILE_RESULT_SECTION_GAP = 12;
export const MOBILE_RESULT_CARD_GAP = 12;
export const MOBILE_RESULT_CARD_MAX_W = 344;
export const MOBILE_RESULT_DAY_STRIP_MAX_W = 380;

/** Web `ResultCard` scheduleDense（モバイル一覧） */
export const MOBILE_RESULT_JERSEY_SIZE = 62;
export const MOBILE_RESULT_CARD_PAD_TOP = 28;
export const MOBILE_RESULT_CARD_PAD_X = 8;
export const MOBILE_RESULT_CARD_PAD_BOTTOM = 6;

/** Web `RESULT_STAT_ROW_GRID_COMPACT`（5rem / 1fr / 1.75rem, gap-x-1.5） */
export const MOBILE_RESULT_STAT_LABEL_W = 80;
export const MOBILE_RESULT_STAT_VALUE_W = 28;
export const MOBILE_RESULT_STAT_ROW_GAP = 6;

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
  hit: { ...cyberBadgeTextBase, color: "#fffbeb" },
  perfect: { ...cyberBadgeTextBase, fontSize: 7, letterSpacing: 0.6, color: "#f5f3ff" },
  miss: { ...cyberBadgeTextBase, color: "#f1f5f9" },
  upset: { ...cyberBadgeTextBase, color: "#fef2f2" },
});

/** Web `resultDayStripPanelClass(true)` + glass */
export const resultDayStripPanelNative = StyleSheet.create({
  outer: {
    width: "100%",
    maxWidth: MOBILE_RESULT_DAY_STRIP_MAX_W,
    alignSelf: "center",
  },
  panel: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(8,11,18,0.88)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.55,
    shadowRadius: 20,
    elevation: 6,
  },
  leftAccent: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: "rgba(34,211,238,0.95)",
    shadowColor: "#22d3ee",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 6,
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.08,
  },
  row: {
    position: "relative",
    zIndex: 3,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  date: {
    flexShrink: 0,
    fontSize: 16,
    fontWeight: "700",
    color: "rgba(236,254,255,0.95)",
    fontVariant: ["tabular-nums"],
    fontFamily: MONO_FONT,
    textShadowColor: "rgba(34,211,238,0.45)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
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
    backgroundColor: "rgba(9,13,20,0.95)",
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

/** Web `ResultGlassShell` dense + `RESULT_GLASS_FILL_MOBILE` */
export const resultCardShellNative = StyleSheet.create({
  shell: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 0,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(8,11,18,0.84)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.55,
    shadowRadius: 20,
    elevation: 7,
  },
  body: {
    position: "relative",
    zIndex: 1,
    paddingHorizontal: MOBILE_RESULT_CARD_PAD_X,
    paddingTop: MOBILE_RESULT_CARD_PAD_TOP,
    paddingBottom: MOBILE_RESULT_CARD_PAD_BOTTOM,
  },
});
