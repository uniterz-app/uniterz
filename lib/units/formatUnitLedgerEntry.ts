/**
 * Unit 台帳エントリの表示文言
 */

import { DATE_LOCALE, type Language } from "@/lib/i18n/language";
import {
  L,
  resolveLocalizedLang,
  type LocalizedLang,
} from "@/lib/i18n/localize";
import type { UnitLedgerReasonCode } from "@/lib/units/unitLedgerTypes";
import {
  periodRankingUnitMetricLabel,
  type PeriodRankingUnitMetric,
} from "@/lib/units/periodRankingUnitRewards";

export function normalizeUnitLedgerReason(raw: unknown): UnitLedgerReasonCode {
  if (typeof raw !== "string") return "unknown";
  switch (raw) {
    case "referral_invitee":
    case "referral_referrer":
    case "referral_milestone":
    case "group_battle_weekly":
    case "group_battle_monthly":
    case "weekly_rank":
    case "monthly_rank":
    case "redemption":
    case "adjustment":
      return raw;
    default:
      return "unknown";
  }
}

export function unitLedgerReasonTitle(
  reason: UnitLedgerReasonCode,
  language: LocalizedLang | string,
  meta?: { milestoneAt?: number; rank?: number; metric?: string }
): string {
  const lang = resolveLocalizedLang(language);
  const milestone = meta?.milestoneAt ?? "?";
  switch (reason) {
    case "referral_invitee":
      return L(lang, {
        ja: "招待ボーナス",
        en: "Invite bonus",
        ko: "초대 보너스",
        zh: "邀请奖励",
        es: "Bonus por invitación",
        pt: "Bônus de convite",
        fr: "Bonus d’invitation",
      });
    case "referral_referrer":
      return L(lang, {
        ja: "招待で獲得",
        en: "Referral reward",
        ko: "초대로 획득",
        zh: "邀请获得",
        es: "Recompensa por referidos",
        pt: "Recompensa por indicação",
        fr: "Récompense de parrainage",
      });
    case "referral_milestone":
      return L(lang, {
        ja: `招待マイルストーン（${milestone}人）`,
        en: `Referral milestone (${milestone} friends)`,
        ko: `초대 마일스톤(${milestone}명)`,
        zh: `邀请里程碑（${milestone}人）`,
        es: `Hito de referidos (${milestone} amigos)`,
        pt: `Marco de indicação (${milestone} amigos)`,
        fr: `Jalon de parrainage (${milestone} amis)`,
      });
    case "group_battle_weekly":
      return L(lang, {
        ja: "グループバトル（週間）",
        en: "Group Battle (weekly)",
        ko: "그룹 배틀(주간)",
        zh: "小队对战（周）",
        es: "Batalla de grupo (semanal)",
        pt: "Batalha de grupo (semanal)",
        fr: "Bataille de groupe (hebdo)",
      });
    case "group_battle_monthly":
      return L(lang, {
        ja: "グループバトル（期間）",
        en: "Group Battle (period)",
        ko: "그룹 배틀(기간)",
        zh: "小队对战（期）",
        es: "Batalla de grupo (periodo)",
        pt: "Batalha de grupo (período)",
        fr: "Bataille de groupe (période)",
      });
    case "weekly_rank":
      return L(lang, {
        ja: "週間ランキング報酬",
        en: "Weekly ranking reward",
        ko: "주간 랭킹 보상",
        zh: "周榜奖励",
        es: "Recompensa ranking semanal",
        pt: "Recompensa ranking semanal",
        fr: "Récompense classement hebdo",
      });
    case "monthly_rank":
      return L(lang, {
        ja: "月間ランキング報酬",
        en: "Monthly ranking reward",
        ko: "월간 랭킹 보상",
        zh: "月榜奖励",
        es: "Recompensa ranking mensual",
        pt: "Recompensa ranking mensal",
        fr: "Récompense classement mensuel",
      });
    case "redemption":
      return L(lang, {
        ja: "商品交換で使用",
        en: "Redeemed for product",
        ko: "상품 교환에 사용",
        zh: "用于商品兑换",
        es: "Canjeado por producto",
        pt: "Resgatado por produto",
        fr: "Échangé contre un produit",
      });
    case "adjustment":
      return L(lang, {
        ja: "調整",
        en: "Adjustment",
        ko: "조정",
        zh: "调整",
        es: "Ajuste",
        pt: "Ajuste",
        fr: "Ajustement",
      });
    default:
      return L(lang, {
        ja: "Unit",
        en: "Units",
        ko: "Unit",
        zh: "Unit",
        es: "Units",
        pt: "Units",
        fr: "Units",
      });
  }
}

function metricLabelForLedger(
  metric: string | undefined,
  language: LocalizedLang
): string | null {
  if (!metric) return null;
  const known: PeriodRankingUnitMetric[] = [
    "totalPoints",
    "winRate",
    "totalUpset",
    "totalGoalScorerHits",
  ];
  if (!(known as string[]).includes(metric)) return metric;
  return periodRankingUnitMetricLabel(
    metric as PeriodRankingUnitMetric,
    language
  );
}

export function unitLedgerReasonDetail(
  reason: UnitLedgerReasonCode,
  language: LocalizedLang | string,
  meta?: { rank?: number; label?: string; metric?: string }
): string | null {
  const lang = resolveLocalizedLang(language);
  if (
    (reason === "group_battle_weekly" || reason === "group_battle_monthly") &&
    meta?.rank != null
  ) {
    return L(lang, {
      ja: `${meta.rank}位`,
      en: `Rank #${meta.rank}`,
      ko: `${meta.rank}위`,
      zh: `第${meta.rank}名`,
      es: `Puesto #${meta.rank}`,
      pt: `Colocação #${meta.rank}`,
      fr: `Rang #${meta.rank}`,
    });
  }
  if (
    (reason === "weekly_rank" || reason === "monthly_rank") &&
    meta?.rank != null
  ) {
    const metricLabel = metricLabelForLedger(meta.metric, lang);
    const rankPart = L(lang, {
      ja: `${meta.rank}位`,
      en: `Rank #${meta.rank}`,
      ko: `${meta.rank}위`,
      zh: `第${meta.rank}名`,
      es: `Puesto #${meta.rank}`,
      pt: `Colocação #${meta.rank}`,
      fr: `Rang #${meta.rank}`,
    });
    if (metricLabel) {
      return `${metricLabel} · ${rankPart}`;
    }
    return rankPart;
  }
  if (meta?.label) return meta.label;
  return null;
}

/** 12/3 のような短い日付 */
export function formatUnitLedgerDate(
  createdAtMs: number,
  language: LocalizedLang | string
): string {
  if (!Number.isFinite(createdAtMs) || createdAtMs <= 0) return "—";
  const d = new Date(createdAtMs);
  const lang = resolveLocalizedLang(language);
  const locale = DATE_LOCALE[lang as Language] ?? DATE_LOCALE.en;
  if (lang === "ja") {
    return `${d.getMonth() + 1}/${d.getDate()}`;
  }
  return d.toLocaleDateString(locale, { month: "short", day: "numeric" });
}

export function formatUnitLedgerAmount(
  amount: number,
  language: LocalizedLang | string
): string {
  const lang = resolveLocalizedLang(language);
  const locale = DATE_LOCALE[lang as Language] ?? DATE_LOCALE.en;
  const abs = Math.abs(Math.round(amount));
  const n = abs.toLocaleString(locale);
  if (amount > 0) return `+${n}`;
  if (amount < 0) return `−${n}`;
  return n;
}
