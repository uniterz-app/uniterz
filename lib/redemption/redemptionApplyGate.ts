/**
 * 交換申請フォームの不足判定・エラー文言
 */
export function redemptionAvailableUnits(
  balance: number,
  reservedUnits: number
): number {
  return Math.max(0, Math.floor(balance) - Math.max(0, Math.floor(reservedUnits)));
}

export function canAffordRedemption(opts: {
  balance: number;
  reservedUnits: number;
  unitsRequired: number;
  seasonUnitsUsed: number;
  seasonCap: number;
}): { ok: true } | { ok: false; reason: "insufficient_units" | "season_cap_exceeded" } {
  const available = redemptionAvailableUnits(opts.balance, opts.reservedUnits);
  if (available < opts.unitsRequired) {
    return { ok: false, reason: "insufficient_units" };
  }
  if (opts.seasonUnitsUsed + opts.unitsRequired > opts.seasonCap) {
    return { ok: false, reason: "season_cap_exceeded" };
  }
  return { ok: true };
}

export function redemptionApplyErrorMessage(
  code: string | null | undefined,
  lang: "ja" | "en"
): string {
  const key = (code ?? "").trim();
  if (key === "insufficient_units") {
    return lang === "ja"
      ? "Unit が不足しています。必要数を貯めてから申請してください。"
      : "Not enough Units. Earn more before applying.";
  }
  if (key === "season_cap_exceeded") {
    return lang === "ja"
      ? "今シーズンの交換上限（2,000 Unit）を超えます。"
      : "This would exceed the season exchange cap (2,000 Units).";
  }
  if (key === "consent_required") {
    return lang === "ja"
      ? "申請には同意が必要です。"
      : "Consent is required to submit.";
  }
  if (!key || key === "error") {
    return lang === "ja" ? "申請に失敗しました。" : "Could not submit application.";
  }
  return key;
}
