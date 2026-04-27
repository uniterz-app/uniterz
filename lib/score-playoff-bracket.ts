/* lib/score-playoff-bracket.ts */

import {
  PLAYOFF_BRACKET_STRUCTURE,
  PLAYOFF_ROUND_POINTS,
  PLAYOFF_GAMES_EXACT_POINTS,
  SeriesId,
} from "./playoff-bracket";

export type SeriesResult = {
  winner: string;
  games: number;
};

export type Bracket = Partial<Record<SeriesId, SeriesResult>>;

/** 公式結果として採点に使う（winner 非空かつ試合数 4–7）。プレースホルダー `{}` / `{ winner: "", games: 0 }` は除外 */
export function isRecordedOfficialResult(
  result: SeriesResult | undefined | null
): boolean {
  if (result == null) return false;
  const w = String(result.winner ?? "").trim();
  const g = Number(result.games);
  if (!w) return false;
  if (!Number.isFinite(g) || g < 4 || g > 7) return false;
  return true;
}

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

/** 実際の対戦カード（親2シリーズの勝者ペア）と、予想の対戦カードが一致しているか */
function isActualMatchupAlignedForGamesBonus(
  seriesId: SeriesId,
  prediction: Bracket,
  results: Bracket
): boolean {
  const parents = PLAYOFF_BRACKET_STRUCTURE[seriesId];
  if (!parents) return true; // R1 は対戦カード固定なので常に一致扱い

  const [p1, p2] = parents;

  const predP1 = prediction[p1];
  const predP2 = prediction[p2];
  const resP1 = results[p1];
  const resP2 = results[p2];

  if (!predP1?.winner || !predP2?.winner) return false;
  if (!isRecordedOfficialResult(resP1) || !isRecordedOfficialResult(resP2)) return false;
  const predSet = new Set([predP1.winner, predP2.winner]);
  return predSet.has(resP1!.winner) && predSet.has(resP2!.winner);
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
    if (!isRecordedOfficialResult(result)) continue;
    if (!isSeriesValid(id, prediction)) continue;

    if (pred.winner === result.winner) {
      const round = getRound(id);
      const pts = PLAYOFF_ROUND_POINTS[round];

      winnerPoints += pts;
      totalScore += pts;

      if (
        pred.games === result.games &&
        isActualMatchupAlignedForGamesBonus(id, prediction, results)
      ) {
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