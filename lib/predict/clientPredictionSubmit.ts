/**
 * Web / Native クライアント共通: 予想の整合チェックと goalScorer 付き payload 組み立て。
 * サーバ側 `parsePredictionPayload` と同趣旨（PK 選択はクライアントで winner に畳む）。
 */

import {
  isSoccerLeagueForPrediction,
  parsePredictionPayload,
  type PredictionWinner,
} from "@/lib/predict/parsePredictionPayload";
import {
  normalizeNbaTopScorerPick,
  type NbaTopScorerPick,
} from "@/lib/nba/topScorer";
import {
  isWcGoalScorerPickValidForPredictedScore,
  normalizeWcGoalScorerPick,
  type WcGoalScorerPick,
} from "@/lib/legacyWcWebShims";

export type ClientPredictionValidationCode =
  | "winner_required"
  | "invalid_score"
  | "draw_not_allowed"
  | "home_win_score"
  | "away_win_score"
  | "draw_requires_equal"
  | "knockout_draw_not_allowed"
  | "knockout_pk_winner_required"
  | "knockout_home_advance"
  | "knockout_away_advance"
  | "prediction_invalid";

export type ClientPredictionValidated = {
  winner: PredictionWinner;
  score: { home: number; away: number };
};

function mapServerErrorToCode(error: string): ClientPredictionValidationCode {
  switch (error) {
    case "prediction.winner must be home/away/draw":
    case "prediction required":
      return "winner_required";
    case "score invalid":
      return "invalid_score";
    case "draw not allowed for this league":
      return "draw_not_allowed";
    case "home win requires home score > away":
      return "home_win_score";
    case "away win requires away score > home":
      return "away_win_score";
    case "draw requires equal scores":
      return "draw_requires_equal";
    case "draw result not allowed in knockout stage":
      return "knockout_draw_not_allowed";
    case "home advance requires home score >= away":
      return "knockout_home_advance";
    case "away advance requires away score >= home":
      return "knockout_away_advance";
    default:
      return "prediction_invalid";
  }
}

/**
 * スコア・勝者・（ノックアウト同点時の）PK 進出を検証し、送信用 winner/score を返す。
 */
export function validateClientPrediction(input: {
  winner: PredictionWinner | null;
  scoreHome: number;
  scoreAway: number;
  league: unknown;
  knockout: boolean;
  /** ノックアウトで同点のとき必須 */
  pkWinner?: "home" | "away" | null;
}):
  | { ok: true; value: ClientPredictionValidated }
  | { ok: false; code: ClientPredictionValidationCode } {
  const { scoreHome: home, scoreAway: away, knockout } = input;
  if (!Number.isFinite(home) || !Number.isFinite(away) || home < 0 || away < 0) {
    return { ok: false, code: "invalid_score" };
  }
  if (!Number.isInteger(home) || !Number.isInteger(away)) {
    return { ok: false, code: "invalid_score" };
  }

  let winner = input.winner;
  if (knockout && home === away) {
    if (input.pkWinner !== "home" && input.pkWinner !== "away") {
      return { ok: false, code: "knockout_pk_winner_required" };
    }
    winner = input.pkWinner;
  }

  if (!winner) {
    return { ok: false, code: "winner_required" };
  }

  const parsed = parsePredictionPayload(
    { winner, score: { home, away } },
    input.league,
    knockout
  );
  if (!parsed.ok) {
    return { ok: false, code: mapServerErrorToCode(parsed.error) };
  }
  return { ok: true, value: parsed.prediction };
}

export type ClientPredictionPayload = {
  winner: PredictionWinner;
  score: { home: number; away: number };
  goalScorer?: WcGoalScorerPick | NbaTopScorerPick | null;
};

/** WC / NBA の goalScorer をリーグに応じて付与（不正ピックは null） */
export function buildClientPredictionPayload(input: {
  validated: ClientPredictionValidated;
  league: unknown;
  goalScorerPick?: unknown;
  homeTeamId?: string | null;
  awayTeamId?: string | null;
}): ClientPredictionPayload {
  const league = String(input.league ?? "").toLowerCase();
  const { validated } = input;
  const base: ClientPredictionPayload = {
    winner: validated.winner,
    score: validated.score,
  };

  if (league === "wc") {
    const pick = normalizeWcGoalScorerPick(input.goalScorerPick);
    const ok =
      pick &&
      isWcGoalScorerPickValidForPredictedScore(
        pick,
        validated.score,
        input.homeTeamId,
        input.awayTeamId
      );
    return { ...base, goalScorer: ok ? pick : null };
  }

  if (league === "nba") {
    return {
      ...base,
      goalScorer: normalizeNbaTopScorerPick(input.goalScorerPick),
    };
  }

  return base;
}

export { isSoccerLeagueForPrediction };
