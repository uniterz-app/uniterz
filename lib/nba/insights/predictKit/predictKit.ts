/**
 * Pro Insight「予想の材料」: 勝ち負けの傾き（3 段階）と点数の傾向（3 段階）。純関数。
 *
 * 傾き = Matchup Difficulty の回帰（ホーム + 実力差 × ratingScale + 休養）に欠場の影響（点）を足した期待点差を
 * P(勝ち) = Φ(M / σ) にして段階分け。点数 = 両チームの得点・失点のリーグ平均差（前季で縮小）の和。
 *
 * バックテスト（scripts/backtest-predict-kit.ts・欠場なし・2026-11-12）:
 * - 傾き: 互角 予想 55% → 実際 54〜57%、やや有利 66% → 68〜72%、有利 80% → 80〜83%（2024-25 / 2025-26 各 1237 試合）
 * - 点数: 合計の誤差 RMSE 18.4〜19.0（リーグ平均だけ 19.0〜19.9）。半分の試合が入る幅は合計 ±12.4〜13.0、チーム得点 ±7.8〜8.5。
 *   ハイスコア寄り = 実際リーグ平均比 +8.5〜+9.9、ロースコア寄り = −8.7
 */
import { MATCHUP_DIFFICULTY_COEFFICIENTS as C } from "@/lib/nba/matchupDifficulty/fittedCoefficients";
import { blendTeamRating, normCdf } from "@/lib/nba/matchupDifficulty/model";
import {
  restCategoryFromDays,
  restDaysBetweenGameDates,
  type RestCategory,
} from "@/lib/nba/matchupDifficulty/features";
import { preseasonWinTotalCentered } from "@/lib/nba/matchupDifficulty/preseasonWinTotals";
import { proInsightTeamAbbr } from "@/lib/nba/insights/proInsightFacts/teamAbbr";

export const PREDICT_KIT_TOTAL_TUNING = { k: 10, carry: 0.4 } as const;
/** 予想合計がリーグ平均 × 2 からこれ以上ずれたらハイ / ロースコア寄り */
export const PREDICT_KIT_TOTAL_TIER_PTS = 5;
/** 有利側の勝つ確率の境目（未満なら互角、未満ならやや有利、以上は有利） */
export const PREDICT_KIT_LEAN_EVEN_MAX_P = 0.6;
export const PREDICT_KIT_LEAN_SLIGHT_MAX_P = 0.72;
/** 内訳に出す要因の最小の大きさ（点） */
export const PREDICT_KIT_FACTOR_MIN_PTS = 1;
/** 予想合計のレンジの半幅（2024-25〜2026-27 で実際の合計の約半分が入る幅） */
export const PREDICT_KIT_TOTAL_BAND_PTS = 13;
/** 序盤、リーグ平均をこの試合数（チーム試合）まで前季で埋める */
const LEAGUE_AVG_FILL_TEAM_GAMES = 40;

export type PredictKitFinalGame = {
  /** 米国東部の試合日 YYYY-MM-DD */
  date: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
};

export type PredictKitTeamState = {
  n: number;
  wins: number;
  sumMargin: number;
  last10: number[];
  lastDate: string | null;
  pf: number;
  pa: number;
};

export type PredictKitSeasonFinal = {
  margin: Record<string, number>;
  off: Record<string, number>;
  def: Record<string, number>;
  leagueAvg: number;
};

export type PredictKitSeasonState = {
  seasonKey: string;
  teams: Record<string, PredictKitTeamState>;
  leagueTeamGames: number;
  leaguePts: number;
  prior: PredictKitSeasonFinal | null;
};

export function emptyPredictKitSeason(seasonKey: string, prior: PredictKitSeasonFinal | null): PredictKitSeasonState {
  return { seasonKey, teams: {}, leagueTeamGames: 0, leaguePts: 0, prior };
}

function teamOf(s: PredictKitSeasonState, id: string): PredictKitTeamState {
  return (s.teams[id] ??= { n: 0, wins: 0, sumMargin: 0, last10: [], lastDate: null, pf: 0, pa: 0 });
}

