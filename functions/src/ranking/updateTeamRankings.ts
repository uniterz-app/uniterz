// functions/src/ranking/updateTeamRankings.ts

import { getFirestore } from "firebase-admin/firestore";

const db = getFirestore();

/**
 * チーム勝敗からリーグ別に順位を計算し、teams コレクションに rank を書き込む。
 *
 * ルール:
 * 1. winRate 降順
 * 2. wins 降順
 * 3. teamId アルファベット順
 */
export async function updateTeamRankings() {
  const teamsSnap = await db.collection("teams").get();

  const leagues: Record<string, any[]> = {};

  // リーグ別に分類
  teamsSnap.docs.forEach((doc) => {
    const data = doc.data();
    const league = data.league || "unknown";

    if (!leagues[league]) leagues[league] = [];

    leagues[league].push({
      id: doc.id,
      wins: Number(data.wins || 0),
      losses: Number(data.losses || 0),
      winRate:
        data.wins + data.losses > 0
          ? data.wins / (data.wins + data.losses)
          : 0,
    });
  });

  const batch = db.batch();

  // リーグごとにランキング
  Object.keys(leagues).forEach((league) => {
    const teams = leagues[league];

    teams.sort((a, b) => {
      if (b.winRate !== a.winRate) return b.winRate - a.winRate;
      if (b.wins !== a.wins) return b.wins - a.wins;
      return a.id.localeCompare(b.id);
    });

    teams.forEach((team, index) => {
      const ref = db.collection("teams").doc(team.id);
      batch.update(ref, { rank: index + 1 });
    });
  });

  await batch.commit();

  return { ok: true };
}
