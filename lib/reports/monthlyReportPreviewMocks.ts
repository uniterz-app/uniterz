// 月次レポート dev プレビュー用モック。
// docs/pro-subscription-plan.md §4 の画面順に合わせる。
// プレビューは順位帯・上昇/下降・初月などで切り替え確認する。

import type {
  MonthlyReport,
  MonthlyReportHabits,
  MonthlyReportHighlight,
  MonthlyReportMetric,
  MonthlyReportOutlook,
  MonthlyReportRadar,
  MonthlyReportTeam,
  MonthlyReportUnitGrant,
} from "@/lib/reports/monthlyReportTypes";
import type { AnalysisTypeId } from "@/shared/analysis/types";
import { buildMonthlyHabits } from "@/lib/reports/buildMonthlyHabits";

type CoverPatch = Partial<
  Pick<
    MonthlyReport,
    | "monthKey"
    | "participantCount"
    | "rank"
    | "prevRank"
    | "rankDeltaPlaces"
    | "topPercent"
    | "totalPoints"
    | "totalPosts"
    | "totalWins"
    | "unitsEarned"
    | "unitsEarnedRank"
    | "analysisTypeId"
  >
>;

/** Home×順当寄り・勝率良好（プレビュー既定） */
const DEFAULT_HABITS: MonthlyReportHabits = buildMonthlyHabits({
  home: { posts: 22, wins: 16 },
  away: { posts: 16, wins: 8 },
  favorite: { posts: 24, wins: 16 },
  underdog: { posts: 14, wins: 8 },
  winRate: 0.632,
})!;

/** 合計 80 — TOP10 プレビューの unitsEarned と一致 */
const DEFAULT_UNITS_BREAKDOWN: MonthlyReportUnitGrant[] = [
  {
    id: "u1",
    source: "personal_monthly",
    amount: 30,
    periodLabel: "2026-01",
    grantedDateKey: "2026-02-01",
    rank: 8,
    metric: null,
  },
  {
    id: "u2",
    source: "personal_weekly",
    amount: 15,
    periodLabel: "2026-W03",
    grantedDateKey: "2026-01-20",
    rank: 12,
    metric: null,
  },
  {
    id: "u3",
    source: "metric_rank",
    amount: 12,
    periodLabel: "2026-01",
    grantedDateKey: "2026-02-01",
    rank: 5,
    metric: "upset",
  },
  {
    id: "u4",
    source: "group_monthly",
    amount: 10,
    periodLabel: "2026-01",
    grantedDateKey: "2026-02-02",
    rank: 2,
    metric: null,
  },
  {
    id: "u5",
    source: "group_weekly",
    amount: 5,
    periodLabel: "2026-W04",
    grantedDateKey: "2026-01-27",
    rank: 3,
    metric: null,
  },
  {
    id: "u6",
    source: "invite",
    amount: 5,
    periodLabel: "2026-01",
    grantedDateKey: "2026-01-14",
    rank: null,
    metric: null,
  },
  {
    id: "u7",
    source: "metric_rank",
    amount: 3,
    periodLabel: "2026-W02",
    grantedDateKey: "2026-01-13",
    rank: 9,
    metric: "scorer",
  },
];

const DEFAULT_STRONG: MonthlyReportTeam[] = [
  { teamId: "nba-lakers", abbr: "LAL", games: 8, wins: 6, losses: 2, points: 48.5 },
  { teamId: "nba-celtics", abbr: "BOS", games: 6, wins: 4, losses: 2, points: 31.0 },
  { teamId: "nba-bucks", abbr: "MIL", games: 5, wins: 3, losses: 2, points: 22.5 },
];

const DEFAULT_WEAK: MonthlyReportTeam[] = [
  { teamId: "nba-nuggets", abbr: "DEN", games: 7, wins: 2, losses: 5, points: 8.0 },
  { teamId: "nba-heat", abbr: "MIA", games: 5, wins: 2, losses: 3, points: 9.5 },
  { teamId: "nba-suns", abbr: "PHX", games: 4, wins: 2, losses: 2, points: 11.0 },
];

