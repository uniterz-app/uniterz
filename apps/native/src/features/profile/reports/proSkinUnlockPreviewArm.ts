/** Profile ホームで解放モーダルを強制表示するための一時フラグ（プレビュー用） */
let forceProSkinUnlockPreviewOnce = false;

export function armProSkinUnlockPreviewOnProfile(): void {
  forceProSkinUnlockPreviewOnce = true;
}

export function consumeProSkinUnlockPreviewOnProfile(): boolean {
  if (!forceProSkinUnlockPreviewOnce) return false;
  forceProSkinUnlockPreviewOnce = false;
  return true;
}
