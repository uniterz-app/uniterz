/**
 * 選手欠場の影響（1 試合あたりの得失点差、点）— 試合単位の ridge 回帰。
 *
 * 点差(home) = HCA + s[home季] − s[away季] + 休養(Matchup Difficulty の固定係数)
 *            + Σ 欠場(home) β_p − Σ 欠場(away) β_p
 * β_p = X_p·γ（スタッツからの目安）+ u_p（個人差、λ で 0 へ寄せる）
 * s = そのチーム・シーズンの「主力がそろった」強さ。
 *
 * 欠場 = そのチームで ROTATION 条件を満たす選手が、そのチームでの初出場〜最終出場の間に出なかった試合
 * （初出場前・最終出場後の長期離脱は数えない）。
 */
import {
  restCategoryFromDays,
  restDaysBetweenGameDates,
} from "@/lib/nba/matchupDifficulty/features";
import { MATCHUP_DIFFICULTY_COEFFICIENTS as COEFFS } from "@/lib/nba/matchupDifficulty/fittedCoefficients";

export const OUT_IMPACT_FEATURES = ["mpg", "ppg", "rpg", "apg", "stocks", "tov"] as const;
export const OUT_IMPACT_ROTATION_MIN_GAMES = 10;
export const OUT_IMPACT_ROTATION_MIN_MPG = 15;
/** 影響値を出す最低条件（ローテ未満でもスタッツの目安は出す） */
export const OUT_IMPACT_LIST_MIN_GAMES = 3;

export type OutImpactGame = {
  id: string;
  seasonKey: string;
  startMs: number;
  /** 米東部の試合日 YYYY-MM-DD（休養日数の基準） */
  usDate: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
};

/** 出場した box 行（min > 0）だけ */
export type OutImpactStatRow = {
  gameId: string;
  teamId: string;
  playerId: string;
  playerName: string;
  min: number;
  pts: number;
  reb: number;
  ast: number;
  stocks: number;
  tov: number;
};

export type OutImpactPlayer = {
  key: string;
  seasonKey: string;
  teamId: string;
  playerId: string;
  playerName: string;
  games: number;
  /** OUT_IMPACT_FEATURES 順の 1 試合平均 */
  x: number[];
  gamesOut: number;
  rotation: boolean;
};

export type OutImpactObs = {
  gameId: string;
  seasonKey: string;
  y: number;
  homeTeamId: string;
  awayTeamId: string;
  outHome: number[];
  outAway: number[];
};

