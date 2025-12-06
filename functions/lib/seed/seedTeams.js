"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedTeams = seedTeams;
// functions/src/seed/seedTeams.ts
const admin = __importStar(require("firebase-admin"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
async function seedTeams() {
    const db = admin.firestore();
    // teams.json の読み込み
    const filePath = path.join(__dirname, "teams.json");
    const raw = fs.readFileSync(filePath, "utf-8");
    const teams = JSON.parse(raw);
    console.log(`Seeding ${teams.length} teams...`);
    const batch = db.batch();
    for (const t of teams) {
        const ref = db.collection("teams").doc(t.id);
        batch.set(ref, {
            name: t.name,
            league: t.league,
            wins: 0,
            losses: 0,
            winRate: 0,
            rank: null, // nightly rank job が後で計算
        }, { merge: true });
    }
    await batch.commit();
    console.log("Done seeding teams.");
}
//# sourceMappingURL=seedTeams.js.map