const DEFAULT_HIGHLIGHTS: MonthlyReportHighlight[] = [
  {
    kind: "bestPick",
    dateKey: "2026-01-17",
    home: { teamId: "nba-lakers", abbr: "LAL", score: 112 },
    away: { teamId: "nba-celtics", abbr: "BOS", score: 108 },
    myHome: 110,
    myAway: 106,
    points: 9.5,
  },
  {
    kind: "bestDay",
    dateKey: "2026-01-24",
    points: 31.5,
    wins: 5,
    posts: 6,
  },
  {
    kind: "winStreak",
    length: 8,
  },
];

function buildReport(input: {
  cover: CoverPatch & {
    rank: number;
    totalPoints: number;
    totalPosts: number;
    totalWins: number;
    analysisTypeId: AnalysisTypeId;
  };
  metrics: MonthlyReportMetric[];
  radar: MonthlyReportRadar;
  outlook: MonthlyReportOutlook;
  habits?: MonthlyReportHabits | null;
  highlights?: MonthlyReportHighlight[];
  unitsBreakdown?: MonthlyReportUnitGrant[];
}): MonthlyReport {
  return {
    league: "nba",
    monthKey: input.cover.monthKey ?? "2026-01",
    participantCount: input.cover.participantCount ?? 412,
    rank: input.cover.rank,
    prevRank: input.cover.prevRank ?? null,
    rankDeltaPlaces: input.cover.rankDeltaPlaces ?? null,
    topPercent: input.cover.topPercent ?? null,
    totalPoints: input.cover.totalPoints,
    totalPosts: input.cover.totalPosts,
    totalWins: input.cover.totalWins,
    unitsEarned: input.cover.unitsEarned ?? 0,
    unitsEarnedRank: input.cover.unitsEarnedRank ?? null,
    analysisTypeId: input.cover.analysisTypeId,
    metrics: input.metrics,
    unitsBreakdown:
      input.unitsBreakdown ??
      ((input.cover.unitsEarned ?? 0) > 0 ? DEFAULT_UNITS_BREAKDOWN : []),
    radar: input.radar,
    habits: input.habits === undefined ? DEFAULT_HABITS : input.habits,
    teamAffinity: { strong: DEFAULT_STRONG, weak: DEFAULT_WEAK },
    highlights: input.highlights ?? DEFAULT_HIGHLIGHTS,
    outlook: input.outlook,
  };
}

/** TOP10 帯・前月比上昇（ヒーロー金） */
export function monthlyReportPreviewTop10(): MonthlyReport {
  return buildReport({
    cover: {
      rank: 8,
      prevRank: 15,
      rankDeltaPlaces: 7,
      topPercent: 1.9,
      totalPoints: 298.4,
      totalPosts: 38,
      totalWins: 24,
      unitsEarned: 80,
      unitsEarnedRank: 8,
      analysisTypeId: "BIG_GAME_HUNTER",
    },
    metrics: [
      { key: "posts", value: 38, prevDelta: 9, median: 24, top10: 44, rank: null },
      { key: "winRate", value: 63.2, prevDelta: 5.4, median: 52.0, top10: 68.0, rank: null },
      { key: "units", value: 80, prevDelta: 30, median: 12, top10: 55, rank: 8 },
      { key: "points", value: 298.4, prevDelta: 86.2, median: 154.8, top10: 398.2, rank: 8 },
      { key: "goalScorerHits", value: 11, prevDelta: 3, median: 7.9, top10: 15, rank: 41 },
      { key: "upsetPoints", value: 42.0, prevDelta: 18.0, median: 25.2, top10: 50.5, rank: 12 },
    
    ],
    radar: {
      win: 88,
      scorer: 62,
      upset: 91,
      activity: 86,
      consistency: 74,
    },
    outlook: {
      summary: "UPSET で上位 4%、前月比 +18pt と番狂わせ読みが今月のエンジンだった一方、SCORER は参加が少なくチャート最低帯。来月は得点者予想に 10 試合以上入り、穴を埋めたい。",
    },
  });
}

