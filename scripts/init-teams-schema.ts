// scripts/init-teams-schema.ts
import adminPkg from "firebase-admin";
const admin = adminPkg;
import fs from "fs";

const serviceAccount = JSON.parse(
  fs.readFileSync("service-account.json", "utf8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

/**
 * 数値 0 で初期化するキー
 */
const TEAM_NUMBER_KEYS = [
  "homePointsForTotal",
  "homePointsAgainstTotal",
  "awayPointsForTotal",
  "awayPointsAgainstTotal",

  "homeGames",
  "homeWins",
  "awayGames",
  "awayWins",

  "pointsForTotal",
  "pointsAgainstTotal",

  "vsHigherGames",
  "vsHigherWins",
  "vsLowerGames",
  "vsLowerWins",

  "vsEastGames",
  "vsEastWins",
  "vsWestGames",
  "vsWestWins",

  "closeGames",
  "closeWins",

  "b2bGames",
  "b2bWins",

  "currentStreak",
] as const;

type TeamNumberKey = typeof TEAM_NUMBER_KEYS[number];

async function run() {
  console.log("=== INIT TEAMS SCHEMA START ===");

  const snap = await db.collection("teams").get();

  for (const doc of snap.docs) {
    const data = doc.data();
    const patch: Partial<Record<TeamNumberKey, number> & { lastGames: any[] }> =
      {};

    for (const key of TEAM_NUMBER_KEYS) {
      if (data[key] === undefined) {
        patch[key] = 0;
      }
    }

    if (data.lastGames === undefined) {
      patch.lastGames = [];
    }

    if (Object.keys(patch).length > 0) {
      await doc.ref.set(patch, { merge: true });
      console.log(doc.id, "patched:", Object.keys(patch));
    }
  }

  console.log("=== INIT FINISHED ===");
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
