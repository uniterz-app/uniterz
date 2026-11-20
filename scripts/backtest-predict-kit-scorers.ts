/**
 * 得点王の候補（`predictKitScorers` と同じ考え方）を今季の終わった試合で採点する。読むだけ（書き込み・BDL・OpenAI なし）。
 * 各試合の前日までの試合ログ + 前季平均だけで予想し、実際に出場した選手を候補にする（欠場は分かっている前提）。
 * 比べる相手: 平均得点 1 位 / UNITERZ のみんなが一番選んだ選手（games.topScorerMarket）。
 *
 *   npx tsx --tsconfig tsconfig.json scripts/backtest-predict-kit-scorers.ts
 *   K / RECENT_W / BOOST / SD_A / SD_B / SD_EMP=0 で設定を変えて比べる（既定は本番と同じ）
 *   --write: 1 番手の当たりを nbaPredictShadowMeta/{season}.kitBacktest.scorerGames / scorerHits に保存（本番設定のときだけ使う）
 *   DEF_W / POS_W / OPP_K: 相手の失点（全体 / 同じポジション G・F・C）で平均を補正する強さと、その前の試合数での寄せ（本番は入れていない）
 */
import "./_loadAdminEnv";
import { getAdminDb } from "../lib/firebaseAdmin";
import { nbaPositionGroup, type NbaPositionGroup } from "../lib/nba/teamGameLog/teamPositionDefense";

const SEASON = "2026-27";
const PRIOR = "2025-26";
const RUNS = 4000;

type Row = { pid: string; team: string; pts: number; min: number };
type Hist = { ms: number; pts: number; min: number; team: string }[];

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

