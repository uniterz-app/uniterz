/**
 * Matchup Difficulty v1 — 係数の実測（オフライン・ローカルのみ）。
 *
 *   npx tsx scripts/nba-matchup-difficulty-fit.ts            # キャッシュ優先
 *   npx tsx scripts/nba-matchup-difficulty-fit.ts --refetch  # BDL から取り直し
 *
 * 認証: `.env.local` の BALLDONTLIE_API_KEY
 * 生データ: .tmp/nba-matchup-difficulty/games-{season}.json（gitignore）
 * 出力: docs/nba-matchup-difficulty-fit.json, lib/nba/matchupDifficulty/fittedCoefficients.ts
 */
import fs from "fs";
import path from "path";
import { fetchBdlGames, type BdlGame } from "../lib/nba/bdl/fetchBdlGames";
import {
  restCategoryFromDays,
  restDaysBetweenGameDates,
  type RestCategory,
} from "../lib/nba/matchupDifficulty/features";
import {
  blendTeamRating,
  computeMatchupDifficulty,
  normCdf,
  type MatchupDifficultyCoefficients,
  type TeamRatingParams,
} from "../lib/nba/matchupDifficulty/model";
import { preseasonWinTotalCentered } from "../lib/nba/matchupDifficulty/preseasonWinTotals";

/** BDL season 年（2021 = 2021-22） */
/** 前季の値にだけ使う（学習しない） */
const PRIOR_ONLY_SEASONS = [2019, 2020];
const TRAIN_SEASONS = [2021, 2022, 2023, 2024];
const HOLDOUT_SEASON = 2025;
const ALL_SEASONS = [...PRIOR_ONLY_SEASONS, ...TRAIN_SEASONS, HOLDOUT_SEASON];

const CACHE_DIR = path.join(process.cwd(), ".tmp", "nba-matchup-difficulty");

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

async function loadSeasonGames(season: number, refetch: boolean): Promise<BdlGame[]> {
  const file = path.join(CACHE_DIR, `games-${season}.json`);
  if (!refetch && fs.existsSync(file)) {
    return JSON.parse(fs.readFileSync(file, "utf8")) as BdlGame[];
  }
  const rows = await fetchBdlGames({ seasonYears: [season], postseason: false });
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(file, JSON.stringify(rows));
  console.error(`fetched ${season}: ${rows.length} games`);
  return rows;
}

