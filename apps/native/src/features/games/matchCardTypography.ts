import { Platform, type TextStyle } from "react-native";

/** Web `nameOxanium` / Bebas 表示用 */
export const MATCH_CARD_DISPLAY_FONT = Platform.select({
  ios: "BebasNeue_400Regular",
  android: "BebasNeue_400Regular",
  default: "BebasNeue_400Regular",
});

/** Web `matchScoreClass`（Montserrat Black Italic） */
export const MATCH_CARD_SCORE_FONT = Platform.select({
  ios: "Montserrat_900Black_Italic",
  android: "Montserrat_900Black_Italic",
  default: "Montserrat_900Black_Italic",
});

/** Web `resultStatsMetricNumClass`（戦績・順位） */
export const MATCH_CARD_METRIC_FONT = Platform.select({
  ios: "Oxanium_700Bold",
  android: "Oxanium_700Bold",
  default: "Oxanium_700Bold",
});

/** Web `bracketMarketTeamTypography` mobile — Bebas は 400 のみ（太字指定で別字体になるのを防ぐ） */
export const MATCH_CARD_BRACKET_TEXT: TextStyle = {
  fontFamily: MATCH_CARD_DISPLAY_FONT,
  fontWeight: "400",
  includeFontPadding: false,
};

/** 0.08em @ 12px */
export const MATCH_CARD_BRACKET_LETTER_SPACING_12 = 0.96;

/** 0.08em @ 15px（WC モバイル overlay 国名） */
export const MATCH_CARD_BRACKET_LETTER_SPACING_15 = 1.2;

/** 放送局名など CJK — Bebas に無い字形の太さ合わせ */
export const MATCH_CARD_JP_BOLD_FONT = Platform.select({
  ios: "NotoSansJP_700Bold",
  android: "NotoSansJP_700Bold",
  default: "NotoSansJP_700Bold",
});
