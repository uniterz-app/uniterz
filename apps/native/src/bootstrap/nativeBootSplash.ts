import { InteractionManager } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import { NATIVE_SPLASH_VIDEO_ENABLED } from "../features/splash/video/splashVideoColdStart";

let preventCalled = false;
/** 動画ゲートが OS スプラッシュ解除を握っている間 true */
let splashVideoGateActive = false;

/** ネイティブスプラッシュを JS 側で制御（起動直後のフラッシュ防止） */
export function ensureNativeSplashHeld() {
  if (preventCalled) return;
  preventCalled = true;
  if (!NATIVE_SPLASH_VIDEO_ENABLED) {
    /** 動画オフ時は握らずすぐ消す（フォント待ちの黒画面を伸ばさない） */
    void SplashScreen.hideAsync().catch(() => {});
    return;
  }
  void SplashScreen.preventAutoHideAsync().catch(() => {});
  try {
    SplashScreen.setOptions({ fade: true, duration: 420 });
  } catch {
    /* setOptions は void — 未対応ビルドでは無視 */
  }
}

export function setSplashVideoGateActive(active: boolean) {
  splashVideoGateActive = active;
}

/** 1フレーム描画後にフェードアウト。動画ゲート中は no-op */
export function hideNativeBootSplash() {
  if (splashVideoGateActive) return;
  InteractionManager.runAfterInteractions(() => {
    requestAnimationFrame(() => {
      SplashScreen.hideAsync().catch(() => {});
    });
  });
}

/** 動画の 1 フレーム目が出せたら OS スプラッシュを下げる */
export function hideNativeBootSplashForVideo() {
  InteractionManager.runAfterInteractions(() => {
    requestAnimationFrame(() => {
      SplashScreen.hideAsync().catch(() => {});
    });
  });
}
