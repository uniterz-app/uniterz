import { Platform } from "react-native";

/** Android 向け expo-blur 追加 props（型定義に無い blurMethod を安全に渡す） */
export function nativeBlurViewExtraProps(): Record<string, unknown> {
  if (Platform.OS !== "android") return {};
  return {
    blurMethod: "dimezisBlurViewSdk31Plus",
    blurReductionFactor: 4,
  };
}
