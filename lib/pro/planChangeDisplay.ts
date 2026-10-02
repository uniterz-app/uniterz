/**
 * プラン変更画面用の表示ロジック（docs/pro-billing-design.md §14）
 */

import { DATE_LOCALE } from "@/lib/i18n/language";
import { L, type LocalizedLang } from "@/lib/i18n/localize";
import {
  IAP_FALLBACK_PRICE_JA,
  isSubscriptionPlan,
  proPlanDisplayName,
  type ProIapPlan,
} from "@/lib/pro/iapProductIds";
import { PRO_SUBSCRIBE_PREVIEW_PLANS } from "@/lib/pro/proSubscribePreviewPlans";

export type StoredPlanType = ProIapPlan | "annual";

const PLAN_RANK: Record<ProIapPlan, number> = {
  weekly: 1,
  monthly: 2,
  season: 3,
};

export function normalizeStoredPlanType(raw: unknown): StoredPlanType | null {
  if (raw === "weekly" || raw === "monthly" || raw === "season" || raw === "annual") {
    return raw;
  }
  return null;
}

export function asProIapPlan(raw: StoredPlanType | null | undefined): ProIapPlan {
  if (raw === "weekly" || raw === "monthly" || raw === "season") return raw;
  return "monthly";
}

export function suggestedChangeTarget(current: ProIapPlan): ProIapPlan | null {
  if (!isSubscriptionPlan(current)) return null;
  return current === "weekly" ? "monthly" : "weekly";
}

export function isPlanUpgrade(from: ProIapPlan, to: ProIapPlan): boolean {
  return PLAN_RANK[to] > PLAN_RANK[from];
}

/** 価格はストア表記に合わせるため全言語共通 */
export function planCatalogPrice(
  plan: ProIapPlan,
  _lang: LocalizedLang = "ja"
): string {
  const row = PRO_SUBSCRIBE_PREVIEW_PLANS.find((p) => p.id === plan);
  if (!row) return IAP_FALLBACK_PRICE_JA[plan];
  return row.price;
}

export function planPeriodLabel(
  plan: ProIapPlan,
  lang: LocalizedLang = "ja"
): string {
  const row = PRO_SUBSCRIBE_PREVIEW_PLANS.find((p) => p.id === plan);
  if (!row) return "";
  return L(lang, row.period);
}

export function planDisplayNameFull(
  plan: StoredPlanType | ProIapPlan | null | undefined,
  lang: LocalizedLang = "ja"
): string {
  if (plan === "annual") {
    return L(lang, {
      ja: "年額（旧）",
      en: "Annual (legacy)",
      ko: "연간(구)",
      zh: "年付（旧）",
      es: "Anual (legacy)",
      pt: "Anual (legado)",
      fr: "Annuel (legacy)",
    });
  }
  return proPlanDisplayName(plan, lang === "ja" ? "ja" : "en");
}

export function firestoreDate(raw: unknown): Date | null {
  if (!raw) return null;
  if (raw instanceof Date) return Number.isFinite(raw.getTime()) ? raw : null;
  if (typeof raw === "object" && raw !== null && "toDate" in raw) {
    const toDate = (raw as { toDate?: unknown }).toDate;
    if (typeof toDate === "function") {
      const d = (toDate as () => Date).call(raw);
      return d instanceof Date && Number.isFinite(d.getTime()) ? d : null;
    }
  }
  return null;
}

