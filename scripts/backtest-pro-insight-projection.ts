/**
 * Pro Insight の得点見込み（`projectPlayerPoints`）を今季の試合ログで答え合わせする。読むだけ・OpenAI なし。
 * 各試合の時点で分かっていた情報だけで見込みを出し、実際の得点と比べる。
 * 欠場は injury の履歴が無いので「直近でローテに入っていたのにその試合に出ていない」チームメイトで代用する。
 *
 *   npx tsx --tsconfig tsconfig.json scripts/backtest-pro-insight-projection.ts --season 2026-27
 *   npx tsx --tsconfig tsconfig.json scripts/backtest-pro-insight-projection.ts --season 2026-27 --grid
 */
import "./_loadAdminEnv";
import { getAdminDb } from "../lib/firebaseAdmin";
import {
  NBA_PLAYER_GAME_LOGS_COLLECTION,
  NBA_PLAYER_GAME_LOGS_PLAYERS_SUB,
} from "../lib/nba/playerGameLogs/playerGameLogsTypes";
import {
  PLAYER_POINTS_PROJECTION_MIN_GAMES,
  PLAYER_POINTS_PROJECTION_TUNING,
  projectPlayerPoints,
  type PlayerPointsProjectionInput,
  type PlayerPointsProjectionTuning,
} from "../lib/nba/insights/proInsightFacts/playerPointsProjection";

function arg(name: string): string | null {
  const i = process.argv.indexOf(`--${name}`);
  if (i < 0) return null;
  const v = process.argv[i + 1];
  return v && !v.startsWith("--") ? v : null;
}

type Row = { pid: string; opp: string; team: string | null; min: number; pts: number };
type Sample = { input: PlayerPointsProjectionInput; actual: number };

/** 見込みを出す対象（Pro Insight の主力 = 平均 10 点以上） */
const MIN_PRIOR_PPG = 10;
/** 欠場とみなすチームメイト: 直近 10 試合の 6 割以上に出て平均 5 点以上 */
const ROTATION_SHARE = 0.6;
const ROTATION_MIN_PPG = 5;

async function loadGames(season: string): Promise<Map<number, Row[]>> {
  const db = getAdminDb();
  const snap = await db
    .collection(NBA_PLAYER_GAME_LOGS_COLLECTION)
    .doc(season)
    .collection(NBA_PLAYER_GAME_LOGS_PLAYERS_SUB)
    .select("gameLogs")
    .get();
  const games = new Map<number, Row[]>();
  for (const d of snap.docs) {
    const logs = (d.data().gameLogs ?? []) as Array<{ gameId: string; oppTeamId: string; min: number; pts: number }>;
    for (const g of logs) {
      if (!(g.min > 0)) continue;
      const gid = Number(g.gameId);
      const list = games.get(gid) ?? [];
      list.push({ pid: d.id, opp: g.oppTeamId, team: null, min: g.min, pts: g.pts });
      games.set(gid, list);
    }
  }
  for (const rows of games.values()) {
    const opps = [...new Set(rows.map((r) => r.opp))];
    for (const r of rows) r.team = opps.find((o) => o !== r.opp) ?? null;
  }
  return games;
}

function buildSamples(games: Map<number, Row[]>): Sample[] {
  const order = [...games.keys()].sort((a, b) => a - b);
  const hist = new Map<string, { gameId: string; min: number; pts: number }[]>();
  const teamGames = new Map<string, number[]>();
  const allowed = new Map<string, { pts: number; games: number }>();
  const samples: Sample[] = [];
  const ppgOf = (pid: string) => {
    const h = hist.get(pid) ?? [];
    return h.length ? h.reduce((s, g) => s + g.pts, 0) / h.length : 0;
  };

  for (const gid of order) {
    const rows = games.get(gid)!;
    const present = new Set(rows.map((r) => r.pid));
    const ranked = [...allowed.values()].filter((a) => a.games >= 3);
    const leagueAllowed = ranked.length >= 20 ? ranked.reduce((s, a) => s + a.pts / a.games, 0) / ranked.length : null;

    const teamsHere = [...new Set(rows.map((r) => r.team).filter((t): t is string => !!t))];
    const ctx = new Map<string, { missing: number; absent: string[]; rotation: string[] }>();
    for (const team of teamsHere) {
      const recent = (teamGames.get(team) ?? []).slice(-10);
      const count = new Map<string, number>();
      for (const g2 of recent) {
        for (const r2 of games.get(g2) ?? []) if (r2.team === team) count.set(r2.pid, (count.get(r2.pid) ?? 0) + 1);
      }
      const rotation = [...count.entries()]
        .filter(([pid, c]) => recent.length > 0 && c >= ROTATION_SHARE * recent.length && ppgOf(pid) >= ROTATION_MIN_PPG)
        .map(([pid]) => pid);
      const absent = rotation.filter((pid) => !present.has(pid));
      ctx.set(team, { missing: absent.reduce((s, pid) => s + ppgOf(pid), 0), absent, rotation });
    }

    for (const r of rows) {
      const h = hist.get(r.pid) ?? [];
      if (!r.team || h.length < PLAYER_POINTS_PROJECTION_MIN_GAMES || leagueAllowed == null) continue;
      if (ppgOf(r.pid) < MIN_PRIOR_PPG) continue;
      const opp = allowed.get(r.opp);
      if (!opp || opp.games < 3) continue;
      const c = ctx.get(r.team)!;
      const remaining = rows
        .filter((x) => x.team === r.team)
        .map((x) => ppgOf(x.pid))
        .sort((a, b) => b - a)
        .slice(0, 8);
      const remainingSum = remaining.reduce((s, v) => s + v, 0);
      let loadShift: PlayerPointsProjectionInput["loadShift"] = null;
      const star = c.absent.sort((a, b) => ppgOf(b) - ppgOf(a))[0];
      if (star) {
        const starGames = new Set((hist.get(star) ?? []).map((g) => g.gameId));
        const without = h.filter((g) => !starGames.has(g.gameId));
        const withHim = h.filter((g) => starGames.has(g.gameId));
        if (without.length >= 2 && withHim.length >= 2) {
          const avg = (xs: typeof h) => xs.reduce((s, g) => s + g.pts, 0) / xs.length;
          loadShift = { withoutPpg: avg(without), withPpg: avg(withHim), gamesWithout: without.length };
        }
      }
      samples.push({
        input: {
          logs: h,
          missingTeammatePpg: c.missing,
          shareOfRemaining: remainingSum > 0 ? ppgOf(r.pid) / remainingSum : 0,
          loadShift,
          oppAllowedRatio: opp.pts / opp.games / leagueAllowed,
        },
        actual: r.pts,
      });
    }

    for (const r of rows) {
      const h = hist.get(r.pid) ?? [];
      h.push({ gameId: String(gid), min: r.min, pts: r.pts });
      hist.set(r.pid, h);
      const a = allowed.get(r.opp) ?? { pts: 0, games: 0 };
      a.pts += r.pts;
      allowed.set(r.opp, a);
    }
    for (const o of new Set(rows.map((r) => r.opp))) allowed.get(o)!.games += 1;
    for (const t of teamsHere) teamGames.set(t, [...(teamGames.get(t) ?? []), gid]);
  }
  return samples;
}

