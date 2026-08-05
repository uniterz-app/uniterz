/**
 * 招待達成「スタンプ・ドン」演出の文言・報酬・モーション定数。
 * プロフィール表示時・最新1枚のみ（docs / 会話合意）。
 */
import {
  REFERRAL_MILESTONES,
  REFERRAL_REFERRER_MAX_COMPLETED,
  REFERRAL_REFERRER_UNITS_PER_COMPLETED,
} from "./referralRewards";
import {
  referralStampToneForSlot,
  type ReferralStampToneId,
} from "./referralStampBoard";

export type ReferralStampCelebrateContent = {
  slotIndex: number;
  tone: ReferralStampToneId;
  baseUnits: number;
  bonusUnits: number;
  totalUnits: number;
  title: string;
  description: string;
  unitsLine: string;
  ctaLabel: string;
  dismissLabel: string;
};

/** 達成スロット N（1…10）の表示内容。最新1枚用。 */
export function referralStampCelebrateContent(
  slotIndex: number,
  isJa: boolean
): ReferralStampCelebrateContent {
  const capped = Math.min(
    Math.max(1, Math.floor(slotIndex)),
    REFERRAL_REFERRER_MAX_COMPLETED
  );
  const baseUnits = REFERRAL_REFERRER_UNITS_PER_COMPLETED;
  const milestone = REFERRAL_MILESTONES.find((m) => m.completedCount === capped);
  const bonusUnits = milestone?.bonusUnits ?? 0;
  const totalUnits = baseUnits + bonusUnits;
  const tone = referralStampToneForSlot(capped);

  if (isJa) {
    return {
      slotIndex: capped,
      tone,
      baseUnits,
      bonusUnits,
      totalUnits,
      title: "招待が成立しました",
      description: `${capped}人目`,
      unitsLine:
        bonusUnits > 0
          ? `基本 +${baseUnits} · ボーナス +${bonusUnits} Unit`
          : `+${baseUnits} Unit`,
      ctaLabel: "スタンプラリーを見る",
      dismissLabel: "閉じる",
    };
  }

  return {
    slotIndex: capped,
    tone,
    baseUnits,
    bonusUnits,
    totalUnits,
    title: "Invite confirmed",
    description: `Invite #${capped}`,
    unitsLine:
      bonusUnits > 0
        ? `Base +${baseUnits} · Bonus +${bonusUnits} Unit`
        : `+${baseUnits} Unit`,
    ctaLabel: "View stamp rally",
    dismissLabel: "Close",
  };
}

/** モーション秒数（Native へコピーする正） */
export const REFERRAL_STAMP_CELEBRATE_MOTION = {
  backdropFadeS: 0.22,
  /** スタンプが落下して着地するまで */
  stampSlamS: 0.42,
  stampSlamEase: [0.16, 0.84, 0.24, 1.12] as const,
  /** 着地後の微バウンス */
  stampSettleS: 0.18,
  copyDelayS: 0.38,
  copyFadeS: 0.28,
  ctaDelayS: 0.52,
  ctaFadeS: 0.24,
} as const;

const s = REFERRAL_STAMP_CELEBRATE_MOTION;
export const REFERRAL_STAMP_CELEBRATE_MOTION_MS = {
  backdropFadeMs: Math.round(s.backdropFadeS * 1000),
  stampSlamMs: Math.round(s.stampSlamS * 1000),
  copyDelayMs: Math.round(s.copyDelayS * 1000),
  copyFadeMs: Math.round(s.copyFadeS * 1000),
  ctaDelayMs: Math.round(s.ctaDelayS * 1000),
  ctaFadeMs: Math.round(s.ctaFadeS * 1000),
} as const;
