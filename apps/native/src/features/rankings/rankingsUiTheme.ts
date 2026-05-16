import { Platform } from "react-native";

/** ランキング UI 共通の数字・ラベル用フォント */
export const METRIC_FONT = Platform.select({
  ios: "Oxanium_700Bold",
  android: "Oxanium_700Bold",
  default: "sans-serif",
});
