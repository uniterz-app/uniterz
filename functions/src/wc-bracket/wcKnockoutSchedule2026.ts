/**
 * R16 以降の FIFA スケジュール（キックオフは現地スタジアム時刻）
 *
 * ソース: FIFA 放送 ET 表記 → 各会場 TZ へ変換（2026-07 = EDT/CDT/PDT、Mexico City = CST）
 * @see https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/match-schedule-fixtures-results-teams-stadiums
 */

import type { WcKnockoutMatchId } from "./wcKnockoutBracketStructure";

export type WcKnockoutScheduleEntry = {
  startAtIso: string;
  venue: string;
};

export const WC_KNOCKOUT_SCHEDULE_2026: Partial<
  Record<WcKnockoutMatchId, WcKnockoutScheduleEntry>
> = {
  M89: {
    startAtIso: "2026-07-04T17:00:00-04:00",
    venue: "Philadelphia",
  },
  M90: {
    startAtIso: "2026-07-04T12:00:00-05:00",
    venue: "Houston",
  },
  M91: {
    startAtIso: "2026-07-05T16:00:00-04:00",
    venue: "East Rutherford",
  },
  M92: {
    startAtIso: "2026-07-05T18:00:00-06:00",
    venue: "Mexico City",
  },
  M93: {
    startAtIso: "2026-07-06T14:00:00-05:00",
    venue: "Arlington",
  },
  M94: {
    startAtIso: "2026-07-06T17:00:00-07:00",
    venue: "Seattle",
  },
  M95: {
    startAtIso: "2026-07-07T12:00:00-04:00",
    venue: "Atlanta",
  },
  M96: {
    startAtIso: "2026-07-07T13:00:00-07:00",
    venue: "Vancouver",
  },
  M97: {
    startAtIso: "2026-07-09T16:00:00-04:00",
    venue: "Boston",
  },
  M98: {
    startAtIso: "2026-07-10T12:00:00-07:00",
    venue: "Inglewood",
  },
  M99: {
    startAtIso: "2026-07-11T17:00:00-04:00",
    venue: "Miami",
  },
  M100: {
    startAtIso: "2026-07-11T20:00:00-05:00",
    venue: "Kansas City",
  },
  M101: {
    startAtIso: "2026-07-14T14:00:00-05:00",
    venue: "Arlington",
  },
  M102: {
    startAtIso: "2026-07-15T15:00:00-04:00",
    venue: "Atlanta",
  },
  M103: {
    startAtIso: "2026-07-18T17:00:00-04:00",
    venue: "Miami",
  },
  M104: {
    startAtIso: "2026-07-19T15:00:00-04:00",
    venue: "East Rutherford",
  },
};