async function main() {
  loadEnvLocal();
  const refetch = process.argv.includes("--refetch");
  const bySeason = new Map<number, BdlGame[]>();
  for (const season of ALL_SEASONS) {
    bySeason.set(season, await loadSeasonGames(season, refetch));
  }
  if (process.argv.includes("--inspect")) {
    for (const [season, rows] of bySeason) {
      const types = new Map<string, number>();
      const statuses = new Map<string, number>();
      for (const g of rows) {
        const t = `${g.season_type ?? "?"}|${g.ist_stage ?? "-"}`;
        types.set(t, (types.get(t) ?? 0) + 1);
        statuses.set(String(g.status), (statuses.get(String(g.status)) ?? 0) + 1);
      }
      console.log(season, rows.length, Object.fromEntries(types), Object.fromEntries(statuses));
    }
    return;
  }

  const finalMargins = new Map<number, Map<number, number>>();
  const rowsBySeason = new Map<number, GameRow[]>();
  for (const season of ALL_SEASONS) {
    const { rows, finalMarginByTeam } = buildSeasonRows(
      season,
      bySeason.get(season)!,
      finalMargins.get(season - 1) ?? new Map<number, number>()
    );
    finalMargins.set(season, finalMarginByTeam);
    if (!PRIOR_ONLY_SEASONS.includes(season)) rowsBySeason.set(season, rows);
  }
  const trainRows = TRAIN_SEASONS.flatMap((s) => rowsBySeason.get(s)!);
  const holdoutRows = rowsBySeason.get(HOLDOUT_SEASON)!;
  const missingWinTotals = [...trainRows, ...holdoutRows].filter(
    (r) => r.home.winTotal == null || r.away.winTotal == null
  ).length;
  if (missingWinTotals > 0) throw new Error(`win total missing in ${missingWinTotals} games`);

  // 1a) ラインなし（前季得失点差だけ）: w / k / priorCarryover
  const trainNoLines = withoutWinTotals(trainRows);
  const holdoutNoLines = withoutWinTotals(holdoutRows);
  let baseline: { params: RatingParams; fit: OlsFit } | null = null;
  for (const w of [1, 0.9, 0.8, 0.7, 0.6]) {
    for (const k of [6, 8, 10, 12, 15, 20, 25, 30, 40]) {
      for (const rho of [0, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7]) {
        const params = {
          seasonWeight: w,
          shrinkGames: k,
          priorCarryover: rho,
          winTotalScale: 0,
          winTotalPriorCarryover: rho,
        };
        const fit = fitOls(trainNoLines, params);
        if (!baseline || fit.rmse < baseline.fit.rmse) baseline = { params, fit };
      }
    }
  }

  // 1b) 勝ち星ライン prior: w / k / winTotalScale / winTotalPriorCarryover（fallback の rho は 1a）
  let withLines: { params: RatingParams; fit: OlsFit } | null = null;
  const grid: Array<{ w: number; k: number; a: number; b: number; rmse: number }> = [];
  for (const w of [1, 0.9, 0.8, 0.7, 0.6]) {
    for (const k of [10, 15, 20, 25, 30, 40, 50, 60, 80]) {
      for (const a of [0.1, 0.125, 0.15, 0.175, 0.2, 0.225, 0.25, 0.3, 0.35, 0.4]) {
        for (const b of [0, 0.05, 0.1, 0.15, 0.2, 0.3]) {
          const params = {
            seasonWeight: w,
            shrinkGames: k,
            priorCarryover: baseline!.params.priorCarryover,
            winTotalScale: a,
            winTotalPriorCarryover: b,
          };
          const fit = fitOls(trainRows, params);
          grid.push({ w, k, a, b, rmse: fit.rmse });
          if (!withLines || fit.rmse < withLines.fit.rmse) withLines = { params, fit };
        }
      }
    }
  }

  const baselineCoeffs = coeffsFromFit(baseline!.fit, baseline!.params, PLACEHOLDER_COEFFS);
  const withLinesCoeffs = coeffsFromFit(withLines!.fit, withLines!.params, PLACEHOLDER_COEFFS);
  const priorComparison = {
    lastSeasonOnly: {
      params: baseline!.params,
      trainRmse: baseline!.fit.rmse,
      holdout: holdoutSummary(holdoutNoLines, baselineCoeffs),
    },
    winTotals: {
      params: withLines!.params,
      trainRmse: withLines!.fit.rmse,
      holdout: holdoutSummary(holdoutRows, withLinesCoeffs),
    },
  };
  const linesAdopted =
    priorComparison.winTotals.trainRmse < priorComparison.lastSeasonOnly.trainRmse &&
    priorComparison.winTotals.holdout.all.rmse < priorComparison.lastSeasonOnly.holdout.all.rmse;
  const { params, fit } = linesAdopted ? withLines! : baseline!;

  // 制約なし（自休養 / 相手休養を別推定）での対称性チェック
  const unconstrained = fitOls(trainRows, params, { symmetricRest: false });

  const coeffs: MatchupDifficultyCoefficients = {
    ratingScale: fit.beta.ratingDiff,
    homeCourt: fit.beta.home,
    ownRest: {
      "0": fit.beta.rest0,
      "1": 0,
      "2": fit.beta.rest2,
      "3+": fit.beta.rest3p,
    },
    oppRest: {
      "0": -fit.beta.rest0,
      "1": 0,
      "2": -fit.beta.rest2,
      "3+": -fit.beta.rest3p,
    },
    sigma: fit.rmse,
    seasonWeight: params.seasonWeight,
    shrinkGames: params.shrinkGames,
    priorCarryover: params.priorCarryover,
    winTotalScale: params.winTotalScale,
    winTotalPriorCarryover: params.winTotalPriorCarryover,
    lowSampleGames: 10,
    tierSoftMax: 0,
    tierToughMin: 0,
    scheduleTierSoftMax: 0,
    scheduleTierToughMin: 0,
  };

  // 2) tier 境目: 全季・両視点の Difficulty 分布と、チームごと連続 10 試合平均の分布
  const allDifficulties: number[] = [];
  const windowAverages: number[] = [];
  for (const season of [...TRAIN_SEASONS, HOLDOUT_SEASON]) {
    const byTeam = new Map<number, number[]>();
    for (const row of rowsBySeason.get(season)!) {
      const [homeView, awayView] = teamViews(row, coeffs);
      for (const [teamId, view] of [
        [row.home.teamId, homeView!],
        [row.away.teamId, awayView!],
      ] as const) {
        allDifficulties.push(view.difficulty);
        const list = byTeam.get(teamId) ?? [];
        list.push(view.difficulty);
        byTeam.set(teamId, list);
      }
    }
    for (const list of byTeam.values()) {
      for (let i = 0; i + 10 <= list.length; i++) {
        windowAverages.push(list.slice(i, i + 10).reduce((a, b) => a + b, 0) / 10);
      }
    }
  }
  allDifficulties.sort((a, b) => a - b);
  windowAverages.sort((a, b) => a - b);
  coeffs.tierSoftMax = percentile(allDifficulties, 0.25);
  coeffs.tierToughMin = percentile(allDifficulties, 0.75);
  coeffs.scheduleTierSoftMax = percentile(windowAverages, 0.25);
  coeffs.scheduleTierToughMin = percentile(windowAverages, 0.75);

  // 3) holdout 検証
  const holdout = evaluateHoldout(linesAdopted ? holdoutRows : holdoutNoLines, coeffs);

  // 4) 計算例: LAL @ DEN（2025-26 終了時レーティング、LAL B2B / DEN 休養2日）
  const finalHoldout = finalMargins.get(HOLDOUT_SEASON)!;
  const denRating = finalHoldout.get(BDL_DEN) ?? 0;
  const example = computeMatchupDifficulty(
    {
      oppRating: blendTeamRating(
        {
          gamesPlayed: 82,
          seasonMargin: denRating,
          last10Margin: denRating,
          priorSeasonMargin: finalMargins.get(HOLDOUT_SEASON - 1)?.get(BDL_DEN) ?? 0,
          winTotalCentered: preseasonWinTotalCentered(seasonLabel(HOLDOUT_SEASON), "DEN"),
        },
        coeffs
      ),
      isHome: false,
      ownRest: "0",
      oppRest: "2",
      oppGamesPlayed: 82,
    },
    coeffs
  );

  const output = {
    generatedAt: new Date().toISOString(),
    data: {
      source: "BDL /nba/v1/games (postseason=false)",
      priorOnlySeasons: PRIOR_ONLY_SEASONS.map(seasonLabel),
      trainSeasons: TRAIN_SEASONS.map(seasonLabel),
      holdoutSeason: seasonLabel(HOLDOUT_SEASON),
      trainGames: trainRows.length,
      holdoutGames: holdoutRows.length,
    },
    coefficients: roundDeep(coeffs),
    standardErrors: roundDeep(fit.se),
    unconstrainedRestCheck: roundDeep({ beta: unconstrained.beta, se: unconstrained.se }),
    restSampleShare: roundDeep(restShares(trainRows)),
    winTotalGridTop10: grid.sort((a, b) => a.rmse - b.rmse).slice(0, 10).map(roundDeep),
    holdout: roundDeep(holdout),
    linesAdopted,
    priorComparison: roundDeep(priorComparison),
    openingPriors2026: roundDeep(openingPriors("2026-27", finalMargins.get(HOLDOUT_SEASON)!, bySeason.get(HOLDOUT_SEASON)!, coeffs)),
    exampleLalAtDen: roundDeep({ denFinalMargin: denRating, ...example }),
  };

  fs.writeFileSync(
    path.join(process.cwd(), "docs", "nba-matchup-difficulty-fit.json"),
    `${JSON.stringify(output, null, 2)}\n`
  );
  fs.writeFileSync(
    path.join(process.cwd(), "lib", "nba", "matchupDifficulty", "fittedCoefficients.ts"),
    [
      "/** 自動生成: scripts/nba-matchup-difficulty-fit.ts（手で編集しない） */",
      'import type { MatchupDifficultyCoefficients } from "@/lib/nba/matchupDifficulty/model";',
      "",
      `export const MATCHUP_DIFFICULTY_FIT_SEASONS = ${JSON.stringify(output.data.trainSeasons)} as const;`,
      "",
      `export const MATCHUP_DIFFICULTY_COEFFICIENTS: MatchupDifficultyCoefficients = ${JSON.stringify(output.coefficients, null, 2)};`,
      "",
    ].join("\n")
  );
  console.log(JSON.stringify(output, null, 2));
}