/** 上位10%ライン超え（レンジバーが金線を超える確認用） */
export function monthlyReportPreviewAboveTop10(): MonthlyReport {
  return buildReport({
    cover: {
      monthKey: "2026-01",
      rank: 3,
      prevRank: 9,
      rankDeltaPlaces: 6,
      topPercent: 0.7,
      totalPoints: 441.5,
      totalPosts: 48,
      totalWins: 34,
      unitsEarned: 120,
      unitsEarnedRank: 3,
      analysisTypeId: "CHEAT_CODE",
    },
    metrics: [
      { key: "posts", value: 48, prevDelta: 11, median: 24, top10: 44, rank: null },
      { key: "winRate", value: 70.8, prevDelta: 4.2, median: 52.0, top10: 68.0, rank: null },
      { key: "units", value: 120, prevDelta: 45, median: 12, top10: 55, rank: 3 },
      { key: "points", value: 441.5, prevDelta: 102.0, median: 154.8, top10: 398.2, rank: 3 },
      { key: "goalScorerHits", value: 18, prevDelta: 5, median: 7.9, top10: 15, rank: 6 },
      { key: "upsetPoints", value: 58.0, prevDelta: 14.0, median: 25.2, top10: 50.5, rank: 5 },
    
    ],
    radar: {
      win: 94,
      scorer: 90,
      upset: 88,
      activity: 92,
      consistency: 86,
    },
    outlook: {
      summary: "全指標で上位10%平均を上回り、総合・勝率・SCORER が特に抜けた月。弱点と呼べる穴はほぼないので、来月はこの水準を維持しつつ安定性を一段上げたい。",
    },
  });
}

/** TOP20 帯・微上昇（ヒーロー銀） */
export function monthlyReportPreviewTop20(): MonthlyReport {
  return buildReport({
    cover: {
      monthKey: "2026-02",
      rank: 16,
      prevRank: 22,
      rankDeltaPlaces: 6,
      topPercent: 3.9,
      totalPoints: 241.0,
      totalPosts: 34,
      totalWins: 20,
      unitsEarned: 40,
      unitsEarnedRank: 16,
      analysisTypeId: "ASSASSIN",
    },
    metrics: [
      { key: "posts", value: 34, prevDelta: 4, median: 24, top10: 44, rank: null },
      { key: "winRate", value: 58.8, prevDelta: 2.1, median: 52.0, top10: 68.0, rank: null },
      { key: "units", value: 40, prevDelta: 10, median: 12, top10: 55, rank: 16 },
      { key: "points", value: 241.0, prevDelta: 28.5, median: 154.8, top10: 398.2, rank: 16 },
      { key: "goalScorerHits", value: 9, prevDelta: 1, median: 7.9, top10: 15, rank: 28 },
      { key: "upsetPoints", value: 31.0, prevDelta: 6.0, median: 25.2, top10: 50.5, rank: 22 },
    
    ],
    radar: {
      win: 72,
      scorer: 68,
      upset: 64,
      activity: 74,
      consistency: 70,
    },
    outlook: {
      summary: "勝率と継続力が安定し、無理打ちを抑えて着実に帯を上げた。上位帯との差は UPSET の伸びが中心なので、来月は週あたり UPSET 候補を 2 試合は入れたい。",
    },
  });
}

/** TOP50 帯・大きく上昇 */
export function monthlyReportPreviewClimbed(): MonthlyReport {
  return buildReport({
    cover: {
      monthKey: "2026-03",
      rank: 38,
      prevRank: 92,
      rankDeltaPlaces: 54,
      topPercent: 9.2,
      totalPoints: 198.5,
      totalPosts: 36,
      totalWins: 21,
      unitsEarned: 25,
      unitsEarnedRank: 38,
      analysisTypeId: "HOT_HAND",
    },
    metrics: [
      { key: "posts", value: 36, prevDelta: 14, median: 24, top10: 44, rank: null },
      { key: "winRate", value: 58.3, prevDelta: 8.2, median: 52.0, top10: 68.0, rank: null },
      { key: "units", value: 25, prevDelta: 25, median: 12, top10: 55, rank: 38 },
      { key: "points", value: 198.5, prevDelta: 72.0, median: 154.8, top10: 398.2, rank: 38 },
      { key: "goalScorerHits", value: 8, prevDelta: 4, median: 7.9, top10: 15, rank: 55 },
      { key: "upsetPoints", value: 36.5, prevDelta: 22.0, median: 25.2, top10: 50.5, rank: 18 },
    
    ],
    radar: {
      win: 70,
      scorer: 55,
      upset: 82,
      activity: 80,
      consistency: 48,
    },
    outlook: {
      summary: "投稿量と UPSET で一気に帯を上げた勢いの月。一方で安定性がまだ低く、波の大きい週が順位を食っている。来月は週ごとの負けを 2 敗以内に抑えたい。",
    },
  });
}

