/**
 * 選手の今夜の得点の見込み（中心とレンジ）。純関数。
 * 係数は scripts/backtest-pro-insight-projection.ts で今季の試合ログに当てて決める（シーズン中に取り直す）。
 *
 * 2026-11-12 の検証（981 選手試合・各チーム約 10 試合）: 今季平均を中心にするのが最も当たる。
 * チームメイト欠場の上乗せ・相手の失点の多さはどちらも外れを増やした（欠場 15 点以上の試合でも今季平均の偏りは −0.07 点）。
 * 相手のポジション別失点（r=+0.03）・直近の好調（平均へ戻る）は入れない。
 * absorb / oppWeight は 0。データが増えたらスクリプトの --grid で取り直す。
 */
import type { NbaPlayerGameLog } from "@/lib/predict/nbaPlayerDetailPreviewMocks";

export type PlayerPointsProjectionTuning = {
  /** 欠場者の得点のうち、残った選手に移る割合（得点シェアで按分） */
  absorb: number;
  /** 相手の失点倍率（リーグ平均比）をどれだけ効かせるか。1 = そのまま */
  oppWeight: number;
  /** 本人の「欠場時の得点差」の実測を、按分の見込みと何試合分の重みで混ぜるか */
  loadShiftPriorGames: number;
  /** 得点のばらつき（標準偏差）の事前値 = 平均 × この率。試合数が少ないうちはこちらに寄せる */
  sdPriorRatio: number;
  sdPriorGames: number;
  /** レンジの幅 = 中心 ± z × 標準偏差 */
  z: number;
};

export const PLAYER_POINTS_PROJECTION_TUNING: PlayerPointsProjectionTuning = {
  absorb: 0,
  oppWeight: 0,
  loadShiftPriorGames: 1e9,
  sdPriorRatio: 0.35,
  sdPriorGames: 6,
  z: 0.85,
};

export const PLAYER_POINTS_PROJECTION_MIN_GAMES = 3;

export type PlayerPointsProjectionInput = {
  /** 今夜より前の本人の試合ログ（出場分） */
  logs: Pick<NbaPlayerGameLog, "gameId" | "min" | "pts">[];
  /** 今夜 OUT / doubtful の同じチームの選手の 1 試合平均得点の合計 */
  missingTeammatePpg: number;
  /** 欠場者を除いたローテーション（得点上位 8 人）の得点合計に占める本人のシェア（0–1） */
  shareOfRemaining: number;
  /** 欠場者が出ていない試合 / 出た試合での本人の平均（各 2 試合以上あるときだけ） */
  loadShift?: { withoutPpg: number; withPpg: number; gamesWithout: number } | null;
  /** 今夜の相手の 1 試合平均失点 ÷ リーグ平均 */
  oppAllowedRatio: number | null;
};

export type PlayerPointsProjection = {
  seasonPpg: number;
  mean: number;
  low: number;
  high: number;
  absenceBoost: number;
  oppAdjust: number;
  games: number;
};

const round1 = (n: number) => Math.round(n * 10) / 10;

export function projectPlayerPoints(
  input: PlayerPointsProjectionInput,
  tuning: PlayerPointsProjectionTuning = PLAYER_POINTS_PROJECTION_TUNING
): PlayerPointsProjection | null {
  const logs = input.logs.filter((g) => g.min > 0);
  const n = logs.length;
  if (n < PLAYER_POINTS_PROJECTION_MIN_GAMES) return null;
  const seasonPpg = logs.reduce((s, g) => s + g.pts, 0) / n;

  let absenceBoost =
    input.missingTeammatePpg > 0
      ? input.missingTeammatePpg * tuning.absorb * Math.max(0, Math.min(1, input.shareOfRemaining))
      : 0;
  const shift = input.loadShift;
  if (shift && shift.gamesWithout >= 2) {
    const observed = shift.withoutPpg - shift.withPpg;
    const k = tuning.loadShiftPriorGames;
    absenceBoost = (absenceBoost * k + observed * shift.gamesWithout) / (k + shift.gamesWithout);
  }

  const base = seasonPpg + absenceBoost;
  const ratio = input.oppAllowedRatio;
  const oppFactor =
    ratio != null && Number.isFinite(ratio) && ratio > 0 ? 1 + tuning.oppWeight * (ratio - 1) : 1;
  const mean = Math.max(0, base * oppFactor);

  const variance = logs.reduce((s, g) => s + (g.pts - seasonPpg) ** 2, 0) / Math.max(1, n - 1);
  const priorSd = Math.max(3, seasonPpg * tuning.sdPriorRatio);
  const sd = Math.sqrt(
    (variance * (n - 1) + priorSd ** 2 * tuning.sdPriorGames) / (n - 1 + tuning.sdPriorGames)
  );

  return {
    seasonPpg: round1(seasonPpg),
    mean: round1(mean),
    low: Math.max(0, Math.round(mean - tuning.z * sd)),
    high: Math.round(mean + tuning.z * sd),
    absenceBoost: round1(absenceBoost),
    oppAdjust: round1(mean - base),
    games: n,
  };
}
