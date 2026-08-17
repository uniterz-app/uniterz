"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.countMilestoneUnlockedProSkins = countMilestoneUnlockedProSkins;
const proSkinMilestoneCatalog_1 = require("./proSkinMilestoneCatalog");
const PRO_IMMEDIATE = new Set(proSkinMilestoneCatalog_1.PRO_IMMEDIATE_SKIN_IDS);
function countMilestoneUnlockedProSkins(unlockedIds) {
    const set = new Set();
    for (const id of unlockedIds) {
        if (typeof id !== "string")
            continue;
        const trimmed = id.trim();
        if (!trimmed || PRO_IMMEDIATE.has(trimmed))
            continue;
        set.add(trimmed);
    }
    return set.size;
}
//# sourceMappingURL=countMilestoneUnlockedProSkins.js.map