const BDL_DEN = 8;

const PLACEHOLDER_COEFFS: MatchupDifficultyCoefficients = {
  ratingScale: 0,
  homeCourt: 0,
  ownRest: { "0": 0, "1": 0, "2": 0, "3+": 0 },
  oppRest: { "0": 0, "1": 0, "2": 0, "3+": 0 },
  sigma: 1,
  seasonWeight: 1,
  shrinkGames: 0,
  priorCarryover: 0,
  winTotalScale: 0,
  winTotalPriorCarryover: 0,
  lowSampleGames: 10,
  tierSoftMax: 0,
  tierToughMin: 0,
  scheduleTierSoftMax: 0,
  scheduleTierToughMin: 0,
};

function withoutWinTotals(rows: GameRow[]): GameRow[] {
  return rows.map((r) => ({
    ...r,
    home: { ...r.home, winTotal: null },
    away: { ...r.away, winTotal: null },
  }));
}

/** 開幕時点（0 試合）の prior: ラインあり / 前季だけ（期待点差の単位） */
function openingPriors(
  seasonKey: string,
  prevFinal: Map<number, number>,
  prevGames: BdlGame[],
  coeffs: MatchupDifficultyCoefficients
) {
  const abbrById = bdlAbbreviations(prevGames);
  return [...prevFinal.entries()]
    .map(([id, prevMargin]) => {
      const abbr = abbrById.get(id) ?? String(id);
      const input = { gamesPlayed: 0, seasonMargin: 0, last10Margin: 0, priorSeasonMargin: prevMargin };
      return {
        team: abbr,
        prevMargin,
        withLines: blendTeamRating(
          { ...input, winTotalCentered: preseasonWinTotalCentered(seasonKey, abbr) },
          coeffs
        ),
        lastSeasonOnly: blendTeamRating(input, coeffs),
      };
    })
    .sort((a, b) => b.withLines - a.withLines);
}

