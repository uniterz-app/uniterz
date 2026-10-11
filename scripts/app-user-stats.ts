/**
 * アプリリリース（2026-10-09 JST）以降に登録したユーザーだけの利用状況。
 * Web 時代の登録者は対象外。
 *
 *   npx tsx --tsconfig tsconfig.json scripts/app-user-stats.ts
 */
import "./_loadAdminEnv";
import { getAuth } from "firebase-admin/auth";
import { getAdminDb } from "../lib/firebaseAdmin";
import { CURRENT_NBA_SEASON_KEY } from "../lib/rankings/nbaSeason";

const APP_RELEASE_MS = Date.parse("2026-10-09T00:00:00+09:00");
const DAY_MS = 86_400_000;

async function main() {
  const db = getAdminDb();
  const auth = getAuth();
  const now = Date.now();

  const cohort = new Set<string>();
  const byDay = new Map<string, number>();
  let new24h = 0;
  let active24h = 0;
  let active3d = 0;
  let pageToken: string | undefined;
  do {
    const res = await auth.listUsers(1000, pageToken);
    for (const u of res.users) {
      const created = Date.parse(u.metadata.creationTime || "");
      if (!Number.isFinite(created) || created < APP_RELEASE_MS) continue;
      cohort.add(u.uid);
      const dayKey = new Date(created + 9 * 3600_000).toISOString().slice(0, 10);
      byDay.set(dayKey, (byDay.get(dayKey) ?? 0) + 1);
      if (now - created <= DAY_MS) new24h++;
      const last = Date.parse(
        u.metadata.lastRefreshTime || u.metadata.lastSignInTime || ""
      );
      if (Number.isFinite(last)) {
        if (now - last <= DAY_MS) active24h++;
        if (now - last <= 3 * DAY_MS) active3d++;
      }
    }
    pageToken = res.pageToken;
  } while (pageToken);

  const countSubmitted = async (collection: string) => {
    const snap = await db
      .collection(collection)
      .where("isSubmitted", "==", true)
      .select("uid")
      .get();
    return snap.docs.filter((d) => {
      const uid = String(d.get("uid") ?? "");
      return cohort.has(uid) && d.id.startsWith(`${CURRENT_NBA_SEASON_KEY}_`);
    }).length;
  };

  const [standings, awards, referrals, favorites] = await Promise.all([
    countSubmitted("seasonStandingsPredictions"),
    countSubmitted("seasonAwardsPredictions"),
    db
      .collection("referralRelations")
      .get()
      .then((s) => s.docs.filter((d) => cohort.has(d.id)).length),
    db
      .collection("users")
      .select("favoriteNbaTeamId", "favoriteNbaPlayers")
      .get()
      .then(
        (s) =>
          s.docs.filter((d) => {
            if (!cohort.has(d.id)) return false;
            const team = d.get("favoriteNbaTeamId");
            const players = d.get("favoriteNbaPlayers");
            return (
              (typeof team === "string" && team.length > 0) ||
              (Array.isArray(players) && players.length > 0)
            );
          }).length
      ),
  ]);

  const total = cohort.size;
  const pct = (n: number) => (total ? `${((n / total) * 100).toFixed(1)}%` : "-");
  console.log({
    since: "2026-10-09 JST",
    users: total,
    new24h,
    active24h: `${active24h} (${pct(active24h)})`,
    active3d: `${active3d} (${pct(active3d)})`,
    standingsSubmitted: `${standings} (${pct(standings)})`,
    awardsSubmitted: `${awards} (${pct(awards)})`,
    referredSignups: referrals,
    favorites: `${favorites} (${pct(favorites)})`,
  });
  console.log("signups by day (JST)");
  for (const k of [...byDay.keys()].sort()) console.log(`  ${k} ${byDay.get(k)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
