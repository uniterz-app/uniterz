"use client";

import type { StreakCyberTier } from "@/lib/result/streakCyberBorderTier";
import styles from "./ResultHitCyberBorder.module.css";

const tierClass: Record<StreakCyberTier, string> = {
  1: styles.tier1,
  2: styles.tier2,
  3: styles.tier3,
  4: styles.tier4,
};

type Props = { tier: StreakCyberTier };

/** 3連勝以上のとき：枠外周の走光（ティアで色変更） */
export default function ResultHitCyberBorder({ tier }: Props) {
  return (
    <div className={[styles.wrap, tierClass[tier]].join(" ")} aria-hidden>
      <div className={styles.ringClip}>
        <div className={styles.dotsBorder} />
      </div>
    </div>
  );
}
