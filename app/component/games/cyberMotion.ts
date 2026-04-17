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

/** 先頭スロットまでのリード（秒） */
export const GAMES_CYBER_LEAD_IN_SEC = 0.042;

/** GamesPage: 日付ストリップの後に一覧ラッパーのモーションが始まるまで（秒） */
export const GAMES_LIST_AFTER_DAY_STRIP_SEC = 0.14;

/** GamesPage: 一覧ラッパー（rich / opacity+y）の尺（秒） */
export const GAMES_SCHEDULE_SHELL_DURATION_SEC = 0.28;

/** ラッパー入場が終わるまでの合計 — ScheduleList の page モードで 4 枚目以降の遅延基準（GamesPage の rich ラッパーと同じ尺にすること） */
export const GAMES_SCHEDULE_SHELL_MOTION_COMPLETE_SEC =
  GAMES_LIST_AFTER_DAY_STRIP_SEC + GAMES_SCHEDULE_SHELL_DURATION_SEC;

/** カード入場 1 要素の尺（ミリ秒）— jersey ドット遅延計算と同期 */
export const GAMES_CYBER_ENTRY_DURATION_MS = Math.round(
  GAMES_CYBER_ENTRY_DURATION_SEC * 1000,
);
