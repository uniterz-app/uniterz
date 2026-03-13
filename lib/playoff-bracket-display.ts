import type { BracketState } from "@/lib/playoff-bracket-firestore";
import { TEAM_SHORT } from "@/lib/team-short";

export type TeamSlot = {
  teamId?: string | null;
  wins?: number | string;
};

export type PlayoffDisplayData = {
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

function toTeamId(code?: string) {
  if (!code) return null;
  return NBA_TEAM_CODE_TO_ID[code] ?? null;
}

function toSlot(winner?: string, games?: number): TeamSlot {
  return {
    teamId: toTeamId(winner),
    wins: games ?? "",
  };
}

export function buildPlayoffDisplayData(
  bracket: BracketState
): PlayoffDisplayData {
  const eastFinalWinner = bracket["CF_E"]?.winner;
  const westFinalWinner = bracket["CF_W"]?.winner;
  const finalsWinner = bracket["FINALS"]?.winner;
  const finalsGames = bracket["FINALS"]?.games;

  const finalsTopTeam =
    eastFinalWinner ?? undefined;

  const finalsBottomTeam =
    westFinalWinner ?? undefined;

  return {
    leftRound1: [
      toSlot(bracket["R1_E1"]?.winner, bracket["R1_E1"]?.games),
      toSlot(bracket["R1_E2"]?.winner, bracket["R1_E2"]?.games),
      toSlot(bracket["R1_E3"]?.winner, bracket["R1_E3"]?.games),
      toSlot(bracket["R1_E4"]?.winner, bracket["R1_E4"]?.games),
    ],

    leftRound2: [
      toSlot(bracket["R2_E1"]?.winner, bracket["R2_E1"]?.games),
      toSlot(bracket["R2_E2"]?.winner, bracket["R2_E2"]?.games),
    ],

    leftRound3: [
      toSlot(bracket["CF_E"]?.winner, bracket["CF_E"]?.games),
    ],

    leftRound4: [
      toSlot(finalsTopTeam, finalsGames),
    ],

    rightRound1: [
      toSlot(bracket["R1_W1"]?.winner, bracket["R1_W1"]?.games),
      toSlot(bracket["R1_W2"]?.winner, bracket["R1_W2"]?.games),
      toSlot(bracket["R1_W3"]?.winner, bracket["R1_W3"]?.games),
      toSlot(bracket["R1_W4"]?.winner, bracket["R1_W4"]?.games),
    ],

    rightRound2: [
      toSlot(bracket["R2_W1"]?.winner, bracket["R2_W1"]?.games),
      toSlot(bracket["R2_W2"]?.winner, bracket["R2_W2"]?.games),
    ],

    rightRound3: [
      toSlot(bracket["CF_W"]?.winner, bracket["CF_W"]?.games),
    ],

    rightRound4: [
      toSlot(finalsBottomTeam, finalsGames),
    ],

    champion: toSlot(finalsWinner, finalsGames),
  };
}