// 月次レポート「予想のクセ」— 集計値 → スタイルマップ用バイアス + 勝率 + 短文。
// docs/pro-subscription-plan.md §4 予想のクセ（Pro Stats ハイブリッド）

import type { MonthlyReportHabits } from "@/lib/reports/monthlyReportTypes";

export const MONTHLY_HABIT_MIN_SIDE_POSTS = 3;

export type MonthlyHabitSideStats = {
  posts: number;
  wins: number;
};

export type MonthlyHabitsRaw = {
  home: MonthlyHabitSideStats;
  away: MonthlyHabitSideStats;
  favorite: MonthlyHabitSideStats;
  underdog: MonthlyHabitSideStats;
  /** 総合勝率 0–1（点サイズ）。省略時は全サイド合算 */
  winRate?: number;
};

function clamp(v: number, min = -1, max = 1) {
  return Math.min(max, Math.max(min, v));
}

function rate(side: MonthlyHabitSideStats): number {
  return side.posts > 0 ? side.wins / side.posts : 0;
}

function sharePair(
  a: MonthlyHabitSideStats,
  b: MonthlyHabitSideStats
): { a: number; b: number } {
  const tot = a.posts + b.posts;
  if (tot <= 0) return { a: 0.5, b: 0.5 };
  return { a: a.posts / tot, b: b.posts / tot };
}

/** Pro Stats と同じ: (homePosts - awayPosts) / total */
export function computeHomeAwayBias(
  home: MonthlyHabitSideStats,
  away: MonthlyHabitSideStats
): number {
  const tot = home.posts + away.posts;
  if (tot <= 0) return 0;
  return clamp((home.posts - away.posts) / tot);
}

/** Pro Stats と同じ: (0.5 - favoriteShare) * 2 */
export function computeMarketBias(
  favorite: MonthlyHabitSideStats,
  underdog: MonthlyHabitSideStats
): number {
  const tot = favorite.posts + underdog.posts;
  if (tot <= 0) return 0;
  const favRate = favorite.posts / tot;
  return clamp((0.5 - favRate) * 2);
}

export function buildHabitsStyleComment(
  homeAwayBias: number,
  marketBias: number,
  winRate: number,
  lang: "ja" | "en" = "ja"
): { title: string; body: string } {
  const x = homeAwayBias;
  const y = -marketBias;
  const winPct = Math.round(winRate * 100);
  const DEAD = 0.12;

  let axisLabel = lang === "en" ? "Balanced" : "バランス";
  let typeLabel = lang === "en" ? "Balanced" : "バランス型";
  let tendency =
    lang === "en"
      ? "No strong venue or market lean this month."
      : "会場・市場どちらにも強い偏りはなかった。";

  if (x > DEAD && y > DEAD) {
    axisLabel = lang === "en" ? "Home × Consensus" : "Home × 順当";
    typeLabel = lang === "en" ? "Theory-first" : "セオリー重視タイプ";
    tendency =
      lang === "en"
        ? "You leaned into home edges and market favorites."
        : "ホーム有利と市場の評価を素直に信頼する読みが多かった。";
  } else if (x > DEAD && y < -DEAD) {
    axisLabel = lang === "en" ? "Home × Fade" : "Home × 逆張り";
    typeLabel = lang === "en" ? "Context reader" : "文脈判断タイプ";
    tendency =
      lang === "en"
        ? "Even on home sides, you faded the crowd when the spot called for it."
        : "ホーム側でも状況次第で市場と逆を取る柔軟さが出ていた。";
  } else if (x < -DEAD && y > DEAD) {
    axisLabel = lang === "en" ? "Away × Consensus" : "Away × 順当";
    typeLabel = lang === "en" ? "Condition flip" : "条件反転タイプ";
    tendency =
      lang === "en"
        ? "You respected away spots while still riding consensus value."
        : "アウェー条件を織り込みつつ、順当な期待値を丁寧に拾っていた。";
  } else if (x < -DEAD && y < -DEAD) {
    axisLabel = lang === "en" ? "Away × Fade" : "Away × 逆張り";
    typeLabel = lang === "en" ? "High-risk lean" : "高リスク選好タイプ";
    tendency =
      lang === "en"
        ? "Away underdogs were a real part of your book this month."
        : "不利条件や市場逆張りを積極的に取りにいく月だった。";
  }

  let performance =
    lang === "en"
      ? "Overall hit rate sat in a mid band."
      : "平均的なレンジに収まっている。";
  if (winPct >= 66) {
    performance =
      lang === "en"
        ? "Hit rate is high — this style is clearly working."
        : "この読みの型は今月はっきり機能している。";
  } else if (winPct < 50) {
    performance =
      lang === "en"
        ? "Hit rate is soft — worth tuning the selection axes."
        : "判断軸の調整余地がある。";
  }

  if (lang === "en") {
    return {
      title: `${axisLabel} · ${typeLabel}`,
      body: `${tendency} Overall ${winPct}%. ${performance}`,
    };
  }
  return {
    title: `${axisLabel} の ${typeLabel}`,
    body: `${tendency} 総合勝率 ${winPct}%。${performance}`,
  };
}

function sidesReady(raw: MonthlyHabitsRaw): boolean {
  return (
    raw.home.posts >= MONTHLY_HABIT_MIN_SIDE_POSTS &&
    raw.away.posts >= MONTHLY_HABIT_MIN_SIDE_POSTS &&
    raw.favorite.posts >= MONTHLY_HABIT_MIN_SIDE_POSTS &&
    raw.underdog.posts >= MONTHLY_HABIT_MIN_SIDE_POSTS
  );
}

/**
 * 集計済み Home/Away・市場 → クセブロック。
 * 各サイド最低投稿に満たない場合は null。
 */
export function buildMonthlyHabits(
  raw: MonthlyHabitsRaw,
  lang: "ja" | "en" = "ja"
): MonthlyReportHabits | null {
  if (!sidesReady(raw)) return null;

  const ha = sharePair(raw.home, raw.away);
  const mk = sharePair(raw.favorite, raw.underdog);
  const homeAwayBias = computeHomeAwayBias(raw.home, raw.away);
  const marketBias = computeMarketBias(raw.favorite, raw.underdog);

  const allPosts =
    raw.home.posts + raw.away.posts + raw.favorite.posts + raw.underdog.posts;
  // home+away と favorite+underdog は同一投稿の二重分類なので勝率は HA 側を使う
  const haPosts = raw.home.posts + raw.away.posts;
  const haWins = raw.home.wins + raw.away.wins;
  const winRate =
    raw.winRate ?? (haPosts > 0 ? haWins / haPosts : allPosts > 0 ? 0 : 0);

  const comment = buildHabitsStyleComment(
    homeAwayBias,
    marketBias,
    winRate,
    lang
  );

  return {
    homeAwayBias,
    marketBias,
    winRate,
    home: { winRate: rate(raw.home), share: ha.a },
    away: { winRate: rate(raw.away), share: ha.b },
    favorite: { winRate: rate(raw.favorite), share: mk.a },
    underdog: { winRate: rate(raw.underdog), share: mk.b },
    summaryTitle: comment.title,
    summaryBody: comment.body,
  };
}