/** TOP50 帯・下降（ヒーローシアン） */
export function monthlyReportPreviewDropped(): MonthlyReport {
  return buildReport({
    cover: {
      monthKey: "2026-04",
      rank: 47,
      prevRank: 19,
      rankDeltaPlaces: -28,
      topPercent: 11.4,
      totalPoints: 162.0,
      totalPosts: 29,
      totalWins: 14,
      unitsEarned: 0,
      unitsEarnedRank: null,
      analysisTypeId: "SCRAPPER",
    },
    metrics: [
      { key: "posts", value: 29, prevDelta: -8, median: 24, top10: 44, rank: null },
      { key: "winRate", value: 48.3, prevDelta: -7.1, median: 52.0, top10: 68.0, rank: null },
      { key: "units", value: 0, prevDelta: -20, median: 12, top10: 55, rank: null },
      { key: "points", value: 162.0, prevDelta: -54.0, median: 154.8, top10: 398.2, rank: 47 },
      { key: "goalScorerHits", value: 5, prevDelta: -3, median: 7.9, top10: 15, rank: 88 },
      { key: "upsetPoints", value: 18.0, prevDelta: -12.5, median: 25.2, top10: 50.5, rank: 71 },
    
    ],
    radar: {
      win: 42,
      scorer: 38,
      upset: 44,
      activity: 52,
      consistency: 35,
    },
    outlook: {
      summary: "選球眼は残っており、無理に穴を狙わなかったのは正解側。ただし母数と勝率が同時に落ち、参加を減らした週が痛かった。来月は最低でも前月並みの予想数に戻したい。",
    },
  });
}

/** TOP100 帯（ヒーローライム） */
export function monthlyReportPreviewTop100(): MonthlyReport {
  return buildReport({
    cover: {
      monthKey: "2026-05",
      rank: 84,
      prevRank: 71,
      rankDeltaPlaces: -13,
      topPercent: 20.4,
      totalPoints: 138.2,
      totalPosts: 26,
      totalWins: 13,
      unitsEarned: 10,
      unitsEarnedRank: 84,
      analysisTypeId: "PROSPECT",
    },
    metrics: [
      { key: "posts", value: 26, prevDelta: -2, median: 24, top10: 44, rank: null },
      { key: "winRate", value: 50.0, prevDelta: -1.2, median: 52.0, top10: 68.0, rank: null },
      { key: "units", value: 10, prevDelta: -5, median: 12, top10: 55, rank: 84 },
      { key: "points", value: 138.2, prevDelta: -12.0, median: 154.8, top10: 398.2, rank: 84 },
      { key: "goalScorerHits", value: 6, prevDelta: 0, median: 7.9, top10: 15, rank: 92 },
      { key: "upsetPoints", value: 21.0, prevDelta: -3.0, median: 25.2, top10: 50.5, rank: 80 },
    
    ],
    radar: {
      win: 50,
      scorer: 46,
      upset: 48,
      activity: 48,
      consistency: 52,
    },
    outlook: {
      summary: "大きな崩れはなく中央値付近はキープできたが、上位10%との差は全指標で開いた。一撃の月ではなかったので、来月はまず勝率を中央値以上に戻したい。",
    },
  });
}

