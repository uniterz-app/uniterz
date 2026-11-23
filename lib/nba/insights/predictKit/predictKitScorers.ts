/**
 * 試合の得点王（両チーム合わせて最多得点）になりそうな選手と確率。
 * 1 人ずつの得点を 平均 mu・ばらつき sd の正規分布で 4000 回引き、最多になった回数の割合（同点は山分け）。
 * - mu = 今季平均を前季平均へ寄せ（前季分は K 試合ぶん）、直近 5 試合を RECENT_W だけ混ぜる
 * - sd = 0.3·mu + 3 を、今季 4 試合以上あれば試合ごとの散らばりと混ぜる
 * - 欠場: OUT は外す。出場未定は出る確率だけその回に出る
 * - 欠場者の得点を残りの選手に配る補正は入れない（2026-27 の 170 試合で外したほうが当たった）
 * 2026-27 の 248 試合（出場した選手が分かっている前提）で 1 番手 45.6%。
 * 相手の失点（全体 0.4 + 同じポジション 0.8、試合数で shrink）を平均に掛けると 46.8%。
 * 40% 以上と出した試合の当たり 55.3% → 60.3%（scripts/backtest-predict-kit-scorers.ts）。
 */

export const PREDICT_KIT_SCORER_TUNING = {
  priorGames: 6,
  recentWeight: 0.2,
  recentGames: 5,
  sdSlope: 0.3,
  sdBase: 3,
  sdPriorGames: 6,
  minMu: 4,
  runs: 4000,
} as const;

/** 相手の失点で平均得点を動かす強さ（検証 248 試合） */
export const PREDICT_KIT_SCORER_OPP = {
  defW: 0.4,
  posW: 0.8,
  shrinkGames: 10,
  minGames: 5,
  minAdj: 0.82,
  maxAdj: 1.18,
} as const;

export type PredictKitScorerPos = "G" | "F" | "C";

export type PredictKitScorerOppDefense = {
  games: number;
  overall: number;
  overallLeague: number;
  groups: Record<PredictKitScorerPos, { value: number; leagueAvg: number }>;
};

/** 出場未定の選手がその試合に出る確率 */
export const PREDICT_KIT_SCORER_PLAY_PROB: Record<string, number> = {
  probable: 0.9,
  "day-to-day": 0.6,
  questionable: 0.5,
  doubtful: 0.2,
  out: 0,
};

export type PredictKitScorerPlayer = {
  playerId: string;
  teamId: string;
  name: string;
  /** 今季の出場試合数と平均得点（0 試合なら ppg は使わない） */
  gp: number;
  ppg: number;
  /** 前季の平均得点（無ければ null） */
  priorPpg: number | null;
  /** 今季の出場試合の得点（新しい順）。無ければ空 */
  recentPts: number[];
  /** その試合に出る確率（1 = 欠場情報なし） */
  playProb: number;
  pos?: PredictKitScorerPos;
  /** 相手の失点補正（1 = そのまま） */
  oppMuAdj?: number;
};

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

/** 相手がそのポジションに失点しやすいほど 1 より大きい */
export function predictKitScorerOppMuAdj(
  pos: PredictKitScorerPos | null | undefined,
  opp: PredictKitScorerOppDefense | null | undefined
): number {
  const T = PREDICT_KIT_SCORER_OPP;
  if (!opp || opp.games < T.minGames || opp.overallLeague <= 0) return 1;
  const shrink = (raw: number) => 1 + (raw - 1) * (opp.games / (opp.games + T.shrinkGames));
  let adj = 1 + T.defW * (shrink(opp.overall / opp.overallLeague) - 1);
  const g = pos ? opp.groups[pos] : null;
  if (g && g.leagueAvg > 0) {
    adj *= 1 + T.posW * (shrink(g.value / g.leagueAvg) - 1);
  }
  return clamp(adj, T.minAdj, T.maxAdj);
}

export type PredictKitScorerOdds = {
  playerId: string;
  teamId: string;
  name: string;
  /** 得点王になる確率（0〜1） */
  p: number;
  /** 表示用の平均得点（今季。今季未出場なら前季） */
  ppg: number;
  /** 出場未定 */
  doubtful: boolean;
};

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

/** 今季平均を前季へ寄せた期待得点（候補の絞り込みにも使う） */
export function predictKitScorerSeasonMu(p: Pick<PredictKitScorerPlayer, "gp" | "ppg" | "priorPpg">): number {
  const { priorGames: k } = PREDICT_KIT_SCORER_TUNING;
  const base = p.priorPpg ?? (p.gp > 0 ? p.ppg : 3);
  return (p.gp * p.ppg + k * base) / (p.gp + k);
}

export function predictKitScorerOdds(players: PredictKitScorerPlayer[], seed: number): PredictKitScorerOdds[] {
  const T = PREDICT_KIT_SCORER_TUNING;
  const cand = players
    .filter((p) => p.playProb > 0)
    .map((p) => {
      const seasonMu = predictKitScorerSeasonMu(p);
      const recent = p.recentPts.slice(0, T.recentGames);
      const blended =
        recent.length >= 3
          ? (1 - T.recentWeight) * seasonMu + (T.recentWeight * recent.reduce((a, b) => a + b, 0)) / recent.length
          : seasonMu;
      const sd0 = T.sdSlope * blended + T.sdBase;
      const mu = blended * (p.oppMuAdj && p.oppMuAdj > 0 ? p.oppMuAdj : 1);
      const pts = p.recentPts;
      let sd = sd0;
      if (pts.length >= 4) {
        const avg = pts.reduce((a, b) => a + b, 0) / pts.length;
        const emp = pts.reduce((s, x) => s + (x - avg) ** 2, 0) / (pts.length - 1);
        sd = Math.sqrt((pts.length * emp + T.sdPriorGames * sd0 ** 2) / (pts.length + T.sdPriorGames));
      }
      return { p, mu, sd };
    })
    .filter((c) => c.mu >= T.minMu);
  if (!cand.length) return [];

  const r = rng(seed);
  const wins = new Array<number>(cand.length).fill(0);
  const who: number[] = [];
  for (let run = 0; run < T.runs; run++) {
    let best = -1;
    who.length = 0;
    for (let i = 0; i < cand.length; i++) {
      const c = cand[i]!;
      if (c.p.playProb < 1 && r() >= c.p.playProb) continue;
      const z = Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
      const v = Math.max(0, Math.round(c.mu + c.sd * z));
      if (v > best) {
        best = v;
        who.length = 0;
        who.push(i);
      } else if (v === best) who.push(i);
    }
    for (const i of who) wins[i]! += 1 / who.length;
  }
  return cand
    .map((c, i) => ({
      playerId: c.p.playerId,
      teamId: c.p.teamId,
      name: c.p.name,
      p: wins[i]! / T.runs,
      ppg: c.p.gp > 0 ? c.p.ppg : c.p.priorPpg ?? 0,
      doubtful: c.p.playProb < 1,
    }))
    .sort((a, b) => b.p - a.p);
}
