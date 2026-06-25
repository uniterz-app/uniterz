import { isWcBracketPredictMatchId } from "./wcKnockoutMatchIds";

export function resolveWcKnockoutMatchIdFromGame(
  game: Record<string, unknown>
): string | null {
  const raw = game.wcKnockoutMatchId ?? game.wcMatchId;
  const id = String(raw ?? "").trim().toUpperCase();
  if (isWcBracketPredictMatchId(id)) return id;

  const gameId = String(game.id ?? "").trim();
  const m = gameId.match(/(?:^|[-_])M(\d{2,3})$/i);
  if (m) {
    const candidate = `M${m[1]}`;
    if (isWcBracketPredictMatchId(candidate)) return candidate;
  }

  return null;
}

/** ノックアウト試合の勝者 teamId（PK 進出は advancingTeamId 優先） */
export function resolveKnockoutWinnerTeamId(game: {
  homeTeamId?: string | null;
  awayTeamId?: string | null;
  homeScore?: number | null;
  awayScore?: number | null;
  advancingTeamId?: string | null;
  knockout?: boolean;
}): string | null {
  const adv = String(game.advancingTeamId ?? "").trim();
  if (adv) return adv;

  const home = String(game.homeTeamId ?? "").trim();
  const away = String(game.awayTeamId ?? "").trim();
  const hs = game.homeScore;
  const as = game.awayScore;
  if (hs == null || as == null || !home || !away) return null;
  if (hs === as) return null;
  return hs > as ? home : away;
}
