/**
 * プラン変更画面用の表示ロジック（docs/pro-billing-design.md §14）
 */

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

/** 変更 UX 用。旧 annual は monthly 相当として扱う */
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

export function planCatalogPrice(
  plan: ProIapPlan,
  lang: "ja" | "en" = "ja"
): string {
  const row = PRO_SUBSCRIBE_PREVIEW_PLANS.find((p) => p.id === plan);
  if (!row) return IAP_FALLBACK_PRICE_JA[plan];
  return lang === "en" ? row.priceEn : row.priceJa;
}

export function planPeriodLabel(
  plan: ProIapPlan,
  lang: "ja" | "en" = "ja"
): string {
  const row = PRO_SUBSCRIBE_PREVIEW_PLANS.find((p) => p.id === plan);
  if (!row) return "";
  return lang === "en" ? row.periodEn : row.periodJa;
}

export function planDisplayNameFull(
  plan: StoredPlanType | ProIapPlan | null | undefined,
  lang: "ja" | "en" = "ja"
): string {
  if (plan === "annual") {
    return lang === "ja" ? "年額（旧）" : "Annual (legacy)";
  }
  return proPlanDisplayName(plan, lang);
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
  lang: "ja" | "en" = "ja"
): string {
  if (!d) return "—";
  return d.toLocaleDateString(lang === "ja" ? "ja-JP" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function periodEndLabel(plan: ProIapPlan, lang: "ja" | "en"): string {
  if (plan === "season") {
    return lang === "ja" ? "有効期限" : "Valid until";
  }
  return lang === "ja" ? "次回更新日 / 期間終了" : "Next billing / period end";
}

export function changeEffectiveCopy(opts: {
  from: ProIapPlan;
  to: ProIapPlan;
  periodEnd: Date | null;
  lang: "ja" | "en";
}): { timingLabel: string; timingDetail: string; nextChargeLabel: string } {
  const end = formatPlanDate(opts.periodEnd, opts.lang);
  const nextPrice = planCatalogPrice(opts.to, opts.lang);
  const upgrade = isPlanUpgrade(opts.from, opts.to);

  if (opts.lang === "ja") {
    return {
      timingLabel: "反映タイミング",
      timingDetail: upgrade
        ? "課金画面の仕様に従い反映されます。月次レポートは Monthly が有効になってから利用できます。"
        : `現在の契約期間終了後（${end}）に適用されます。終了までは現行プランを利用できます。返金はありません。`,
      nextChargeLabel: `変更後の請求額：${nextPrice}`,
    };
  }

  return {
    timingLabel: "When it takes effect",
    timingDetail: upgrade
      ? "Applies per the billing provider. Monthly report unlocks once Monthly is active."
      : `Applies after the current period ends (${end}). Keep current plan until then. No refunds.`,
    nextChargeLabel: `Next charge after change: ${nextPrice}`,
  };
}

/** planStartDate からの Pro 継続期間（日数ベース） */
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
  lang: "ja" | "en" = "ja",
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

  if (days <= 0) return "Pro since today";
  if (months <= 0) return `Pro for ${days} day${days === 1 ? "" : "s"}`;
  if (remDays === 0) {
    return `Pro for ${months} month${months === 1 ? "" : "s"}`;
  }
  return `Pro for ${months} mo ${remDays}d`;
}
