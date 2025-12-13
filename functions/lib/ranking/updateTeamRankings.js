"use strict";
// functions/src/ranking/updateTeamRankings.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTeamRankings = updateTeamRankings;
const firestore_1 = require("firebase-admin/firestore");
const db = (0, firestore_1.getFirestore)();
/**
 * チーム勝敗からリーグ別に順位を計算し、teams に winRate / rank を書き込む
 *
 * ルール:
 * 1. winRate 降順（wins / (wins + losses)）
 * 2. wins 降順
 * 3. teamId アルファベット順
 */
async function updateTeamRankings() {
    const teamsSnap = await db.collection("teams").get();
    const leagues = {};
    teamsSnap.docs.forEach((doc) => {
        const data = doc.data();
        if (!data.league)
            return;
        const wins = Number(data.wins || 0);
        const losses = Number(data.losses || 0);
        const games = wins + losses;
        const winRate = games > 0 ? wins / games : 0;
        if (!leagues[data.league])
            leagues[data.league] = [];
        leagues[data.league].push({
            id: doc.id,
            wins,
            losses,
            winRate,
        });
    });
    const batch = db.batch();
    Object.keys(leagues).forEach((league) => {
        const teams = leagues[league];
        teams.sort((a, b) => {
            if (b.winRate !== a.winRate)
                return b.winRate - a.winRate;
            if (b.wins !== a.wins)
                return b.wins - a.wins;
            return a.id.localeCompare(b.id);
        });
        teams.forEach((team, index) => {
            const ref = db.collection("teams").doc(team.id);
            batch.update(ref, {
                rank: index + 1,
                winRate: team.winRate,
            });
        });
    });
    await batch.commit();
    return { ok: true };
}
//# sourceMappingURL=updateTeamRankings.js.map