async function main() {
  const db = getAdminDb();
  const k = Number(process.env.K ?? 6);
  const recentW = Number(process.env.RECENT_W ?? 0.2);
  const boostW = Number(process.env.BOOST ?? 0);
  const sdA = Number(process.env.SD_A ?? 0.3);
  const sdB = Number(process.env.SD_B ?? 3);
  const defW = Number(process.env.DEF_W ?? 0);
  const posW = Number(process.env.POS_W ?? 0);
  const oppK = Number(process.env.OPP_K ?? 10);

  const rosterDoc = await db.collection("nbaTeamRosters").doc(SEASON).get();
  const posOf = new Map<string, NbaPositionGroup>();
  for (const t of Object.values((rosterDoc.get("teams") ?? {}) as Record<string, any>)) {
    for (const pl of (t?.players ?? []) as any[]) {
      const g = nbaPositionGroup(pl.position);
      if (g) posOf.set(String(pl.id), g);
    }
  }

  const gs = await db
    .collection("games")
    .where("league", "==", "nba")
    .where("season", "==", SEASON)
    .select("homeTeamId", "awayTeamId", "startAtJst", "status", "seasonPhase", "leadingScorers", "topScorerMarket")
    .get();
  const games = new Map<string, { id: string; ms: number; home: string; away: string; phase: string; leaders: Set<string>; crowd: string | null; crowdPct: number }>();
  for (const d of gs.docs) {
    const g = d.data() as Record<string, any>;
    if (g.status !== "final") continue;
    const bdl = d.id.replace(/^nba-bdl-/, "");
    const leaders = new Set<string>((g.leadingScorers ?? []).map((x: any) => String(x.playerId)));
    const slices = (g.topScorerMarket?.slices ?? []) as any[];
    const top = slices.slice().sort((a, b) => b.pct - a.pct)[0];
    games.set(bdl, {
      id: d.id,
      ms: g.startAtJst?.toMillis?.() ?? 0,
      home: g.homeTeamId,
      away: g.awayTeamId,
      phase: String(g.seasonPhase ?? ""),
      leaders,
      crowd: top ? String(top.playerId) : null,
      crowdPct: top ? top.pct : 0,
    });
  }

  const logs = await db.collection("nbaPlayerGameLogs").doc(SEASON).collection("players").get();
  const byGame = new Map<string, Row[]>();
  const hist = new Map<string, Hist>();
  for (const d of logs.docs) {
    const pid = d.id;
    const h: Hist = [];
    for (const r of (d.get("gameLogs") ?? []) as any[]) {
      const g = games.get(String(r.gameId));
      if (!g) continue;
      const team = r.home ? g.home : g.away;
      const row = { pid, team, pts: Number(r.pts) || 0, min: Number(r.min) || 0 };
      if (row.min > 0) {
        (byGame.get(String(r.gameId)) ?? byGame.set(String(r.gameId), []).get(String(r.gameId))!).push(row);
        h.push({ ms: g.ms, pts: row.pts, min: row.min, team });
      }
    }
    hist.set(pid, h.sort((a, b) => a.ms - b.ms));
  }

  const priorSnap = await db.collection("nbaPlayerSeasonMetrics").doc(PRIOR).collection("players").select("metrics.pts", "metrics.min", "gamesPlayed").get();
  const prior = new Map<string, { pts: number; min: number; gp: number }>();
  for (const d of priorSnap.docs) {
    const pts = Number(d.get("metrics.pts.value"));
    if (Number.isFinite(pts)) prior.set(d.id, { pts, min: Number(d.get("metrics.min.value")) || 0, gp: Number(d.get("gamesPlayed")) || 0 });
  }

  const ordered = [...games.entries()].filter(([bdl, g]) => byGame.has(bdl) && g.leaders.size && g.phase === "regular").sort((a, b) => a[1].ms - b[1].ms);
  type Allowed = { n: number; pts: number; G: number; F: number; C: number };
  const allowed = new Map<string, Allowed>();
  const league: Allowed = { n: 0, pts: 0, G: 0, F: 0, C: 0 };
  const shrink = (raw: number, n: number) => 1 + (raw - 1) * (n / (n + oppK));
  let n = 0, hitPpg = 0, hitModel = 0, hitCrowd = 0, nCrowd = 0, top3 = 0, brier = 0, ll = 0;
  const cal = new Map<string, { n: number; p: number; hit: number }>();
  for (const [bdl, g] of ordered) {
    const rows = byGame.get(bdl)!;
    const players = rows.map((r) => {
      const past = (hist.get(r.pid) ?? []).filter((x) => x.ms < g.ms);
      const cur = past.length ? past.reduce((s, x) => s + x.pts, 0) / past.length : 0;
      const last = past.slice(-5);
      const recent = last.length ? last.reduce((s, x) => s + x.pts, 0) / last.length : cur;
      const pr = prior.get(r.pid);
      const base = pr ? pr.pts : past.length ? cur : 3;
      const seasonMu = (past.length * cur + k * base) / (past.length + k);
      const mu = past.length >= 3 ? (1 - recentW) * seasonMu + recentW * recent : seasonMu;
      const sdEmp = past.length >= 4 ? Math.sqrt(past.reduce((s, x) => s + (x.pts - cur) ** 2, 0) / (past.length - 1)) : null;
      const sd0 = sdA * mu + sdB;
      const sd = sdEmp == null || process.env.SD_EMP === "0" ? sd0 : Math.sqrt((past.length * sdEmp ** 2 + 6 * sd0 ** 2) / (past.length + 6));
      const opp = r.team === g.home ? g.away : g.home;
      const a = allowed.get(opp);
      let adj = 1;
      if (a && a.n > 0 && league.n > 0) {
        const defRaw = a.pts / a.n / (league.pts / league.n);
        adj *= 1 + defW * (shrink(defRaw, a.n) - 1);
        const grp = posOf.get(r.pid);
        if (grp && league[grp] > 0) {
          const posRaw = a[grp] / a.n / (league[grp] / league.n);
          adj *= 1 + posW * (shrink(posRaw, a.n) - 1);
        }
      }
      return { ...r, mu: mu * adj, sd, ppg: past.length ? cur : pr?.pts ?? 0 };
    });
    for (const team of [g.home, g.away]) {
      const active = new Set(players.filter((p) => p.team === team).map((p) => p.pid));
      let absent = 0;
      for (const [pid, h] of hist) {
        if (active.has(pid)) continue;
        const past = h.filter((x) => x.ms < g.ms && x.team === team);
        const last5 = past.slice(-5);
        if (last5.length < 3) continue;
        const avgMin = last5.reduce((s, x) => s + x.min, 0) / last5.length;
        if (avgMin < 20) continue;
        absent += past.reduce((s, x) => s + x.pts, 0) / past.length;
      }
      const tp = players.filter((p) => p.team === team);
      const sum = tp.reduce((s, p) => s + p.mu * p.mu, 0) || 1;
      for (const p of tp) p.mu += boostW * absent * ((p.mu * p.mu) / sum);
    }
    const r = rng(Number(bdl) || 1);
    const wins = new Map<string, number>();
    const cand = players.filter((p) => p.mu >= 4);
    for (let i = 0; i < RUNS; i++) {
      let best = -1, who: string[] = [];
      for (const p of cand) {
        const z = Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
        const v = Math.max(0, Math.round(p.mu + p.sd * z));
        if (v > best) { best = v; who = [p.pid]; } else if (v === best) who.push(p.pid);
      }
      for (const w of who) wins.set(w, (wins.get(w) ?? 0) + 1 / who.length);
    }
    const probs = [...wins.entries()].map(([pid, c]) => ({ pid, p: c / RUNS })).sort((a, b) => b.p - a.p);
    const pick = probs[0]!;
    const ppgPick = players.slice().sort((a, b) => b.ppg - a.ppg)[0]!;
    n++;
    if (g.leaders.has(ppgPick.pid)) hitPpg++;
    const hit = g.leaders.has(pick.pid);
    if (hit) hitModel++;
    if (probs.slice(0, 3).some((x) => g.leaders.has(x.pid))) top3++;
    if (g.crowd) { nCrowd++; if (g.leaders.has(g.crowd)) hitCrowd++; }
    brier += (pick.p - (hit ? 1 : 0)) ** 2;
    const pLeader = Math.max(1e-3, probs.filter((x) => g.leaders.has(x.pid)).reduce((s, x) => s + x.p, 0));
    ll += -Math.log(pLeader);
    const b = pick.p >= 0.4 ? "40%+" : pick.p >= 0.3 ? "30-40%" : pick.p >= 0.2 ? "20-30%" : "<20%";
    const c = cal.get(b) ?? { n: 0, p: 0, hit: 0 };
    c.n++; c.p += pick.p; if (hit) c.hit++;
    cal.set(b, c);
    for (const team of [g.home, g.away]) {
      const opp = team === g.home ? g.away : g.home;
      const a = allowed.get(opp) ?? { n: 0, pts: 0, G: 0, F: 0, C: 0 };
      a.n++;
      league.n++;
      for (const row of rows) {
        if (row.team !== team) continue;
        a.pts += row.pts;
        league.pts += row.pts;
        const grp = posOf.get(row.pid);
        if (grp) { a[grp] += row.pts; league[grp] += row.pts; }
      }
      allowed.set(opp, a);
    }
  }
  const pct = (a: number, b: number) => ((a / b) * 100).toFixed(1) + "%";
  console.log(`games=${n}  K=${k} RECENT_W=${recentW} BOOST=${boostW} SD=${sdA}*mu+${sdB} DEF_W=${defW} POS_W=${posW} OPP_K=${oppK} posKnown=${posOf.size}`);
  console.log(`top pick hit: highest PPG ${pct(hitPpg, n)}  model ${pct(hitModel, n)}  crowd ${pct(hitCrowd, nCrowd)} (n=${nCrowd})  model top3 ${pct(top3, n)}`);
  console.log(`model: brier(top pick) ${(brier / n).toFixed(4)}  logloss(actual leader) ${(ll / n).toFixed(3)}`);
  for (const [b, c] of [...cal.entries()].sort()) console.log(`  model top pick ${b}: n=${c.n} said ${pct(c.p, c.n)} hit ${pct(c.hit, c.n)}`);
  if (process.argv.includes("--write")) {
    await db
      .collection("nbaPredictShadowMeta")
      .doc(SEASON)
      .set({ kitBacktest: { scorerGames: n, scorerHits: hitModel } }, { merge: true });
    console.log("wrote kitBacktest scorer");
  }
}
main().then(() => process.exit(0));
