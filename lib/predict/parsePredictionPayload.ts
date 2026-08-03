/**
 * POST /api/posts_v2 と PATCH /api/posts_v2/[id] で共有する予想ペイロード検証。
 */

export type PredictionWinner = "home" | "away" | "draw";

export type ParsedPredictionPayload = {
  winner: PredictionWinner;
  score: { home: number; away: number };
};

export type ParsePredictionOk = {
  ok: true;
  prediction: ParsedPredictionPayload;
  rawGoalScorer: unknown;
};

export type ParsePredictionNg = { ok: false; error: string };

export function isSoccerLeagueForPrediction(league: unknown): boolean {
  const s = String(league ?? "").toLowerCase();
  return s === "pl" || s === "j1" || s === "wc" || s.includes("premier");
}

/**
 * winner / score の整合性を検証する（goalScorer は raw のまま返す）。
 * `raw` は `{ prediction: {...} }` でも `{ winner, score, ... }` でも可。
 */
export function parsePredictionPayload(
  raw: unknown,
  league: unknown,
  knockout: boolean
): ParsePredictionOk | ParsePredictionNg {
  const soccer = isSoccerLeagueForPrediction(league);
  const p = (raw as { prediction?: unknown } | null)?.prediction ?? raw;
  if (!p || typeof p !== "object") {
    return { ok: false, error: "prediction required" };
  }
  const winner = (p as { winner?: unknown }).winner;
  if (!["home", "away", "draw"].includes(String(winner))) {
    return { ok: false, error: "prediction.winner must be home/away/draw" };
  }
  const s = (p as { score?: { home?: unknown; away?: unknown } }).score ?? {};
  const home = Number(s.home);
  const away = Number(s.away);
  if (
    !Number.isInteger(home) ||
    !Number.isInteger(away) ||
    home < 0 ||
    away < 0
  ) {
    return { ok: false, error: "score invalid" };
  }

  if (knockout) {
    // ノックアウト: 引き分け結果は不可。同点スコアは PK 決着として許可（勝者は進出側）
    if (winner === "draw") {
      return { ok: false, error: "draw result not allowed in knockout stage" };
    }
    if (winner === "home" && home < away) {
      return { ok: false, error: "home advance requires home score >= away" };
    }
    if (winner === "away" && away < home) {
      return { ok: false, error: "away advance requires away score >= home" };
    }
    return {
      ok: true,
      prediction: {
        winner: winner as PredictionWinner,
        score: { home, away },
      },
      rawGoalScorer: (p as { goalScorer?: unknown }).goalScorer,
    };
  }

  if (!soccer && winner === "draw") {
    return { ok: false, error: "draw not allowed for this league" };
  }
  if (winner === "home" && home <= away) {
    return { ok: false, error: "home win requires home score > away" };
  }
  if (winner === "away" && away <= home) {
    return { ok: false, error: "away win requires away score > home" };
  }
  if (soccer && winner === "draw" && home !== away) {
    return { ok: false, error: "draw requires equal scores" };
  }
  return {
    ok: true,
    prediction: {
      winner: winner as PredictionWinner,
      score: { home, away },
    },
    rawGoalScorer: (p as { goalScorer?: unknown }).goalScorer,
  };
}
