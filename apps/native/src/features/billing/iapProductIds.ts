/**
 * Web / 共有 `lib/pro/iapProductIds` 相当。
 * Native からも同一の商品 ID・プラン型を使う。
 */
export {
  IAP_ALL_SKUS,
  IAP_FALLBACK_PRICE_JA,
  IAP_LEGACY_PRODUCT_IDS,
  IAP_ONE_TIME_SKUS,
  IAP_PRODUCT_IDS,
  IAP_SUBSCRIPTION_SKUS,
  isSubscriptionPlan,
  planForProductId,
  productIdForPlan,
  proPlanDisplayName,
  stubProUntilForPlan,
  type ProIapPlan,
} from "../../../../../lib/pro/iapProductIds";

/** @deprecated ProIapPlan を使う */
export type IapPlan = import("../../../../../lib/pro/iapProductIds").ProIapPlan;
