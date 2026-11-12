import type { ComponentType } from "react";
import { Platform, View, type ViewProps } from "react-native";
import { requireNativeView, requireOptionalNativeModule } from "expo";

/**
 * 中身をスクショ・画面収録に写さない入れ物（iOS のみ）。画面には見え、タップもできる。
 * Android は部品ごとに隠す仕組みが OS に無く、この部品が入る前のビルドにはネイティブ側が無い。どちらも普通の View で描く。
 * 入れ物自体はタッチを取らないので、子だけがタップを受ける。
 */
const NativeHidden: ComponentType<ViewProps> | null =
  Platform.OS === "ios" && requireOptionalNativeModule("ScreenshotHidden")
    ? requireNativeView<ViewProps>("ScreenshotHidden")
    : null;

export default function ScreenshotHiddenNative(props: ViewProps) {
  if (NativeHidden) return <NativeHidden {...props} />;
  return <View {...props} />;
}
