import { parseUserPlanProBgVariant } from "@/lib/profile/profilePlanProBgVariantField";
import type { ProfilePlanProBgVariant } from "@/lib/profile/profilePlanProBgVariants";

/**
 * ランキング行の Pro Skin。
 * Pro なら装備値（未設定・不正はデフォルト）。Free / 不明は null。
 * Web / Native 共通。
 */
export function rankingRowProSkinVariant(
  plan: string | undefined,
  raw: string | undefined | null
): ProfilePlanProBgVariant | null {
  if (plan !== "pro") return null;
  return parseUserPlanProBgVariant(raw);
}