/** TOP100 圏外（控えめシアン） */
export function monthlyReportPreviewField(): MonthlyReport {
  return buildReport({
    cover: {
      monthKey: "2026-06",
      rank: 186,
      prevRank: 154,
      rankDeltaPlaces: -32,
      topPercent: 45.1,
      totalPoints: 96.5,
      totalPosts: 18,
      totalWins: 8,
      unitsEarned: 0,
      unitsEarnedRank: null,
      analysisTypeId: "HIGH_MOTOR",
    },
    metrics: [
      { key: "posts", value: 18, prevDelta: -6, median: 24, top10: 44, rank: null },
      { key: "winRate", value: 44.4, prevDelta: -4.0, median: 52.0, top10: 68.0, rank: null },
      { key: "units", value: 0, prevDelta: -8, median: 12, top10: 55, rank: null },
      { key: "points", value: 96.5, prevDelta: -28.0, median: 154.8, top10: 398.2, rank: 186 },
      { key: "goalScorerHits", value: 3, prevDelta: -2, median: 7.9, top10: 15, rank: 201 },
      { key: "upsetPoints", value: 11.0, prevDelta: -7.0, median: 25.2, top10: 50.5, rank: 190 },
    
    ],
    radar: {
      win: 28,
      scorer: 22,
      upset: 30,
      activity: 26,
      consistency: 34,
    },
    outlook: {
      summary: "参加自体は続いてゼロ月にはならなかったが、母数が少なく全指標が中央値割れし帯の外へ落ちた。来月はまず予想数を 30 に戻したい。",
    },
  });
}

/** 初月（前月比なし） */
export function monthlyReportPreviewFirstMonth(): MonthlyReport {
  return buildReport({
    cover: {
      monthKey: "2026-01",
      rank: 112,
      prevRank: null,
      rankDeltaPlaces: null,
      topPercent: 27.2,
      totalPoints: 124.0,
      totalPosts: 22,
      totalWins: 12,
      unitsEarned: 0,
      unitsEarnedRank: null,
      analysisTypeId: "LASER",
    },
    metrics: [
      { key: "posts", value: 22, prevDelta: null, median: 24, top10: 44, rank: null },
      { key: "winRate", value: 54.5, prevDelta: null, median: 52.0, top10: 68.0, rank: null },
      { key: "units", value: 0, prevDelta: null, median: 12, top10: 55, rank: null },
      { key: "points", value: 124.0, prevDelta: null, median: 154.8, top10: 398.2, rank: 112 },
      { key: "goalScorerHits", value: 7, prevDelta: null, median: 7.9, top10: 15, rank: 98 },
      { key: "upsetPoints", value: 19.5, prevDelta: null, median: 25.2, top10: 50.5, rank: 120 },
    
    ],
    radar: {
      win: 58,
      scorer: 50,
      upset: 46,
      activity: 42,
      consistency: 40,
    },
    outlook: {
      summary: "初月から勝率は中央値超えで読みの土台はある一方、母数と UPSET はまだ薄い。前月比較がない分、積み上げが課題。来月は参加を増やしつつ勝率を落としたくない。",
    },
  });
}

/** 中央値割れ多め（レンジバー確認用） */
export function monthlyReportPreviewBelowMedian(): MonthlyReport {
  return buildReport({
    cover: {
      monthKey: "2026-07",
      rank: 63,
      prevRank: 41,
      rankDeltaPlaces: -22,
      topPercent: 15.3,
      totalPoints: 142.0,
      totalPosts: 21,
      totalWins: 9,
      unitsEarned: 0,
      unitsEarnedRank: null,
      analysisTypeId: "CHAOS_TAKER",
    },
    metrics: [
      { key: "posts", value: 21, prevDelta: -5, median: 24, top10: 44, rank: null },
      { key: "winRate", value: 42.9, prevDelta: -6.5, median: 52.0, top10: 68.0, rank: null },
      { key: "units", value: 0, prevDelta: -12, median: 12, top10: 55, rank: null },
      { key: "points", value: 142.0, prevDelta: -31.0, median: 154.8, top10: 398.2, rank: 63 },
      { key: "goalScorerHits", value: 4, prevDelta: -2, median: 7.9, top10: 15, rank: 140 },
      { key: "upsetPoints", value: 28.0, prevDelta: 4.0, median: 25.2, top10: 50.5, rank: 48 },
    
    ],
    radar: {
      win: 36,
      scorer: 30,
      upset: 60,
      activity: 38,
      consistency: 32,
    },
    outlook: {
      summary: "UPSET だけ中央値超えで読みの尖りは残っているが、勝率と母数が同時に割れ総合点が伸びなかった。来月は本命側の勝率を先に立て直したい。",
    },
  });
}

/** @deprecated 互換。TOP10 パターンと同じ */
export function monthlyReportPreviewMock(): MonthlyReport {
  return monthlyReportPreviewTop10();
}
