/**
 * 試合カード上辺の roundLabel 表示用。
 * 常に英語大文字（PRESEASON / REGULAR SEASON 等）。JA でもカタカナ化しない。
 */
export function displayNbaRoundLabel(
  roundLabel: string | null | undefined,
  _isJa?: boolean
): string {
  const raw = typeof roundLabel === "string" ? roundLabel.trim() : "";
  if (!raw) return "";

  const u = raw.toUpperCase();
  if (
    u === "PRESEASON" ||
    u.includes("PRESEASON") ||
    /プレシーズン/.test(raw)
  ) {
    return "PRESEASON";
  }
  if (
    u === "REGULAR SEASON" ||
    u.includes("REGULAR SEASON") ||
    /レギュラーシーズン/.test(raw)
  ) {
    return "REGULAR SEASON";
  }
  if (
    u === "PLAY-IN" ||
    u.includes("PLAY-IN") ||
    u.includes("PLAY IN") ||
    /プレーイン/.test(raw)
  ) {
    return "PLAY-IN";
  }
  if (
    u === "PLAYOFFS" ||
    (u.includes("PLAYOFF") && !u.includes("PLAY-IN")) ||
    /プレーオフ/.test(raw)
  ) {
    return "PLAYOFFS";
  }
  return raw;
}
