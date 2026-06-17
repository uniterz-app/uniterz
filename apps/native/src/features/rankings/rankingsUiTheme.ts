import { Platform } from "react-native";
import { hasJaScript } from "../../../../../lib/rankings/rankingJaTextSize";

/** Web `nameOxanium` — ラベル・メタ・タブ */
export const METRIC_FONT = Platform.select({
  ios: "Oxanium_700Bold",
  android: "Oxanium_700Bold",
  default: "sans-serif",
});

/** Web `nameBebas` — `CyberRankNumber` 順位 */
export const RANK_DISPLAY_FONT = Platform.select({
  ios: "BebasNeue_400Regular",
  android: "BebasNeue_400Regular",
  default: "BebasNeue_400Regular",
});

/** Web `summaryMetricNumClass`（Alfa Slab One）— スコア・My Rank HUD 数値 */
export const RANKING_SCORE_FONT = Platform.select({
  ios: "AlfaSlabOne_400Regular",
  android: "AlfaSlabOne_400Regular",
  default: "AlfaSlabOne_400Regular",
});

/** Web `nameRajdhani` — 英字ユーザー名 */
export const RANKING_NAME_FONT_EN = Platform.select({
  ios: "Rajdhani_700Bold",
  android: "Rajdhani_700Bold",
  default: "Rajdhani_700Bold",
});

/** Web `jp`（Noto Sans JP）— 日本語ユーザー名 */
export const RANKING_NAME_FONT_JA = Platform.select({
  ios: "NotoSansJP_700Bold",
  android: "NotoSansJP_700Bold",
  default: "NotoSansJP_700Bold",
});

/** Web `RankingsPageTitleCyber` horizon-chrome */
export const RANKING_TITLE_FONT = RANK_DISPLAY_FONT;

export function rankingNameFont(text: string): string | undefined {
  return hasJaScript(text) ? RANKING_NAME_FONT_JA : RANKING_NAME_FONT_EN;
}

export function rankingTagFont(text: string): string | undefined {
  return hasJaScript(text) ? RANKING_NAME_FONT_JA : METRIC_FONT;
}
