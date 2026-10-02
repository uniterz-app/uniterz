/** expo-video のネイティブ有無を確認してから SplashVideoGate を遅延ロード */
import { requireOptionalNativeModule } from "expo-modules-core";
import type { ComponentType } from "react";

type SplashVideoGateProps = { onDone: () => void };

let cachedGate: ComponentType<SplashVideoGateProps> | null | undefined;
let warnedMissing = false;

/** dev-client に ExpoVideo が含まれるか（prebuild / run:ios 後に true） */
export function isExpoVideoNativeAvailable(): boolean {
  return requireOptionalNativeModule("ExpoVideo") != null;
}

/** ネイティブ未リンク時は null（起動クラッシュを避ける） */
export function getSplashVideoGateNative(): ComponentType<SplashVideoGateProps> | null {
  if (cachedGate !== undefined) return cachedGate;

  if (!isExpoVideoNativeAvailable()) {
    if (__DEV__ && !warnedMissing) {
      warnedMissing = true;
      console.warn(
        "[splash-video] ExpoVideo が見つかりません。expo-video 追加後は dev-client の再ビルドが必要です: npm run native:ios"
      );
    }
    cachedGate = null;
    return null;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("./SplashVideoGateNative") as {
      default: ComponentType<SplashVideoGateProps>;
    };
    cachedGate = mod.default;
    return cachedGate;
  } catch (err) {
    if (__DEV__) {
      console.warn("[splash-video] SplashVideoGateNative の読み込みに失敗", err);
    }
    cachedGate = null;
    return null;
  }
}
