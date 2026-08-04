/**
 * 招待進捗リスト用の表示ラベル（ハンドルマスク）
 * docs/referral-design.md §16 — V1 はマスク済みのみ
 */
export function maskReferralHandle(raw: string | null | undefined): string {
  const s = String(raw ?? "")
    .trim()
    .replace(/^@+/, "");
  if (!s) return "@****";
  const keep = Math.min(4, Math.max(1, Math.ceil(s.length / 2)));
  return `@${s.slice(0, keep)}***`;
}

export function resolveReferralDisplayHandle(user: {
  handle?: unknown;
  username?: unknown;
  displayName?: unknown;
}): string {
  for (const key of ["handle", "username", "displayName"] as const) {
    const v = String(user[key] ?? "").trim();
    if (v) return maskReferralHandle(v);
  }
  return "@****";
}
