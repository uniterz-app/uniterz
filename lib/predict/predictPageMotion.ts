import type { Variants } from "framer-motion";
import {
  GAMES_CYBER_EASE,
  GAMES_CYBER_EASE_SNAP,
} from "@/app/component/games/cyberMotion";

/** オーバーレイルート（背面 → パネルの順） */
export const predictOverlayRoot: Variants = {
  hidden: { opacity: 1 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.02,
    },
  },
  exit: {
    opacity: 1,
    transition: { staggerChildren: 0.03, staggerDirection: -1 },
  },
};

/** オーバーレイ背面のフェード */
export const predictOverlayBackdrop: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration: 0.2, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.16, ease: "easeIn" },
  },
};

/** オーバーレイ本文パネル */
export const predictOverlayPanel: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.28,
      ease: GAMES_CYBER_EASE,
      delay: 0.04,
    },
  },
  exit: {
    opacity: 0,
    y: 12,
    transition: { duration: 0.2, ease: GAMES_CYBER_EASE_SNAP },
  },
};

/** カード → フォームの順入場（パネル上昇後に開始） */
export const predictOverlayContentOrch: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.09,
      delayChildren: 0.18,
    },
  },
};

/** 予想オーバーレイ上部の MatchCard */
export const predictOverlayCard: Variants = {
  hidden: { opacity: 0, y: -12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.26, ease: GAMES_CYBER_EASE },
  },
};

/** オーバーレイ内 PredictionForm のルート */
export const predictOverlayFormContainer: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.26,
      ease: GAMES_CYBER_EASE,
      staggerChildren: 0.04,
      delayChildren: 0.04,
    },
  },
};

/** オーバーレイ内フォームの各セクション */
export const predictOverlayFormSection: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.24, ease: GAMES_CYBER_EASE },
  },
};

/** 単体予想ページ（/games/[id]/predict） */
export const predictPageContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      opacity: { duration: 0.16, ease: "easeOut" },
      staggerChildren: 0.045,
      delayChildren: 0.06,
    },
  },
};

export const predictPageSection: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.24, ease: GAMES_CYBER_EASE },
  },
};
