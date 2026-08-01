/**
 * App Store / Google Play の Pro 商品 ID（設計正: docs/pro-billing-design.md）
 */

export type ProIapPlan = "weekly" | "monthly" | "season";

export const IAP_PRODUCT_IDS = {
  weekly: "uniterz_pro_weekly",
  monthly: "uniterz_pro_monthly",
  season: "uniterz_pro_season",
} as const satisfies Record<ProIapPlan, string>;

/** 旧 annual 商品（復元用。新規販売しない） */
export const IAP_LEGACY_PRODUCT_IDS = {
  annual: "uniterz_pro_annual",
} as const;

export const IAP_SUBSCRIPTION_SKUS = [
  IAP_PRODUCT_IDS.weekly,
  IAP_PRODUCT_IDS.monthly,
] as const;

export const IAP_ONE_TIME_SKUS = [IAP_PRODUCT_IDS.season] as const;

export const IAP_ALL_SKUS = [
  ...IAP_SUBSCRIPTION_SKUS,
  ...IAP_ONE_TIME_SKUS,
  IAP_LEGACY_PRODUCT_IDS.annual,
] as const;

export const IAP_FALLBACK_PRICE_JA: Record<ProIapPlan, string> = {
  weekly: "¥280",
  monthly: "¥780",
  season: "¥5,000",
};

export function productIdForPlan(plan: ProIapPlan): string {
  return IAP_PRODUCT_IDS[plan];
}

export function isSubscriptionPlan(plan: ProIapPlan): boolean {
  return plan === "weekly" || plan === "monthly";
}

export function planForProductId(productId: string): ProIapPlan | null {
  if (productId === IAP_PRODUCT_IDS.weekly) return "weekly";
  if (productId === IAP_PRODUCT_IDS.monthly) return "monthly";
  if (productId === IAP_PRODUCT_IDS.season) return "season";
  // 旧年額 → 月額相当として扱わず season 相当の長期利用に寄せない。表示互換のため monthly。
  if (productId === IAP_LEGACY_PRODUCT_IDS.annual) return "monthly";
  if (productId.includes("weekly")) return "weekly";
  if (productId.includes("season")) return "season";
  if (productId.includes("monthly")) return "monthly";
  return null;
}

/** 検証スタブ用の有効期限。本番はストアの period / seasonEndAt を正とする。 */
export function stubProUntilForPlan(plan: ProIapPlan, now = new Date()): Date {
  const d = new Date(now);
  if (plan === "weekly") {
    d.setDate(d.getDate() + 7);
    return d;
  }
  if (plan === "monthly") {
    d.setMonth(d.getMonth() + 1);
    return d;
  }
  // Season Pass: 当年 or 翌年の 6/30（NBA シーズン終了の簡易スタブ）
  const endYear = d.getMonth() >= 6 ? d.getFullYear() + 1 : d.getFullYear();
  return new Date(endYear, 5, 30, 23, 59, 59);
}

export function proPlanDisplayName(
  plan: ProIapPlan | "annual" | string | null | undefined,
  lang: "ja" | "en" = "ja"
): string {
  switch (plan) {
    case "weekly":
      return lang === "ja" ? "Weekly" : "Weekly";
    case "season":
      return lang === "ja" ? "Season Pass" : "Season Pass";
    case "annual":
      return lang === "ja" ? "年額（旧）" : "Annual (legacy)";
    case "monthly":
      return lang === "ja" ? "Monthly" : "Monthly";
    default:
      return lang === "ja" ? "Pro" : "Pro";
  }
}
