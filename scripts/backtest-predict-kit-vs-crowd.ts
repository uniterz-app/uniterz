/**
 * 予想の材料（欠場なし・その日までのデータだけで再計算）と UNITERZ のみんなの予想（marketPickCounts）の当たり方を比べる。
 * 6 割以上が選んだ側が、予想の材料の確率ごとにどれだけ負けたかも出す。BDL・OpenAI なし。
 * 全試合の勝敗・70% 以上の当たりは、本番の成績が 20 試合たまるまで画面に出す検証の成績になる。
 *
 *   npx tsx --tsconfig tsconfig.json scripts/backtest-predict-kit-vs-crowd.ts           # 表示だけ
 *   npx tsx --tsconfig tsconfig.json scripts/backtest-predict-kit-vs-crowd.ts --write   # nbaPredictShadowMeta/{season}.kitBacktest に保存
 */
import "./_loadAdminEnv";
import { getAdminDb } from "../lib/firebaseAdmin";
import { previousNbaSeasonKey } from "../lib/rankings/nbaSeason";
import {
  buildPredictKit,
  emptyPredictKitSeason,
  recordPredictKitGame,
  withCleanSosStrength,
  type PredictKitStrengthGame,
} from "../lib/nba/insights/predictKit/predictKit";
import { loadPredictKitCleanMargins, loadPredictKitPriorFinal } from "../lib/nba/insights/predictKit/predictKitSeason";

const SEASON = "2026-27";

function etDate(ms: number) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(new Date(ms));
}

async function main() {
  const db = getAdminDb();
  const prior = await loadPredictKitPriorFinal(db, previousNbaSeasonKey(SEASON));
  const clean = await loadPredictKitCleanMargins(db, SEASON);
  const snap = await db
    .collection("games")
    .where("league", "==", "nba")
    .where("season", "==", SEASON)
    .select("homeTeamId", "awayTeamId", "homeScore", "awayScore", "status", "seasonPhase", "startAtJst", "marketPickCounts")
    .get();
  const games = snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as Record<string, any>) }))
    .filter((g) => g.status === "final" && g.seasonPhase === "regular" && g.homeScore > 0 && g.awayScore > 0)
    .map((g) => ({ ...g, ms: g.startAtJst.toMillis() as number, date: etDate(g.startAtJst.toMillis()) }))
    .sort((a, b) => a.ms - b.ms);

  const s = emptyPredictKitSeason(SEASON, prior);
  const strength: PredictKitStrengthGame[] = [];
  const rows: { pKit: number; crowd: number; n: number; homeWon: boolean }[] = [];
  const all: { pFav: number; favWon: boolean }[] = [];
  const dates = [...new Set(games.map((g) => g.date))];
  for (const date of dates) {
    const day = games.filter((g) => g.date === date);
    const state = strength.length ? withCleanSosStrength(s, strength) : s;
    for (const g of day) {
      const kit = buildPredictKit({ season: state, homeTeamId: g.homeTeamId, awayTeamId: g.awayTeamId, gameDate: date, injuries: [] });
      const pHome = kit.favoredTeamId === g.homeTeamId ? kit.favoredWinP : 1 - kit.favoredWinP;
      all.push({ pFav: kit.favoredWinP, favWon: (kit.favoredTeamId === g.homeTeamId) === g.homeScore > g.awayScore });
      const c = g.marketPickCounts ?? {};
      const n = (c.home ?? 0) + (c.away ?? 0);
      if (n < 50) continue;
      rows.push({ pKit: pHome, crowd: c.home / n, n, homeWon: g.homeScore > g.awayScore });
    }
    for (const g of day) {
      recordPredictKitGame(s, { date, homeTeamId: g.homeTeamId, awayTeamId: g.awayTeamId, homeScore: g.homeScore, awayScore: g.awayScore });
      const cm = clean.get(`${date}|${g.homeTeamId}|${g.awayTeamId}`);
      strength.push({ homeTeamId: g.homeTeamId, awayTeamId: g.awayTeamId, cleanMargin: cm ?? g.homeScore - g.awayScore });
    }
  }

  const pctAll = (a: number, b: number) => (b ? ((a / b) * 100).toFixed(1) + "%" : "-");
  const allStrong = all.filter((r) => r.pFav >= 0.7);
  const backtest = {
    games: all.length,
    hits: all.filter((r) => r.favWon).length,
    strongGames: allStrong.length,
    strongHits: allStrong.filter((r) => r.favWon).length,
    throughMs: games.at(-1)?.ms ?? 0,
  };
  console.log(
    `all games: ${backtest.hits}/${backtest.games} ${pctAll(backtest.hits, backtest.games)}  70%+ ${backtest.strongHits}/${backtest.strongGames} ${pctAll(backtest.strongHits, backtest.strongGames)}`
  );
  if (process.argv.includes("--write")) {
    await db.collection("nbaPredictShadowMeta").doc(SEASON).set({ kitBacktest: backtest }, { merge: true });
    console.log("wrote kitBacktest");
  }

  const N = rows.length;
  const pct = (a: number, b: number) => (b ? ((a / b) * 100).toFixed(1) + "%" : "-");
  const hitKit = rows.filter((r) => r.pKit >= 0.5 === r.homeWon).length;
  const hitCrowd = rows.filter((r) => r.crowd >= 0.5 === r.homeWon).length;
  const brier = (f: (r: (typeof rows)[0]) => number) => (rows.reduce((s, r) => s + (f(r) - (r.homeWon ? 1 : 0)) ** 2, 0) / N).toFixed(4);
  console.log(`games with 50+ picks=${N}`);
  console.log(`favorite hit: kit ${pct(hitKit, N)}  crowd majority ${pct(hitCrowd, N)}`);
  console.log(`brier: kit ${brier((r) => r.pKit)}  crowd share ${brier((r) => r.crowd)}  average of both ${brier((r) => (r.pKit + r.crowd) / 2)}`);
  const kit70 = rows.filter((r) => Math.max(r.pKit, 1 - r.pKit) >= 0.7);
  console.log(`kit 70%+: ${kit70.filter((r) => r.pKit >= 0.5 === r.homeWon).length}/${kit70.length} ${pct(kit70.filter((r) => r.pKit >= 0.5 === r.homeWon).length, kit70.length)}`);
  const dis = rows.filter((r) => r.pKit >= 0.5 !== r.crowd >= 0.5);
  console.log(`disagree: ${dis.length}  kit right ${pct(dis.filter((r) => r.pKit >= 0.5 === r.homeWon).length, dis.length)}`);

  // 6 割以上が選んだ側（多数派）について、kit の確率ごとに多数派が負けた率
  console.log("crowd majority >= 60%: how often the majority side lost, by kit's probability for that side");
  const strong = rows.filter((r) => Math.max(r.crowd, 1 - r.crowd) >= 0.6);
  const buckets: [string, number, number][] = [["<45%", 0, 0.45], ["45-55%", 0.45, 0.55], ["55-65%", 0.55, 0.65], ["65-75%", 0.65, 0.75], ["75%+", 0.75, 1.01]];
  for (const [label, lo, hi] of buckets) {
    const b = strong.filter((r) => {
      const majHome = r.crowd >= 0.5;
      const pMaj = majHome ? r.pKit : 1 - r.pKit;
      return pMaj >= lo && pMaj < hi;
    });
    const lost = b.filter((r) => (r.crowd >= 0.5) !== r.homeWon).length;
    console.log(`  kit gives majority ${label}: n=${b.length}  majority lost ${pct(lost, b.length)}`);
  }
}
main().then(() => process.exit(0));
