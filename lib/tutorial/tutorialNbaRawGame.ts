/**
 * 本番 ScheduleList に差し込むチュートリアル用 NBA 生データ。
 * `toMatchCardProps` が読める形。チーム ID は本番の nba-* に合わせる。
 */

import { NBA_TEAM_NAME_BY_ID } from "@/lib/nba-team-names";
import { teamColorsNBA } from "@/lib/teams-nba";
import { TUTORIAL_NBA_MOCK_GAME } from "@/lib/tutorial/tutorialNbaMock";

const g = TUTORIAL_NBA_MOCK_GAME;

export const TUTORIAL_NBA_GAME_ID = g.id;

function nbaSide(
  teamId: string,
  abbr: string,
  nameJa: string,
  wins: number,
  losses: number,
  rank: number
) {
  const name = NBA_TEAM_NAME_BY_ID[teamId] ?? abbr;
  return {
    name,
    nameEn: name,
    nameJa,
    teamId,
    abbr,
    colorHex: teamColorsNBA[teamId]?.primary ?? "#888888",
    wins,
    losses,
    rank,
  };
}

/**
 * @param tipOff 表示日のキックオフ（その日の夕方など）
 */
export function buildTutorialNbaRawGame(tipOff: Date): Record<string, unknown> {
  return {
    id: g.id,
    league: "nba",
    season: "2025-26",
    seasonPhase: "regular",
    /** 本番 NBA カードと同じ帯ラベル */
    roundLabel: "REGULAR SEASON",
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
      /** 本番カードと同じく戦績を表示（未設定だと (0-0) になる） */
      wins: 48,
      losses: 20,
      rank: 2,
    },
    away: {
      name: g.away.name,
      nameEn: g.away.name,
      nameJa: g.away.nameJa,
      teamId: g.away.teamId,
      abbr: g.away.abbr,
      colorHex: g.away.colorHex,
      wins: 42,
      losses: 26,
      rank: 6,
    },
    homeTeamId: g.home.teamId,
    awayTeamId: g.away.teamId,
    homeTeamName: g.home.name,
    awayTeamName: g.away.name,
    score: null,
    /** Web `buildTutorialMatchCardProps` と同じ市場偏り */
    marketBias: { homePct: 36, awayPct: 64 },
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

type AtmosphereSpec = {
  id: string;
  homeId: string;
  homeAbbr: string;
  homeJa: string;
  awayId: string;
  awayAbbr: string;
  awayJa: string;
  homeW: number;
  homeL: number;
  homeRank: number;
  awayW: number;
  awayL: number;
  awayRank: number;
  marketBias: { homePct: number; awayPct: number };
  offsetMin: number;
};

function buildAtmosphereRawGame(
  spec: AtmosphereSpec,
  baseTipOff: Date
): Record<string, unknown> {
  const tipOff = new Date(baseTipOff.getTime() + spec.offsetMin * 60 * 1000);
  const home = nbaSide(
    spec.homeId,
    spec.homeAbbr,
    spec.homeJa,
    spec.homeW,
    spec.homeL,
    spec.homeRank
  );
  const away = nbaSide(
    spec.awayId,
    spec.awayAbbr,
    spec.awayJa,
    spec.awayW,
    spec.awayL,
    spec.awayRank
  );
  return {
    id: spec.id,
    league: "nba",
    season: "2025-26",
    seasonPhase: "regular",
    roundLabel: "REGULAR SEASON",
    status: "scheduled",
    startAt: tipOff,
    startAtJst: tipOff,
    home,
    away,
    homeTeamId: home.teamId,
    awayTeamId: away.teamId,
    homeTeamName: home.name,
    awayTeamName: away.name,
    score: null,
    marketBias: spec.marketBias,
    /** 背景用。練習試合（先頭）以外は予想オーバーレイを開かない */
    __tutorial: true,
    __tutorialBackdrop: true,
  };
}

/** 試合 0 件のとき、ウェルカム背景に置く 3 カード（先頭が練習用） */
export function buildTutorialNbaBackdropGames(
  tipOff: Date
): Record<string, unknown>[] {
  return [
    buildTutorialNbaRawGame(tipOff),
    buildAtmosphereRawGame(
      {
        id: "tutorial-nba-gsw-den",
        homeId: "nba-nuggets",
        homeAbbr: "DEN",
        homeJa: "ナゲッツ",
        awayId: "nba-warriors",
        awayAbbr: "GSW",
        awayJa: "ウォリアーズ",
        homeW: 51,
        homeL: 17,
        homeRank: 1,
        awayW: 39,
        awayL: 29,
        awayRank: 8,
        marketBias: { homePct: 58, awayPct: 42 },
        offsetMin: 90,
      },
      tipOff
    ),
    buildAtmosphereRawGame(
      {
        id: "tutorial-nba-nyk-mia",
        homeId: "nba-heat",
        homeAbbr: "MIA",
        homeJa: "ヒート",
        awayId: "nba-knicks",
        awayAbbr: "NYK",
        awayJa: "ニックス",
        homeW: 37,
        homeL: 31,
        homeRank: 7,
        awayW: 44,
        awayL: 24,
        awayRank: 4,
        marketBias: { homePct: 47, awayPct: 53 },
        offsetMin: 165,
      },
      tipOff
    ),
  ];
}

/** 本番試合が無いときだけモック 3 枚を差し込む */
export function withTutorialNbaBackdropGames(
  games: Record<string, unknown>[],
  enabled: boolean,
  tipOff: Date
): Record<string, unknown>[] {
  if (!enabled || games.length > 0) return games;
  return buildTutorialNbaBackdropGames(tipOff);
}

export function isTutorialNbaBackdropGameId(id: string): boolean {
  return id.startsWith("tutorial-nba-") && id !== TUTORIAL_NBA_GAME_ID;
}
