/** 試合 doc のホーム / アウェーのチーム ID（`homeTeamId` か `home.teamId`） */
function gameTeamIds(game: Record<string, unknown>): string[] {
  const out: string[] = [];
  for (const side of ["home", "away"] as const) {
    const flat = game[`${side}TeamId`];
    const nested = (game[side] as { teamId?: unknown } | undefined)?.teamId;
    const id = typeof flat === "string" && flat ? flat : typeof nested === "string" ? nested : "";
    if (id) out.push(id.trim());
  }
  return out;
}

export function isFavoriteTeamGame(
  game: Record<string, unknown>,
  teamId: string | null | undefined
): boolean {
  return !!teamId && gameTeamIds(game).includes(teamId);
}

/** お気に入りチームの試合を先頭へ（ほかの並びは変えない）。該当なしなら同じ配列を返す */
export function favoriteTeamGamesFirst<T extends Record<string, unknown>>(
  games: T[],
  teamId: string | null | undefined
): T[] {
  if (!teamId) return games;
  const fav: T[] = [];
  const rest: T[] = [];
  for (const g of games) (isFavoriteTeamGame(g, teamId) ? fav : rest).push(g);
  return fav.length === 0 ? games : [...fav, ...rest];
}
