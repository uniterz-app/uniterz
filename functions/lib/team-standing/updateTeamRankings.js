"use strict";
// functions/src/ranking/updateTeamRankings.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTeamRankings = updateTeamRankings;
const firestore_1 = require("firebase-admin/firestore");
const db = (0, firestore_1.getFirestore)();
/**
 * チーム勝敗からリーグ別に順位を計算し、teams に rank / winRate / points を書き込む
 *
 * =============================
 * 【NBA / BJ（バスケ）】
 * 1. winRate 降順（wins / (wins + losses)）
 * 2. wins 降順
 * 3. teamId アルファベット順
 *
 * 【J1 / PL（サッカー）】
 * 1. 勝点 降順（wins * 3 + draws）
 * 2. wins 降順
 * 3. teamId アルファベット順
 *
 * ※ winRate は全リーグで保持（参考用）
 * ※ points はサッカーのみ意味を持つが、保存してOK
 * =============================
 */
async function updateTeamRankings() {
    const teamsSnap = await db.collection("teams").get();
    const leagues = {};
    // -----------------------------
    // データ整形
    // -----------------------------
    teamsSnap.docs.forEach((doc) => {
        const data = doc.data();
        if (!data.league)
            return;
        const league = String(data.league);
        const wins = Number(data.wins || 0);
        const losses = Number(data.losses || 0);
        const draws = Number(data.d || data.draws || 0);
        const isSoccer = league === "j1" || league === "pl";
        const games = isSoccer
            ? wins + losses + draws
            : wins + losses;
        const winRate = games > 0 ? wins / games : 0;
        const points = isSoccer
            ? wins * 3 + draws
            : 0;
        const rankMetric = isSoccer
            ? points // サッカー：勝ち点
            : winRate; // バスケ：勝率
        if (!leagues[league])
            leagues[league] = [];
        leagues[league].push({
            id: doc.id,
            wins,
            losses,
            draws,
            games,
            winRate,
            points,
            rankMetric,
        });
    });
    // -----------------------------
    // ランキング計算 & 保存
    // -----------------------------
    const batch = db.batch();
    Object.keys(leagues).forEach((league) => {
        const teams = leagues[league];
        teams.sort((a, b) => {
            // 1. 勝率 or 勝点
            if (b.rankMetric !== a.rankMetric) {
                return b.rankMetric - a.rankMetric;
            }
            // 2. 勝利数
            if (b.wins !== a.wins) {
                return b.wins - a.wins;
            }
            // 3. teamId
            return a.id.localeCompare(b.id);
        });
        teams.forEach((team, index) => {
            const ref = db.collection("teams").doc(team.id);
            batch.update(ref, {
                rank: index + 1,
                winRate: team.winRate,
                points: team.points, // サッカーのみ実質使用
                updatedAt: firestore_1.FieldValue.serverTimestamp(),
            });
        });
    });
    await batch.commit();
    return { ok: true };
}
//# sourceMappingURL=updateTeamRankings.js.map