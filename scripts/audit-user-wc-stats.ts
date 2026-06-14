import adminPkg from "firebase-admin";
import fs from "fs";

const admin = adminPkg as typeof import("firebase-admin");
admin.initializeApp({
  credential: admin.credential.cert(JSON.parse(fs.readFileSync("service-account.json", "utf8"))),
});
const db = admin.firestore();
const UID = process.argv[2] ?? "Rb3vF67NTLeCxSvrR15brCbiQSD2";

(async () => {
  const cum = (await db.doc(`cumulative_stats/${UID}`).get()).data();
  console.log("=== cumulative_stats ===");
  console.log("rankingByWcStage", JSON.stringify(cum?.rankingByWcStage, null, 2));
  console.log("totalPoints (root)", cum?.totalPoints);
  console.log("ranking.totalPoints", cum?.ranking?.totalPoints);
  console.log("lastAggregatedDate", cum?.lastAggregatedDate);

  const daily = await db.doc(`user_stats_v2_daily/${UID}_2026-06-12`).get();
  const d = daily.data();
  console.log("\n=== daily 2026-06-12 ===");
  console.log("all", d?.all);
  console.log("leagues.wc", d?.leagues?.wc);
  console.log("rankingByWcStage", JSON.stringify(d?.rankingByWcStage, null, 2));
  const flatWc = Object.fromEntries(
    Object.entries(d ?? {}).filter(([k]) => k.startsWith("rankingByWcStage."))
  );
  if (Object.keys(flatWc).length) console.log("FLAT dot keys:", flatWc);

  const markers = await daily.ref.collection("applied_posts").get();
  console.log("applied_posts count", markers.size, markers.docs.map((x) => x.id));

  const posts = await db
    .collection("posts")
    .where("authorUid", "==", UID)
    .where("league", "==", "wc")
    .where("status", "==", "final")
    .get();
  console.log("\n=== wc posts (source of truth) ===");
  let sum = 0;
  for (const p of posts.docs) {
    const x = p.data();
    const pts = x.stats?.pointsV3 ?? 0;
    sum += pts;
    console.log(p.id, x.gameId, {
      pointsV3: pts,
      streakBonus: x.stats?.streakBonus,
      activeWinStreak: x.stats?.pointsV3Detail?.activeWinStreak,
    });
  }
  console.log("sum pointsV3 from posts:", sum);
})();
