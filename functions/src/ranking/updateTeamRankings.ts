// functions/src/ranking/updateTeamRankings.ts

import { getFirestore } from "firebase-admin/firestore";

const db = getFirestore();

/**
 * チーム勝敗からリーグ別に順位を計算し、teams コレクションに rank を書き込む。
 *
 * ルール:
 * 1. winRate 降順（Firestore に保存されている値を使用）
 * 2. wins 降順
 * 3. teamId アルファベット順
 *
 * league が無いチームは除外。
 */
export async function updateTeamRankings() {
  const teamsSnap = await db.collection("teams").get();

  const leagues: Record<string, any[]> = {};

  teamsSnap.docs.forEach((doc) => {
    const data = doc.data();

    // ====== league 未設定のチームは無視（ランキングに含めない） ======
    if (!data.league) return;

    const league = data.league;

    if (!leagues[league]) leagues[league] = [];

    leagues[league].push({
      id: doc.id,
      wins: Number(data.wins || 0),
      losses: Number(data.losses || 0),
      winRate: Number(data.winRate || 0),  // ← winRate は再計算しない
    });
  });

  const batch = db.batch();

  // ====== リーグごとにランキング計算 ======
  Object.keys(leagues).forEach((league) => {
    const teams = leagues[league];

    teams.sort((a, b) => {
      // 1. winRate
      if (b.winRate !== a.winRate) return b.winRate - a.winRate;

      // 2. wins
      if (b.wins !== a.wins) return b.wins - a.wins;

      // 3. teamId アルファベット順
      return a.id.localeCompare(b.id);
    });

    // 順位を書き込む
    teams.forEach((team, index) => {
      const ref = db.collection("teams").doc(team.id);
      batch.update(ref, { rank: index + 1 });
    });
  });

  await batch.commit();

  return { ok: true };
}
