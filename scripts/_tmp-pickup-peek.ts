import "./_loadAdminEnv";
import { getAdminDb } from "../lib/firebaseAdmin";

async function main() {
  const db = getAdminDb();
  const snap = await db
    .collection("games")
    .where("league", "==", "nba")
    .orderBy("startAt")
    .startAt(new Date("2026-10-26T12:00:00+09:00"))
    .endAt(new Date("2026-11-01T12:00:00+09:00"))
    .get();
  for (const d of snap.docs) {
    const g = d.data();
    if (![g.home?.name, g.away?.name].includes("Memphis Grizzlies")) continue;
    const s = (g.startAtJst ?? g.startAt).toDate() as Date;
    console.log(d.id, s.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" }), g.away?.name, "@", g.home?.name, "pickup=", g.pickupWeekKey ?? null);
  }
}
main();
