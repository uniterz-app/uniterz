/**
 * 「予想の材料」の勝ち負けの傾きに欠場を入れると当たりが増えるか（特に互角の試合）。オフライン・ローカルのみ。
 *
 * 欠場 = その季のローテ選手（10 試合以上・平均 15 分以上）がそのチームでの初出場〜最終出場の間に出なかった試合
 *       （fitPlayerOutImpact と同じ定義。試合直前に OUT が分かっていた場合に相当）。
 * 影響の値は前季だけで fit（γ 固定・λ 固定）→ 今季の分は使わない。
 *
 *   npx tsx --tsconfig tsconfig.json scripts/backtest-predict-kit-injuries.ts
 *
 * 生データ: .tmp/nba-matchup-difficulty/games-{year}.json（既存）, .tmp/nba-injury-impact/stats-{year}.json（無ければ BDL から取得）
 */
import "./_loadAdminEnv";
import fs from "fs";
import path from "path";
import { bdlNbaGetJson, type BdlListResponse } from "../lib/nba/bdl/bdlNbaFetch";
import type { BdlGame } from "../lib/nba/bdl/fetchBdlGames";
import {
  buildOutImpactObservations,
  fitOutImpact,
  outImpactOfPlayer,
  type OutImpactGame,
  type OutImpactPlayer,
  type OutImpactStatRow,
} from "../lib/nba/injuryImpact/fitPlayerOutImpact";
import { OUT_IMPACT_GAMMA, OUT_IMPACT_LAMBDA } from "../lib/nba/injuryImpact/fittedOutImpact";
import { MATCHUP_DIFFICULTY_COEFFICIENTS as C } from "../lib/nba/matchupDifficulty/fittedCoefficients";
import {
  buildPredictKit,
  emptyPredictKitSeason,
  finalizePredictKitSeason,
  predictKitLeagueAvg,
  recordPredictKitGame,
  type PredictKit,
  type PredictKitInjury,
  type PredictKitSeasonFinal,
} from "../lib/nba/insights/predictKit/predictKit";

const YEARS = [2022, 2023, 2024, 2025];
const GAMES_CACHE = path.join(process.cwd(), ".tmp", "nba-matchup-difficulty");
const STATS_CACHE = path.join(process.cwd(), ".tmp", "nba-injury-impact");

const seasonLabel = (y: number) => `${y}-${String((y + 1) % 100).padStart(2, "0")}`;

type CachedStatRow = { g: number; t: number; p: number; n: string; m: number; pts: number; reb: number; ast: number; stk: number; tov: number };
type BdlStatRow = {
  min?: string | number | null;
  pts?: number | null;
  reb?: number | null;
  ast?: number | null;
  stl?: number | null;
  blk?: number | null;
  turnover?: number | null;
  player?: { id?: number; first_name?: string; last_name?: string } | null;
  team?: { id?: number } | null;
  game?: { id?: number } | null;
};

function parseMinutes(raw: string | number | null | undefined): number {
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  const s = String(raw ?? "").trim();
  if (!s) return 0;
  if (s.includes(":")) {
    const [m, sec] = s.split(":");
    return (Number(m) || 0) + (Number(sec) || 0) / 60;
  }
  return Number(s) || 0;
}

async function loadSeasonStats(year: number): Promise<CachedStatRow[]> {
  const file = path.join(STATS_CACHE, `stats-${year}.json`);
  if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, "utf8")) as CachedStatRow[];
  const out: CachedStatRow[] = [];
  let cursor: number | undefined;
  for (let page = 0; page < 800; page++) {
    const body = await bdlNbaGetJson<BdlListResponse<BdlStatRow>>("/nba/v1/stats", {
      "seasons[]": year,
      postseason: false,
      per_page: 100,
      ...(cursor != null ? { cursor } : {}),
    });
    const chunk = Array.isArray(body.data) ? body.data : [];
    for (const r of chunk) {
      const m = parseMinutes(r.min);
      if (m <= 0 || r.player?.id == null || r.team?.id == null || r.game?.id == null) continue;
      out.push({
        g: r.game.id,
        t: r.team.id,
        p: r.player.id,
        n: `${r.player.first_name ?? ""} ${r.player.last_name ?? ""}`.trim(),
        m,
        pts: r.pts ?? 0,
        reb: r.reb ?? 0,
        ast: r.ast ?? 0,
        stk: (r.stl ?? 0) + (r.blk ?? 0),
        tov: r.turnover ?? 0,
      });
    }
    if (page % 50 === 0) console.error(`stats ${year} page ${page} rows ${out.length}`);
    const next = body.meta?.next_cursor;
    if (next == null || chunk.length === 0) break;
    cursor = next;
  }
  fs.mkdirSync(STATS_CACHE, { recursive: true });
  fs.writeFileSync(file, JSON.stringify(out));
  console.error(`fetched stats ${year}: ${out.length} rows`);
  return out;
}

