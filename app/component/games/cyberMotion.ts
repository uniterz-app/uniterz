/**
 * 試合一覧まわりの「サイバー」系モーション定数（イージング・尺の統一）
 */

/** メイン：素早く加速して末端でキリッと止まる */
export const GAMES_CYBER_EASE = [0.16, 0.82, 0.22, 1] as const;

/** 日付切替一覧：減速を長めに取ったスムーズなアウト */
export const GAMES_DAY_SWITCH_EASE = [0.22, 1, 0.36, 1] as const;

/** リスト落下など、より機械的なスナップ */
export const GAMES_CYBER_EASE_SNAP = [0.32, 0, 0.18, 1] as const;

/** 試合カード内部スロットの 1 要素あたりの入場尺（秒） */
export const GAMES_CYBER_ENTRY_DURATION_SEC = 0.32;

/** スロット間隔（秒）— 狭めるとデータが流し込まれる感じ */
export const GAMES_CYBER_SLOT_GAP_SEC = 0.052;

/**
 * 試合カード入場のグループ間隔（秒）。
 * カード内部は 9 要素の細かいスタッガーではなく
 * 「シェル → ヘッダー行 → チーム行 → フッター行」の 4 グループで入場させる
 */
export const GAMES_CYBER_GROUP_GAP_SEC = 0.085;

/** 先頭スロットまでのリード（秒）。単体ページなどリスト外での入場用 */
export const GAMES_CYBER_LEAD_IN_SEC = 0.042;

/**
 * 試合一覧（page モード）でカード内部の入場が始まるまでのリード（秒）。
 * 上部バー → 月ヘッダー → 日付ストリップ → 一覧ラッパーの後に来るよう揃える
 */
export const GAMES_LIST_CARDS_LEAD_IN_SEC = 0.62;

/** GamesPage: 日付ストリップの後に一覧ラッパーのモーションが始まるまで（秒） */
export const GAMES_LIST_AFTER_DAY_STRIP_SEC = 0.54;

/** GamesPage: 一覧ラッパー（rich / opacity+y）の尺（秒） */
export const GAMES_SCHEDULE_SHELL_DURATION_SEC = 0.28;

/** page モードで 4 枚目以降が出始める時刻（先頭3枚のロックオンが概ね終わった後） */
export const GAMES_LIST_REST_CARDS_DELAY_SEC =
  GAMES_LIST_CARDS_LEAD_IN_SEC + 0.42;

/** カード入場 1 要素の尺（ミリ秒）— jersey ドット遅延計算と同期 */
export const GAMES_CYBER_ENTRY_DURATION_MS = Math.round(
  GAMES_CYBER_ENTRY_DURATION_SEC * 1000,
);