/** 1 シーズン分の試合と box 行から観測を作り、players に選手を追記する */
export function buildOutImpactObservations(
  seasonKey: string,
  games: OutImpactGame[],
  stats: OutImpactStatRow[],
  players: OutImpactPlayer[]
): OutImpactObs[] {
  const valid = games
    .filter((g) => g.seasonKey === seasonKey && g.homeTeamId && g.awayTeamId)
    .sort((a, b) => a.startMs - b.startMs);
  const order = new Map(valid.map((g, i) => [g.id, i]));

  type Acc = { name: string; idx: number[]; sums: number[]; played: Set<string> };
  const acc = new Map<string, Acc>();
  for (const r of stats) {
    const i = order.get(r.gameId);
    if (i == null || !(r.min > 0)) continue;
    const k = `${r.teamId}:${r.playerId}`;
    let a = acc.get(k);
    if (!a) {
      a = { name: r.playerName, idx: [], sums: [0, 0, 0, 0, 0, 0], played: new Set() };
      acc.set(k, a);
    }
    if (a.played.has(r.gameId)) continue;
    a.played.add(r.gameId);
    a.idx.push(i);
    [r.min, r.pts, r.reb, r.ast, r.stocks, r.tov].forEach((v, j) => (a!.sums[j] += v));
  }

  const rotationByTeam = new Map<
    string,
    Array<{ pi: number; first: number; last: number; played: Set<string> }>
  >();
  for (const [k, a] of acc) {
    const n = a.idx.length;
    const mpg = a.sums[0]! / n;
    if (n < OUT_IMPACT_LIST_MIN_GAMES || mpg < OUT_IMPACT_ROTATION_MIN_MPG) continue;
    const sep = k.indexOf(":");
    const teamId = k.slice(0, sep);
    const playerId = k.slice(sep + 1);
    const rotation = n >= OUT_IMPACT_ROTATION_MIN_GAMES;
    const pi = players.length;
    players.push({
      key: `${seasonKey}:${teamId}:${playerId}`,
      seasonKey,
      teamId,
      playerId,
      playerName: a.name,
      games: n,
      x: a.sums.map((s) => s / n),
      gamesOut: 0,
      rotation,
    });
    if (!rotation) continue;
    const list = rotationByTeam.get(teamId) ?? [];
    list.push({ pi, first: Math.min(...a.idx), last: Math.max(...a.idx), played: a.played });
    rotationByTeam.set(teamId, list);
  }

  const lastDate = new Map<string, string>();
  return valid.map((g, i) => {
    const restOf = (t: string) =>
      restCategoryFromDays(restDaysBetweenGameDates(lastDate.get(t) ?? null, g.usDate));
    const restOffset = COEFFS.ownRest[restOf(g.homeTeamId)] + COEFFS.oppRest[restOf(g.awayTeamId)];
    lastDate.set(g.homeTeamId, g.usDate);
    lastDate.set(g.awayTeamId, g.usDate);
    const outs = (t: string) =>
      (rotationByTeam.get(t) ?? [])
        .filter((r) => i > r.first && i < r.last && !r.played.has(g.id))
        .map((r) => {
          players[r.pi]!.gamesOut += 1;
          return r.pi;
        });
    return {
      gameId: g.id,
      seasonKey,
      y: g.homeScore - g.awayScore - restOffset,
      homeTeamId: g.homeTeamId,
      awayTeamId: g.awayTeamId,
      outHome: outs(g.homeTeamId),
      outAway: outs(g.awayTeamId),
    };
  });
}

/** 対称正定値 A x = b（Cholesky、A は上書き） */
function choleskySolve(a: Float64Array, n: number, b: Float64Array): Float64Array {
  for (let j = 0; j < n; j++) {
    let d = a[j * n + j]!;
    for (let k = 0; k < j; k++) d -= a[j * n + k]! ** 2;
    if (d <= 0) throw new Error(`out-impact fit: matrix not PD at ${j}`);
    const ljj = Math.sqrt(d);
    a[j * n + j] = ljj;
    for (let i = j + 1; i < n; i++) {
      let s = a[i * n + j]!;
      const ri = i * n;
      const rj = j * n;
      for (let k = 0; k < j; k++) s -= a[ri + k]! * a[rj + k]!;
      a[ri + j] = s / ljj;
    }
  }
  const z = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    let s = b[i]!;
    for (let k = 0; k < i; k++) s -= a[i * n + k]! * z[k]!;
    z[i] = s / a[i * n + i]!;
  }
  const x = new Float64Array(n);
  for (let i = n - 1; i >= 0; i--) {
    let s = z[i]!;
    for (let k = i + 1; k < n; k++) s -= a[k * n + i]! * x[k]!;
    x[i] = s / a[i * n + i]!;
  }
  return x;
}

export type OutImpactFit = {
  beta: Float64Array;
  teamSeason: Map<string, number>;
  /** γ を推定したとき列の先頭 index（固定なら null） */
  gammaCol: number | null;
  gamma: number[];
  uCol: number;
  withOuts: boolean;
};

function teamSeasonIndex(obs: OutImpactObs[]): Map<string, number> {
  const m = new Map<string, number>();
  let k = 1;
  for (const o of obs) {
    for (const t of [o.homeTeamId, o.awayTeamId]) {
      const key = `${o.seasonKey}:${t}`;
      if (!m.has(key)) m.set(key, k++);
    }
  }
  return m;
}

