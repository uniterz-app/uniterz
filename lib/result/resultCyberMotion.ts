import type { Variants } from "framer-motion";
import { GAMES_CYBER_EASE, GAMES_CYBER_EASE_SNAP } from "@/app/component/games/cyberMotion";

/** 一覧先頭のリード（秒） */
export const RESULT_LIST_LEAD_IN_SEC = 0.04;

/** 上から順に並べる各スロットの間隔（秒）。初回表示を速くするため短め */
export const RESULT_PAGE_SLOT_GAP_SEC = 0.05;

/**
 * スロット入場開始の上限（秒）。
 * 件数が多いと slot*gap が積み上がって後段カードの表示が遅くなるため、
 * これ以降は同時に出して初回表示の総待ち時間を抑える。
 */
export const RESULT_PAGE_SLOT_MAX_DELAY_SEC = 0.5;

/** スロット1件の入場尺（秒） */
export const RESULT_SLOT_DURATION_SEC = 0.26;

/** 日付ブロック同士の間隔（秒） */
export const RESULT_DAY_GAP_SEC = 0.48;

/** 日付帯 → 最初のカードまで（秒） */
export const RESULT_DAY_HEADER_TO_CARDS_SEC = 0.12;

/** 同一日内のカード間隔（秒） */
export const RESULT_CARD_GAP_SEC = 0.09;

/** 日付帯入場尺（秒） */
export const RESULT_DAY_HEADER_DURATION_SEC = 0.28;

/** カード入場尺（秒） */
export const RESULT_CARD_DURATION_SEC = 0.26;

/** 日付帯内のコーナーブラケット間隔（秒） */
export const RESULT_DAY_BRACKET_GAP_SEC = 0.035;

/** 日付メトリクス（hit / 合計点）のカウント開始遅延（秒） */
export const RESULT_DAY_METRICS_DELAY_SEC = 0.22;

function slotDelay(slot: number): number {
  return Math.min(
    RESULT_LIST_LEAD_IN_SEC + slot * RESULT_PAGE_SLOT_GAP_SEC,
    RESULT_PAGE_SLOT_MAX_DELAY_SEC,
  );
}

/** ページ全体を上から順に（custom = スロット番号）— タブ・フィルタ等 */
export const resultPageSlotItem: Variants = {
  hidden: { opacity: 0, y: -10 },
  show: (slot: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: slotDelay(slot),
      duration: RESULT_SLOT_DURATION_SEC,
      ease: GAMES_CYBER_EASE,
    },
  }),
};

/** 日付帯：上からフェードイン（フラットスロット列用） */
export const resultDayHeaderPageSlot: Variants = {
  hidden: { opacity: 0, y: -14 },
  show: (slot: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: slotDelay(slot),
      duration: RESULT_DAY_HEADER_DURATION_SEC,
      ease: GAMES_CYBER_EASE,
    },
  }),
};

/** リザルトカード：下からスナップ（フラットスロット列用） */
export const resultCardPageSlot: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: (slot: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: slotDelay(slot),
      duration: RESULT_CARD_DURATION_SEC,
      ease: GAMES_CYBER_EASE_SNAP,
    },
  }),
};

/** @deprecated フラットスロット（resultPageSlotItem）に置き換え */
export const resultListCyberRoot: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: RESULT_DAY_GAP_SEC,
      delayChildren: RESULT_LIST_LEAD_IN_SEC,
    },
  },
};

/** 日付ブロック：日付帯 → カード列 */
export const resultDayCyberGroup: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: RESULT_DAY_HEADER_TO_CARDS_SEC,
      delayChildren: 0.02,
    },
  },
};

/** 日付帯シェル */
export const resultDayHeaderCyber: Variants = {
  hidden: { opacity: 0, y: -12 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: RESULT_DAY_HEADER_DURATION_SEC,
      ease: GAMES_CYBER_EASE,
    },
  },
};

/** 日付帯内：コーナーブラケットの順次点灯 */
export const resultDayHeaderBracketOrch: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: RESULT_DAY_BRACKET_GAP_SEC,
      delayChildren: 0.08,
    },
  },
};

export const resultDayHeaderBracketItem: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration: 0.2, ease: GAMES_CYBER_EASE },
  },
};

/** 同一日内：カードを上から順に */
export const resultCardsCyberOrch: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: RESULT_CARD_GAP_SEC,
      delayChildren: 0.03,
    },
  },
};

/** リザルトカード1枚 */
export const resultCardCyberItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: RESULT_CARD_DURATION_SEC,
      ease: GAMES_CYBER_EASE_SNAP,
    },
  },
};
