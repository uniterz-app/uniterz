import { InteractionManager } from "react-native";
import * as SplashScreen from "expo-splash-screen";

let preventCalled = false;

/** ネイティブスプラッシュを JS 側で制御（起動直後のフラッシュ防止） */
export function ensureNativeSplashHeld() {
  if (preventCalled) return;
  preventCalled = true;
  void SplashScreen.preventAutoHideAsync().catch(() => {});
  try {
    SplashScreen.setOptions({ fade: true, duration: 420 });
  } catch {
    /* setOptions は void — 未対応ビルドでは無視 */
  }
}

/** 1フレーム描画後にフェードアウト */
export function hideNativeBootSplash() {
  InteractionManager.runAfterInteractions(() => {
    requestAnimationFrame(() => {
      SplashScreen.hideAsync().catch(() => {});
    });
  });
}