/** 1 試合の疎ベクトルと、固定 γ 分のオフセット */
function rowOf(
  o: OutImpactObs,
  players: OutImpactPlayer[],
  layout: Pick<OutImpactFit, "teamSeason" | "gammaCol" | "gamma" | "uCol" | "withOuts">
): { entries: Map<number, number>; offset: number } {
  const entries = new Map<number, number>();
  const add = (i: number, v: number) => entries.set(i, (entries.get(i) ?? 0) + v);
  let offset = 0;
  add(0, 1);
  add(layout.teamSeason.get(`${o.seasonKey}:${o.homeTeamId}`)!, 1);
  add(layout.teamSeason.get(`${o.seasonKey}:${o.awayTeamId}`)!, -1);
  if (layout.withOuts) {
    for (const [list, sign] of [
      [o.outHome, 1],
      [o.outAway, -1],
    ] as const) {
      for (const pi of list) {
        const p = players[pi]!;
        p.x.forEach((x, j) => {
          if (layout.gammaCol != null) add(layout.gammaCol + j, sign * x);
          else offset += sign * x * layout.gamma[j]!;
        });
        add(layout.uCol + pi, sign);
      }
    }
  }
  return { entries, offset };
}

/**
 * gamma を渡すと固定（本番の今季 fit）、省略すると同時推定（オフラインの実測）。
 * withOuts=false は欠場項なしの比較用。
 */
export function fitOutImpact(
  obs: OutImpactObs[],
  players: OutImpactPlayer[],
  opts: { lambda: number; gamma?: readonly number[]; withOuts?: boolean }
): OutImpactFit {
  const withOuts = opts.withOuts !== false;
  const teamSeason = teamSeasonIndex(obs);
  const gammaCol = opts.gamma ? null : teamSeason.size + 1;
  const uCol = (gammaCol ?? teamSeason.size + 1) + (opts.gamma ? 0 : OUT_IMPACT_FEATURES.length);
  const n = uCol + players.length;
  const layout = {
    teamSeason,
    gammaCol,
    gamma: opts.gamma ? [...opts.gamma] : [],
    uCol,
    withOuts,
  };

  const a = new Float64Array(n * n);
  const b = new Float64Array(n);
  for (const o of obs) {
    const { entries, offset } = rowOf(o, players, layout);
    const y = o.y - offset;
    const list = [...entries];
    for (const [i, vi] of list) {
      b[i] += vi * y;
      for (const [j, vj] of list) a[i * n + j] += vi * vj;
    }
  }
  for (let i = 1; i <= teamSeason.size; i++) a[i * n + i] += 1e-3;
  if (gammaCol != null) {
    for (let j = 0; j < OUT_IMPACT_FEATURES.length; j++) {
      a[(gammaCol + j) * n + gammaCol + j] += 1e-6;
    }
  }
  for (let i = uCol; i < n; i++) a[i * n + i] += withOuts ? opts.lambda : 1;

  const beta = choleskySolve(a, n, b);
  const gamma =
    gammaCol != null
      ? OUT_IMPACT_FEATURES.map((_, j) => beta[gammaCol + j]!)
      : layout.gamma;
  return { ...layout, beta, gamma };
}

export function predictOutImpactGame(
  o: OutImpactObs,
  players: OutImpactPlayer[],
  fit: OutImpactFit
): number {
  const { entries, offset } = rowOf(o, players, fit);
  let s = offset;
  for (const [i, v] of entries) s += fit.beta[i]! * v;
  return s;
}

/** prior = スタッツの目安、total = 目安 + 個人差（負 = 欠場でチームが弱くなる） */
export function outImpactOfPlayer(
  fit: OutImpactFit,
  players: OutImpactPlayer[],
  pi: number
): { prior: number; total: number } {
  const p = players[pi]!;
  const prior = p.x.reduce((s, x, j) => s + x * fit.gamma[j]!, 0);
  return { prior, total: prior + (fit.withOuts ? fit.beta[fit.uCol + pi]! : 0) };
}

export function outImpactHomeCourt(fit: OutImpactFit): number {
  return fit.beta[0]!;
}
