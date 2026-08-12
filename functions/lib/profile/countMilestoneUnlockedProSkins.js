"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.countMilestoneUnlockedProSkins = countMilestoneUnlockedProSkins;
/** lib/profile/proSkinUnlock.ts PRO_IMMEDIATE_IDS と同期 */
const PRO_IMMEDIATE_SKIN_IDS = new Set([
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
function countMilestoneUnlockedProSkins(unlockedIds) {
    const set = new Set();
    for (const id of unlockedIds) {
        if (typeof id !== "string")
            continue;
        const trimmed = id.trim();
        if (!trimmed || PRO_IMMEDIATE_SKIN_IDS.has(trimmed))
            continue;
        set.add(trimmed);
    }
    return set.size;
}
//# sourceMappingURL=countMilestoneUnlockedProSkins.js.map