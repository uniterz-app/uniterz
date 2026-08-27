/**
 * `users/{uid}` ルート文書の公開可否棚卸し。
 *
 * Firestore はフィールド単位の read 制限ができない。
 * 公開ルートには PUBLIC / PRODUCT / OPERATIONAL だけを残し、
 * sensitive は `secure/`（本人 read・Admin write）と
 * `private/`（本人 read/write）へ移す。
 *
 * 移行: `scripts/scrub-user-root-sensitive.ts`
 * 公開プロフィール解決: `pickClientSafeUserFields`（`fetchUserDocByRouteKey`）
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
 * ルートに残す運用フィールド。
 * `expireProUsers` が複合クエリするため当面ルートに置く。
 * 公開されても課金シークレットではないが、解約予約が他人に見える。
 */
export const OPERATIONAL_USER_ROOT_FIELDS = [
  "cancelAtPeriodEnd",
  "planStartDate",
] as const;

/**
 * ルートから消す / 移行済み。
 * - billing* / stripe* / tokens → secure/billing
 * - inviteCode → secure/referral
 * - notificationPrefs → private/notificationPrefs
 * - email は削除のみ
 *
 * まだルートに残るが次フェーズで寄せる:
 * - referredByUid / referral*（投稿・settle がルート参照）
 */
export const SENSITIVE_USER_ROOT_FIELDS = [
  "email",
  "stripeCustomerId",
  "stripeSubscriptionId",
  "googlePurchaseToken",
  "appleOriginalTransactionId",
  "billingProvider",
  "nextPlanType",
  "inviteCode",
  "referredByUid",
  "referralInviteCode",
  "referralBoundAt",
  "referralStats",
  "referralSettledAt",
  "notificationPrefs",
] as const;

/** scrub スクリプトがルートから delete するキー（移行先あり） */
export const SCRUBBABLE_USER_ROOT_FIELDS = [
  "email",
  "stripeCustomerId",
  "stripeSubscriptionId",
  "googlePurchaseToken",
  "appleOriginalTransactionId",
  "billingProvider",
  "nextPlanType",
  "inviteCode",
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
