import type { SeriesId } from "../../../../../../lib/playoff-bracket";
import { slotTeamIdToBracketCode } from "../../../../../../lib/playoff-bracket-display";
import {
  buildRound1Series,
  getPlayoffBracketConfig,
} from "../../../../../../lib/playoff-bracket-config";

export type BracketCardHitStatus = "none" | "winner" | "winnerAndGames";

type SeriesPickLike = {
  winner?: string;
  games?: number;
};

export type BracketLike = Partial<Record<SeriesId, SeriesPickLike>>;

export const ALL_PLAYOFF_SERIES_IDS: SeriesId[] = [
  "R1_E1",
  "R1_E2",
  "R1_E3",
  "R1_E4",
  "R1_W1",
  "R1_W2",
  "R1_W3",
  "R1_W4",
  "R2_E1",
  "R2_E2",
  "R2_W1",
  "R2_W2",
  "CF_E",
  "CF_W",
  "FINALS",
];

const SERIES_PARENTS: Partial<Record<SeriesId, [SeriesId, SeriesId]>> = {
  R2_E1: ["R1_E1", "R1_E2"],
  R2_E2: ["R1_E3", "R1_E4"],
  R2_W1: ["R1_W1", "R1_W2"],
  R2_W2: ["R1_W3", "R1_W4"],
  CF_E: ["R2_E1", "R2_E2"],
  CF_W: ["R2_W1", "R2_W2"],
  FINALS: ["CF_E", "CF_W"],
};

function normalizeTeamId(v?: string | null) {
  return String(v ?? "")
    .trim()
    .toUpperCase();
}

function sameMatchup(
  aTop?: string | null,
  aBottom?: string | null,
  bTop?: string | null,
  bBottom?: string | null
) {
  const x1 = normalizeTeamId(aTop);
  const x2 = normalizeTeamId(aBottom);
  const y1 = normalizeTeamId(bTop);
  const y2 = normalizeTeamId(bBottom);

  if (!x1 || !x2 || !y1 || !y2) return false;

  return (x1 === y1 && x2 === y2) || (x1 === y2 && x2 === y1);
}

export function getRound1InitialTeams(season?: string) {
  if (!season) return {} as Record<SeriesId, [string | null, string | null]>;

  const config = getPlayoffBracketConfig(season);
  const { eastR1, westR1 } = buildRound1Series(config);

  return {
    R1_E1: [eastR1[0]?.[0]?.code ?? null, eastR1[0]?.[1]?.code ?? null],
    R1_E2: [eastR1[1]?.[0]?.code ?? null, eastR1[1]?.[1]?.code ?? null],
    R1_E3: [eastR1[2]?.[0]?.code ?? null, eastR1[2]?.[1]?.code ?? null],
    R1_E4: [eastR1[3]?.[0]?.code ?? null, eastR1[3]?.[1]?.code ?? null],
    R1_W1: [westR1[0]?.[0]?.code ?? null, westR1[0]?.[1]?.code ?? null],
    R1_W2: [westR1[1]?.[0]?.code ?? null, westR1[1]?.[1]?.code ?? null],
    R1_W3: [westR1[2]?.[0]?.code ?? null, westR1[2]?.[1]?.code ?? null],
    R1_W4: [westR1[3]?.[0]?.code ?? null, westR1[3]?.[1]?.code ?? null],
  } as Record<SeriesId, [string | null, string | null]>;
}

function getSeriesMatchup(
  seriesId: SeriesId,
  state: BracketLike | undefined,
  round1InitialTeams: Record<SeriesId, [string | null, string | null]>
): [string | null, string | null] {
  if (seriesId.startsWith("R1_")) {
    return round1InitialTeams[seriesId] ?? [null, null];
  }

  const parents = SERIES_PARENTS[seriesId];
  if (!parents) return [null, null];

  const [parentA, parentB] = parents;

  const teamA = normalizeTeamId(state?.[parentA]?.winner || null) || null;
  const teamB = normalizeTeamId(state?.[parentB]?.winner || null) || null;

  return [teamA, teamB];
}

export function getSeriesHitStatus(
  seriesId: SeriesId,
  bracket: BracketLike | undefined,
  results: BracketLike | undefined,
  round1InitialTeams: Record<SeriesId, [string | null, string | null]>
): BracketCardHitStatus {
  const predictedWinner = normalizeTeamId(bracket?.[seriesId]?.winner);
  const actualWinner = normalizeTeamId(results?.[seriesId]?.winner);

  if (!predictedWinner || !actualWinner) return "none";
  if (predictedWinner !== actualWinner) return "none";

  const predictedGames = bracket?.[seriesId]?.games;
  const actualGames = results?.[seriesId]?.games;

  const gamesMatch =
    predictedGames != null &&
    actualGames != null &&
    Number(predictedGames) === Number(actualGames);

  if (!gamesMatch) return "winner";

  const [predTop, predBottom] = getSeriesMatchup(seriesId, bracket, round1InitialTeams);
  const [actualTop, actualBottom] = getSeriesMatchup(seriesId, results, round1InitialTeams);

  if (sameMatchup(predTop, predBottom, actualTop, actualBottom)) {
    return "winnerAndGames";
  }

  return "winner";
}

export function buildSeriesStatusMap(
  bracket: BracketLike | undefined,
  results: BracketLike | undefined,
  season?: string
): Record<SeriesId, BracketCardHitStatus> {
  const round1InitialTeams = getRound1InitialTeams(season);
  const map = {} as Record<SeriesId, BracketCardHitStatus>;

  for (const seriesId of ALL_PLAYOFF_SERIES_IDS) {
    map[seriesId] = getSeriesHitStatus(seriesId, bracket, results, round1InitialTeams);
  }

  return map;
}

export function getCardHitStatus(
  seriesId: SeriesId,
  teamId: string | null | undefined,
  bracket: BracketLike | undefined,
  seriesStatusMap: Record<SeriesId, BracketCardHitStatus>
): BracketCardHitStatus {
  const winner = normalizeTeamId(bracket?.[seriesId]?.winner);
  const slotCode = slotTeamIdToBracketCode(teamId);

  if (!winner || !slotCode) return "none";
  if (winner !== slotCode) return "none";

  return seriesStatusMap[seriesId] ?? "none";
}

export function getSeriesIdFromRound1Index(side: "left" | "right", index: number): SeriesId {
  const seriesIndex = Math.floor(index / 2) + 1;
  return `${side === "left" ? "R1_E" : "R1_W"}${seriesIndex}` as SeriesId;
}
