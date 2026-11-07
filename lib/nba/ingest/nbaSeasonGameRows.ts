/**
 * スタッツ ingest 用のシーズン `games` 一括読み。
 * 日次 / 試合後監視は 1 回だけ読み、試合ログ・成績スプリット・shape・順位表へ同じ行を渡す。
 */
import type { Firestore } from "firebase-admin/firestore";

export type NbaSeasonGameRow = Record<string, unknown> & { id: string };

/**
 * ingest が読むフィールドだけ。`pointsSummary` / `topScorerMarket` / `predictorUids` など
 * ユーザー予想側の集計は読まない（今季だけで数 MB あり、ingest では使わない）。
 * 新しい ingest が games の別フィールドを使うときはここに足す。
 */
export const NBA_SEASON_GAME_ROW_FIELDS = [
  "status",
  "status_state",
  "final",
  "homeTeamId",
  "awayTeamId",
  "home",
  "away",
  "startAtJst",
  "startAt",
  "startAtMs",
  "kickoffJst",
  "score",
  "homeScore",
  "awayScore",
  "finalScore",
  "result",
  "seasonPhase",
  "season_type",
  "countsForRanking",
  "liveStats.box",
  "liveStats.teamStats",
] as const;

/** プレシーズン + レギュラー + プレーイン + プレーオフ + 重複 doc でも切れない上限 */
export const NBA_SEASON_GAME_ROWS_LIMIT = 3000;

export async function loadNbaSeasonGameRows(
  db: Firestore,
  season: string,
  limit: number = NBA_SEASON_GAME_ROWS_LIMIT
): Promise<NbaSeasonGameRow[]> {
  const snap = await db
    .collection("games")
    .where("league", "==", "nba")
    .where("season", "==", season)
    .orderBy("startAtJst", "asc")
    .select(...NBA_SEASON_GAME_ROW_FIELDS)
    .limit(limit)
    .get();

  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Record<string, unknown>),
  }));
}
