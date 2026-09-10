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

/**
 * 採用スキンとして確定できるときだけ返す。
 * 未確定時にデフォルト（titanium）を当てない（他人プロフィールのチラつき防止）。
 */
export function tryParseUserPlanProBgVariant(
  raw: unknown
): ProfilePlanProBgVariant | null {
  if (typeof raw === "string" && isAdoptedProBgVariant(raw)) {
    return raw;
  }
  return null;
}

/** Pro の装備スキン。プロフィール表示と一致させる（所持リスト欠落でチタンに落とさない） */
export function parseEquippedProSkinFromUserDoc(data: {
  plan?: unknown;
  planProBgVariant?: unknown;
  proSkinUnlockedIds?: unknown;
}): ProfilePlanProBgVariant | undefined {
  if (data.plan !== "pro") return undefined;
  /**
   * 以前は proSkinUnlockedIds に無い装備をデフォルト（titanium）へ落としていた。
   * マイルストーン解放のリスト遅延・欠落と装備値のズレで、プロフィールは
   * Jagged Plate なのにランキングだけチタン、という不整合が起きていた。
   * 装備フィールドが採用スキンならそれを返す（保存 API 側で所持検証済み）。
   */
  return parseUserPlanProBgVariant(data.planProBgVariant);
}
