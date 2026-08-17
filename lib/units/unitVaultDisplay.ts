/**
 * プロフィール金庫の表示残高。
 * 実残高 0 のときは UI 確認用モックを出す（Web / Native 共通）。
 */
export const UNIT_VAULT_ZERO_MOCK = 1000;

/** 画面に出す金庫残高（モック込み） */
export function unitVaultUiBalance(real: number | null | undefined): number {
  if (real == null || !Number.isFinite(real)) return UNIT_VAULT_ZERO_MOCK;
  const n = Math.max(0, Math.floor(real));
  return n > 0 ? n : UNIT_VAULT_ZERO_MOCK;
}
