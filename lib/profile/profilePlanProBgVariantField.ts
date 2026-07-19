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