function loadGames(year: number): { games: OutImpactGame[]; abbr: Map<string, string> } {
  const raw = JSON.parse(fs.readFileSync(path.join(GAMES_CACHE, `games-${year}.json`), "utf8")) as Array<
    BdlGame & { postseason?: boolean; home_team?: { id?: number; abbreviation?: string }; visitor_team?: { id?: number; abbreviation?: string } }
  >;
  const abbr = new Map<string, string>();
  const games: OutImpactGame[] = [];
  for (const g of raw) {
    if (g.postseason || g.postponed) continue;
    if (g.home_team?.id == null || g.visitor_team?.id == null || !g.date) continue;
    if (!((g.home_team_score ?? 0) > 0 && (g.visitor_team_score ?? 0) > 0)) continue;
    abbr.set(String(g.home_team.id), String(g.home_team.abbreviation ?? ""));
    abbr.set(String(g.visitor_team.id), String(g.visitor_team.abbreviation ?? ""));
    const usDate = g.date.slice(0, 10);
    const ms = Date.parse(g.datetime ?? `${usDate}T00:00:00Z`);
    games.push({
      id: String(g.id),
      seasonKey: seasonLabel(year),
      startMs: Number.isFinite(ms) ? ms : Date.parse(`${usDate}T00:00:00Z`),
      usDate,
      homeTeamId: String(g.home_team.id),
      awayTeamId: String(g.visitor_team.id),
      homeScore: g.home_team_score!,
      awayScore: g.visitor_team_score!,
    });
  }
  return { games: games.sort((a, b) => a.startMs - b.startMs), abbr };
}

const toStats = (rows: CachedStatRow[]): OutImpactStatRow[] =>
  rows.map((r) => ({
    gameId: String(r.g),
    teamId: String(r.t),
    playerId: String(r.p),
    playerName: r.n,
    min: r.m,
    pts: r.pts,
    reb: r.reb,
    ast: r.ast,
    stocks: r.stk,
    tov: r.tov,
  }));

const statPrior = (x: number[]) => x.reduce((s, v, j) => s + v * OUT_IMPACT_GAMMA[j]!, 0);

type PrevRow = { total: number; prior: number; games: number; x: number[] };

type Variant = "none" | "fit" | "stat";
type Rec = { kit: Record<Variant, PredictKit>; margin: number; total: number; lg2: number; homeId: string; outCount: number };

