/** __DEV__ 試合カードプレビュー用 mock。一覧本番データとは無関係。 */

import { NBA_TEAM_NAME_BY_ID } from "../../../../../lib/nba-team-names";

function nbaSide(
  teamId: string,
  wins = 0,
  losses = 0,
  rank?: number
) {
  const name = NBA_TEAM_NAME_BY_ID[teamId] ?? teamId;
  return rank != null && rank > 0
    ? { teamId, name, wins, losses, rank }
    : { teamId, name, wins, losses };
}

function openingGame(input: {
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
      ? { isPickup: true, pickupWeekKey: "2026-10-19" }
      : {}),
  };
}

export const matchCardPreviewOpeningPistonsCeltics = openingGame({
  id: "preview-nba-20261021-bos-det",
  startAtJst: "2026-10-21T04:00:00+09:00",
  homeTeamId: "nba-pistons",
  awayTeamId: "nba-celtics",
});

export const matchCardPreviewOpeningKnicksSixers = openingGame({
  id: "preview-nba-20261021-phi-nyk",
  startAtJst: "2026-10-21T08:00:00+09:00",
  homeTeamId: "nba-knicks",
  awayTeamId: "nba-76ers",
  pickup: true,
});

export const matchCardPreviewOpeningSpursThunder = openingGame({
  id: "preview-nba-20261021-okc-sas",
  startAtJst: "2026-10-21T10:30:00+09:00",
  homeTeamId: "nba-spurs",
  awayTeamId: "nba-thunder",
  pickup: true,
});

export const matchCardPreviewOpeningNightGames = [
  matchCardPreviewOpeningPistonsCeltics,
  matchCardPreviewOpeningKnicksSixers,
  matchCardPreviewOpeningSpursThunder,
];

export const MATCH_CARD_PREVIEW_SCHEDULED_ID =
  matchCardPreviewOpeningPistonsCeltics.id as string;
export const MATCH_CARD_PREVIEW_PREDICTED_ID =
  "preview-nba-20261021-bos-det-predicted";
export const MATCH_CARD_PREVIEW_PICKUP_ID =
  matchCardPreviewOpeningKnicksSixers.id as string;
export const MATCH_CARD_PREVIEW_PICKUP_PREDICTED_ID =
  "preview-nba-20261021-okc-sas-predicted";

export const matchCardPreviewScheduled = matchCardPreviewOpeningPistonsCeltics;

export const matchCardPreviewPredicted: Record<string, unknown> = {
  ...matchCardPreviewOpeningPistonsCeltics,
  id: MATCH_CARD_PREVIEW_PREDICTED_ID,
};

export const matchCardPreviewPickup = matchCardPreviewOpeningKnicksSixers;

export const matchCardPreviewPickupPredicted: Record<string, unknown> = {
  ...matchCardPreviewOpeningSpursThunder,
  id: MATCH_CARD_PREVIEW_PICKUP_PREDICTED_ID,
};

const kickoffSoon = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();

export const matchCardPreviewLive: Record<string, unknown> = {
  id: "preview-match-live",
  league: "nba",
  status: "live",
  startAtJst: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
  roundLabel: "REGULAR SEASON",
  liveMeta: { period: "Q3", clock: "4:12" },
  home: nbaSide("nba-warriors", 42, 30, 7),
  away: nbaSide("nba-suns", 36, 36, 10),
  homeTeamName: "Golden State Warriors",
  awayTeamName: "Phoenix Suns",
};

export const matchCardPreviewFinal: Record<string, unknown> = {
  id: "preview-match-final",
  league: "nba",
  status: "final",
  final: true,
  startAtJst: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
  roundLabel: "REGULAR SEASON",
  score: { home: 118, away: 111 },
  home: nbaSide("nba-heat", 37, 35, 9),
  away: nbaSide("nba-bucks", 41, 31, 5),
  homeTeamName: "Miami Heat",
  awayTeamName: "Milwaukee Bucks",
};

export const matchCardPreviewFinalOt: Record<string, unknown> = {
  id: "preview-match-final-ot",
  league: "nba",
  status: "final",
  final: true,
  finalMeta: { ot: true },
  startAtJst: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
  roundLabel: "REGULAR SEASON",
  score: { home: 124, away: 122 },
  home: nbaSide("nba-nuggets", 49, 23, 1),
  away: nbaSide("nba-timberwolves", 43, 29, 4),
  homeTeamName: "Denver Nuggets",
  awayTeamName: "Minnesota Timberwolves",
};

export const matchCardPreviewPlayoff: Record<string, unknown> = {
  id: "preview-match-playoff",
  league: "nba",
  status: "scheduled",
  seasonPhase: "playoffs",
  startAtJst: kickoffSoon,
  roundLabel: "PLAYOFFS GAME 5",
  seriesStanding: { homeWins: 3, awayWins: 1 },
  home: nbaSide("nba-thunder", 57, 15, 1),
  away: nbaSide("nba-spurs", 46, 26, 4),
  homeTeamName: "Oklahoma City Thunder",
  awayTeamName: "San Antonio Spurs",
};
