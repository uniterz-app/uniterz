/** Games ページの日付窓（Web / Native / API 共通） */
export const GAMES_WINDOW_PLUS_MINUS_DEFAULT = 5;
/** 窓アンカーの丸め幅。選択日前後の最低余白は pm − floor(7/2)（pm=5 なら 2 日） */
export const GAMES_WINDOW_ANCHOR_STEP_DAYS = 7;
/** 端に近づいたときの追加取得日数 */
export const GAMES_WINDOW_EDGE_EXTEND_DAYS = 2;
/** この日数以内に端へ近づいたら追加取得 */
export const GAMES_WINDOW_EDGE_TRIGGER_DAYS = 2;
export const GAMES_WINDOW_QUERY_LIMIT = 200;
/** 次/前の試合日ジャンプ用の最大探索日数（API 窓） */
export const GAMES_NEAREST_DAY_LOOKAHEAD_DAYS = 62;
