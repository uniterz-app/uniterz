/**
 * プレビュー用: 2026-27 Opening Night（ET 2026-10-20 = JST 2026-10-21）。
 * NBC トリプルヘッダー。本番 API が空でも Games 一覧に出す。
 */

import { mergeGameRowsById } from "@/lib/games/gamesWindowRange";
import { NBA_TEAM_NAME_BY_ID } from "@/lib/nba-team-names";
import { toDateKeyInTimeZone } from "@/lib/time/zonedTime";

/** キックオフの JST 暦日 */
export const NBA_OPENING_NIGHT_PREVIEW_DATE_KEY = "2026-10-21";

/** ピックアップ週キー（JST 月曜） */
const OPENING_PICKUP_WEEK_KEY = "2026-10-19";

function nbaSide(teamId: string) {
  const name = NBA_TEAM_NAME_BY_ID[teamId] ?? teamId;
  return { teamId, name, wins: 0, losses: 0 };
}

function nbaOpeningGame(input: {
  id: string;
  startAtJst: string;
  homeTeamId: string;
  awayTeamId: string;
  pickup?: boolean;
}): Record<string, unknown> {
  const home = nbaSide(input.homeTeamId);
  const away = nbaSide(input.awayTeamId);
  return {
    id: input.id,
    league: "nba",
    season: "2026-27",
    seasonPhase: "regular",
    status: "scheduled",
    startAtJst: input.startAtJst,
    roundLabel: "REGULAR SEASON",
    home,
    away,
    homeTeamId: home.teamId,
    awayTeamId: away.teamId,
    homeTeamName: home.name,
    awayTeamName: away.name,
    countsForRanking: false,
    ...(input.pickup
      ? { isPickup: true, pickupWeekKey: OPENING_PICKUP_WEEK_KEY }
      : {}),
  };
}

/** Celtics @ Pistons 15:00 ET → 04:00 JST。通常カード */
export const nbaOpeningNightPistonsCeltics = nbaOpeningGame({
  id: "preview-nba-20261021-bos-det",
  startAtJst: "2026-10-21T04:00:00+09:00",
  homeTeamId: "nba-pistons",
  awayTeamId: "nba-celtics",
});

/** 76ers @ Knicks 19:00 ET → 08:00 JST。ピックアップ */
export const nbaOpeningNightKnicksSixers = nbaOpeningGame({
  id: "preview-nba-20261021-phi-nyk",
  startAtJst: "2026-10-21T08:00:00+09:00",
  homeTeamId: "nba-knicks",
  awayTeamId: "nba-76ers",
  pickup: true,
});

/** Thunder @ Spurs 21:30 ET → 10:30 JST。ピックアップ */
export const nbaOpeningNightSpursThunder = nbaOpeningGame({
  id: "preview-nba-20261021-okc-sas",
  startAtJst: "2026-10-21T10:30:00+09:00",
  homeTeamId: "nba-spurs",
  awayTeamId: "nba-thunder",
  pickup: true,
});

export const NBA_OPENING_NIGHT_PREVIEW_GAMES: Record<string, unknown>[] = [
  nbaOpeningNightPistonsCeltics,
  nbaOpeningNightKnicksSixers,
  nbaOpeningNightSpursThunder,
];

export function mergeNbaOpeningNightPreviewGames(
  league: unknown,
  rows: ReadonlyArray<Record<string, unknown>>
): Record<string, unknown>[] {
  if (String(league ?? "").toLowerCase() !== "nba") return [...rows];
  return mergeGameRowsById(rows, NBA_OPENING_NIGHT_PREVIEW_GAMES);
}

/** 表示 TZ の Opening Night 暦日（JST→10/21、ET→10/20） */
export function nbaOpeningNightDefaultDateKey(timeZone: string): string {
  return toDateKeyInTimeZone(
    new Date("2026-10-21T08:00:00+09:00"),
    timeZone
  );
}
