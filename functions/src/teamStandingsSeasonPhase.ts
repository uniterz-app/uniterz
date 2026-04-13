/**
 * Regular season aggregates: root `wins` / `losses` / `draws` and NBA flat stats.
 */
export function countsTowardRegularSeasonTeamStats(phase: unknown): boolean {
  if (phase === "play_in" || phase === "playoffs") return false;
  return true;
}

/**
 * Playoff aggregates: `playoff.{wins,losses,draws}` and NBA `playoffNba.*`.
 */
export function countsTowardPlayoffTeamStats(phase: unknown): boolean {
  return phase === "playoffs";
}