/** 1 試合ぶん状態を進める（日付順に呼ぶ。同じ 2 チーム・同じ日の重複は呼び出し側で除く） */
export function recordPredictKitGame(s: PredictKitSeasonState, g: PredictKitFinalGame): void {
  const m = g.homeScore - g.awayScore;
  for (const [id, mm, pf, pa] of [
    [g.homeTeamId, m, g.homeScore, g.awayScore],
    [g.awayTeamId, -m, g.awayScore, g.homeScore],
  ] as const) {
    const t = teamOf(s, id);
    t.n += 1;
    if (mm > 0) t.wins += 1;
    t.sumMargin += mm;
    t.last10.push(mm);
    if (t.last10.length > 10) t.last10.shift();
    t.lastDate = g.date;
    t.pf += pf;
    t.pa += pa;
  }
  s.leaguePts += g.homeScore + g.awayScore;
  s.leagueTeamGames += 2;
}

/** 今季の試合（日付順）。cleanMargin = ガベージタイムを抜いたホーム視点の点差（無い試合は最終点差） */
export type PredictKitStrengthGame = { homeTeamId: string; awayTeamId: string; cleanMargin: number };

/** ホーム有利を引いた点差 + 相手の強さ（SRS）を反復で解く。リーグ平均 0・1 試合あたりの点 */
export function predictKitSrs(games: PredictKitStrengthGame[]): Record<string, number> {
  const teams = [...new Set(games.flatMap((g) => [g.homeTeamId, g.awayTeamId]))];
  let r: Record<string, number> = Object.fromEntries(teams.map((t) => [t, 0]));
  for (let it = 0; it < 60; it++) {
    const sum: Record<string, number> = {};
    const n: Record<string, number> = {};
    for (const g of games) {
      const m = g.cleanMargin - C.homeCourt;
      sum[g.homeTeamId] = (sum[g.homeTeamId] ?? 0) + m + r[g.awayTeamId]!;
      sum[g.awayTeamId] = (sum[g.awayTeamId] ?? 0) - m + r[g.homeTeamId]!;
      n[g.homeTeamId] = (n[g.homeTeamId] ?? 0) + 1;
      n[g.awayTeamId] = (n[g.awayTeamId] ?? 0) + 1;
    }
    const next = teams.map((t) => sum[t]! / n[t]!);
    const mean = next.reduce((a, b) => a + b, 0) / Math.max(1, teams.length);
    r = Object.fromEntries(teams.map((t, i) => [t, next[i]! - mean]));
  }
  return r;
}

/**
 * 実力差の今季分（平均得失点差・直近 10 試合）を、ガベージタイム抜き + 相手補正（SRS）と
 * ガベージタイム抜きの直近 10 試合に差し替えた状態。勝敗・得点・休養はそのまま。
 * 2026-27 の 170 試合の再生でブライアー 0.2059 → 0.2036・点差 RMSE 15.11 → 15.01。
 */
export function withCleanSosStrength(
  s: PredictKitSeasonState,
  games: PredictKitStrengthGame[]
): PredictKitSeasonState {
  const srs = predictKitSrs(games);
  const last10: Record<string, number[]> = {};
  for (const g of games) {
    (last10[g.homeTeamId] ??= []).push(g.cleanMargin);
    (last10[g.awayTeamId] ??= []).push(-g.cleanMargin);
  }
  const teams: PredictKitSeasonState["teams"] = {};
  for (const [id, t] of Object.entries(s.teams)) {
    teams[id] = {
      ...t,
      sumMargin: (srs[id] ?? 0) * t.n,
      last10: (last10[id] ?? t.last10).slice(-10),
    };
  }
  return { ...s, teams };
}

export function finalizePredictKitSeason(s: PredictKitSeasonState): PredictKitSeasonFinal {
  const lg = s.leagueTeamGames ? s.leaguePts / s.leagueTeamGames : 112;
  const entries = Object.entries(s.teams).filter(([, t]) => t.n > 0);
  return {
    margin: Object.fromEntries(entries.map(([id, t]) => [id, t.sumMargin / t.n])),
    off: Object.fromEntries(entries.map(([id, t]) => [id, t.pf / t.n - lg])),
    def: Object.fromEntries(entries.map(([id, t]) => [id, t.pa / t.n - lg])),
    leagueAvg: lg,
  };
}