function bdlAbbreviations(games: BdlGame[]): Map<number, string> {
  const out = new Map<number, string>();
  for (const g of games) {
    if (g.home_team?.id != null && g.home_team.abbreviation) {
      out.set(g.home_team.id, g.home_team.abbreviation);
    }
    if (g.visitor_team?.id != null && g.visitor_team.abbreviation) {
      out.set(g.visitor_team.id, g.visitor_team.abbreviation);
    }
  }
  return out;
}

function coeffsFromFit(
  fit: OlsFit,
  params: RatingParams,
  base: MatchupDifficultyCoefficients
): MatchupDifficultyCoefficients {
  return {
    ...base,
    ...params,
    ratingScale: fit.beta.ratingDiff!,
    homeCourt: fit.beta.home!,
    ownRest: { "0": fit.beta.rest0!, "1": 0, "2": fit.beta.rest2!, "3+": fit.beta.rest3p! },
    oppRest: { "0": -fit.beta.rest0!, "1": 0, "2": -fit.beta.rest2!, "3+": -fit.beta.rest3p! },
    sigma: fit.rmse,
  };
}

function holdoutSummary(rows: GameRow[], coeffs: MatchupDifficultyCoefficients) {
  const early = rows.filter((r) => r.home.n < 20 && r.away.n < 20);
  const veryEarly = rows.filter((r) => r.home.n < 10 && r.away.n < 10);
  const all = evaluateHoldout(rows, coeffs);
  const e = evaluateHoldout(early, coeffs);
  const ve = evaluateHoldout(veryEarly, coeffs);
  return {
    all: { games: all.games, rmse: all.marginRmse, brier: all.brier, acc: all.winAccuracy },
    under20Games: { games: e.games, rmse: e.marginRmse, brier: e.brier, acc: e.winAccuracy },
    under10Games: { games: ve.games, rmse: ve.marginRmse, brier: ve.brier, acc: ve.winAccuracy },
  };
}

