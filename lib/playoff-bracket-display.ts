import type { BracketState } from "@/lib/playoff-bracket-firestore";
import { TEAM_SHORT } from "@/lib/team-short";
import {
  getPlayoffBracketConfig,
  buildRound1Series,
} from "@/lib/playoff-bracket-config";

export type TeamSlot = {
  teamId?: string | null;
  wins?: number | string;
  seed?: number | string;
};

export type PlayoffDisplayData = {
  season: string;
  leftRound1: TeamSlot[];
  leftRound2: TeamSlot[];
  leftRound3: TeamSlot[];
  leftRound4: TeamSlot[];

  rightRound1: TeamSlot[];
  rightRound2: TeamSlot[];
  rightRound3: TeamSlot[];
  rightRound4: TeamSlot[];

  champion?: TeamSlot;
};

const NBA_TEAM_CODE_TO_ID: Record<string, string> = Object.fromEntries(
  Object.entries(TEAM_SHORT)
    .filter(([teamId]) => teamId.startsWith("nba-"))
    .map(([teamId, short]) => [short, teamId])
);

const NBA_ID_TO_BRACKET_CODE: Record<string, string> = Object.fromEntries(
  Object.entries(NBA_TEAM_CODE_TO_ID).map(([code, id]) => [
    id.toLowerCase(),
    code,
  ])
);

function toTeamId(code?: string) {
  if (!code) return null;
  return NBA_TEAM_CODE_TO_ID[code] ?? null;
}

/** 表示スロットの teamId（例: nba-pistons）を bracket の winner コード（例: DET）に揃える */
export function slotTeamIdToBracketCode(teamId?: string | null): string {
  const raw = String(teamId ?? "").trim();
  if (!raw) return "";
  const key = raw.toLowerCase();
  const code = NBA_ID_TO_BRACKET_CODE[key];
  if (code) return code.toUpperCase();
  return raw.toUpperCase();
}

function buildTeamCodeToSeed(season: string): Record<string, number> {
  const config = getPlayoffBracketConfig(season);

  return Object.fromEntries(
    [...config.east, ...config.west].map((team) => [team.code, team.seed])
  );
}

function getSeed(code: string | undefined, teamCodeToSeed: Record<string, number>) {
  if (!code) return "";
  return teamCodeToSeed[code] ?? "";
}

function winsForTeam(
  teamCode: string | undefined,
  winner: string | undefined,
  games: number | undefined
): number | string {
  if (!teamCode || !winner || games == null) return "";
  if (teamCode === winner) return 4;
  return Math.max(0, games - 4);
}

function toSlot(
  code: string | undefined,
  wins: number | string | undefined,
  teamCodeToSeed: Record<string, number>
): TeamSlot {
  return {
    teamId: toTeamId(code),
    wins: wins ?? "",
    seed: getSeed(code, teamCodeToSeed),
  };
}

function makeSeriesPair(
  teamA: string | undefined,
  teamB: string | undefined,
  winner: string | undefined,
  games: number | undefined,
  teamCodeToSeed: Record<string, number>
): [TeamSlot, TeamSlot] {
  return [
    toSlot(teamA, winsForTeam(teamA, winner, games), teamCodeToSeed),
    toSlot(teamB, winsForTeam(teamB, winner, games), teamCodeToSeed),
  ];
}

