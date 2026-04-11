import { getResolvedGameScore, toStatus } from "@/lib/games/transform";

/** URL の margin_min / margin_max（0〜200、整数） */
export function parseMarginBoundParam(
  param: string | null | undefined,
): number | null {
  if (param == null || param === "") return null;
  const n = parseInt(String(param).trim(), 10);
  if (!Number.isFinite(n) || n < 0 || n > 200) return null;
  return n;
}

/**
 * 点差（|ホーム−アウェイ|）が [marginMin, marginMax] に収まるか（両端とも指定時は含む）。
 * 条件未指定の側は制限なし。
 * 未開始・スコア未取得は常に通す（当日の他試合も見られるようにする）。
 */
export function gameMatchesMarginBounds(
  game: Record<string, unknown>,
  marginMin: number | null,
  marginMax: number | null,
): boolean {
  if (marginMin == null && marginMax == null) return true;

  const st = toStatus(game.status);
  if (st !== "live" && st !== "final") return true;

  const sc = getResolvedGameScore(game);
  if (!sc) return true;

  const d = Math.abs(sc.home - sc.away);
  if (marginMin != null && d < marginMin) return false;
  if (marginMax != null && d > marginMax) return false;
  return true;
}
