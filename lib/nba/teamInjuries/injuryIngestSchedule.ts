import { gameStartMs, isUpcomingNbaGameDoc } from "@/lib/nba/games/gameDocTime";

/** tip の T-60 / T-45 / T-30 / T-15 分（cron は 5 分毎、±2.5 分） */
export const INJURY_PREGAME_TARGETS_MS = [
  60 * 60 * 1000,
  45 * 60 * 1000,
  30 * 60 * 1000,
  15 * 60 * 1000,
] as const;

export const INJURY_PREGAME_TOLERANCE_MS = 150 * 1000;

/** 直近 fetch からこの ms 以内は pregame / hourly ingest をスキップ（15 分刻みより短く） */
export const INJURY_INGEST_MIN_INTERVAL_MS = 10 * 60 * 1000;

/** pregame 判定用 — 最大 T-60 窓 + tolerance */
export const INJURY_PREGAME_LOOKAHEAD_MS =
  INJURY_PREGAME_TARGETS_MS[0] + INJURY_PREGAME_TOLERANCE_MS;

/** hourly: この範囲に tip がある試合があれば「試合がある日」として回す */
export const INJURY_HOURLY_LOOKAHEAD_MS = 24 * 60 * 60 * 1000;
export const INJURY_HOURLY_LOOKBACK_MS = 3 * 60 * 60 * 1000;

export function isTipInInjuryPregameWindow(
  tipAtMs: number,
  nowMs: number
): boolean {
  if (!Number.isFinite(tipAtMs) || tipAtMs <= nowMs) return false;
  const delta = tipAtMs - nowMs;
  return INJURY_PREGAME_TARGETS_MS.some(
    (target) => Math.abs(delta - target) <= INJURY_PREGAME_TOLERANCE_MS
  );
}

export function isAnyGameInInjuryPregameWindow(
  games: Array<{ data: Record<string, unknown> }>,
  nowMs: number
): boolean {
  for (const game of games) {
    if (!isUpcomingNbaGameDoc(game.data, nowMs)) continue;
    const tip = gameStartMs(game.data.startAtJst);
    if (tip != null && isTipInInjuryPregameWindow(tip, nowMs)) return true;
  }
  return false;
}

export function injuryIngestUpdatedWithinMs(
  updatedAtIso: string | null | undefined,
  nowMs: number,
  withinMs: number
): boolean {
  if (!updatedAtIso) return false;
  const t = Date.parse(updatedAtIso);
  if (!Number.isFinite(t)) return false;
  return nowMs - t < withinMs;
}
