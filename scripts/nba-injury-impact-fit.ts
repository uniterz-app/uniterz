/**
 * 選手欠場の影響（点）— 係数の実測（オフライン・ローカルのみ）。モデルは lib/nba/injuryImpact/fitPlayerOutImpact.ts。
 *
 *   npx tsx --tsconfig tsconfig.json scripts/nba-injury-impact-fit.ts            # キャッシュ優先
 *   npx tsx --tsconfig tsconfig.json scripts/nba-injury-impact-fit.ts --refetch  # BDL stats を取り直し
 *
 * γ（スタッツの目安）と λ（個人差の寄せ）を 5 シーズンで同時推定し、λ は 5 分割 CV（試合単位）で選ぶ。
 * 本番 ingest は γ・λ を固定して今季だけ fit する。
 *
 * 認証: `.env.local` の BALLDONTLIE_API_KEY
 * 生データ: .tmp/nba-matchup-difficulty/games-{season}.json, .tmp/nba-injury-impact/stats-{season}.json（gitignore）
 * 出力: docs/nba-injury-impact-fit.json, lib/nba/injuryImpact/fittedOutImpact.ts
 */
import fs from "fs";
import path from "path";
import { bdlNbaGetJson, type BdlListResponse } from "../lib/nba/bdl/bdlNbaFetch";
import type { BdlGame } from "../lib/nba/bdl/fetchBdlGames";
import {
  buildOutImpactObservations,
  fitOutImpact,
  outImpactHomeCourt,
  outImpactOfPlayer,
  predictOutImpactGame,
  OUT_IMPACT_FEATURES,
  OUT_IMPACT_ROTATION_MIN_GAMES,
  OUT_IMPACT_ROTATION_MIN_MPG,
  type OutImpactFit,
  type OutImpactGame,
  type OutImpactObs,
  type OutImpactPlayer,
  type OutImpactStatRow,
} from "../lib/nba/injuryImpact/fitPlayerOutImpact";

const SEASONS = [2021, 2022, 2023, 2024, 2025];
const FOLDS = 5;
const LAMBDAS = [2, 5, 10, 20, 40, 80, 1e6];
/** 「主力欠場の試合」= 欠場合計の見積もり |影響| がこれ以上 */
const BIG_OUT_POINTS = 3;
const GAMES_CACHE = path.join(process.cwd(), ".tmp", "nba-matchup-difficulty");
const STATS_CACHE = path.join(process.cwd(), ".tmp", "nba-injury-impact");

function loadEnvLocal(): void {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const raw of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i <= 0) continue;
    const key = line.slice(0, i).trim();
    let val = line.slice(i + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] == null) process.env[key] = val;
  }
}

function seasonLabel(year: number): string {
  return `${year}-${String((year + 1) % 100).padStart(2, "0")}`;
}

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

/** キャッシュ形式（数値 ID） */
type CachedStatRow = {
  g: number;
  t: number;
  p: number;
  n: string;
  m: number;
  pts: number;
  reb: number;
  ast: number;
  stk: number;
  tov: number;
};

