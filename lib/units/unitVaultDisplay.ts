/**
 * プロフィール金庫の表示残高（実残高のみ。UI 確認用モックは廃止）。
 */
export function unitVaultUiBalance(real: number | null | undefined): number {
  if (real == null || !Number.isFinite(real)) return 0;
  return Math.max(0, Math.floor(real));
}
