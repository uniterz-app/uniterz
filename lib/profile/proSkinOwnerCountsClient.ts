import type { ProfilePlanProBgVariant } from "@/lib/profile/profilePlanProBgVariants";

export const PRO_SKIN_OWNER_COUNTS_DOC_PATH = "meta/proSkinOwnerCounts";

const LEGACY_DOTTED_PREFIX = "counts.";

function toCount(v: unknown): number | null {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : null;
}

/**
 * `counts` map を正とする。旧ライターが set(merge) で作った
 * `"counts.<id>"` という名前のトップレベルフィールドも足し合わせる。
 */
export function parseProSkinOwnerCounts(
  raw: unknown
): Record<string, number> {
  if (!raw || typeof raw !== "object") return {};
  const data = raw as Record<string, unknown>;
  const out: Record<string, number> = {};
  const add = (id: string, v: unknown) => {
    const n = toCount(v);
    if (!id || n == null) return;
    out[id] = (out[id] ?? 0) + n;
  };

  const counts = data.counts;
  if (counts && typeof counts === "object") {
    for (const [k, v] of Object.entries(counts as Record<string, unknown>)) {
      add(k, v);
    }
  }
  for (const [k, v] of Object.entries(data)) {
    if (k.startsWith(LEGACY_DOTTED_PREFIX)) {
      add(k.slice(LEGACY_DOTTED_PREFIX.length), v);
    }
  }
  return out;
}

export type { ProfilePlanProBgVariant };
