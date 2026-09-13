/**
 * Unit 獲得演出 — 文言・プレビュープリセット・モーション（数字は仮、後で ledger 連携）
 */
import { L, resolveLocalizedLang } from "@/lib/i18n/localize";

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
    { id: "monthly-rank-1", amount: 300 },
    { id: "monthly-rank-8", amount: 140 },
    { id: "weekly-rank-3", amount: 42 },
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
  language: string | null | undefined
): { title: string; subtitle: string | null; rank: number | null } {
  const lang = resolveLocalizedLang(language);
  switch (id) {
    case "monthly-rank-1":
      return {
        title: L(lang, {
          ja: "月間ランキング 1位",
          en: "Monthly rank #1",
          ko: "월간 랭킹 1위",
          zh: "月榜第 1 名",
          es: "Ranking mensual #1",
          pt: "Ranking mensal #1",
          fr: "Classement mensuel #1",
        }),
        subtitle: L(lang, {
          ja: "2026年1月 · NBA",
          en: "Jan 2026 · NBA",
          ko: "2026년 1월 · NBA",
          zh: "2026年1月 · NBA",
          es: "Ene 2026 · NBA",
          pt: "Jan 2026 · NBA",
          fr: "Janv. 2026 · NBA",
        }),
        rank: 1,
      };
    case "monthly-rank-8":
      return {
        title: L(lang, {
          ja: "月間ランキング 8位",
          en: "Monthly rank #8",
          ko: "월간 랭킹 8위",
          zh: "月榜第 8 名",
          es: "Ranking mensual #8",
          pt: "Ranking mensal #8",
          fr: "Classement mensuel #8",
        }),
        subtitle: L(lang, {
          ja: "2026年1月 · NBA",
          en: "Jan 2026 · NBA",
          ko: "2026년 1월 · NBA",
          zh: "2026年1月 · NBA",
          es: "Ene 2026 · NBA",
          pt: "Jan 2026 · NBA",
          fr: "Janv. 2026 · NBA",
        }),
        rank: 8,
      };
    case "weekly-rank-3":
      return {
        title: L(lang, {
          ja: "週間ランキング 3位",
          en: "Weekly rank #3",
          ko: "주간 랭킹 3위",
          zh: "周榜第 3 名",
          es: "Ranking semanal #3",
          pt: "Ranking semanal #3",
          fr: "Classement hebdo #3",
        }),
        subtitle: L(lang, {
          ja: "第12週 · NBA",
          en: "Week 12 · NBA",
          ko: "12주차 · NBA",
          zh: "第12周 · NBA",
          es: "Semana 12 · NBA",
          pt: "Semana 12 · NBA",
          fr: "Semaine 12 · NBA",
        }),
        rank: 3,
      };
    case "referral-base":
      return {
        title: L(lang, {
          ja: "招待が成立",
          en: "Invite confirmed",
          ko: "초대 성사",
          zh: "邀请成功",
          es: "Invitación confirmada",
          pt: "Convite confirmado",
          fr: "Invitation confirmée",
        }),
        subtitle: null,
        rank: null,
      };
    case "referral-milestone-3":
      return {
        title: L(lang, {
          ja: "招待マイルストーン",
          en: "Invite milestone",
          ko: "초대 마일스톤",
          zh: "邀请里程碑",
          es: "Hito de referidos",
          pt: "Marco de indicação",
          fr: "Jalon de parrainage",
        }),
        subtitle: L(lang, {
          ja: "3人目 · ボーナス",
          en: "3 invites · Bonus",
          ko: "3번째 · 보너스",
          zh: "第3人 · 奖励",
          es: "3.º amigo · Bonus",
          pt: "3º amigo · Bônus",
          fr: "3e ami · Bonus",
        }),
        rank: null,
      };
  }
}

export function unitEarnCelebrateContent(
  presetId: UnitEarnCelebratePresetId,
  language: string | null | undefined
): UnitEarnCelebrateContent {
  const lang = resolveLocalizedLang(language);
  const preset = UNIT_EARN_CELEBRATE_PREVIEW_PRESETS.find((p) => p.id === presetId);
  const amount = preset?.amount ?? 0;
  const meta = presetMeta(presetId, lang);

  return {
    presetId,
    amount,
    kicker: "UNIT REWARD",
    title: meta.title,
    subtitle: meta.subtitle,
    rank: meta.rank,
    amountHero: `+${amount.toLocaleString("en-US")}`,
    claimLabel: L(lang, {
      ja: "受け取る",
      en: "Claim",
      ko: "받기",
      zh: "领取",
      es: "Reclamar",
      pt: "Resgatar",
      fr: "Récupérer",
    }),
    historyLabel: L(lang, {
      ja: "Unit 履歴を見る",
      en: "View Unit history",
      ko: "Unit 기록 보기",
      zh: "查看 Unit 记录",
      es: "Ver historial de Units",
      pt: "Ver histórico de Units",
      fr: "Voir l’historique Units",
    }),
    dismissLabel: L(lang, {
      ja: "閉じる",
      en: "Close",
      ko: "닫기",
      zh: "关闭",
      es: "Cerrar",
      pt: "Fechar",
      fr: "Fermer",
    }),
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
