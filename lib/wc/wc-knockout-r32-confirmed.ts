/**
 * WC 2026 R32 — 全16試合（グループステージ終了後確定）
 *
 * @see https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_knockout_stage
 */

import type { WcKnockoutMatchId } from "@/lib/wc/wc-knockout-bracket";
import {
  lookupWcTeamDisplay,
  wcTeamIdFromIso3,
} from "@/lib/wc/wc-team-display";

export type WcR32ConfirmedMatch = {
  matchId: WcKnockoutMatchId;
  homeIso3: string;
  awayIso3: string;
  /** ISO 8601（現地 TZ 付き） */
  startAtIso: string;
  venue: string;
};

/** 現地キックオフ（FIFA スケジュール / ET 表記 → スタジアム現地時刻） */
export const WC_2026_R32_CONFIRMED_MATCHES: readonly WcR32ConfirmedMatch[] = [
  {
    matchId: "M73",
    homeIso3: "zaf",
    awayIso3: "can",
    startAtIso: "2026-06-28T12:00:00-07:00",
    venue: "Inglewood",
  },
  {
    matchId: "M74",
    homeIso3: "deu",
    awayIso3: "pry",
    startAtIso: "2026-06-29T16:30:00-04:00",
    venue: "Foxborough",
  },
  {
    matchId: "M75",
    homeIso3: "nld",
    awayIso3: "mar",
    startAtIso: "2026-06-29T19:00:00-06:00",
    venue: "Monterrey",
  },
  {
    matchId: "M76",
    homeIso3: "bra",
    awayIso3: "jpn",
    startAtIso: "2026-06-29T12:00:00-05:00",
    venue: "Houston",
  },
  {
    matchId: "M77",
    homeIso3: "fra",
    awayIso3: "swe",
    startAtIso: "2026-06-30T17:00:00-04:00",
    venue: "East Rutherford",
  },
  {
    matchId: "M78",
    homeIso3: "civ",
    awayIso3: "nor",
    startAtIso: "2026-06-30T12:00:00-05:00",
    venue: "Arlington",
  },
  {
    matchId: "M79",
    homeIso3: "mex",
    awayIso3: "ecu",
    startAtIso: "2026-06-30T19:00:00-06:00",
    venue: "Mexico City",
  },
  {
    matchId: "M80",
    homeIso3: "eng",
    awayIso3: "cod",
    startAtIso: "2026-07-01T12:00:00-04:00",
    venue: "Atlanta",
  },
  {
    matchId: "M81",
    homeIso3: "usa",
    awayIso3: "bih",
    startAtIso: "2026-07-01T17:00:00-07:00",
    venue: "Santa Clara",
  },
  {
    matchId: "M82",
    homeIso3: "bel",
    awayIso3: "sen",
    startAtIso: "2026-07-01T16:00:00-07:00",
    venue: "Seattle",
  },
  {
    matchId: "M83",
    homeIso3: "prt",
    awayIso3: "hrv",
    startAtIso: "2026-07-02T19:00:00-04:00",
    venue: "Toronto",
  },
  {
    matchId: "M84",
    homeIso3: "esp",
    awayIso3: "aut",
    startAtIso: "2026-07-02T12:00:00-07:00",
    venue: "Inglewood",
  },
  {
    matchId: "M85",
    homeIso3: "che",
    awayIso3: "dza",
    startAtIso: "2026-07-02T20:00:00-07:00",
    venue: "Vancouver",
  },
  {
    matchId: "M86",
    homeIso3: "arg",
    awayIso3: "cpv",
    startAtIso: "2026-07-03T18:00:00-04:00",
    venue: "Miami",
  },
  {
    matchId: "M87",
    homeIso3: "col",
    awayIso3: "gha",
    startAtIso: "2026-07-03T20:30:00-05:00",
    venue: "Kansas City",
  },
  {
    matchId: "M88",
    homeIso3: "aus",
    awayIso3: "egy",
    startAtIso: "2026-07-03T13:00:00-05:00",
    venue: "Arlington",
  },
] as const;

const R32_CONFIRMED_BY_MATCH_ID = new Map(
  WC_2026_R32_CONFIRMED_MATCHES.map((m) => [m.matchId, m])
);

/** R32 確定対戦カード（advancement / Firestore より優先） */
export function resolveWcR32ConfirmedParticipants(
  matchId: WcKnockoutMatchId
): [{ teamId: string; label: string }, { teamId: string; label: string }] | null {
  const m = R32_CONFIRMED_BY_MATCH_ID.get(matchId);
  if (!m) return null;

  const homeNames = lookupWcTeamDisplay(m.homeIso3);
  const awayNames = lookupWcTeamDisplay(m.awayIso3);

  return [
    {
      teamId: wcTeamIdFromIso3(m.homeIso3),
      label: homeNames?.en ?? m.homeIso3,
    },
    {
      teamId: wcTeamIdFromIso3(m.awayIso3),
      label: awayNames?.en ?? m.awayIso3,
    },
  ];
}

export function wcKnockoutGameId(
  matchId: WcKnockoutMatchId,
  tournamentYear = 2026
): string {
  return `wc-${tournamentYear}-ko-${matchId}`;
}
