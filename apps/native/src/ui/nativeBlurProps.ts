import { Platform } from "react-native";

/**
 * Android 向け expo-blur 追加 props。
 * 既定の `experimentalBlurMethod: "none"` だと半透明のみでガウスが効かない。
 * @see https://docs.expo.dev/versions/latest/sdk/blur-view/
 */
export function nativeBlurViewExtraProps(): Record<string, unknown> {
  if (Platform.OS !== "android") return {};
  return {
    experimentalBlurMethod: "dimezisBlurView",
    /** 小さいほど Android の見え方が強い（iOS の intensity に寄せる） */
    blurReductionFactor: 1,
  };
}
