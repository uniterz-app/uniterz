/**
 * 商品交換のライブ切替（弁護士 OK 後に true）
 * - Units: 申請時ロック / 購入時消費
 * - 月次レポート: ledger から unitsEarned を接続（builder 側も参照）
 *
 * Flip checklist:
 * 1. 弁護士 OK ✅
 * 2. 規約・交換規約・プライバシー更新
 * 3. REDEMPTION_UNITS_LIVE = true
 * 4. MONTHLY_REPORT_UNITS_FROM_LEDGER = true（月次 builder は ledger 接続済み）
 * 5. 交換申請の本番告知
 */
export let REDEMPTION_UNITS_LIVE = true;
export let MONTHLY_REPORT_UNITS_FROM_LEDGER = true;

export function isRedemptionUnitsLive(): boolean {
  return Boolean(REDEMPTION_UNITS_LIVE);
}

export function isMonthlyReportUnitsFromLedger(): boolean {
  return Boolean(MONTHLY_REPORT_UNITS_FROM_LEDGER);
}