export function formatPlanDate(
  d: Date | null | undefined,
  lang: LocalizedLang = "ja"
): string {
  if (!d) return "—";
  return d.toLocaleDateString(DATE_LOCALE[lang], {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function periodEndLabel(plan: ProIapPlan, lang: LocalizedLang): string {
  if (plan === "season") {
    return L(lang, {
      ja: "有効期限",
      en: "Valid until",
      ko: "유효 기간",
      zh: "有效期至",
      es: "Válido hasta",
      pt: "Válido até",
      fr: "Valable jusqu’au",
    });
  }
  return L(lang, {
    ja: "次回更新日 / 期間終了",
    en: "Next billing / period end",
    ko: "다음 결제일 / 기간 종료",
    zh: "下次扣款 / 周期结束",
    es: "Próximo cobro / fin del periodo",
    pt: "Próxima cobrança / fim do período",
    fr: "Prochaine facturation / fin de période",
  });
}

export function changeEffectiveCopy(opts: {
  from: ProIapPlan;
  to: ProIapPlan;
  periodEnd: Date | null;
  lang: LocalizedLang;
}): { timingLabel: string; timingDetail: string; nextChargeLabel: string } {
  const end = formatPlanDate(opts.periodEnd, opts.lang);
  const nextPrice = planCatalogPrice(opts.to, opts.lang);
  const upgrade = isPlanUpgrade(opts.from, opts.to);

  const timingLabel = L(opts.lang, {
    ja: "反映タイミング",
    en: "When it takes effect",
    ko: "적용 시점",
    zh: "生效时间",
    es: "Cuándo se aplica",
    pt: "Quando entra em vigor",
    fr: "Quand ça s’applique",
  });

  if (opts.lang === "ja") {
    return {
      timingLabel,
      timingDetail: upgrade
        ? "課金画面の仕様に従い反映されます。月次レポートは Monthly が有効になってから利用できます。"
        : `現在の契約期間終了後（${end}）に適用されます。終了までは現行プランを利用できます。返金はありません。`,
      nextChargeLabel: `変更後の請求額：${nextPrice}`,
    };
  }

  const timingDetailUpgrade = L(opts.lang, {
    ja: "課金画面の仕様に従い反映されます。月次レポートは Monthly が有効になってから利用できます。",
    en: "Applies per the billing provider. Monthly report unlocks once Monthly is active.",
    ko: "결제 제공자 정책에 따라 적용됩니다. Monthly가 활성화되면 월간 리포트를 이용할 수 있습니다.",
    zh: "按计费平台规则生效。Monthly 激活后可使用月度报告。",
    es: "Se aplica según el proveedor de pago. El informe mensual se desbloquea con Monthly activo.",
    pt: "Aplica conforme o provedor de cobrança. O relatório mensal libera quando Monthly estiver ativo.",
    fr: "S’applique selon le prestataire de facturation. Le rapport mensuel se débloque une fois Monthly actif.",
  });

  const timingDetailDowngrade = (() => {
    if (opts.lang === "ko") {
      return `현재 기간 종료 후(${end}) 적용됩니다. 종료 전까지 현재 플랜을 이용할 수 있습니다. 환불은 없습니다.`;
    }
    if (opts.lang === "zh") {
      return `将在当前周期结束后（${end}）生效。在此之前可继续使用当前方案。不予退款。`;
    }
    if (opts.lang === "es") {
      return `Se aplica tras el fin del periodo actual (${end}). Mantén tu plan hasta entonces. Sin reembolsos.`;
    }
    if (opts.lang === "pt") {
      return `Aplica após o fim do período atual (${end}). Mantenha o plano atual até lá. Sem reembolso.`;
    }
    if (opts.lang === "fr") {
      return `S’applique après la fin de la période en cours (${end}). Gardez votre plan jusque-là. Aucun remboursement.`;
    }
    return `Applies after the current period ends (${end}). Keep current plan until then. No refunds.`;
  })();

  const nextChargeLabel = (() => {
    if (opts.lang === "ko") return `변경 후 청구액: ${nextPrice}`;
    if (opts.lang === "zh") return `变更后扣款：${nextPrice}`;
    if (opts.lang === "es") return `Próximo cargo tras el cambio: ${nextPrice}`;
    if (opts.lang === "pt") return `Próxima cobrança após a alteração: ${nextPrice}`;
    if (opts.lang === "fr") return `Prochain prélèvement après changement : ${nextPrice}`;
    return `Next charge after change: ${nextPrice}`;
  })();

  return {
    timingLabel,
    timingDetail: upgrade ? timingDetailUpgrade : timingDetailDowngrade,
    nextChargeLabel,
  };
}

export function proTenureParts(
  planStart: Date | null | undefined,
  now = new Date()
): { days: number; months: number; remDays: number } | null {
  if (!planStart) return null;
  const startMs = planStart.getTime();
  if (!Number.isFinite(startMs) || startMs > now.getTime()) return null;
  const days = Math.max(0, Math.floor((now.getTime() - startMs) / 86_400_000));
  const months = Math.floor(days / 30);
  const remDays = days % 30;
  return { days, months, remDays };
}

export function formatProTenureLabel(
  planStart: Date | null | undefined,
  lang: LocalizedLang = "ja",
  now = new Date()
): string | null {
  const parts = proTenureParts(planStart, now);
  if (!parts) return null;
  const { days, months, remDays } = parts;

  if (lang === "ja") {
    if (days <= 0) return "Pro 継続 今日から";
    if (months <= 0) return `Pro 継続 ${days}日`;
    if (remDays === 0) return `Pro 継続 ${months}か月`;
    return `Pro 継続 ${months}か月 ${remDays}日`;
  }

  if (days <= 0) {
    return L(lang, {
      ja: "Pro 継続 今日から",
      en: "Pro since today",
      ko: "오늘부터 Pro",
      zh: "Pro 从今天开始",
      es: "Pro desde hoy",
      pt: "Pro desde hoje",
      fr: "Pro depuis aujourd’hui",
    });
  }
  if (months <= 0) {
    if (lang === "ko") return `Pro ${days}일`;
    if (lang === "zh") return `Pro ${days} 天`;
    if (lang === "es") return `Pro ${days} día${days === 1 ? "" : "s"}`;
    if (lang === "pt") return `Pro ${days} dia${days === 1 ? "" : "s"}`;
    if (lang === "fr") return `Pro ${days} jour${days === 1 ? "" : "s"}`;
    return `Pro for ${days} day${days === 1 ? "" : "s"}`;
  }
  if (remDays === 0) {
    if (lang === "ko") return `Pro ${months}개월`;
    if (lang === "zh") return `Pro ${months} 个月`;
    if (lang === "es") return `Pro ${months} mes${months === 1 ? "" : "es"}`;
    if (lang === "pt") return `Pro ${months} mês${months === 1 ? "" : "es"}`;
    if (lang === "fr") return `Pro ${months} mois`;
    return `Pro for ${months} month${months === 1 ? "" : "s"}`;
  }
  if (lang === "ko") return `Pro ${months}개월 ${remDays}일`;
  if (lang === "zh") return `Pro ${months} 个月 ${remDays} 天`;
  if (lang === "es") return `Pro ${months} mes${months === 1 ? "" : "es"} ${remDays}d`;
  if (lang === "pt") return `Pro ${months} mês${months === 1 ? "" : "es"} ${remDays}d`;
  if (lang === "fr") return `Pro ${months} mo ${remDays}j`;
  return `Pro for ${months} mo ${remDays}d`;
}
