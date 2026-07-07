/** WC ノックアウト試合 ID からスタメン解決用ラウンドを返す */

export type WcKnockoutLineupRound =
  | "R32"
  | "R16"
  | "QF"
  | "SF"
  | "FINAL"
  | "THIRD";

const MATCH_ID_TO_ROUND: Record<string, WcKnockoutLineupRound> = {
  M73: "R32",
  M74: "R32",
  M75: "R32",
  M76: "R32",
  M77: "R32",
  M78: "R32",
  M79: "R32",
  M80: "R32",
  M81: "R32",
  M82: "R32",
  M83: "R32",
  M84: "R32",
  M85: "R32",
  M86: "R32",
  M87: "R32",
  M88: "R32",
  M89: "R16",
  M90: "R16",
  M91: "R16",
  M92: "R16",
  M93: "R16",
  M94: "R16",
  M95: "R16",
  M96: "R16",
  M97: "QF",
  M98: "QF",
  M99: "QF",
  M100: "QF",
  M101: "SF",
  M102: "SF",
  M103: "THIRD",
  M104: "FINAL",
};

export function parseWcKnockoutLineupRound(
  gameId?: string | null,
): WcKnockoutLineupRound | null {
  const id = String(gameId ?? "").trim();
  const match = id.match(/^wc-2026-ko-(M\d+)$/);
  if (!match) return null;
  return MATCH_ID_TO_ROUND[match[1]!] ?? null;
}

/** ベスト16（R16）スナップショットを使うラウンド — QF 以降は進出チームの R16 XI を固定 */
export function shouldUseKnockoutR16Lineup(
  round: WcKnockoutLineupRound | null,
): boolean {
  return (
    round === "R16" ||
    round === "QF" ||
    round === "SF" ||
    round === "FINAL" ||
    round === "THIRD"
  );
}
