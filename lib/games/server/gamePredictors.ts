/**
 * 試合を予想した uid の一覧（`gamePredictors/{gameId}.uids`）。
 * `games/{id}` は公開読み取り＋ライブ書き込みが多いので、増え続ける配列はここに置く。
 * Functions 側 `functions/src/notifications/gamePredictors.ts` と同じコレクション。
 */
export const GAME_PREDICTORS_COLLECTION = "gamePredictors";