export function buildPlayoffDisplayData(
  bracket: BracketState,
  season: string
): PlayoffDisplayData {
  const teamCodeToSeed = buildTeamCodeToSeed(season);
  const config = getPlayoffBracketConfig(season);
  const { eastR1, westR1 } = buildRound1Series(config);

  const r1e1w = bracket["R1_E1"]?.winner;
  const r1e2w = bracket["R1_E2"]?.winner;
  const r1e3w = bracket["R1_E3"]?.winner;
  const r1e4w = bracket["R1_E4"]?.winner;

  const r1w1w = bracket["R1_W1"]?.winner;
  const r1w2w = bracket["R1_W2"]?.winner;
  const r1w3w = bracket["R1_W3"]?.winner;
  const r1w4w = bracket["R1_W4"]?.winner;

  const r2e1w = bracket["R2_E1"]?.winner;
  const r2e2w = bracket["R2_E2"]?.winner;
  const r2w1w = bracket["R2_W1"]?.winner;
  const r2w2w = bracket["R2_W2"]?.winner;

  const cfeWinner = bracket["CF_E"]?.winner;
  const cfwWinner = bracket["CF_W"]?.winner;

  const finalsWinner = bracket["FINALS"]?.winner;
  const finalsGames = bracket["FINALS"]?.games;

  const leftRound1 = [
    ...makeSeriesPair(
      eastR1[0][0].code,
      eastR1[0][1].code,
      bracket["R1_E1"]?.winner,
      bracket["R1_E1"]?.games,
      teamCodeToSeed
    ),
    ...makeSeriesPair(
      eastR1[1][0].code,
      eastR1[1][1].code,
      bracket["R1_E2"]?.winner,
      bracket["R1_E2"]?.games,
      teamCodeToSeed
    ),
    ...makeSeriesPair(
      eastR1[2][0].code,
      eastR1[2][1].code,
      bracket["R1_E3"]?.winner,
      bracket["R1_E3"]?.games,
      teamCodeToSeed
    ),
    ...makeSeriesPair(
      eastR1[3][0].code,
      eastR1[3][1].code,
      bracket["R1_E4"]?.winner,
      bracket["R1_E4"]?.games,
      teamCodeToSeed
    ),
  ];

  const leftRound2 = [
    ...makeSeriesPair(
      r1e1w,
      r1e2w,
      bracket["R2_E1"]?.winner,
      bracket["R2_E1"]?.games,
      teamCodeToSeed
    ),
    ...makeSeriesPair(
      r1e3w,
      r1e4w,
      bracket["R2_E2"]?.winner,
      bracket["R2_E2"]?.games,
      teamCodeToSeed
    ),
  ];

  const leftRound3 = makeSeriesPair(
    r2e1w,
    r2e2w,
    bracket["CF_E"]?.winner,
    bracket["CF_E"]?.games,
    teamCodeToSeed
  );

  const leftRound4 = [
    toSlot(
      cfeWinner,
      winsForTeam(cfeWinner, finalsWinner, finalsGames),
      teamCodeToSeed
    ),
  ];

  const rightRound1 = [
    ...makeSeriesPair(
      westR1[0][0].code,
      westR1[0][1].code,
      bracket["R1_W1"]?.winner,
      bracket["R1_W1"]?.games,
      teamCodeToSeed
    ),
    ...makeSeriesPair(
      westR1[1][0].code,
      westR1[1][1].code,
      bracket["R1_W2"]?.winner,
      bracket["R1_W2"]?.games,
      teamCodeToSeed
    ),
    ...makeSeriesPair(
      westR1[2][0].code,
      westR1[2][1].code,
      bracket["R1_W3"]?.winner,
      bracket["R1_W3"]?.games,
      teamCodeToSeed
    ),
    ...makeSeriesPair(
      westR1[3][0].code,
      westR1[3][1].code,
      bracket["R1_W4"]?.winner,
      bracket["R1_W4"]?.games,
      teamCodeToSeed
    ),
  ];

  const rightRound2 = [
    ...makeSeriesPair(
      r1w1w,
      r1w2w,
      bracket["R2_W1"]?.winner,
      bracket["R2_W1"]?.games,
      teamCodeToSeed
    ),
    ...makeSeriesPair(
      r1w3w,
      r1w4w,
      bracket["R2_W2"]?.winner,
      bracket["R2_W2"]?.games,
      teamCodeToSeed
    ),
  ];

  const rightRound3 = makeSeriesPair(
    r2w1w,
    r2w2w,
    bracket["CF_W"]?.winner,
    bracket["CF_W"]?.games,
    teamCodeToSeed
  );

  const rightRound4 = [
    toSlot(
      cfwWinner,
      winsForTeam(cfwWinner, finalsWinner, finalsGames),
      teamCodeToSeed
    ),
  ];

  return {
    season,
    leftRound1,
    leftRound2,
    leftRound3,
    leftRound4,
    rightRound1,
    rightRound2,
    rightRound3,
    rightRound4,
    champion: toSlot(finalsWinner, 4, teamCodeToSeed),
  };
}