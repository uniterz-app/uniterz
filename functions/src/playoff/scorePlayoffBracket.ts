import { SeriesId } from "./playoffBracketTypes";

export type SeriesResult = {
  winner: string;
  games: number;
};

export type Bracket = Partial<Record<SeriesId, SeriesResult>>;

const PLAYOFF_BRACKET_STRUCTURE: Partial<Record<SeriesId, [SeriesId, SeriesId]>> = {
  R2_E1: ["R1_E1", "R1_E2"],
  R2_E2: ["R1_E3", "R1_E4"],
  R2_W1: ["R1_W1", "R1_W2"],
  R2_W2: ["R1_W3", "R1_W4"],
  CF_E: ["R2_E1", "R2_E2"],
  CF_W: ["R2_W1", "R2_W2"],
  FINALS: ["CF_E", "CF_W"],
};

const PLAYOFF_ROUND_POINTS = {
  R1: 4,
  R2: 5,
  CF: 6,
  FINALS: 6,
} as const;

const PLAYOFF_GAMES_EXACT_POINTS = 2;

function getRound(seriesId: SeriesId): "R1" | "R2" | "CF" | "FINALS" {
  if (seriesId.startsWith("R1")) return "R1";
  if (seriesId.startsWith("R2")) return "R2";
  if (seriesId.startsWith("CF")) return "CF";
  return "FINALS";
}

function isSeriesValid(seriesId: SeriesId, prediction: Bracket) {
  const parents = PLAYOFF_BRACKET_STRUCTURE[seriesId];

  if (!parents) return true;

  const [p1, p2] = parents;

  const w1 = prediction[p1]?.winner;
  const w2 = prediction[p2]?.winner;

  if (!w1 || !w2) return false;

  const predWinner = prediction[seriesId]?.winner;

  if (!predWinner) return false;

  return predWinner === w1 || predWinner === w2;
}

export type PlayoffScoreResult = {
  totalScore: number;
  winnerPoints: number;
  gamesPoints: number;
  alive: boolean;
  firstMissSeriesId: SeriesId | null;
};

export function scorePlayoffBracket(
  prediction: Bracket,
  results: Bracket
): PlayoffScoreResult {
  let totalScore = 0;
  let winnerPoints = 0;
  let gamesPoints = 0;

  let alive = true;
  let firstMissSeriesId: SeriesId | null = null;

  for (const seriesId in results) {
    const id = seriesId as SeriesId;

    const result = results[id];
    const pred = prediction[id];

    if (!result || !pred) continue;
    if (!isSeriesValid(id, prediction)) continue;

    if (pred.winner === result.winner) {
      const round = getRound(id);
      const pts = PLAYOFF_ROUND_POINTS[round];

      winnerPoints += pts;
      totalScore += pts;

      if (pred.games === result.games) {
        gamesPoints += PLAYOFF_GAMES_EXACT_POINTS;
        totalScore += PLAYOFF_GAMES_EXACT_POINTS;
      }
    } else if (alive) {
      alive = false;
      firstMissSeriesId = id;
    }
  }

  return {
    totalScore,
    winnerPoints,
    gamesPoints,
    alive,
    firstMissSeriesId,
  };
}