function parseMinutes(raw: string | number | null | undefined): number {
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  const s = String(raw ?? "").trim();
  if (!s) return 0;
  if (s.includes(":")) {
    const [m, sec] = s.split(":");
    const mm = Number(m);
    const ss = Number(sec);
    return Number.isFinite(mm) ? mm + (Number.isFinite(ss) ? ss / 60 : 0) : 0;
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

async function loadSeasonStats(season: number, refetch: boolean): Promise<CachedStatRow[]> {
  const file = path.join(STATS_CACHE, `stats-${season}.json`);
  if (!refetch && fs.existsSync(file)) {
    return JSON.parse(fs.readFileSync(file, "utf8")) as CachedStatRow[];
  }
  const out: CachedStatRow[] = [];
  let cursor: number | undefined;
  for (let page = 0; page < 600; page++) {
    const body = await bdlNbaGetJson<BdlListResponse<BdlStatRow>>("/nba/v1/stats", {
      "seasons[]": season,
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
    if (page % 50 === 0) console.error(`stats ${season} page ${page} rows ${out.length}`);
    const next = body.meta?.next_cursor;
    if (next == null || chunk.length === 0) break;
    cursor = next;
  }
  fs.mkdirSync(STATS_CACHE, { recursive: true });
  fs.writeFileSync(file, JSON.stringify(out));
  console.error(`fetched stats ${season}: ${out.length} rows`);
  return out;
}

function toGames(season: number, games: BdlGame[]): OutImpactGame[] {
  return games
    .filter(
      (g) =>
        g.home_team?.id != null &&
        g.visitor_team?.id != null &&
        g.date &&
        (g.home_team_score ?? 0) > 0 &&
        (g.visitor_team_score ?? 0) > 0 &&
        !g.postponed
    )
    .map((g) => {
      const usDate = g.date!.slice(0, 10);
      const ms = Date.parse(g.datetime ?? `${usDate}T00:00:00Z`);
      return {
        id: String(g.id),
        seasonKey: seasonLabel(season),
        startMs: Number.isFinite(ms) ? ms : Date.parse(`${usDate}T00:00:00Z`),
        usDate,
        homeTeamId: String(g.home_team!.id),
        awayTeamId: String(g.visitor_team!.id),
        homeScore: g.home_team_score!,
        awayScore: g.visitor_team_score!,
      };
    });
}

function toStats(rows: CachedStatRow[]): OutImpactStatRow[] {
  return rows.map((r) => ({
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
}

function rmse(xs: number[]): number {
  return Math.sqrt(xs.reduce((s, x) => s + x * x, 0) / xs.length);
}

function round(n: number, d = 2): number {
  const f = 10 ** d;
  return Math.round(n * f) / f;
}

function numericHash(id: string): number {
  const n = Number(id);
  if (Number.isFinite(n)) return n;
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}

async function main() {
  loadEnvLocal();
  const refetch = process.argv.includes("--refetch");
  const players: OutImpactPlayer[] = [];
  const obs: OutImpactObs[] = [];
  for (const season of SEASONS) {
    const games = JSON.parse(
      fs.readFileSync(path.join(GAMES_CACHE, `games-${season}.json`), "utf8")
    ) as BdlGame[];
    const stats = await loadSeasonStats(season, refetch);
    obs.push(
      ...buildOutImpactObservations(seasonLabel(season), toGames(season, games), toStats(stats), players)
    );
  }
  const withOutGames = obs.filter((o) => o.outHome.length + o.outAway.length > 0).length;
  console.error(
    `games ${obs.length} (with outs ${withOutGames}) · listed player-seasons ${players.length} · rotation ${players.filter((p) => p.rotation).length}`
  );

  // 5 分割 CV: 欠場なし vs 欠場あり（λ ごと）
  const foldOf = (o: OutImpactObs) => numericHash(o.gameId) % FOLDS;
  const resid = new Map<number | "none", { all: number[]; outs: number[]; big: number[] }>();
  const bigOut = new Set<string>();
  for (let k = 0; k < FOLDS; k++) {
    const train = obs.filter((o) => foldOf(o) !== k);
    const test = obs.filter((o) => foldOf(o) === k);
    const fits: Array<[number | "none", OutImpactFit]> = [
      ["none", fitOutImpact(train, players, { lambda: 1, withOuts: false })],
    ];
    for (const lambda of LAMBDAS) fits.push([lambda, fitOutImpact(train, players, { lambda })]);
    const ref = fits.find(([key]) => key === 40)![1];
    const sumImpact = (list: number[]) =>
      list.reduce((s, pi) => s + outImpactOfPlayer(ref, players, pi).total, 0);
    for (const o of test) {
      if (Math.abs(sumImpact(o.outHome) - sumImpact(o.outAway)) >= BIG_OUT_POINTS) bigOut.add(o.gameId);
    }
    for (const [key, f] of fits) {
      const r = resid.get(key) ?? { all: [], outs: [], big: [] };
      for (const o of test) {
        const e = o.y - predictOutImpactGame(o, players, f);
        r.all.push(e);
        if (o.outHome.length + o.outAway.length > 0) r.outs.push(e);
        if (bigOut.has(o.gameId)) r.big.push(e);
      }
      resid.set(key, r);
    }
    console.error(`fold ${k + 1}/${FOLDS} done`);
  }
  const cv = [...resid].map(([lambda, r]) => ({
    lambda,
    rmseAll: round(rmse(r.all), 3),
    rmseOutGames: round(rmse(r.outs), 3),
    rmseBigOutGames: round(rmse(r.big), 3),
  }));
  const lambda = cv
    .filter((c) => c.lambda !== "none")
    .sort((a, b) => a.rmseAll - b.rmseAll)[0]!.lambda as number;

  const final = fitOutImpact(obs, players, { lambda });
  let sse = 0;
  for (const o of obs) sse += (o.y - predictOutImpactGame(o, players, final)) ** 2;
  const sigma2 = sse / obs.length;
  const gamma = Object.fromEntries(
    OUT_IMPACT_FEATURES.map((name, j) => [name, round(final.gamma[j]!, 4)])
  );

  const latest = seasonLabel(SEASONS[SEASONS.length - 1]!);
  const latestRows = players
    .map((p, pi) => ({ p, ...outImpactOfPlayer(final, players, pi) }))
    .filter((r) => r.p.seasonKey === latest && r.p.rotation)
    .sort((a, b) => a.total - b.total);
  const fmt = (r: (typeof latestRows)[number]) => ({
    name: r.p.playerName,
    bdlTeam: r.p.teamId,
    impact: round(r.total, 1),
    statPrior: round(r.prior, 1),
    gamesOut: r.p.gamesOut,
    mpg: round(r.p.x[0]!, 1),
    ppg: round(r.p.x[1]!, 1),
  });
  const pick = (needle: string) =>
    latestRows.filter((r) => r.p.playerName.includes(needle)).map(fmt);

  const output = {
    generatedAt: new Date().toISOString(),
    data: {
      seasons: SEASONS.map(seasonLabel),
      games: obs.length,
      gamesWithOuts: withOutGames,
      rotationPlayerSeasons: players.filter((p) => p.rotation).length,
      rotation: { minGames: OUT_IMPACT_ROTATION_MIN_GAMES, minMpg: OUT_IMPACT_ROTATION_MIN_MPG },
    },
    cv,
    bigOutGames: bigOut.size,
    chosenLambda: lambda,
    tauSquared: round(sigma2 / lambda, 2),
    residualSd: round(Math.sqrt(sigma2), 3),
    homeCourt: round(outImpactHomeCourt(final), 3),
    gamma,
    latestSeasonMostImpactful: latestRows.slice(0, 25).map(fmt),
    latestSeasonLeastImpactful: latestRows.slice(-10).map(fmt),
    examples: {
      sga: pick("Gilgeous"),
      embiid: pick("Embiid"),
      wells: pick("Jaylen Wells"),
      tatum: pick("Tatum"),
      jokic: pick("Jok"),
      brown: pick("Jaylen Brown"),
    },
  };
  fs.writeFileSync(
    path.join(process.cwd(), "docs", "nba-injury-impact-fit.json"),
    `${JSON.stringify(output, null, 2)}\n`
  );
  fs.writeFileSync(
    path.join(process.cwd(), "lib", "nba", "injuryImpact", "fittedOutImpact.ts"),
    [
      "/** 自動生成: scripts/nba-injury-impact-fit.ts（手で編集しない） */",
      "",
      `export const OUT_IMPACT_FIT_SEASONS = ${JSON.stringify(output.data.seasons)} as const;`,
      "",
      "/** 個人差の寄せ（ridge λ）。大きいほどスタッツの目安に寄る */",
      `export const OUT_IMPACT_LAMBDA = ${lambda};`,
      "",
      "/** スタッツの目安 = Σ γ × 1 試合平均（OUT_IMPACT_FEATURES 順） */",
      `export const OUT_IMPACT_GAMMA = ${JSON.stringify(OUT_IMPACT_FEATURES.map((f) => gamma[f]))} as const;`,
      "",
    ].join("\n")
  );
  console.log(JSON.stringify(output, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
