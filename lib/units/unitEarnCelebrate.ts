/**
 * Unit 獲得演出 — 文言・プレビュープリセット・モーション（数字は仮、後で ledger 連携）
 */

export type UnitEarnCelebratePresetId =
  | "monthly-rank-1"
  | "monthly-rank-8"
  | "weekly-rank-3"
  | "referral-base"
  | "referral-milestone-3";

export type UnitEarnCelebratePreset = {
  id: UnitEarnCelebratePresetId;
  /** プレビュー用付与量（本番は ledger / API） */
  amount: number;
};

export const UNIT_EARN_CELEBRATE_PREVIEW_PRESETS: readonly UnitEarnCelebratePreset[] =
  [
    { id: "monthly-rank-1", amount: 200 },
    { id: "monthly-rank-8", amount: 80 },
    { id: "weekly-rank-3", amount: 30 },
    { id: "referral-base", amount: 10 },
    { id: "referral-milestone-3", amount: 10 },
  ] as const;

export type UnitEarnCelebrateContent = {
  presetId: UnitEarnCelebratePresetId;
  amount: number;
  kicker: string;
  title: string;
  subtitle: string | null;
  /** 順位がある報酬のみ */
  rank: number | null;
  amountHero: string;
  claimLabel: string;
  historyLabel: string;
  dismissLabel: string;
};

function presetMeta(
  id: UnitEarnCelebratePresetId,
  isJa: boolean
): { title: string; subtitle: string | null; rank: number | null } {
  if (isJa) {
    switch (id) {
      case "monthly-rank-1":
        return { title: "月間ランキング 1位", subtitle: "2026年1月 · NBA", rank: 1 };
      case "monthly-rank-8":
        return { title: "月間ランキング 8位", subtitle: "2026年1月 · NBA", rank: 8 };
      case "weekly-rank-3":
        return { title: "週間ランキング 3位", subtitle: "第12週 · NBA", rank: 3 };
      case "referral-base":
        return { title: "招待が成立", subtitle: null, rank: null };
      case "referral-milestone-3":
        return {
          title: "招待マイルストーン",
          subtitle: "3人目 · ボーナス",
          rank: null,
        };
    }
  }
  switch (id) {
    case "monthly-rank-1":
      return { title: "Monthly rank #1", subtitle: "Jan 2026 · NBA", rank: 1 };
    case "monthly-rank-8":
      return { title: "Monthly rank #8", subtitle: "Jan 2026 · NBA", rank: 8 };
    case "weekly-rank-3":
      return { title: "Weekly rank #3", subtitle: "Week 12 · NBA", rank: 3 };
    case "referral-base":
      return { title: "Invite confirmed", subtitle: null, rank: null };
    case "referral-milestone-3":
      return {
        title: "Invite milestone",
        subtitle: "3 invites · Bonus",
        rank: null,
      };
  }
}

export function unitEarnCelebrateContent(
  presetId: UnitEarnCelebratePresetId,
  isJa: boolean
): UnitEarnCelebrateContent {
  const preset = UNIT_EARN_CELEBRATE_PREVIEW_PRESETS.find((p) => p.id === presetId);
  const amount = preset?.amount ?? 0;
  const meta = presetMeta(presetId, isJa);

  if (isJa) {
    return {
      presetId,
      amount,
      kicker: "UNIT REWARD",
      title: meta.title,
      subtitle: meta.subtitle,
      rank: meta.rank,
      amountHero: `+${amount.toLocaleString("en-US")}`,
      claimLabel: "受け取る",
      historyLabel: "Unit 履歴を見る",
      dismissLabel: "閉じる",
    };
  }

  return {
    presetId,
    amount,
    kicker: "UNIT REWARD",
    title: meta.title,
    subtitle: meta.subtitle,
    rank: meta.rank,
    amountHero: `+${amount.toLocaleString("en-US")}`,
    claimLabel: "Claim",
    historyLabel: "View Unit history",
    dismissLabel: "Close",
  };
}

/** Phase A — モーダル */
export const UNIT_EARN_CELEBRATE_MOTION = {
  backdropFadeS: 0.26,
  panelEnterS: 0.34,
  panelEnterEase: [0.22, 1, 0.36, 1] as const,
  amountSlamS: 0.38,
  /** オーバーシュートなし — 安っぽいバウンスを避ける */
  amountSlamEase: [0.16, 1, 0.3, 1] as const,
  impactScanS: 0.22,
  copyDelayS: 0.42,
  copyFadeS: 0.3,
  ctaDelayS: 0.56,
  ctaFadeS: 0.26,
  /** Phase B — Vault へ流れる */
  flyDurationS: 0.58,
  flyEase: [0.22, 1, 0.36, 1] as const,
  vaultPulseS: 0.4,
  balanceCountMs: 900,
} as const;

const m = UNIT_EARN_CELEBRATE_MOTION;
export const UNIT_EARN_CELEBRATE_MOTION_MS = {
  backdropFadeMs: Math.round(m.backdropFadeS * 1000),
  panelEnterMs: Math.round(m.panelEnterS * 1000),
  amountSlamMs: Math.round(m.amountSlamS * 1000),
  copyDelayMs: Math.round(m.copyDelayS * 1000),
  copyFadeMs: Math.round(m.copyFadeS * 1000),
  ctaDelayMs: Math.round(m.ctaDelayS * 1000),
  ctaFadeMs: Math.round(m.ctaFadeS * 1000),
  flyDurationMs: Math.round(m.flyDurationS * 1000),
  vaultPulseMs: Math.round(m.vaultPulseS * 1000),
  balanceCountMs: m.balanceCountMs,
} as const;