async function main() {
  const seasons = [];
  for (const y of YEARS) {
    const { games, abbr } = loadGames(y);
    const stats = toStats(await loadSeasonStats(y));
    seasons.push({ y, games, abbr, stats });
  }

  let priorFinal: PredictKitSeasonFinal | null = null;
  let prevImpact: Map<string, PrevRow> | null = null;
  const results: Array<{ label: string; recs: Rec[] }> = [];

  for (const { y, games, abbr, stats } of seasons) {
    const label = seasonLabel(y);
    const teamKey = (bdlTeamId: string) => `nba-${(abbr.get(bdlTeamId) ?? bdlTeamId).toLowerCase()}`;
    const players: OutImpactPlayer[] = [];
    const obs = buildOutImpactObservations(label, games, stats, players);
    const obsById = new Map(obs.map((o) => [o.gameId, o]));

    // 試合ごとの出場者（presence 用の累計）
    const playedBy = new Map<string, Set<string>>();
    for (const r of stats) {
      let set = playedBy.get(r.gameId);
      if (!set) playedBy.set(r.gameId, (set = new Set()));
      set.add(`${r.teamId}:${r.playerId}`);
    }
    const playedSoFar = new Map<string, number>();
    const teamGamesSoFar = new Map<string, number>();

    const s = emptyPredictKitSeason(label, priorFinal);
    const recs: Rec[] = [];
    for (const g of games) {
      const o = obsById.get(g.id);
      const home = teamKey(g.homeTeamId);
      const away = teamKey(g.awayTeamId);
      const injuriesFor = (variant: Variant): PredictKitInjury[] => {
        if (variant === "none" || !o || !prevImpact) return [];
        const list: PredictKitInjury[] = [];
        for (const [ids, bdlTeam, teamId] of [
          [o.outHome, g.homeTeamId, home],
          [o.outAway, g.awayTeamId, away],
        ] as const) {
          for (const pi of ids) {
            const p = players[pi]!;
            const key = `${bdlTeam}:${p.playerId}`;
            const prev = prevImpact.get(key);
            const full = variant === "fit" ? (prev ? prev.total : statPrior(p.x)) : statPrior(prev ? prev.x : p.x);
            const priorShare = prev ? Math.min(1, prev.games / 82) : 0;
            const n = teamGamesSoFar.get(bdlTeam) ?? 0;
            const played = playedSoFar.get(key) ?? 0;
            const presence = (C.shrinkGames * priorShare + played) / (C.shrinkGames + n);
            const net = Math.min(0, Math.round(full * presence * 10) / 10);
            if (net < 0) list.push({ teamId, playerName: p.playerName, netDelta: net });
          }
        }
        return list;
      };
      const kit = Object.fromEntries(
        (["none", "fit", "stat"] as const).map((v) => [
          v,
          buildPredictKit({ season: s, homeTeamId: home, awayTeamId: away, gameDate: g.usDate, injuries: injuriesFor(v) }),
        ])
      ) as Record<Variant, PredictKit>;
      recs.push({
        kit,
        margin: g.homeScore - g.awayScore,
        total: g.homeScore + g.awayScore,
        lg2: 2 * predictKitLeagueAvg(s),
        homeId: home,
        outCount: o ? o.outHome.length + o.outAway.length : 0,
      });
      recordPredictKitGame(s, { date: g.usDate, homeTeamId: home, awayTeamId: away, homeScore: g.homeScore, awayScore: g.awayScore });
      for (const who of playedBy.get(g.id) ?? []) playedSoFar.set(who, (playedSoFar.get(who) ?? 0) + 1);
      for (const t of [g.homeTeamId, g.awayTeamId]) teamGamesSoFar.set(t, (teamGamesSoFar.get(t) ?? 0) + 1);
    }
    if (prevImpact) results.push({ label, recs });

    // この季の影響値を fit（翌季の検証に使う）
    const fit = fitOutImpact(obs, players, { lambda: OUT_IMPACT_LAMBDA, gamma: OUT_IMPACT_GAMMA });
    prevImpact = new Map();
    players.forEach((p, pi) => {
      const v = outImpactOfPlayer(fit, players, pi);
      prevImpact!.set(`${p.teamId}:${p.playerId}`, { total: v.total, prior: v.prior, games: p.games, x: p.x });
    });
    priorFinal = finalizePredictKitSeason(s);
  }

  const pct = (a: number, b: number) => (b ? `${((a / b) * 100).toFixed(1)}%` : "-");
  const won = (r: Rec, k: PredictKit) => (k.favoredTeamId === r.homeId ? r.margin > 0 : r.margin < 0);
  const brier = (rs: Rec[], v: Variant) =>
    rs.reduce((sum, r) => {
      const k = r.kit[v];
      const p = k.favoredWinP;
      return sum + (p - (won(r, k) ? 1 : 0)) ** 2;
    }, 0) / rs.length;
  const rmse = (rs: Rec[], v: Variant) => Math.sqrt(rs.reduce((sum, r) => sum + (r.margin - r.kit[v].homeMargin) ** 2, 0) / rs.length);

  const all = results.flatMap((x) => x.recs);
  for (const { label, recs } of [...results, { label: "合計", recs: all }]) {
    const close = recs.filter((r) => r.kit.none.favoredWinP < 0.6);
    console.log(`\n=== ${label}（${recs.length} 試合・互角 ${close.length}）===`);
    for (const v of ["none", "fit", "stat"] as const) {
      const name = v === "none" ? "欠場なし      " : v === "fit" ? "欠場（本番の値）" : "欠場（スタッツ目安）";
      console.log(
        `  ${name}  全体 ${pct(recs.filter((r) => won(r, r.kit[v])).length, recs.length)}  互角 ${pct(close.filter((r) => won(r, r.kit[v])).length, close.length)}` +
          `  Brier ${brier(recs, v).toFixed(4)}  点差RMSE ${rmse(recs, v).toFixed(2)}`
      );
    }
    for (const v of ["fit", "stat"] as const) {
      const flipped = close.filter((r) => r.kit[v].favoredTeamId !== r.kit.none.favoredTeamId);
      console.log(
        `  互角で欠場により選ぶ側が変わった（${v}）: ${flipped.length} 試合 → 欠場込みの的中 ${pct(flipped.filter((r) => won(r, r.kit[v])).length, flipped.length)}`
      );
    }
    for (const tier of ["low", "mid", "high"] as const) {
      const xs = close.filter((r) => r.kit.none.pace === tier);
      const over = xs.filter((r) => r.total > r.lg2).length;
      const diff = xs.reduce((sum, r) => sum + r.total - r.lg2, 0) / (xs.length || 1);
      console.log(`  互角の試合の点数 ${tier.padEnd(4)} ${String(xs.length).padStart(4)} 試合  平均比 ${diff >= 0 ? "+" : ""}${diff.toFixed(1)}  平均超え ${pct(over, xs.length)}`);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
