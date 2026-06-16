/**
 * Web `app/component/games/cyberMotion.ts` と同一の尺・イージング定数
 */

/** メイン：素早く加速して末端でキリッと止まる */
export const GAMES_CYBER_EASE = [0.16, 0.82, 0.22, 1] as const;

/** 日付切替一覧：減速を長めに取ったスムーズなアウト */
export const GAMES_DAY_SWITCH_EASE = [0.22, 1, 0.36, 1] as const;

/** リスト落下など、より機械的なスナップ */
export const GAMES_CYBER_EASE_SNAP = [0.32, 0, 0.18, 1] as const;

export const GAMES_CYBER_ENTRY_DURATION_SEC = 0.32;
export const GAMES_CYBER_SLOT_GAP_SEC = 0.052;
export const GAMES_CYBER_GROUP_GAP_SEC = 0.085;
export const GAMES_CYBER_LEAD_IN_SEC = 0.042;
export const GAMES_LIST_CARDS_LEAD_IN_SEC = 0.22;
export const GAMES_LIST_AFTER_DAY_STRIP_SEC = 0.18;
export const GAMES_SCHEDULE_SHELL_DURATION_SEC = 0.28;
export const GAMES_LIST_REST_CARDS_DELAY_SEC =
  GAMES_LIST_CARDS_LEAD_IN_SEC + 0.3;

export const GAMES_CYBER_ENTRY_DURATION_MS = Math.round(
  GAMES_CYBER_ENTRY_DURATION_SEC * 1000
);
export const GAMES_CYBER_GROUP_GAP_MS = Math.round(
  GAMES_CYBER_GROUP_GAP_SEC * 1000
);
export const GAMES_LIST_CARDS_LEAD_IN_MS = Math.round(
  GAMES_LIST_CARDS_LEAD_IN_SEC * 1000
);
export const GAMES_LIST_AFTER_DAY_STRIP_MS = Math.round(
  GAMES_LIST_AFTER_DAY_STRIP_SEC * 1000
);
export const GAMES_SCHEDULE_SHELL_DURATION_MS = Math.round(
  GAMES_SCHEDULE_SHELL_DURATION_SEC * 1000
);
export const GAMES_LIST_REST_CARDS_DELAY_MS = Math.round(
  GAMES_LIST_REST_CARDS_DELAY_SEC * 1000
);

/** Web `ScheduleList` の 4 枚目以降スタッガー */
export const PAGE_REST_CARD_STAGGER_MS = 34;

/** カード間スタッガー上限（Web `MatchCard` listStagger cap 0.14s） */
export const GAMES_CARD_LIST_STAGGER_MS = 50;
export const GAMES_CARD_LIST_STAGGER_CAP_MS = 140;

/** 日付切替：行スタッガー（Web `scheduleItem` daySwitch） */
export const GAMES_DAY_SWITCH_ROW_STAGGER_MS = 38;
export const GAMES_DAY_SWITCH_ROW_STAGGER_CAP_MS = 280;
export const GAMES_DAY_SWITCH_ROW_OPACITY_MS = 520;
export const GAMES_DAY_SWITCH_ROW_TRANSLATE_MS = 560;
export const GAMES_DAY_SWITCH_ROW_FROM_Y = -11;

/** 4 枚目以降（page モード） */
export const GAMES_PAGE_REST_CARD_DURATION_MS = 240;
export const GAMES_PAGE_REST_CARD_FROM_Y = 12;
