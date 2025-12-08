import * as admin from "firebase-admin";
import teams from "./teams.json"; // ← JSON を直接 import（確実にバンドルされる）

export async function seedTeams() {
  const db = admin.firestore();

  console.log(`Seeding ${teams.length} teams...`);

  const batch = db.batch();

  for (const t of teams) {
    const ref = db.collection("teams").doc(t.id);

    batch.set(
      ref,
      {
        name: t.name,
        league: t.league,
        wins: 0,
        losses: 0,
        winRate: 0,
        rank: null, // nightly rank job が後で計算
      },
      { merge: true },
    );
  }

  await batch.commit();

  console.log("Done seeding teams.");
}
