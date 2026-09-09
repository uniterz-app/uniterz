/**
 * コールドスタート時のみ動画スプラッシュを 1 回再生する。
 * JS モジュールはプロセス再起動時だけリセットされる。
 */
let played = false;

export function consumeSplashVideoColdStart(): boolean {
  if (played) return false;
  played = true;
  return true;
}

/** テスト用 */
export function resetSplashVideoColdStartForTests(): void {
  played = false;
}
