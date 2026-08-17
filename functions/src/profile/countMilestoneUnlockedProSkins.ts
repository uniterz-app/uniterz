import { PRO_IMMEDIATE_SKIN_IDS } from "./proSkinMilestoneCatalog";

const PRO_IMMEDIATE = new Set<string>(PRO_IMMEDIATE_SKIN_IDS);

export function countMilestoneUnlockedProSkins(
  unlockedIds: readonly string[]
): number {
  const set = new Set<string>();
  for (const id of unlockedIds) {
    if (typeof id !== "string") continue;
    const trimmed = id.trim();
    if (!trimmed || PRO_IMMEDIATE.has(trimmed)) continue;
    set.add(trimmed);
  }
  return set.size;
}