type TeamState = { n: number; sum: number; last: number[]; lastDate: string | null };

type TeamSnapshot = {
  teamId: number;
  n: number;
  seasonMargin: number;
  last10Margin: number;
  prior: number;
  /** 勝ち星ライン − 季平均 */
  winTotal: number | null;
  rest: RestCategory;
};

type GameRow = {
  season: number;
  margin: number;
  home: TeamSnapshot;
  away: TeamSnapshot;
};

type RatingParams = TeamRatingParams;

function seasonLabel(year: number): string {
  return `${year}-${String((year + 1) % 100).padStart(2, "0")}`;
}

function buildSeasonRows(
  season: number,
  games: BdlGame[],
  priorByTeam: Map<number, number>
): { rows: GameRow[]; finalMarginByTeam: Map<number, number> } {
  const abbrById = bdlAbbreviations(games);
  const seasonKey = seasonLabel(season);
  const sorted = games
    .filter(
      (g) =>
        g.home_team?.id != null &&
        g.visitor_team?.id != null &&
        g.date &&
        (g.home_team_score ?? 0) > 0 &&
        (g.visitor_team_score ?? 0) > 0 &&
        !g.postponed
    )
    .sort((a, b) =>
      `${a.date}${a.datetime ?? ""}`.localeCompare(`${b.date}${b.datetime ?? ""}`)
    );

  const states = new Map<number, TeamState>();
  const stateOf = (id: number) => {
    let s = states.get(id);
    if (!s) {
      s = { n: 0, sum: 0, last: [], lastDate: null };
      states.set(id, s);
    }
    return s;
  };
  const snapshot = (id: number, date: string): TeamSnapshot => {
    const s = stateOf(id);
    return {
      teamId: id,
      n: s.n,
      seasonMargin: s.n ? s.sum / s.n : 0,
      last10Margin: s.last.length ? s.last.reduce((a, b) => a + b, 0) / s.last.length : 0,
      prior: priorByTeam.get(id) ?? 0,
      winTotal: abbrById.has(id) ? preseasonWinTotalCentered(seasonKey, abbrById.get(id)!) : null,
      rest: restCategoryFromDays(restDaysBetweenGameDates(s.lastDate, date)),
    };
  };
  const record = (id: number, margin: number, date: string) => {
    const s = stateOf(id);
    s.n += 1;
    s.sum += margin;
    s.last.push(margin);
    if (s.last.length > 10) s.last.shift();
    s.lastDate = date;
  };

  const rows: GameRow[] = [];
  for (const g of sorted) {
    const date = g.date!.slice(0, 10);
    const homeId = g.home_team!.id;
    const awayId = g.visitor_team!.id;
    const margin = g.home_team_score! - g.visitor_team_score!;
    rows.push({ season, margin, home: snapshot(homeId, date), away: snapshot(awayId, date) });
    record(homeId, margin, date);
    record(awayId, -margin, date);
  }

  const finalMarginByTeam = new Map<number, number>();
  for (const [id, s] of states) finalMarginByTeam.set(id, s.n ? s.sum / s.n : 0);
  return { rows, finalMarginByTeam };
}

function ratingOf(t: TeamSnapshot, params: RatingParams): number {
  return blendTeamRating(
    {
      gamesPlayed: t.n,
      seasonMargin: t.seasonMargin,
      last10Margin: t.last10Margin,
      priorSeasonMargin: t.prior,
      winTotalCentered: t.winTotal,
    },
    params
  );
}

