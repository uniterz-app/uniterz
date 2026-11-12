/**
 * Pro Insight「予想の材料」（lib/nba/insights/predictKit）のバックテスト。OpenAI・BDL なし。
 * Firestore `games`（レギュラー・終了）を時系列で再生し、試合前に分かっていた情報だけで予想する（欠場は入れない）。
 *
 *   npx tsx --tsconfig tsconfig.json scripts/backtest-predict-kit.ts
 *   npx tsx --tsconfig tsconfig.json scripts/backtest-predict-kit.ts --upcoming   # これからの試合に当てはめて表示
 */
import "./_loadAdminEnv";
import { getAdminDb } from "../lib/firebaseAdmin";
import { CURRENT_NBA_SEASON_KEY } from "../lib/rankings/nbaSeason";
import { proInsightTeamAbbr } from "../lib/nba/insights/proInsightFacts/teamAbbr";
import { previousNbaSeasonKey } from "../lib/rankings/nbaSeason";
import { loadTeamInjuriesSnapshot } from "../lib/nba/teamInjuries/loadTeamInjuriesSnapshot";
import { loadPlayerOutImpactBundle } from "../lib/nba/injuryImpact/ingestNbaPlayerOutImpact";
import { resolvePlayerOutImpact } from "../lib/nba/injuryImpact/resolvePlayerOutImpact";
import {
  type PredictKitInjury,
  buildPredictKit,
  emptyPredictKitSeason,
  finalizePredictKitSeason,
  predictKitLeagueAvg,
  recordPredictKitGame,
  type PredictKitFinalGame,
  type PredictKitSeasonFinal,
  type PredictKitSeasonState,
} from "../lib/nba/insights/predictKit/predictKit";
import { toProInsightPredictKit } from "../lib/nba/insights/predictKit/predictKitTypes";

const SEASONS = ["2023-24", "2024-25", "2025-26", "2026-27"];

const etDate = (ms: number) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(new Date(ms));

