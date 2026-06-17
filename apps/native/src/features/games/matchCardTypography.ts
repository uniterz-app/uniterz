import { Platform } from "react-native";

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
