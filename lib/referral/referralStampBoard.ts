/**
 * 紹介者 1〜10 人スタンプラリー用スロット（docs/referral-design.md）
 */
import {
  REFERRAL_MILESTONES,
  REFERRAL_REFERRER_MAX_COMPLETED,
  nextReferralMilestone,
} from "./referralRewards";

/** スタンプ色。通常枠は base、3/5/10 はマイルストーン固定色 */
export type ReferralStampToneId = "cyan" | "lime" | "amber" | "ink";

/** 3 / 5 / 10 人目のスタンプ色 */
export const REFERRAL_MILESTONE_STAMP_TONE: Readonly<
  Record<number, ReferralStampToneId>
> = {
  3: "lime",
  5: "amber",
  10: "ink",
};

export function referralStampToneForSlot(
  index: number,
  baseTone: ReferralStampToneId = "cyan"
): ReferralStampToneId {
  return REFERRAL_MILESTONE_STAMP_TONE[index] ?? baseTone;
}

export type ReferralStampSlot = {
  /** 1 … maxCompleted */
  index: number;
  stamped: boolean;
  /** このマスがマイルストーン対象ならボーナス Unit */
  milestoneBonusUnits: number | null;
  /** 次に埋める目標マス */
  isNextTarget: boolean;
  /** マイルストーン色（3/5/10） */
  milestoneTone: ReferralStampToneId | null;
};

const MILESTONE_BONUS_BY_INDEX: Readonly<Record<number, number>> =
  Object.fromEntries(
    REFERRAL_MILESTONES.map((m) => [m.completedCount, m.bonusUnits])
  );

export function buildReferralStampSlots(
  completedCount: number,
  maxSlots: number = REFERRAL_REFERRER_MAX_COMPLETED
): ReferralStampSlot[] {
  const capped = Math.min(
    Math.max(0, Math.floor(completedCount)),
    maxSlots
  );
  const next = nextReferralMilestone(capped);
  const nextTarget = next?.target ?? null;

  return Array.from({ length: maxSlots }, (_, i) => {
    const index = i + 1;
    return {
      index,
      stamped: index <= capped,
      milestoneBonusUnits: MILESTONE_BONUS_BY_INDEX[index] ?? null,
      isNextTarget: nextTarget === index,
      milestoneTone: REFERRAL_MILESTONE_STAMP_TONE[index] ?? null,
    };
  });
}
