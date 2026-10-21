import { isSoccerLeagueForPrediction } from "@/lib/predict/parsePredictionPayload";
import { toDateKeyInTimeZone } from "@/lib/time/zonedTime";

export type SanitizedPredictionBody =
  | { ok: true; gameId: string; comment: string; rawPrediction: unknown }
  | { ok: false; error: string };

/** game 未取得時の薄い抽出。整合は game 取得後に parsePredictionPayload */
export function sanitizePredictionBody(body: unknown): SanitizedPredictionBody {
  try {
    const raw = body as {
      gameId?: unknown;
      prediction?: { winner?: unknown; score?: { home?: unknown; away?: unknown } };
      comment?: unknown;
    };
    const gameId = String(raw?.gameId ?? "").trim();
    if (!gameId) throw new Error("gameId required");

    const p = raw?.prediction ?? {};
    if (!["home", "away", "draw"].includes(String(p.winner))) {
      throw new Error("prediction.winner must be home/away/draw");
    }

    const s = p.score ?? {};
    const home = Number(s.home);
    const away = Number(s.away);
    if (!Number.isInteger(home) || !Number.isInteger(away) || home < 0 || away < 0) {
      throw new Error("score invalid");
    }

    const comment = String(raw?.comment ?? "").slice(0, 2000);
    return { ok: true, gameId, comment, rawPrediction: p };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "bad payload";
    return { ok: false, error: message };
  }
}

/** 1 回の一括提出に載せられる試合数 */
export const BATCH_PREDICT_MAX_ITEMS = 15;

/**
 * 一括提出は 1 試合日分まで。試合日は NBA が米国東部、それ以外は日本時間の暦日
 * （NBA の夜試合は日本時間で翌日にまたがるため、リーグの現地日で揃える）。
 */
export function batchPredictGameDayKey(league: unknown, startAtMs: number): string {
  const timeZone =
    String(league ?? "").toLowerCase() === "nba" ? "America/New_York" : "Asia/Tokyo";
  return toDateKeyInTimeZone(new Date(startAtMs), timeZone);
}

/**
 * 表示中の日の候補を、先頭（キックオフが最も早い）試合と同じ試合日だけに絞る。
 * 端末のタイムゾーンによっては 1 日の一覧に NBA の 2 試合日が混ざるため。
 */
export function keepSingleBatchGameDay<T>(
  rows: readonly T[],
  gameOf: (row: T) => { league?: unknown; startAtMs: number | null }
): T[] {
  let firstKey: string | null = null;
  let firstMs = Infinity;
  const keyed = rows.map((row) => {
    const { league, startAtMs } = gameOf(row);
    const key = startAtMs == null ? null : batchPredictGameDayKey(league, startAtMs);
    if (key && startAtMs != null && startAtMs < firstMs) {
      firstMs = startAtMs;
      firstKey = key;
    }
    return { row, key };
  });
  if (firstKey == null) return [...rows];
  return keyed.filter((r) => r.key === firstKey).map((r) => r.row);
}

export type BatchPredictWinner = "home" | "away" | "draw";

/**
 * スコアから勝者を決める。
 * サッカーの通常戦で同点なら draw。それ以外の同点は提出できない。
 */
function sideLabel(side: unknown): string {
  if (typeof side === "string") return side.trim();
  if (!side || typeof side !== "object") return "";
  const o = side as Record<string, unknown>;
  for (const key of ["shortName", "abbr", "nickname", "name"] as const) {
    const value = o[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

export function batchPredictRowFromGame(game: {
  id?: unknown;
  home?: unknown;
  away?: unknown;
  league?: unknown;
  knockout?: unknown;
}): BatchPredictGameRow | null {
  const gameId = String(game.id ?? "").trim();
  if (!gameId) return null;
  return {
    gameId,
    homeLabel: sideLabel(game.home) || "HOME",
    awayLabel: sideLabel(game.away) || "AWAY",
    league: String(game.league ?? ""),
    knockout: game.knockout === true,
  };
}

export type BatchPredictGameRow = {
  gameId: string;
  homeLabel: string;
  awayLabel: string;
  league: string;
  knockout: boolean;
};

export type BatchPredictItem = {
  gameId: string;
  prediction: {
    winner: BatchPredictWinner;
    score: { home: number; away: number };
    /** NBA 最多得点。未選択の試合は付けない */
    goalScorer?: { playerId: string; teamId: string; name?: string | null };
  };
  comment: string;
};

/** 空欄は捨てる。同点で提出できない行は skippedTieIds に残す。 */
export function buildBatchPredictItems(
  rows: readonly BatchPredictGameRow[],
  scores: Readonly<Record<string, { home: string; away: string } | undefined>>,
  scorers?: Readonly<
    Record<
      string,
      { playerId: string; teamId: string; name?: string | null } | null | undefined
    >
  >
): { items: BatchPredictItem[]; skippedTieIds: string[] } {
  const items: BatchPredictItem[] = [];
  const skippedTieIds: string[] = [];
  for (const row of rows) {
    const raw = scores[row.gameId];
    if (!raw) continue;
    const homeText = raw.home.trim();
    const awayText = raw.away.trim();
    if (homeText === "" || awayText === "") continue;
    const home = Number(homeText);
    const away = Number(awayText);
    if (!Number.isInteger(home) || !Number.isInteger(away) || home < 0 || away < 0) {
      continue;
    }
    const winner = batchPredictWinnerFromScores(row.league, home, away, row.knockout);
    if (!winner.ok) {
      skippedTieIds.push(row.gameId);
      continue;
    }
    const scorer = scorers?.[row.gameId];
    const goalScorer =
      String(row.league).toLowerCase() === "nba" &&
      scorer &&
      scorer.playerId.trim() &&
      scorer.teamId.trim()
        ? {
            playerId: scorer.playerId.trim(),
            teamId: scorer.teamId.trim(),
            ...(scorer.name?.trim() ? { name: scorer.name.trim() } : {}),
          }
        : null;
    items.push({
      gameId: row.gameId,
      prediction: {
        winner: winner.winner,
        score: { home, away },
        ...(goalScorer ? { goalScorer } : {}),
      },
      comment: "",
    });
  }
  return {
    items: items.slice(0, BATCH_PREDICT_MAX_ITEMS),
    skippedTieIds,
  };
}

export function batchPredictWinnerFromScores(
  league: unknown,
  home: number,
  away: number,
  knockout: boolean
): { ok: true; winner: BatchPredictWinner } | { ok: false; error: "tie" } {
  if (home > away) return { ok: true, winner: "home" };
  if (away > home) return { ok: true, winner: "away" };
  if (isSoccerLeagueForPrediction(league) && !knockout) {
    return { ok: true, winner: "draw" };
  }
  return { ok: false, error: "tie" };
}