const restDummy = (c: RestCategory, target: RestCategory) => (c === target ? 1 : 0);

type OlsFit = { beta: Record<string, number>; se: Record<string, number>; rmse: number };

function designRow(row: GameRow, params: RatingParams, symmetricRest: boolean) {
  const base = { home: 1, ratingDiff: ratingOf(row.home, params) - ratingOf(row.away, params) };
  const h = row.home.rest;
  const a = row.away.rest;
  if (symmetricRest) {
    return {
      ...base,
      rest0: restDummy(h, "0") - restDummy(a, "0"),
      rest2: restDummy(h, "2") - restDummy(a, "2"),
      rest3p: restDummy(h, "3+") - restDummy(a, "3+"),
    };
  }
  return {
    ...base,
    homeRest0: restDummy(h, "0"),
    homeRest2: restDummy(h, "2"),
    homeRest3p: restDummy(h, "3+"),
    awayRest0: restDummy(a, "0"),
    awayRest2: restDummy(a, "2"),
    awayRest3p: restDummy(a, "3+"),
  };
}

function fitOls(
  rows: GameRow[],
  params: RatingParams,
  opts: { symmetricRest?: boolean } = {}
): OlsFit {
  const symmetricRest = opts.symmetricRest ?? true;
  const xs = rows.map((r) => designRow(r, params, symmetricRest));
  const names = Object.keys(xs[0]!);
  const p = names.length;
  const xtx = Array.from({ length: p }, () => new Array<number>(p).fill(0));
  const xty = new Array<number>(p).fill(0);
  rows.forEach((r, i) => {
    const x = names.map((n) => (xs[i] as Record<string, number>)[n]!);
    for (let a = 0; a < p; a++) {
      xty[a] += x[a]! * r.margin;
      for (let b = 0; b < p; b++) xtx[a]![b] += x[a]! * x[b]!;
    }
  });
  const inv = invert(xtx);
  const beta = inv.map((rowInv) => rowInv.reduce((s, v, j) => s + v * xty[j]!, 0));
  let sse = 0;
  rows.forEach((r, i) => {
    const pred = names.reduce(
      (s, n, j) => s + beta[j]! * (xs[i] as Record<string, number>)[n]!,
      0
    );
    sse += (r.margin - pred) ** 2;
  });
  const dof = rows.length - p;
  const s2 = sse / dof;
  return {
    beta: Object.fromEntries(names.map((n, j) => [n, beta[j]!])),
    se: Object.fromEntries(names.map((n, j) => [n, Math.sqrt(s2 * inv[j]![j]!)])),
    rmse: Math.sqrt(s2),
  };
}

function invert(m: number[][]): number[][] {
  const n = m.length;
  const a = m.map((row, i) => [...row, ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))]);
  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(a[r]![col]!) > Math.abs(a[pivot]![col]!)) pivot = r;
    }
    [a[col], a[pivot]] = [a[pivot]!, a[col]!];
    const pv = a[col]![col]!;
    for (let j = 0; j < 2 * n; j++) a[col]![j]! /= pv;
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const f = a[r]![col]!;
      for (let j = 0; j < 2 * n; j++) a[r]![j]! -= f * a[col]![j]!;
    }
  }
  return a.map((row) => row.slice(n));
}

/** 両チーム視点の Difficulty と実際の負け */
function teamViews(row: GameRow, coeffs: MatchupDifficultyCoefficients) {
  const homeRating = ratingOf(row.home, coeffs);
  const awayRating = ratingOf(row.away, coeffs);
  const homeView = computeMatchupDifficulty(
    {
      oppRating: awayRating,
      isHome: true,
      ownRest: row.home.rest,
      oppRest: row.away.rest,
      oppGamesPlayed: row.away.n,
    },
    coeffs
  );
  const awayView = computeMatchupDifficulty(
    {
      oppRating: homeRating,
      isHome: false,
      ownRest: row.away.rest,
      oppRest: row.home.rest,
      oppGamesPlayed: row.home.n,
    },
    coeffs
  );
  return [
    { difficulty: homeView.difficulty, lost: row.margin < 0, lowSample: homeView.lowSample },
    { difficulty: awayView.difficulty, lost: row.margin > 0, lowSample: awayView.lowSample },
  ];
}

