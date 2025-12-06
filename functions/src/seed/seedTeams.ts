// functions/src/seed/seedTeams.ts
import * as admin from "firebase-admin";
import * as fs from "fs";
import * as path from "path";

export async function seedTeams() {
  const db = admin.firestore();

  // teams.json の読み込み
  const filePath = path.join(__dirname, "teams.json");
  const raw = fs.readFileSync(filePath, "utf-8");
  const teams = JSON.parse(raw) as Array<{
    id: string;
    name: string;
    league: string;
  }>;

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
