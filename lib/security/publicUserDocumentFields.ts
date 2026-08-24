/**
 * `users/{uid}` ルート文書の公開可否棚卸し。
 *
 * Firestore ルールは現状 `allow read: if true`（ドキュメント全体が読める）。
 * 書き込みは本人 + 許可キーのみ。課金シークレットは `secure/` へ寄せ中。
 *
 * 本番前の方針:
 * - PUBLIC_PROFILE: プロフィール表示に必要なもの（公開のまま可）
 * - PRODUCT_VISIBLE: プロダクト上わざと見せる（残高など）— 公開のまま可だが意図を明示
 * - SENSITIVE_ON_ROOT: ルートに残っているが公開読みは望ましくない → `secure/` へ移行継続
 * - NEVER_CLIENT_WRITE: クライアント書き込み禁止（ルールで既に禁止）
 */

/** 公開プロフィールとして意図して読まれてよい */
export const PUBLIC_USER_PROFILE_FIELDS = [
  "displayName",
  "bio",
  "photoURL",
  "avatarUrl",
  "photoCropY",
  "handle",
  "username",
  "slug",
  "createdAt",
  "updatedAt",
  "counts",
  "language",
  "locale",
  "timeZone",
  "countryCode",
  "preferredLeague",
  "onboardingCompletedAt",
  "profileViewCount",
  "plan",
  "planType",
  "proUntil",
] as const;

/** プロダクト要件で公開読める（課金・残高 UX） */
export const PRODUCT_VISIBLE_USER_FIELDS = [
  "unitBalance",
  "unitReserved",
  "planProBgVariant",
  "proSkinUnlockedIds",
  "proSkinProgress",
  "proSkinRankEarnedIds",
  "proSkinUnlockNoticeIds",
  "proSkinUnlockSeason",
  "proSkinHeldIds",
] as const;

/**
 * ルートに残っているが公開読みは縮小したい。
 * Admin / Functions のみが本来必要。移行先は `users/{uid}/secure/*`。
 */
export const SENSITIVE_USER_ROOT_FIELDS = [
  "email",
  "stripeCustomerId",
  "stripeSubscriptionId",
  "googlePurchaseToken",
  "appleOriginalTransactionId",
  "billingProvider",
  "nextPlanType",
  "cancelAtPeriodEnd",
  "inviteCode",
  "referredByUid",
  "referralInviteCode",
  "referralBoundAt",
  "referralStats",
  "referralSettledAt",
  "notificationPrefs",
] as const;

export type PublicUserProfileField = (typeof PUBLIC_USER_PROFILE_FIELDS)[number];
export type SensitiveUserRootField = (typeof SENSITIVE_USER_ROOT_FIELDS)[number];

/** クライアント向けプロフィール投影で許可するキー集合 */
export const CLIENT_SAFE_USER_FIELD_SET = new Set<string>([
  ...PUBLIC_USER_PROFILE_FIELDS,
  ...PRODUCT_VISIBLE_USER_FIELDS,
]);

export function pickClientSafeUserFields(
  data: Record<string, unknown> | null | undefined
): Record<string, unknown> {
  if (!data) return {};
  const out: Record<string, unknown> = {};
  for (const key of CLIENT_SAFE_USER_FIELD_SET) {
    if (key in data) out[key] = data[key];
  }
  return out;
}
