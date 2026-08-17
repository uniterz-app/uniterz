/**
 * 招待・紹介の報酬表（docs/referral-design.md と同期）
 */
export const REFERRAL_INVITEE_UNITS = 30;

/** 条件達成 1 人あたり（紹介者・有効招待 10 人以内） */
export const REFERRAL_REFERRER_UNITS_PER_COMPLETED = 10;

/** 有効招待人数の上限（これ超は紹介者報酬なし） */
export const REFERRAL_REFERRER_MAX_COMPLETED = 10;

/** 紹介者累計 Unit 上限 */
export const REFERRAL_REFERRER_MAX_UNITS = 150;

export const REFERRAL_MILESTONES = [
  { completedCount: 3, bonusUnits: 10 },
  { completedCount: 5, bonusUnits: 10 },
  { completedCount: 10, bonusUnits: 30 },
] as const;

export type ReferralInviteStatus =
  | "registered"
  | "in_progress"
  | "under_review"
  | "completed"
  | "invalid"
  | "fraud_rejected"
  | "withdrawn";

export type ReferralInviteProgressRow = {
  id: string;
  /** 表示用（最小限。ハンドル一部など） */
  label: string;
  status: ReferralInviteStatus;
  /** 有効予想の日数 0–7 */
  activePredictDays: number;
};

export type ReferralInviteSummary = {
  inviteCode: string;
  inviteUrl: string;
  completedCount: number;
  inProgressCount: number;
  underReviewCount: number;
  unitsFromBase: number;
  unitsFromMilestones: number;
  rows: ReferralInviteProgressRow[];
};

export function referralReferrerUnitsEarned(completedCount: number): {
  base: number;
  milestones: number;
  total: number;
} {
  const capped = Math.min(
    Math.max(0, Math.floor(completedCount)),
    REFERRAL_REFERRER_MAX_COMPLETED
  );
  const base = capped * REFERRAL_REFERRER_UNITS_PER_COMPLETED;
  let milestones = 0;
  for (const m of REFERRAL_MILESTONES) {
    if (capped >= m.completedCount) milestones += m.bonusUnits;
  }
  const total = Math.min(base + milestones, REFERRAL_REFERRER_MAX_UNITS);
  return { base, milestones, total };
}

export function nextReferralMilestone(completedCount: number): {
  target: number;
  remaining: number;
  bonusUnits: number;
} | null {
  const capped = Math.min(
    Math.max(0, Math.floor(completedCount)),
    REFERRAL_REFERRER_MAX_COMPLETED
  );
  for (const m of REFERRAL_MILESTONES) {
    if (capped < m.completedCount) {
      return {
        target: m.completedCount,
        remaining: m.completedCount - capped,
        bonusUnits: m.bonusUnits,
      };
    }
  }
  return null;
}

/** 空サマリー（未招待・API 失敗時のフォールバック） */
export function emptyReferralInviteSummary(
  inviteCode = "",
  inviteUrl = ""
): ReferralInviteSummary {
  return {
    inviteCode,
    inviteUrl,
    completedCount: 0,
    inProgressCount: 0,
    underReviewCount: 0,
    unitsFromBase: 0,
    unitsFromMilestones: 0,
    rows: [],
  };
}

/** UI プレビュー用モック（スタンプ色確認など） */
export function mockReferralInviteSummary(): ReferralInviteSummary {
  /** スタンプボード確認用: 10 人達成で 3/5/10 の色差を確認 */
  const completedCount = 10;
  const earned = referralReferrerUnitsEarned(completedCount);
  return {
    inviteCode: "UNIT-7K2M",
    inviteUrl: "https://uniterz.app/mobile/r/UNIT-7K2M",
    completedCount,
    inProgressCount: 2,
    underReviewCount: 0,
    unitsFromBase: earned.base,
    unitsFromMilestones: earned.milestones,
    rows: [
      {
        id: "1",
        label: "@alex***",
        status: "completed",
        activePredictDays: 7,
      },
      {
        id: "2",
        label: "@kai***",
        status: "completed",
        activePredictDays: 7,
      },
      {
        id: "3",
        label: "@mio***",
        status: "completed",
        activePredictDays: 7,
      },
      {
        id: "4",
        label: "@ren***",
        status: "completed",
        activePredictDays: 7,
      },
      {
        id: "5",
        label: "@yuki***",
        status: "in_progress",
        activePredictDays: 5,
      },
      {
        id: "6",
        label: "@leo***",
        status: "in_progress",
        activePredictDays: 2,
      },
    ],
  };
}
