/**
 * 「ランキング上位 10% の予想の多数派」は「全員の多数派」より当たるか。読むだけ（書き込み・BDL・OpenAI なし）。
 * 試合日ごとに、その日より前の確定ポイントだけで PICK UP ランキングを作り直す（先読みなし）。
 * 選んだ側は gameUserPoints の的中フラグ w と最終スコアから戻す（無い試合は posts）。
 *
 *   npx tsx --tsconfig tsconfig.json scripts/backtest-top-ranker-market.ts [2026-27 ...]
 *   BY_RATE=1 MIN_PICKS=30 … 上位をポイントではなく的中率（予想数 MIN_PICKS 以上）で決める
 */
import "./_loadAdminEnv";
import { getAdminDb } from "../lib/firebaseAdmin";
import { isNbaPickupGame } from "../lib/nba/isPickupGame";

const PICKUP = 2;
const TOP_SHARE = 0.1;

type G = {
  id: string;
  ms: number;
  date: string;
  phase: string;
  homeWon: boolean;
  pickup: boolean;
};

function etDate(ms: number): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(new Date(ms));
}

async function runSeason(season: string) {
  const db = getAdminDb();
  const snap = await db
    .collection("games")
    .where("league", "==", "nba")
    .where("season", "==", season)
    .select("status", "seasonPhase", "homeScore", "awayScore", "startAtJst", "isPickup", "pickupWeekKey", "postponed")
    .get();
  const games: G[] = [];
  for (const d of snap.docs) {
    const g = d.data() as Record<string, any>;
    if (g.status !== "final" || g.postponed === true) continue;
    const hs = Number(g.homeScore);
    const as = Number(g.awayScore);
    if (!(hs > 0 && as > 0) || hs === as) continue;
    const ms = g.startAtJst?.toMillis?.();
    if (!ms) continue;
    games.push({ id: d.id, ms, date: etDate(ms), phase: String(g.seasonPhase ?? ""), homeWon: hs > as, pickup: isNbaPickupGame(g) });
  }
  games.sort((a, b) => a.ms - b.ms);

  const entriesBy = new Map<string, Array<{ u: string; p: number; k: number; w: number }>>();
  for (let i = 0; i < games.length; i += 300) {
    const refs = games.slice(i, i + 300).map((g) => db.doc(`gameUserPoints/${g.id}`));
    const docs = await db.getAll(...refs);
    docs.forEach((d) => {
      const e = d.exists ? (d.get("entries") as any[]) : null;
      if (Array.isArray(e)) entriesBy.set(d.id, e);
    });
  }

  const missing = games.filter((g) => !entriesBy.has(g.id) && g.ms >= Date.UTC(2026, 3, 13));
  for (const g of missing) {
    const ps = await db
      .collection("posts")
      .where("gameId", "==", g.id)
      .select("authorUid", "status", "stats.isWin", "stats.pointsV3", "stats.countedForRanking", "stats.countedForPickup")
      .get();
    const e: Array<{ u: string; p: number; k: number; w: number }> = [];
    for (const d of ps.docs) {
      if (d.get("status") !== "final") continue;
      const p = Number(d.get("stats.pointsV3"));
      if (!Number.isFinite(p)) continue;
      const rank = d.get("stats.countedForRanking") === true;
      const pick = typeof d.get("stats.countedForPickup") === "boolean" ? d.get("stats.countedForPickup") : rank;
      e.push({ u: String(d.get("authorUid") ?? ""), p, k: pick ? PICKUP : 0, w: d.get("stats.isWin") === true ? 1 : 0 });
    }
    if (e.length) entriesBy.set(g.id, e);
  }

  const points = new Map<string, number>();
  const rec = new Map<string, { n: number; w: number }>();
  const byRate = process.env.BY_RATE === "1";
  const minPicks = Number(process.env.MIN_PICKS ?? 30);
  const res = {
    games: 0,
    allHit: 0,
    topHit: 0,
    disagree: 0,
    disagreeTopHit: 0,
    allBrier: 0,
    topBrier: 0,
    topN: [] as number[],
    allN: [] as number[],
    byConf: new Map<string, { n: number; hit: number }>(),
  };
  const dates = [...new Set(games.map((g) => g.date))];
  for (const date of dates) {
    const ranked = byRate
      ? [...rec.entries()].filter(([, r]) => r.n >= minPicks).map(([u, r]) => [u, r.w / r.n] as [string, number]).sort((a, b) => b[1] - a[1])
      : [...points.entries()].sort((a, b) => b[1] - a[1]);
    const cut = Math.ceil(ranked.length * TOP_SHARE);
    const top = new Set(ranked.slice(0, cut).map(([u]) => u));
    const dayGames = games.filter((g) => g.date === date);
    for (const g of dayGames) {
      const e = entriesBy.get(g.id);
      if (!e || !e.length || top.size < (byRate ? 20 : 50)) continue;
      if (g.phase !== "regular" && g.phase !== "playoffs" && g.phase !== "play_in") continue;
      let allHome = 0, allN = 0, topHome = 0, topN = 0;
      for (const x of e) {
        const pickedHome = x.w === 1 ? g.homeWon : !g.homeWon;
        allN++;
        if (pickedHome) allHome++;
        if (top.has(x.u)) {
          topN++;
          if (pickedHome) topHome++;
        }
      }
      if (topN < 10) continue;
      const allP = allHome / allN;
      const topP = topHome / topN;
      const y = g.homeWon ? 1 : 0;
      const allPickHome = allP >= 0.5;
      const topPickHome = topP >= 0.5;
      res.games++;
      res.topN.push(topN);
      res.allN.push(allN);
      if (allPickHome === g.homeWon) res.allHit++;
      if (topPickHome === g.homeWon) res.topHit++;
      if (allPickHome !== topPickHome) {
        res.disagree++;
        if (topPickHome === g.homeWon) res.disagreeTopHit++;
      }
      res.allBrier += (allP - y) ** 2;
      res.topBrier += (topP - y) ** 2;
      const conf = Math.max(topP, 1 - topP);
      const bucket = conf >= 0.9 ? "90%+" : conf >= 0.75 ? "75-90%" : conf >= 0.6 ? "60-75%" : "50-60%";
      const b = res.byConf.get(bucket) ?? { n: 0, hit: 0 };
      b.n++;
      if (topPickHome === g.homeWon) b.hit++;
      res.byConf.set(bucket, b);
    }
    for (const g of dayGames) {
      for (const x of entriesBy.get(g.id) ?? []) {
        const r = rec.get(x.u) ?? { n: 0, w: 0 };
        r.n++;
        r.w += x.w === 1 ? 1 : 0;
        rec.set(x.u, r);
        if ((x.k & PICKUP) === 0) continue;
        points.set(x.u, (points.get(x.u) ?? 0) + (Number(x.p) || 0));
      }
    }
  }
  const med = (a: number[]) => (a.length ? [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)] : 0);
  const pct = (a: number, b: number) => (b ? ((a / b) * 100).toFixed(1) + "%" : "-");
  console.log(`\n=== ${season}  finals=${games.length} withPoints=${entriesBy.size} rankedUsersNow=${points.size}`);
  console.log(`compared games=${res.games}  top10 predictors/game median=${med(res.topN)}  all median=${med(res.allN)}`);
  console.log(`majority hit: all ${pct(res.allHit, res.games)}  top10 ${pct(res.topHit, res.games)}`);
  console.log(`brier (share as prob, lower better): all ${(res.allBrier / res.games).toFixed(4)}  top10 ${(res.topBrier / res.games).toFixed(4)}`);
  console.log(`games where majorities disagree: ${res.disagree}  top10 right in ${pct(res.disagreeTopHit, res.disagree)}`);
  for (const [k, v] of [...res.byConf.entries()].sort()) console.log(`  top10 confidence ${k}: n=${v.n} hit ${pct(v.hit, v.n)}`);
}

async function main() {
  for (const s of process.argv.slice(2).length ? process.argv.slice(2) : ["2025-26", "2026-27"]) await runSeason(s);
}
main().then(() => process.exit(0));
