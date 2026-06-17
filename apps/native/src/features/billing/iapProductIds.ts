/** App Store / Google Play 商品 ID */
export const IAP_PRODUCT_IDS = {
  monthly: "uniterz_pro_monthly",
  annual: "uniterz_pro_annual",
} as const;

export type IapPlan = keyof typeof IAP_PRODUCT_IDS;

export function productIdForPlan(plan: IapPlan): string {
  return IAP_PRODUCT_IDS[plan];
}

export function planForProductId(productId: string): IapPlan | null {
  if (productId === IAP_PRODUCT_IDS.monthly) return "monthly";
  if (productId === IAP_PRODUCT_IDS.annual) return "annual";
  return null;
}
