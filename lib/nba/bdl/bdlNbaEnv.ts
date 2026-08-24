/**
 * BallDontLie NBA API キー（サーバー専用）。
 * クライアント / EXPO_PUBLIC_ には載せない。
 */
export function requireBdlNbaApiKey(): string {
  const key =
    process.env.BALLDONTLIE_API_KEY?.trim() ||
    process.env.BDL_API_KEY?.trim() ||
    "";
  if (!key) {
    throw new Error(
      "BALLDONTLIE_API_KEY is not set (server env only; do not use EXPO_PUBLIC_)"
    );
  }
  return key;
}

/** `"2025-26"` → `2025`（BDL の season クエリ） */
export function bdlSeasonYearFromSeasonKey(seasonKey: string): number {
  const start = Number.parseInt(seasonKey.slice(0, 4), 10);
  if (!Number.isFinite(start)) {
    throw new Error(`invalid seasonKey: ${seasonKey}`);
  }
  return start;
}
