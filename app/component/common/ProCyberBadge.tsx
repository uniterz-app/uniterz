"use client";

import { motion } from "framer-motion";
import type { ComponentProps } from "react";
import UniterzProBadge from "@/app/component/units/UniterzProBadge";

export type ProCyberBadgeMotionProps = Pick<
  ComponentProps<typeof motion.span>,
  "initial" | "animate" | "transition"
>;

type Props = ProCyberBadgeMotionProps & {
  ariaLabel: string;
  /** ランキング一覧などでサイズを一段小さく */
  compact?: boolean;
  /** マイランクカード — compact より少しだけ大きく */
  emphasized?: boolean;
  /** プロフィールカード — compact より一段大きく */
  premium?: boolean;
};

/** 選んだ UNITERZ PRO タグ。課金会員の名前横に付く。 */
export function ProCyberBadge({
  ariaLabel,
  initial,
  animate,
  transition,
  compact = false,
  emphasized = false,
  premium = false,
}: Props) {
  const markHeight = premium ? 22 : emphasized ? 20 : compact ? 16 : 18;

  return (
    <motion.span
      className="inline-flex shrink-0 -translate-y-0.5 select-none items-center self-center outline-none"
      initial={initial}
      animate={animate}
      transition={transition}
      aria-label={ariaLabel}
    >
      <UniterzProBadge
        height={markHeight}
        title={ariaLabel}
        tone="gold"
      />
    </motion.span>
  );
}

/** ランキング行など：入場アニメなし */
export const proBadgeStaticMotion: ProCyberBadgeMotionProps = {
  initial: { opacity: 1, y: 0 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0 },
};

/** Free 行のレイアウト揃え用スペーサー幅（compact） */
export const PRO_BADGE_COMPACT_SPACER_CLASS =
  "inline-flex h-[16px] w-[31px] shrink-0 sm:h-[17px] sm:w-[33px]";