export function predictKitLeagueAvg(s: PredictKitSeasonState): number {
  const n = s.leagueTeamGames;
  if (!s.prior || n >= LEAGUE_AVG_FILL_TEAM_GAMES) return n ? s.leaguePts / n : s.prior?.leagueAvg ?? 112;
  return (s.leaguePts + (LEAGUE_AVG_FILL_TEAM_GAMES - n) * s.prior.leagueAvg) / LEAGUE_AVG_FILL_TEAM_GAMES;
}

export function predictKitTeamRating(s: PredictKitSeasonState, teamId: string): number {
  const t = teamOf(s, teamId);
  return blendTeamRating(
    {
      gamesPlayed: t.n,
      seasonMargin: t.n ? t.sumMargin / t.n : 0,
      last10Margin: t.last10.length ? t.last10.reduce((a, b) => a + b, 0) / t.last10.length : 0,
      priorSeasonMargin: s.prior?.margin[teamId] ?? 0,
      winTotalCentered: preseasonWinTotalCentered(s.seasonKey, proInsightTeamAbbr(teamId)),
    },
    C
  );
}

export function predictKitRest(s: PredictKitSeasonState, teamId: string, gameDate: string): RestCategory {
  return restCategoryFromDays(restDaysBetweenGameDates(teamOf(s, teamId).lastDate, gameDate));
}

/** 予想合計 − リーグ平均 × 2（点） */
export function predictKitTotalVsLeague(s: PredictKitSeasonState, homeTeamId: string, awayTeamId: string): number {
  const lg = predictKitLeagueAvg(s);
  const { k, carry } = PREDICT_KIT_TOTAL_TUNING;
  const side = (id: string) => {
    const t = teamOf(s, id);
    const blend = (cur: number, pr: number) => (t.n * cur + k * carry * pr) / (t.n + k);
    return {
      off: blend(t.n ? t.pf / t.n - lg : 0, s.prior?.off[id] ?? 0),
      def: blend(t.n ? t.pa / t.n - lg : 0, s.prior?.def[id] ?? 0),
    };
  };
  const h = side(homeTeamId);
  const a = side(awayTeamId);
  return h.off + a.def + a.off + h.def;
}

export type PredictKitLeanTier = "even" | "slight" | "clear";
export type PredictKitPaceTier = "low" | "mid" | "high";

export type PredictKitFactor =
  | { kind: "strength"; teamId: string; pts: number }
  | { kind: "home"; teamId: string; pts: number }
  | { kind: "rest"; teamId: string; rest: RestCategory; pts: number }
  | { kind: "injury"; teamId: string; players: string[]; pts: number };

export type PredictKit = {
  /** 有利なチーム（互角のときも確率が高い側を入れる） */
  favoredTeamId: string;
  lean: PredictKitLeanTier;
  /** 有利側が勝つ確率（0〜1） */
  favoredWinP: number;
  /** ホーム視点の期待点差 */
  homeMargin: number;
  /** 傾きを 1 点以上動かした要因（有利側から見た点。正 = 有利側を押す） */
  factors: PredictKitFactor[];
  pace: PredictKitPaceTier;
  /** 予想合計 − リーグ平均 × 2 */
  totalVsLeague: number;
  /** 予想スコア（合計 = リーグ平均 × 2 + totalVsLeague、点差 = homeMargin で両チームに分ける） */
  score: { home: number; away: number; total: number; leagueTotal: number };
  /** 試合前の今季成績（実数・縮小なし） */
  teams: { home: PredictKitTeamLine; away: PredictKitTeamLine };
};

export type PredictKitTeamLine = {
  wins: number;
  losses: number;
  /** 1 試合平均の得失点差 */
  margin: number;
  /** 1 試合平均の得点・失点 */
  pf: number;
  pa: number;
};

