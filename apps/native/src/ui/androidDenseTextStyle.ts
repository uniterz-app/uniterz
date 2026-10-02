import { Platform, type TextStyle } from "react-native";

/** Android の余分なフォント余白を抑える（チップ・数値・密なラベル向け） */
export const androidDenseTextStyle: TextStyle =
  Platform.OS === "android" ? { includeFontPadding: false } : {};
