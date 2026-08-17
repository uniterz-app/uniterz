/**
 * users/{uid} → プロフィールカード初回描画用シード（peek / load 共通）。
 */
import { auth } from "../../lib/firebase";
import { parseMemberSinceMs } from "../../../../../lib/profile/parseMemberSinceMs";
import {
  parseUserProfileFields,
  parseUserUnitBalance,
} from "../../../../../lib/profile/parseUserProfileFields";
import { parseUserPlanProBgVariant } from "../../../../../lib/profile/profilePlanProBgVariantField";
import type { ProfilePlanProBgVariant } from "../../../../../lib/profile/profilePlanProBgVariants";
import { peekProfileUserDocNative } from "./profileUserDocCacheNative";

export type OwnProfileSeedNative = {
  displayName: string;
  handle: string;
  bio: string;
  avatarUrl: string;
  language: "ja" | "en";
  countryCode: string;
  /** 期限解決前の表示用（resolveAndExpireMyPlan で後から確定） */
  plan: "free" | "pro";
  planProBgVariant: ProfilePlanProBgVariant;
  memberSinceMs: number | null;
  unitBalance: number;
  data: Record<string, unknown>;
};

export function seedOwnProfileFromUserDocNative(
  data: Record<string, unknown>,
  authPhotoURL?: string | null
): OwnProfileSeedNative {
  const { displayName, handle } = parseUserProfileFields(data);
  const fromFirestorePhoto =
    typeof data.photoURL === "string" && data.photoURL.trim().length > 0
      ? data.photoURL.trim()
      : typeof data.avatarUrl === "string" && data.avatarUrl.trim().length > 0
        ? data.avatarUrl.trim()
        : "";
  const authPhoto = authPhotoURL?.trim() ?? "";
  return {
    displayName: displayName || handle,
    handle,
    bio: typeof data.bio === "string" ? data.bio : "",
    avatarUrl: fromFirestorePhoto || authPhoto,
    language: data.language === "en" ? "en" : "ja",
    countryCode: typeof data.countryCode === "string" ? data.countryCode : "",
    plan: data.plan === "pro" ? "pro" : "free",
    planProBgVariant: parseUserPlanProBgVariant(data.planProBgVariant),
    memberSinceMs: parseMemberSinceMs(data),
    unitBalance: parseUserUnitBalance(data),
    data,
  };
}

/** メモリキャッシュが温いときだけ返す（未キャッシュは null） */
export function peekOwnProfileSeedNative(
  uid: string | undefined | null
): OwnProfileSeedNative | null {
  const safeUid = uid?.trim();
  if (!safeUid) return null;
  const peek = peekProfileUserDocNative(safeUid);
  if (!peek) return null;
  return seedOwnProfileFromUserDocNative(
    peek,
    auth.currentUser?.photoURL ?? null
  );
}
