/**
 * パートナー（YouTuber 等）専用の招待コード。
 * 通常の招待コードと同じ入力欄・7 日条件を使うが、
 * - 紹介者はユーザーではなく `referralPartnerCodes/{code}`（`referrerUid` は `partner:{code}`）
 * - 1 コードあたりの人数制限なし（rate limit / open cap / 紹介者報酬上限を通さない）
 * - 招待された側はコードで登録した時点で PARTNER_INVITEE_UNITS（紹介者側の Unit・スキンはなし）。
 *   7 日条件は効果測定（予想中 / 達成）のためだけに進める
 * - 開幕前の紹介特典（referral_preseason）は対象外
 */
import { normalizeReferralInviteCode } from "./referralInviteCode";

export const REFERRAL_PARTNER_CODES_COLLECTION = "referralPartnerCodes";

export const PARTNER_INVITEE_UNITS = 50;

const PARTNER_REFERRER_PREFIX = "partner:";

export function partnerReferrerUid(code: string): string {
  return `${PARTNER_REFERRER_PREFIX}${normalizeReferralInviteCode(code)}`;
}

export function isPartnerReferrerUid(referrerUid: string | null | undefined): boolean {
  return String(referrerUid ?? "").startsWith(PARTNER_REFERRER_PREFIX);
}

/** 通常コード（UNIT-XXXX）と衝突しない英数 4〜20 文字 */
export function isValidPartnerCodeFormat(raw: string): boolean {
  const c = normalizeReferralInviteCode(raw);
  if (c.length < 4 || c.length > 20) return false;
  if (c.startsWith("UNIT-")) return false;
  return /^[A-Z0-9]+(?:-[A-Z0-9]+)*$/.test(c);
}

export type ReferralPartnerCode = {
  code: string;
  label: string;
  active: boolean;
  inviteeUnits: number;
  createdAtMs: number | null;
};

export type ReferralPartnerStats = {
  /** コードで登録した人数（取り消し・退会を除く） */
  registered: number;
  /** 予想 1 日以上〜7 日未満 */
  inProgress: number;
  /** 予想 7 日達成 */
  completed: number;
  withdrawn: number;
};

export type ReferralPartnerRow = ReferralPartnerCode & {
  stats: ReferralPartnerStats;
};
