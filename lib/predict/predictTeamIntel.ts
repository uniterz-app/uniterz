/**
 * 柱 3 タイミング — Pro Info（両チームカード）。
 *
 * あなた × チームの成績 + チーム状況バッジ（連勝 / HOME / B2B / vs Top 等）。
 * @see docs/pro-subscription-plan.md 柱 3 · チーム文脈チップ
 */

export type PredictTeamTone = "up" | "down" | "neutral";

/** 自分のそのチームでの通算成績（context_cache.teams[teamId]） */
export type PredictTeamPersonal = {
  /** 母数（そのチームの試合を予想した数） */
  posts: number;
  /** 的中数 */
  wins: number;
};

/** 勝率（0..1）。posts=0 は null */
export function personalWinRate(
  personal: PredictTeamPersonal | null
): number | null {
  if (!personal || personal.posts <= 0) return null;
  return personal.wins / personal.posts;
}

/** チーム自身の文脈（試合結果・順位・日程から算出。予想ではない公開事実） */
export type PredictTeamContextId =
  | "recentForm" // 直近フォーム（直近 N 試合 W/D/L）
  | "winStreak" // 連勝中
  | "loseStreak" // 連敗中
  | "giantKilling" // 格上撃破（自分より上位の相手に勝利）
  | "recentUpset" // ここ最近アップセットを起こしている
  | "sideForm" // ホーム/アウェイ別の直近成績
  | "vsTop" // 対上位（例 Top10）戦績
  | "rest"; // B2B / 3-in-4 / 休養日

/** rest チップの種別。wins/losses/n でシーズン切片、location で移動あり B2B 等 */
export type PredictRestKind = "b2b" | "threeInFour" | "rested";

export type PredictTeamContext = {
  id: PredictTeamContextId;
  tone: PredictTeamTone;
  params: Record<string, string | number>;
};

export type PredictTeamIntel = {
  teamId: string;
  teamName: string;
  side: "home" | "away";
  /** 最小投稿数未満は null（勝率を出さない） */
  personal: PredictTeamPersonal | null;
  /** 表示は上位最大件数（状況を複数伝える） */
  contexts: PredictTeamContext[];
};

export const MIN_TEAM_PERSONAL_POSTS = 5;
export const TEAM_STRONG_WIN_RATE = 0.58;
export const TEAM_WEAK_WIN_RATE = 0.42;
/** 連勝・サイド・休息・対上位など。表示は上位 3 行（深い行 UI） */
export const MAX_TEAM_CONTEXTS = 5;

export function teamPersonalTone(
  personal: PredictTeamPersonal | null
): PredictTeamTone {
  const rate = personalWinRate(personal);
  if (rate == null) return "neutral";
  if (rate >= TEAM_STRONG_WIN_RATE) return "up";
  if (rate <= TEAM_WEAK_WIN_RATE) return "down";
  return "neutral";
}

export function pctFromRate(rate: number): number {
  const v = rate <= 1 ? rate * 100 : rate;
  return Math.round(v);
}

/** 直近フォームから現在の連勝数（末尾=最新 からの W 連続） */
export function currentWinStreak(
  results: ReadonlyArray<"W" | "D" | "L">
): number {
  let n = 0;
  for (let i = results.length - 1; i >= 0; i -= 1) {
    if (results[i] === "W") n += 1;
    else break;
  }
  return n;
}

/** 直近フォームから現在の連敗数（末尾=最新 からの L 連続） */
export function currentLoseStreak(
  results: ReadonlyArray<"W" | "D" | "L">
): number {
  let n = 0;
  for (let i = results.length - 1; i >= 0; i -= 1) {
    if (results[i] === "L") n += 1;
    else break;
  }
  return n;
}