function evaluateHoldout(rows: GameRow[], coeffs: MatchupDifficultyCoefficients) {
  let sse = 0;
  let brier = 0;
  let logLoss = 0;
  let hits = 0;
  let brierHomeOnly = 0;
  const homeOnlyP = normCdf(coeffs.homeCourt / coeffs.sigma);
  const probBins = Array.from({ length: 10 }, () => ({ n: 0, predSum: 0, wins: 0 }));
  for (const row of rows) {
    const pred =
      coeffs.homeCourt +
      coeffs.ratingScale * (ratingOf(row.home, coeffs) - ratingOf(row.away, coeffs)) +
      coeffs.ownRest[row.home.rest] +
      coeffs.oppRest[row.away.rest];
    const p = Math.min(0.999, Math.max(0.001, normCdf(pred / coeffs.sigma)));
    const won = row.margin > 0 ? 1 : 0;
    sse += (row.margin - pred) ** 2;
    brier += (p - won) ** 2;
    brierHomeOnly += (homeOnlyP - won) ** 2;
    logLoss += -(won * Math.log(p) + (1 - won) * Math.log(1 - p));
    if ((p >= 0.5 ? 1 : 0) === won) hits += 1;
    const bin = probBins[Math.min(9, Math.floor(p * 10))]!;
    bin.n += 1;
    bin.predSum += p;
    bin.wins += won;
  }

  const diffBins = (filter: (v: { lowSample: boolean }) => boolean) => {
    const bins = Array.from({ length: 10 }, () => ({ n: 0, predSum: 0, losses: 0 }));
    for (const row of rows) {
      for (const v of teamViews(row, coeffs)) {
        if (!filter(v)) continue;
        const bin = bins[Math.min(9, Math.floor(v.difficulty / 10))]!;
        bin.n += 1;
        bin.predSum += v.difficulty / 100;
        bin.losses += v.lost ? 1 : 0;
      }
    }
    return bins
      .map((b, i) => ({
        band: `${i * 10}-${i * 10 + 9}`,
        n: b.n,
        predictedLossRate: b.n ? b.predSum / b.n : null,
        actualLossRate: b.n ? b.losses / b.n : null,
      }))
      .filter((b) => b.n > 0);
  };

  const n = rows.length;
  return {
    games: n,
    marginRmse: Math.sqrt(sse / n),
    brier: brier / n,
    brierHomeCourtOnly: brierHomeOnly / n,
    logLoss: logLoss / n,
    winAccuracy: hits / n,
    fullModelCalibration: probBins
      .map((b, i) => ({
        band: `${i * 10}-${i * 10 + 9}%`,
        n: b.n,
        predictedHomeWin: b.n ? b.predSum / b.n : null,
        actualHomeWin: b.n ? b.wins / b.n : null,
      }))
      .filter((b) => b.n > 0),
    difficultyCalibrationAll: diffBins(() => true),
    difficultyCalibrationLowSample: diffBins((v) => v.lowSample),
    difficultyCalibrationEstablished: diffBins((v) => !v.lowSample),
  };
}

function restShares(rows: GameRow[]) {
  const counts: Record<RestCategory, number> = { "0": 0, "1": 0, "2": 0, "3+": 0 };
  for (const r of rows) {
    counts[r.home.rest] += 1;
    counts[r.away.rest] += 1;
  }
  const total = rows.length * 2;
  return Object.fromEntries(
    Object.entries(counts).map(([k, v]) => [k, { teamGames: v, share: v / total }])
  );
}

function percentile(sorted: number[], q: number): number {
  const idx = (sorted.length - 1) * q;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  return sorted[lo]! + (sorted[hi]! - sorted[lo]!) * (idx - lo);
}

function roundDeep<T>(value: T): T {
  if (typeof value === "number") return (Math.round(value * 1000) / 1000) as T;
  if (Array.isArray(value)) return value.map(roundDeep) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, roundDeep(v)])
    ) as T;
  }
  return value;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
