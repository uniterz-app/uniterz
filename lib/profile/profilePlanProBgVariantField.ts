import { isAdoptedProBgVariant } from "@/lib/profile/profilePlanProAdoptedBgVariants";
import {
  PROFILE_PLAN_PRO_BG_DEFAULT,
  type ProfilePlanProBgVariant,
} from "@/lib/profile/profilePlanProBgVariants";

/** Firestore `users.planProBgVariant` → 採用スキン（不正値はデフォルト） */
export function parseUserPlanProBgVariant(
  raw: unknown
): ProfilePlanProBgVariant {
  if (typeof raw === "string" && isAdoptedProBgVariant(raw)) {
    return raw;
  }
  return PROFILE_PLAN_PRO_BG_DEFAULT;
}

/** Pro かつ所持リストにあるときだけ装備スキンを返す */
export function parseEquippedProSkinFromUserDoc(data: {
  plan?: unknown;
  planProBgVariant?: unknown;
  proSkinUnlockedIds?: unknown;
}): ProfilePlanProBgVariant | undefined {
  if (data.plan !== "pro") return undefined;
  const equipped = parseUserPlanProBgVariant(data.planProBgVariant);
  if (!Array.isArray(data.proSkinUnlockedIds)) return equipped;
  const unlocked = new Set(
    data.proSkinUnlockedIds.filter((x): x is string => typeof x === "string")
  );
  if (unlocked.size === 0) return equipped;
  return unlocked.has(equipped) ? equipped : PROFILE_PLAN_PRO_BG_DEFAULT;
}