async function loadSeason(season: string): Promise<PredictKitFinalGame[]> {
  const snap = await getAdminDb()
    .collection("games")
    .where("league", "==", "nba")
    .where("season", "==", season)
    .select("status", "homeScore", "awayScore", "seasonPhase", "homeTeamId", "awayTeamId", "startAtJst")
    .get();
  const seen = new Set<string>();
  const out: PredictKitFinalGame[] = [];
  for (const d of snap.docs) {
    const g = d.data() as Record<string, any>;
    if (g.status !== "final" || g.seasonPhase !== "regular") continue;
    if (!(g.homeScore > 0 && g.awayScore > 0)) continue;
    const date = etDate(g.startAtJst.toMillis());
    const key = `${g.homeTeamId}|${g.awayTeamId}|${date}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ date, homeTeamId: g.homeTeamId, awayTeamId: g.awayTeamId, homeScore: g.homeScore, awayScore: g.awayScore });
  }
  return out.sort((a, b) => a.date.localeCompare(b.date));
}

type Eval = {
  margin: number;
  total: number;
  leagueAvg2: number;
  kit: ReturnType<typeof buildPredictKit>;
  homeTeamId: string;
  /** 試合前の勝率が上のチームが勝ったか（同率・開幕戦は null） */
  betterRecordWon: boolean | null;
};

function replay(season: string, games: PredictKitFinalGame[], prior: PredictKitSeasonFinal | null) {
  const s = emptyPredictKitSeason(season, prior);
  const evals: Eval[] = [];
  for (const g of games) {
    const kit = buildPredictKit({ season: s, homeTeamId: g.homeTeamId, awayTeamId: g.awayTeamId, gameDate: g.date, injuries: [] });
    const winPct = (id: string) => {
      const t = s.teams[id];
      return t && t.n ? t.wins / t.n : null;
    };
    const hw = winPct(g.homeTeamId);
    const aw = winPct(g.awayTeamId);
    evals.push({
      betterRecordWon: hw == null || aw == null || hw === aw ? null : hw > aw ? g.homeScore > g.awayScore : g.awayScore > g.homeScore,
      margin: g.homeScore - g.awayScore,
      total: g.homeScore + g.awayScore,
      leagueAvg2: 2 * predictKitLeagueAvg(s),
      kit,
      homeTeamId: g.homeTeamId,
    });
    recordPredictKitGame(s, g);
  }
  return { evals, state: s, fin: finalizePredictKitSeason(s) };
}

const LEAN_LABEL = { even: "互角", slight: "やや有利", clear: "有利" } as const;
const PACE_LABEL = { low: "ロースコア寄り", mid: "平均並み", high: "ハイスコア寄り" } as const;

function report(label: string, evals: Eval[]) {
  const n = evals.length;
  console.log(`\n=== ${label}（${n} 試合）===`);
  for (const tier of ["even", "slight", "clear"] as const) {
    const xs = evals.filter((e) => e.kit.lean === tier);
    const won = xs.filter((e) => (e.kit.favoredTeamId === e.homeTeamId ? e.margin > 0 : e.margin < 0)).length;
    const p = xs.reduce((s, e) => s + e.kit.favoredWinP, 0);
    console.log(
      `  ${LEAN_LABEL[tier].padEnd(5)} ${String(xs.length).padStart(4)} 試合  予想 ${xs.length ? ((p / xs.length) * 100).toFixed(0) : "-"}%  実際 ${xs.length ? ((won / xs.length) * 100).toFixed(0) : "-"}%`
    );
  }
  const favWon = (e: Eval) => (e.kit.favoredTeamId === e.homeTeamId ? e.margin > 0 : e.margin < 0);
  const pct = (a: number, b: number) => (b ? `${((a / b) * 100).toFixed(1)}%` : "-");
  console.log(
    `  勝敗の的中 ${pct(evals.filter(favWon).length, n)}（いつもホーム ${pct(evals.filter((e) => e.margin > 0).length, n)}・勝率が上の側 ${pct(evals.filter((e) => e.betterRecordWon != null && e.betterRecordWon).length, evals.filter((e) => e.betterRecordWon != null).length)}）`
  );
  for (const [lo, hi] of [
    [0.5, 0.55],
    [0.55, 0.6],
    [0.6, 0.65],
    [0.65, 0.72],
    [0.72, 0.8],
    [0.8, 1.01],
  ] as const) {
    const xs = evals.filter((e) => e.kit.favoredWinP >= lo && e.kit.favoredWinP < hi);
    console.log(
      `    予想 ${(lo * 100).toFixed(0)}〜${Math.min(100, hi * 100).toFixed(0)}%  ${String(xs.length).padStart(4)} 試合（${pct(xs.length, n)}）  的中 ${pct(xs.filter(favWon).length, xs.length)}`
    );
  }
  const mRmse = Math.sqrt(evals.reduce((s, e) => s + (e.margin - e.kit.homeMargin) ** 2, 0) / n);
  console.log(`  点差の誤差 RMSE ${mRmse.toFixed(1)}`);
  const rmse = Math.sqrt(evals.reduce((s, e) => s + (e.total - (e.leagueAvg2 + e.kit.totalVsLeague)) ** 2, 0) / n);
  const naive = Math.sqrt(evals.reduce((s, e) => s + (e.total - e.leagueAvg2) ** 2, 0) / n);
  console.log(`  合計点 RMSE ${rmse.toFixed(1)}（リーグ平均だけ ${naive.toFixed(1)}）`);
  const q = (xs: number[], p: number) => [...xs].sort((a, b) => a - b)[Math.floor(p * (xs.length - 1))];
  const totErr = evals.map((e) => Math.abs(e.total - (e.leagueAvg2 + e.kit.totalVsLeague)));
  const teamErr = evals.flatMap((e) => {
    const t = e.leagueAvg2 + e.kit.totalVsLeague;
    const home = (e.total + e.margin) / 2;
    const away = (e.total - e.margin) / 2;
    return [Math.abs(home - (t + e.kit.homeMargin) / 2), Math.abs(away - (t - e.kit.homeMargin) / 2)];
  });
  console.log(
    `  合計点の誤差 50% ±${q(totErr, 0.5).toFixed(1)}  68% ±${q(totErr, 0.68).toFixed(1)}  80% ±${q(totErr, 0.8).toFixed(1)}` +
      `  / チーム得点 50% ±${q(teamErr, 0.5).toFixed(1)}  68% ±${q(teamErr, 0.68).toFixed(1)}`
  );
  for (const band of [10, 12, 15]) {
    console.log(`    合計 ±${band} に入る ${pct(totErr.filter((x) => x <= band).length, n)}`);
  }
  for (const tier of ["low", "mid", "high"] as const) {
    const xs = evals.filter((e) => e.kit.pace === tier);
    const diff = xs.reduce((s, e) => s + e.total - e.leagueAvg2, 0) / (xs.length || 1);
    const over = xs.filter((e) => e.total > e.leagueAvg2).length;
    console.log(
      `  ${PACE_LABEL[tier]} ${String(xs.length).padStart(4)} 試合  実際はリーグ平均比 ${diff >= 0 ? "+" : ""}${diff.toFixed(1)} 点  平均超え ${xs.length ? ((over / xs.length) * 100).toFixed(0) : "-"}%`
    );
  }
}

async function showUpcoming(state: PredictKitSeasonState) {
  const db = getAdminDb();
  const now = Date.now();
  const { Timestamp } = await import("firebase-admin/firestore");
  const snap = await db
    .collection("games")
    .where("league", "==", "nba")
    .where("season", "==", CURRENT_NBA_SEASON_KEY)
    .where("startAtJst", ">=", Timestamp.fromMillis(now - 3 * 3600_000))
    .where("startAtJst", "<", Timestamp.fromMillis(now + 30 * 3600_000))
    .select("status", "homeTeamId", "awayTeamId", "startAtJst", "seasonPhase")
    .get();
  const games = snap.docs.filter((d) => (d.data() as any).status !== "final" && (d.data() as any).seasonPhase === "regular");
  const injuryTeams = (await loadTeamInjuriesSnapshot(db, CURRENT_NBA_SEASON_KEY)).bundle.teams;
  const current = await loadPlayerOutImpactBundle(db, CURRENT_NBA_SEASON_KEY);
  const prior = await loadPlayerOutImpactBundle(db, previousNbaSeasonKey(CURRENT_NBA_SEASON_KEY));
  const injuriesOf = (teamId: string): PredictKitInjury[] => {
    const seen = new Set<string>();
    return (injuryTeams[teamId] ?? []).flatMap((e) => {
      if (e.status !== "out" || seen.has(e.playerId)) return [];
      seen.add(e.playerId);
      const r = resolvePlayerOutImpact({ phase: "full", teamId, playerId: e.playerId, current, prior });
      return r && r.impact < 0 ? [{ teamId, playerName: e.name, netDelta: r.impact }] : [];
    });
  };
  /** ローテ選手（影響値の行がある）の OUT と questionable */
  const absenceOf = (teamId: string) => {
    const list = injuryTeams[teamId] ?? [];
    const hasRow = (pid: string) =>
      resolvePlayerOutImpact({ phase: "full", teamId, playerId: pid, current, prior }) != null;
    const uniq = (xs: string[]) => [...new Set(xs)];
    const out = uniq(list.filter((e) => e.status === "out" && hasRow(e.playerId)).map((e) => e.name));
    const questionable = uniq(list.filter((e) => e.status === "questionable" && hasRow(e.playerId)).map((e) => e.name));
    return { teamId, out, questionable };
  };
  const absenceLine = (teamId: string) => {
    const { out, questionable: q } = absenceOf(teamId);
    return `${proInsightTeamAbbr(teamId)} ${out.length ? out.join(" · ") : "なし"}${q.length ? `（出場未定 ${q.join(" · ")}）` : ""}`;
  };
  if (process.argv.includes("--json")) {
    const samples = games.map((d) => {
      const g = d.data() as Record<string, any>;
      const kit = buildPredictKit({
        season: state,
        homeTeamId: g.homeTeamId,
        awayTeamId: g.awayTeamId,
        gameDate: etDate(g.startAtJst.toMillis()),
        injuries: [...injuriesOf(g.homeTeamId), ...injuriesOf(g.awayTeamId)],
      });
      return {
        homeTeamId: g.homeTeamId,
        awayTeamId: g.awayTeamId,
        kit: toProInsightPredictKit({
          kit,
          homeTeamId: g.homeTeamId,
          awayTeamId: g.awayTeamId,
          absences: [absenceOf(g.homeTeamId), absenceOf(g.awayTeamId)],
        }),
      };
    });
    console.log(JSON.stringify(samples, null, 2));
    return;
  }
  games.forEach((d) => {
    const g = d.data() as Record<string, any>;
    const injuries = [...injuriesOf(g.homeTeamId), ...injuriesOf(g.awayTeamId)];
    const kit = buildPredictKit({
      season: state,
      homeTeamId: g.homeTeamId,
      awayTeamId: g.awayTeamId,
      gameDate: etDate(g.startAtJst.toMillis()),
      injuries,
    });
    const ab = (id: string) => proInsightTeamAbbr(id);
    const factorText = kit.factors
      .map((f) =>
        f.kind === "home"
          ? `ホーム ${ab(f.teamId)}`
          : f.kind === "strength"
            ? `実力 ${ab(f.teamId)}`
          : f.kind === "rest"
            ? `${ab(f.teamId)} ${f.rest === "0" ? "連戦" : "休養十分"}`
            : `${ab(f.teamId)} 欠場 ${f.players.join(" / ")}`
      )
      .join(" · ");
    console.log(
      `\n${ab(g.awayTeamId)} @ ${ab(g.homeTeamId)}\n` +
        `  勝ち負け: ${kit.lean === "even" ? `互角（わずかに ${ab(kit.favoredTeamId)}）` : `${LEAN_LABEL[kit.lean]} ${ab(kit.favoredTeamId)}`}` +
        `   [p=${(kit.favoredWinP * 100).toFixed(0)}% 点差 ${kit.homeMargin.toFixed(1)} 要因 ${kit.factors.map((f) => `${f.kind}:${f.pts.toFixed(1)}`).join(",")}]\n` +
        (factorText ? `  内訳: ${factorText}\n` : "") +
        `  欠場: ${absenceLine(g.awayTeamId)} / ${absenceLine(g.homeTeamId)}\n` +
        `  点数: ${PACE_LABEL[kit.pace]}   [合計 リーグ平均比 ${kit.totalVsLeague >= 0 ? "+" : ""}${kit.totalVsLeague.toFixed(1)}]`
    );
  });
}

async function main() {
  let prior: PredictKitSeasonFinal | null = null;
  let last: PredictKitSeasonState | null = null;
  for (const season of SEASONS) {
    const { evals, state, fin } = replay(season, await loadSeason(season), prior);
    if (prior && !process.argv.includes("--upcoming")) report(season, evals);
    prior = fin;
    last = state;
  }
  if (process.argv.includes("--upcoming") && last) await showUpcoming(last);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
