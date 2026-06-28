import { resolveKnockoutWinnerTeamId } from "./resolveKnockoutWinner";

/** ノックアウト試合の敗者 teamId */
export function resolveKnockoutLoserTeamId(game: {
  homeTeamId?: string | null;
  awayTeamId?: string | null;
  homeScore?: number | null;
  awayScore?: number | null;
  advancingTeamId?: string | null;
  knockout?: boolean;
  final?: boolean;
}): string | null {
  const winner = resolveKnockoutWinnerTeamId(game);
  if (!winner) return null;

  const home = String(game.homeTeamId ?? "").trim();
  const away = String(game.awayTeamId ?? "").trim();
  if (!home || !away) return null;

  if (winner === home) return away;
  if (winner === away) return home;
  return null;
}
