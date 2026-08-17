/** __DEV__ 試合カードプレビュー用 mock。一覧 `GameCardList` と同じ shape。 */

import {
  NBA_OPENING_NIGHT_PREVIEW_GAMES,
  nbaOpeningNightKnicksSixers,
  nbaOpeningNightPistonsCeltics,
  nbaOpeningNightSpursThunder,
} from "../../../../../lib/games/nbaOpeningNightPreviewGames";

function nbaSide(teamId: string, name: string, wins = 0, losses = 0, rank?: number) {
  return rank != null && rank > 0
    ? { teamId, name, wins, losses, rank }
    : { teamId, name, wins, losses };
}

export const matchCardPreviewOpeningPistonsCeltics =
  nbaOpeningNightPistonsCeltics;
export const matchCardPreviewOpeningKnicksSixers = nbaOpeningNightKnicksSixers;
export const matchCardPreviewOpeningSpursThunder = nbaOpeningNightSpursThunder;
export const matchCardPreviewOpeningNightGames = NBA_OPENING_NIGHT_PREVIEW_GAMES;

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
  liveMeta: { period: "Q3", runningTime: "4:12" },
  home: nbaSide("nba-warriors", "Golden State Warriors", 42, 30, 7),
  away: nbaSide("nba-suns", "Phoenix Suns", 36, 36, 10),
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
  home: nbaSide("nba-heat", "Miami Heat", 37, 35, 9),
  away: nbaSide("nba-bucks", "Milwaukee Bucks", 41, 31, 5),
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
  home: nbaSide("nba-nuggets", "Denver Nuggets", 49, 23, 1),
  away: nbaSide("nba-timberwolves", "Minnesota Timberwolves", 43, 29, 4),
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
  home: nbaSide("nba-thunder", "Oklahoma City Thunder", 57, 15, 1),
  away: nbaSide("nba-spurs", "San Antonio Spurs", 46, 26, 4),
  homeTeamName: "Oklahoma City Thunder",
  awayTeamName: "San Antonio Spurs",
};
