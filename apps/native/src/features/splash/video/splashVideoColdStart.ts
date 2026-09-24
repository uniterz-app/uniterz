/**
 * コールドスタート時のみ動画スプラッシュを 1 回再生する。
 * JS モジュールはプロセス再起動時だけリセットされる。
 *
 * false で iOS / Android とも動画スプラッシュを出さない（OS 起動スプラッシュのみ即消し）。
 */
export const NATIVE_SPLASH_VIDEO_ENABLED = false;

let played = false;

export function consumeSplashVideoColdStart(): boolean {
  if (!NATIVE_SPLASH_VIDEO_ENABLED) return false;
  if (played) return false;
  played = true;
  return true;
}

/** テスト用 */
export function resetSplashVideoColdStartForTests(): void {
  played = false;
}
