import type { ProfilePlanProAdoptedEntry } from "@/lib/profile/profilePlanProAdoptedBgVariants";
import { PROFILE_PLAN_PRO_BEAST_BG_VARIANTS } from "@/lib/profile/profilePlanProBeastBgVariants";
import { PROFILE_PLAN_PRO_FORM_BG_VARIANTS } from "@/lib/profile/profilePlanProFormBgVariants";
import { PROFILE_PLAN_PRO_FUTURISTIC_BG_VARIANTS } from "@/lib/profile/profilePlanProFuturisticBgVariants";
import { PROFILE_PLAN_PRO_NEO_BG_VARIANTS } from "@/lib/profile/profilePlanProNeoBgVariants";
import { PROFILE_PLAN_PRO_SCALE_BG_VARIANTS } from "@/lib/profile/profilePlanProScaleBgVariants";

const DEFAULT_SWATCH = "linear-gradient(180deg, #050810, #0a1628)";

const ATMOS_SWATCH: Record<string, string> = {
  atmos:
    "linear-gradient(145deg, #040810, #0a2030 40%, #22d3ee55 58%, #010508)",
  parallax:
    "linear-gradient(150deg, #060a14, #102040 45%, #38bdf855 62%, #030508)",
};

export function profilePlanProAdoptedSkinSwatch(
  entry: ProfilePlanProAdoptedEntry
): string {
  const { id, family } = entry;
  if (family === "scale") {
    return (
      PROFILE_PLAN_PRO_SCALE_BG_VARIANTS.find((v) => v.id === id)?.swatch ??
      DEFAULT_SWATCH
    );
  }
  if (family === "beast") {
    return (
      PROFILE_PLAN_PRO_BEAST_BG_VARIANTS.find((v) => v.id === id)?.swatch ??
      DEFAULT_SWATCH
    );
  }
  if (family === "form") {
    return (
      PROFILE_PLAN_PRO_FORM_BG_VARIANTS.find((v) => v.id === id)?.swatch ??
      DEFAULT_SWATCH
    );
  }
  if (family === "neo") {
    return (
      PROFILE_PLAN_PRO_NEO_BG_VARIANTS.find((v) => v.id === id)?.swatch ??
      DEFAULT_SWATCH
    );
  }
  if (family === "futuristic") {
    return (
      PROFILE_PLAN_PRO_FUTURISTIC_BG_VARIANTS.find((v) => v.id === id)?.swatch ??
      DEFAULT_SWATCH
    );
  }
  return ATMOS_SWATCH[id] ?? DEFAULT_SWATCH;
}
