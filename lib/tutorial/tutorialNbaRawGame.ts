/**
 * 本番 ScheduleList に差し込むチュートリアル用 NBA 生データ。
 * `toMatchCardProps` が読める形。チーム ID は本番の nba-* に合わせる。
 */

import { TUTORIAL_NBA_MOCK_GAME } from "@/lib/tutorial/tutorialNbaMock";

const g = TUTORIAL_NBA_MOCK_GAME;

/**
 * @param tipOff 表示日のキックオフ（その日の夕方など）
 */
export function buildTutorialNbaRawGame(tipOff: Date): Record<string, unknown> {
  return {
    id: g.id,
    league: "nba",
    season: "2025-26",
    seasonPhase: "regular",
    status: "scheduled",
    startAt: tipOff,
    startAtJst: tipOff,
    home: {
      name: g.home.name,
      nameEn: g.home.name,
      nameJa: g.home.nameJa,
      teamId: g.home.teamId,
      abbr: g.home.abbr,
      colorHex: g.home.colorHex,
    },
    away: {
      name: g.away.name,
      nameEn: g.away.name,
      nameJa: g.away.nameJa,
      teamId: g.away.teamId,
      abbr: g.away.abbr,
      colorHex: g.away.colorHex,
    },
    homeTeamId: g.home.teamId,
    awayTeamId: g.away.teamId,
    homeTeamName: g.home.name,
    awayTeamName: g.away.name,
    score: null,
    topScorerCandidates: [
      {
        playerId: "tutorial-tatum",
        teamId: g.home.teamId,
        name: "Jayson Tatum",
        ppg: 27.2,
      },
      {
        playerId: "tutorial-brown",
        teamId: g.home.teamId,
        name: "Jaylen Brown",
        ppg: 23.1,
      },
      {
        playerId: "tutorial-lebron",
        teamId: g.away.teamId,
        name: "LeBron James",
        ppg: 24.8,
      },
      {
        playerId: "tutorial-ad",
        teamId: g.away.teamId,
        name: "Anthony Davis",
        ppg: 25.5,
      },
    ],
    leadingScorers: g.leadingScorers,
    /** チュートリアル識別 */
    __tutorial: true,
  };
}

export const TUTORIAL_NBA_GAME_ID = g.id;