function teamLine(s: PredictKitSeasonState, teamId: string): PredictKitTeamLine {
  const t = teamOf(s, teamId);
  const per = (x: number) => (t.n ? x / t.n : 0);
  return { wins: t.wins, losses: t.n - t.wins, margin: per(t.sumMargin), pf: per(t.pf), pa: per(t.pa) };
}

export type PredictKitInjury = { teamId: string; playerName: string; netDelta: number };

export function leanTierFromP(p: number): PredictKitLeanTier {
  if (p < PREDICT_KIT_LEAN_EVEN_MAX_P) return "even";
  if (p < PREDICT_KIT_LEAN_SLIGHT_MAX_P) return "slight";
  return "clear";
}

export function buildPredictKit(input: {
  season: PredictKitSeasonState;
  homeTeamId: string;
  awayTeamId: string;
  /** 米国東部の試合日 */
  gameDate: string;
  /** 欠場の今夜効く分（`NbaInjuryOutImpact.netDelta`・0 以下） */
  injuries: PredictKitInjury[];
}): PredictKit {
  const { season: s, homeTeamId: home, awayTeamId: away } = input;
  const hr = predictKitRest(s, home, input.gameDate);
  const ar = predictKitRest(s, away, input.gameDate);
  const ratingPart = C.ratingScale * (predictKitTeamRating(s, home) - predictKitTeamRating(s, away));
  const restPart = C.ownRest[hr] + C.oppRest[ar];
  const injSum = (teamId: string) =>
    input.injuries.filter((i) => i.teamId === teamId).reduce((sum, i) => sum + i.netDelta, 0);
  const injuryPart = injSum(home) - injSum(away);
  const homeMargin = C.homeCourt + ratingPart + restPart + injuryPart;
  const pHome = normCdf(homeMargin / C.sigma);
  const favoredHome = pHome >= 0.5;
  const favoredTeamId = favoredHome ? home : away;
  const sign = favoredHome ? 1 : -1;

  const factors: PredictKitFactor[] = [];
  factors.push({ kind: "strength", teamId: ratingPart >= 0 ? home : away, pts: sign * ratingPart });
  factors.push({ kind: "home", teamId: home, pts: sign * C.homeCourt });
  for (const [teamId, rest] of [
    [home, hr],
    [away, ar],
  ] as const) {
    const own = C.ownRest[rest];
    if (own !== 0) factors.push({ kind: "rest", teamId, rest, pts: sign * (teamId === home ? own : -own) });
  }
  for (const teamId of [home, away]) {
    const list = input.injuries.filter((i) => i.teamId === teamId && i.netDelta < 0);
    if (!list.length) continue;
    const pts = injSum(teamId);
    factors.push({
      kind: "injury",
      teamId,
      players: list.sort((a, b) => a.netDelta - b.netDelta).map((i) => i.playerName),
      pts: sign * (teamId === home ? pts : -pts),
    });
  }

  const totalVsLeague = predictKitTotalVsLeague(s, home, away);
  const leagueTotal = 2 * predictKitLeagueAvg(s);
  const total = leagueTotal + totalVsLeague;
  return {
    score: { home: (total + homeMargin) / 2, away: (total - homeMargin) / 2, total, leagueTotal },
    teams: { home: teamLine(s, home), away: teamLine(s, away) },
    favoredTeamId,
    lean: leanTierFromP(Math.max(pHome, 1 - pHome)),
    favoredWinP: Math.max(pHome, 1 - pHome),
    homeMargin,
    factors: factors
      .filter((f) => Math.abs(f.pts) >= PREDICT_KIT_FACTOR_MIN_PTS)
      .sort((a, b) => Math.abs(b.pts) - Math.abs(a.pts)),
    pace:
      totalVsLeague >= PREDICT_KIT_TOTAL_TIER_PTS
        ? "high"
        : totalVsLeague <= -PREDICT_KIT_TOTAL_TIER_PTS
          ? "low"
          : "mid",
    totalVsLeague,
  };
}
