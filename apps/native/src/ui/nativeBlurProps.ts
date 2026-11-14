import { Platform } from "react-native";
import { isLightAppTheme } from "../theme/themeColorRuntime";

/**
 * Android 向け expo-blur 追加 props。
 * 既定の `experimentalBlurMethod: "none"` だと半透明のみでガウスが効かない。
 * 白地では呼び出し側の `tint="dark"` を `light` で上書きする（展開は tint より後ろに置く）。
 * @see https://docs.expo.dev/versions/latest/sdk/blur-view/
 */
export function nativeBlurViewExtraProps(): Record<string, unknown> {
  const themed = isLightAppTheme() ? { tint: "light" } : {};
  if (Platform.OS !== "android") return themed;
  return {
    ...themed,
    experimentalBlurMethod: "dimezisBlurView",
    /** 小さいほど Android の見え方が強い（iOS の intensity に寄せる） */
    blurReductionFactor: 1,
  };
}
