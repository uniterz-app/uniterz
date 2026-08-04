import type { ProfilePlanProBgVariant } from "@/lib/profile/profilePlanProBgVariants";

export const PRO_SKIN_OWNER_COUNTS_DOC_PATH = "meta/proSkinOwnerCounts";

export function parseProSkinOwnerCounts(
  raw: unknown
): Record<string, number> {
  if (!raw || typeof raw !== "object") return {};
  const counts = (raw as { counts?: unknown }).counts;
  const src =
    counts && typeof counts === "object"
      ? (counts as Record<string, unknown>)
      : (raw as Record<string, unknown>);
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(src)) {
    if (k === "updatedAt" || k === "counts") continue;
    const n = typeof v === "number" ? v : Number(v);
    if (Number.isFinite(n)) out[k] = Math.max(0, Math.floor(n));
  }
  return out;
}

export type { ProfilePlanProBgVariant };
