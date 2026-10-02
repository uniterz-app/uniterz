"use client";

import {
  ProCyberBadge,
  type ProCyberBadgeMotionProps,
} from "@/app/component/common/ProCyberBadge";

type Props = ProCyberBadgeMotionProps & {
  isPro?: boolean;
  compact?: boolean;
  emphasized?: boolean;
  premium?: boolean;
  proLabel: string;
};

/** ランキング / プロフィールの名前横 — PRO */
export function RankingNameBadges({
  isPro = false,
  compact,
  emphasized,
  premium,
  proLabel,
  initial,
  animate,
  transition,
}: Props) {
  if (!isPro) return null;
  return (
    <ProCyberBadge
      ariaLabel={proLabel}
      compact={compact}
      emphasized={emphasized}
      premium={premium}
      initial={initial}
      animate={animate}
      transition={transition}
    />
  );
}
