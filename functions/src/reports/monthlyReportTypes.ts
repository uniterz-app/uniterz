// 月次レポート（Pro）— UI とレポート doc の共有型。
// docs/pro-subscription-plan.md §4 月次レポート。
// builder（functions 側）はこの形の doc を user_reports/{uid}_monthly_{YYYY-MM} に書く。

import type { AnalysisTypeId } from "../stats/analysis/types";

/** 能力チャート 5 軸（全体内パーセンタイル 0–100） */
export type MonthlyReportRadarAxisKey =
  | "win"
  | "scorer"
  | "upset"
  | "activity"
  | "consistency";

export type MonthlyReportRadar = Record<MonthlyReportRadarAxisKey, number>;

/** 強み判定の相対ライン（コホート内パーセンタイル）。docs/pro-subscription-plan.md */
export const MONTHLY_REPORT_RADAR_STRENGTH_P = 70;

/** 「数字で見る今月」の指標 */
export type MonthlyReportMetricKey =
  | "posts"
  | "points"
  | "winRate"
  | "goalScorerHits"
  | "upsetPoints"
  | "units";

export type MonthlyReportMetric = {
  key: MonthlyReportMetricKey;
  value: number;
  /** 前月比（絶対差）。前月なしは null */
  prevDelta: number | null;
  /**
   * 全体中央値（絶対値）。
   * 平均ではなく中央値を使う（外れ値に強く「典型」が分かる）。
   * 不明は null。
   */
  median: number | null;
  /** 上位 10% 平均（絶対値）。不明は null */
  top10: number | null;
  /**
   * 指標内順位。
   * 予想数・勝率は表示しないため null。
   */
  rank: number | null;
};

/**
 * 予想のクセ（Pro Stats ハイブリッド）
 * スタイルマップ（自分1点）+ Home/Away・順当/逆張り勝率 + 短文
 */
export type MonthlyReportHabitsSide = {
  /** 0–1 */
  winRate: number;
  /** 選球比 0–1（対になるサイドと合計≈1） */
  share: number;
};

export type MonthlyReportHabits = {
  /**
   * スタイルマップ横軸。-1 = Away寄り、+1 = Home寄り
   * （投稿比から算出。Pro Stats と同定義）
   */
  homeAwayBias: number;
  /**
   * スタイルマップ縦軸用。Pro Stats と同定義:
   * 順当寄りほど負、逆張り寄りほど正 → 表示は y = -marketBias
   */
  marketBias: number;
  /** 点サイズ用の総合勝率 0–1 */
  winRate: number;
  home: MonthlyReportHabitsSide;
  away: MonthlyReportHabitsSide;
  /** 順当（市場多数派） */
  favorite: MonthlyReportHabitsSide;
  /** 逆張り（市場少数派） */
  underdog: MonthlyReportHabitsSide;
  /** 象限＋勝率から生成した見出し */
  summaryTitle: string;
  /** 1〜2文の解説 */
  summaryBody: string;
};

/** @deprecated カード列挙型。habits は MonthlyReportHabits に移行 */
export type MonthlyReportHabit = {
  id: string;
  title: string;
  body: string;
  stats?: { label: string; value: string }[];
};

export type MonthlyReportTeam = {
  teamId: string;
  abbr: string;
  games: number;
  wins: number;
  losses: number;
  /** 獲得 pt */
  points: number;
};

export type MonthlyReportHighlight =
  | {
      kind: "bestPick";
      dateKey: string;
      home: { teamId: string; abbr: string; score: number };
      away: { teamId: string; abbr: string; score: number };
      myHome: number;
      myAway: number;
      points: number;
    }
  | {
      kind: "bestDay";
      dateKey: string;
      points: number;
      wins: number;
      posts: number;
    }
  | {
      kind: "winStreak";
      length: number;
    }
  | {
      kind: "upset";
      dateKey: string;
      label: string;
      points: number;
    }
  | {
      kind: "divisionTop10";
      division: "winRate" | "goalScorerHits" | "upset";
      rank: number;
    };

/** 獲得 Unit の付与ソース（月次内訳 / 履歴ページ共通） */
export type MonthlyReportUnitSource =
  | "personal_weekly"
  | "personal_monthly"
  | "group_weekly"
  | "group_monthly"
  | "invite"
  | "metric_rank"
  | "event";

/** 指標別上位付与のとき */
export type MonthlyReportUnitMetric =
  | "totalPoints"
  | "winRate"
  | "scorer"
  | "upset";

/**
 * 1 件の Unit 付与行。
 * 月次レポート内訳・ユーザー履歴ページの双方で使う契約。
 */
export type MonthlyReportUnitGrant = {
  id: string;
  source: MonthlyReportUnitSource;
  /** 付与量（正の整数想定） */
  amount: number;
  /** 対象期間ラベル（例: 2026-W03 / 2026-01） */
  periodLabel: string;
  /** 付与確定日 YYYY-MM-DD JST */
  grantedDateKey: string;
  /** 順位（招待などは null） */
  rank: number | null;
  /** source === metric_rank のとき */
  metric: MonthlyReportUnitMetric | null;
  /** 短い表示ラベル（任意。無ければ UI が source から生成） */
  label?: string;
};

/** 今月のサマリー（強み・改善・目標を1文脈にまとめた本文） */
export type MonthlyReportOutlook = {
  summary: string;
};

export type MonthlyReport = {
  league: "nba";
  /** 例 2026-01 */
  monthKey: string;

  /** 1. 表紙 */
  participantCount: number;
  rank: number;
  prevRank: number | null;
  /** prevRank - rank（+ = 上昇）。前月なしは null */
  rankDeltaPlaces: number | null;
  topPercent: number | null;
  totalPoints: number;
  totalPosts: number;
  totalWins: number;
  /** 今月の獲得 Unit 数（未獲得は 0） */
  unitsEarned: number;
  /**
   * 今月の獲得 Unit 数での順位（母集団内）。
   * 未獲得・対象外は null。表示は TOP10/20/50/100 帯タグに丸める。
   */
  unitsEarnedRank: number | null;
  analysisTypeId: AnalysisTypeId;

  /** 2. 数字で見る今月 */
  metrics: MonthlyReportMetric[];

  /**
   * 2b. 獲得 Unit 内訳（当月に付与された ledger 行）。
   * 合計は unitsEarned と一致させる。未接続・0 件は []。
   */
  unitsBreakdown: MonthlyReportUnitGrant[];

  /** 3. 能力チャート */
  radar: MonthlyReportRadar;

  /** 4. 予想のクセ（スタイルマップ + 勝率）。サンプル不足は null */
  habits: MonthlyReportHabits | null;

  /** 5. チーム相性 */
  teamAffinity: {
    strong: MonthlyReportTeam[];
    weak: MonthlyReportTeam[];
  };

  /** 6. 月間ハイライト（価値の高いもの最大 3） */
  highlights: MonthlyReportHighlight[];

  /** 7. 来月への分析 */
  outlook: MonthlyReportOutlook;
};
