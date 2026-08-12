/** lib/profile/proSkinUnlock.ts PRO_IMMEDIATE_IDS と同期 */
const PRO_IMMEDIATE_SKIN_IDS = new Set<string>([
  "atmos",
  "parallax",
  "wave-riot-shard",
  "wave-uniterz-logo",
  "wave-mono-hex",
  "beast-titanium",
  "beast-panther",
  "beast-crocodile",
  "scale-mamba",
  "scale-python",
  "form-hexveil",
  "scale-diamondback",
  "beast-shark",
  "form-diamondgrid",
]);

export function countMilestoneUnlockedProSkins(
  unlockedIds: readonly string[]
): number {
  const set = new Set<string>();
  for (const id of unlockedIds) {
    if (typeof id !== "string") continue;
    const trimmed = id.trim();
    if (!trimmed || PRO_IMMEDIATE_SKIN_IDS.has(trimmed)) continue;
    set.add(trimmed);
  }
  return set.size;
}