function score(samples: Sample[], tuning: PlayerPointsProjectionTuning) {
  let n = 0;
  let mae = 0;
  let naiveMae = 0;
  let inside = 0;
  let width = 0;
  const absence = { n: 0, mae: 0, naive: 0, bias: 0, naiveBias: 0 };
  for (const s of samples) {
    const p = projectPlayerPoints(s.input, tuning);
    if (!p) continue;
    n += 1;
    const err = Math.abs(s.actual - p.mean);
    const naive = Math.abs(s.actual - p.seasonPpg);
    mae += err;
    naiveMae += naive;
    if (s.actual >= p.low && s.actual <= p.high) inside += 1;
    width += p.high - p.low;
    if (s.input.missingTeammatePpg >= 15) {
      absence.n += 1;
      absence.mae += err;
      absence.naive += naive;
      absence.bias += s.actual - p.mean;
      absence.naiveBias += s.actual - p.seasonPpg;
    }
  }
  return {
    n,
    mae: mae / n,
    naiveMae: naiveMae / n,
    coverage: inside / n,
    avgWidth: width / n,
    absence: absence.n
      ? {
          n: absence.n,
          mae: absence.mae / absence.n,
          naiveMae: absence.naive / absence.n,
          bias: absence.bias / absence.n,
          naiveBias: absence.naiveBias / absence.n,
        }
      : null,
  };
}

async function main() {
  const season = arg("season") ?? "2026-27";
  const games = await loadGames(season);
  const samples = buildSamples(games);
  const base = PLAYER_POINTS_PROJECTION_TUNING;
  console.log(`season ${season}: games ${games.size}, player-games ${samples.length}`);
  console.log("current tuning", base);
  console.log("score", score(samples, base));

  if (process.argv.includes("--absence")) {
    for (const absorb of [0, 0.1, 0.2, 0.3, 0.4, 0.6]) {
      for (const loadShiftPriorGames of [4, 1e9]) {
        const s = score(samples, { ...base, absorb, loadShiftPriorGames });
        console.log(`absorb ${absorb} loadShiftPriorGames ${loadShiftPriorGames}`, s.absence);
      }
    }
  }
  if (!process.argv.includes("--grid")) return;
  const results: Array<{ t: PlayerPointsProjectionTuning; mae: number }> = [];
  for (const absorb of [0, 0.1, 0.2, 0.3, 0.4, 0.6, 0.8, 1]) {
    for (const oppWeight of [0, 0.25, 0.5, 0.75, 1]) {
      for (const loadShiftPriorGames of [2, 4, 8, 16, 1e9]) {
        const t = { ...base, absorb, oppWeight, loadShiftPriorGames };
        results.push({ t, mae: score(samples, t).mae });
      }
    }
  }
  results.sort((a, b) => a.mae - b.mae);
  console.log("best mean tuning:");
  for (const r of results.slice(0, 12)) {
    console.log(
      `  mae ${r.mae.toFixed(3)} absorb ${r.t.absorb} oppWeight ${r.t.oppWeight} loadShiftPriorGames ${r.t.loadShiftPriorGames}`
    );
  }
  const best = results[0]!.t;
  for (const z of [0.6, 0.7, 0.8, 0.85, 0.9, 1.0]) {
    for (const sdPriorRatio of [0.3, 0.35, 0.4]) {
      const s = score(samples, { ...best, z, sdPriorRatio });
      console.log(
        `  z ${z} sdPriorRatio ${sdPriorRatio}: coverage ${(s.coverage * 100).toFixed(1)}% width ${s.avgWidth.toFixed(1)}`
      );
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
