/**
 * モバイル性能の A/B 検証用フラグ。
 * DevTools Console から切り替え可能:
 *   sessionStorage.setItem("uniterz:perf:disableBg", "1")  // 背景オフ
 *   sessionStorage.setItem("uniterz:perf:disableSplashWebgl", "1")  // WebGL スプラッシュオフ
 * リロード後に反映。解除は removeItem。
 */
const BG_KEY = "uniterz:perf:disableBg";
const SPLASH_KEY = "uniterz:perf:disableSplashWebgl";

function readSessionFlag(key: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function readSearchFlag(param: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return new URLSearchParams(window.location.search).get(param) === "1";
  } catch {
    return false;
  }
}

/** GamesPageBackground / 静的背景を無効化して FPS 差分を計測 */
export function isPerfDebugBgDisabled(): boolean {
  return (
    readSessionFlag(BG_KEY) || readSearchFlag("perfNoBg")
  );
}

/** WebGL スプラッシュを無効化して起動コストを計測 */
export function isPerfDebugSplashWebglDisabled(): boolean {
  return (
    readSessionFlag(SPLASH_KEY) || readSearchFlag("perfNoSplashWebgl")
  );
}
