/**
 * __DEV__ リザルト詳細プレビュー用モック。
 * 本番と同じ `buildResultDetailViewModel` に通す（分布 bins なし）。
 */
import { buildResultDetailViewModel } from "@/lib/result/buildResultDetailView";
import type { GamePointsSummaryV1 } from "@/lib/results/gamePointsSummary";
import type { GamePointsTopEntryV1 } from "@/lib/results/gamePointsTop";
import type { ResultTopScorerMarketView } from "@/lib/result/resultTopScorerMarket";
import { SCORE_BREAKDOWN_COLORS } from "@/lib/result/resultScoreBreakdownColors";

export { SCORE_BREAKDOWN_COLORS };
export type { GamePointsTopEntryV1 as ResultDetailDesignTopEntry };

export type ResultDetailDesignBreakdown = {
  basePoints: number;
  streakBonus: number;
  upsetBonus: number;
  goalScorerBonus: number;
  totalPoints: number;
  topScorerHit: boolean;
  topScorerName: string;
};

const MOCK_AVATAR = (seed: number) => `https://i.pravatar.cc/96?img=${seed}`;

export const RESULT_DETAIL_DESIGN_TOP10: GamePointsTopEntryV1[] = [
  {
    rank: 1,
    postId: "dev-top-1",
    uid: "u1",
    handle: "ace_shot",
    displayName: "ace_shot",
    photoURL: MOCK_AVATAR(11),
    isPro: true,
    points: 9.85,
    countryCode: "JP",
  },
  {
    rank: 2,
    postId: "dev-top-2",
    uid: "u2",
    handle: "courtvision",
    displayName: "CourtVision",
    photoURL: MOCK_AVATAR(32),
    isPro: true,
    points: 9.4,
    countryCode: "US",
  },
  {
    rank: 3,
    postId: "dev-top-3",
    uid: "u3",
    handle: "rim_lock",
    displayName: "rim_lock",
    photoURL: MOCK_AVATAR(15),
    isPro: false,
    points: 9.1,
    countryCode: "KR",
  },
  {
    rank: 4,
    postId: "dev-top-you",
    uid: "viewer",
    handle: "you",
    displayName: "You",
    photoURL: null,
    isPro: false,
    points: 8.7,
  },
  {
    rank: 5,
    postId: "dev-top-5",
    uid: "u5",
    handle: "glassman",
    displayName: "GlassMan",
    photoURL: MOCK_AVATAR(28),
    isPro: true,
    points: 8.4,
  },
  {
    rank: 6,
    postId: "dev-top-6",
    uid: "u6",
    handle: "paint_edge",
    displayName: "paint_edge",
    photoURL: MOCK_AVATAR(5),
    isPro: false,
    points: 8.1,
  },
  {
    rank: 7,
    postId: "dev-top-7",
    uid: "u7",
    handle: "late_clock",
    displayName: "LateClock",
    photoURL: MOCK_AVATAR(44),
    isPro: false,
    points: 7.8,
  },
  {
    rank: 8,
    postId: "dev-top-8",
    uid: "u8",
    handle: "split_second",
    displayName: "split_second",
    photoURL: MOCK_AVATAR(19),
    isPro: true,
    points: 7.5,
  },
  {
    rank: 9,
    postId: "dev-top-9",
    uid: "u9",
    handle: "box_out",
    displayName: "BoxOut",
    photoURL: MOCK_AVATAR(8),
    isPro: false,
    points: 7.2,
  },
  {
    rank: 10,
    postId: "dev-top-10",
    uid: "u10",
    handle: "midrange",
    displayName: "midrange",
    photoURL: MOCK_AVATAR(22),
    isPro: false,
    points: 6.9,
  },
];

/** カード案相当のサマリ（bins なし） */
export const RESULT_DETAIL_DESIGN_SUMMARY: GamePointsSummaryV1 = {
  v: 1,
  n: 847,
  median: 6.42,
  max: 9.85,
  p95: 8.7,
  p90: 7.8,
  top: RESULT_DETAIL_DESIGN_TOP10,
};

export const RESULT_DETAIL_DESIGN_MATCH_STATS = {
  median: RESULT_DETAIL_DESIGN_SUMMARY.median!,
  max: RESULT_DETAIL_DESIGN_SUMMARY.max!,
  postCount: RESULT_DETAIL_DESIGN_SUMMARY.n,
} as const;

/**
 * - カード「アップセット」= upsetPoints（別指標 0–10）
 * - 内訳「UPSETボーナス」= upsetBonus（総合点への加点、的中時 +2）
 */
export const RESULT_DETAIL_DESIGN_BREAKDOWN: ResultDetailDesignBreakdown = {
  basePoints: 4.2,
  streakBonus: 1.2,
  upsetBonus: 2,
  goalScorerBonus: 1.3,
  totalPoints: 8.7,
  topScorerHit: true,
  topScorerName: "S.Gilgeous-Alexander",
};

export const RESULT_DETAIL_DESIGN_POST: Record<string, unknown> & {
  id: string;
} = {
  id: "__dev_result_detail_preview__",
  gameId: "dev-game",
  league: "nba",
  status: "final",
  seasonRound: "PLAYOFF GAME 7",
  authorUid: "viewer",
  authorHandle: "you",
  author: { name: "You", handle: "you" },
  home: { name: "THUNDER", teamId: "nba-okc" },
  away: { name: "SPURS", teamId: "nba-sas" },
  prediction: {
    winner: "away",
    score: { home: 106, away: 113 },
    goalScorer: {
      playerId: "sga",
      teamId: "nba-okc",
      name: "S.Gilgeous-Alexander",
    },
  },
  result: { home: 103, away: 111 },
  marketMeta: {
    majoritySide: "away",
    majorityRatio: 0.584,
    homePct: 41.6,
    awayPct: 58.4,
  },
  stats: {
    isWin: true,
    hadUpsetGame: true,
    upsetHit: false,
    upsetPoints: 2.4,
    upsetBonus: 2,
    streakBonus: 1.2,
    goalScorerBonus: 1.3,
    exactMatch: false,
    scoreError: 4,
    pointsV3: 8.7,
    scoreRel: "top5",
    pointsV3Detail: {
      winnerCorrect: true,
      winPoints: 4,
      diffPoints: 0.2,
      totalPoints: 0,
      basePoints: 4.2,
      upsetBonus: 2,
      streakBonus: 1.2,
      goalScorerBonus: 1.3,
      activeWinStreak: 5,
      diffError: 2,
      totalError: 5,
      exactMatch: false,
    },
  },
};

export const RESULT_DETAIL_DESIGN_MARKET = {
  homePct: 41.6,
  awayPct: 58.4,
  homeRate: 41.6,
  awayRate: 58.4,
};

/** プレビュー用 — NBA 最多得点者の選択分布 */
export const RESULT_DETAIL_DESIGN_TOP_SCORER_MARKET: ResultTopScorerMarketView =
  {
    n: 847,
    hitRatePct: 38.2,
    myPick: {
      playerId: "sga",
      teamId: "nba-okc",
      name: "S.Gilgeous-Alexander",
      hit: true,
    },
    slices: [
      {
        playerId: "sga",
        teamId: "nba-okc",
        name: "S.Gilgeous-Alexander",
        pct: 38.2,
        count: 324,
        isActual: true,
        points: 34,
      },
      {
        playerId: "wemby",
        teamId: "nba-sas",
        name: "V.Wembanyama",
        pct: 24.1,
        count: 204,
        isActual: false,
        points: 28,
      },
      {
        playerId: "fox",
        teamId: "nba-sas",
        name: "D.Fox",
        pct: 16.4,
        count: 139,
        isActual: false,
        points: 22,
      },
      {
        playerId: "jdup",
        teamId: "nba-okc",
        name: "J.Williams",
        pct: 11.8,
        count: 100,
        isActual: false,
        points: 19,
      },
      {
        playerId: "__none__",
        teamId: "—",
        name: "NO PICK",
        pct: 9.5,
        count: 80,
        isActual: false,
      },
    ],
  };

export function buildResultDetailDesignPreviewView(viewer?: {
  uid?: string | null;
  handle?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  isPro?: boolean;
}) {
  return buildResultDetailViewModel(RESULT_DETAIL_DESIGN_POST, {
    market: RESULT_DETAIL_DESIGN_MARKET,
    pointsSummary: RESULT_DETAIL_DESIGN_SUMMARY,
    topScorerMarket: RESULT_DETAIL_DESIGN_TOP_SCORER_MARKET,
    leadingScorers: [
      {
        playerId: "sga",
        teamId: "nba-okc",
        name: "S.Gilgeous-Alexander",
        points: 34,
      },
    ],
    topScorerCandidates: RESULT_DETAIL_DESIGN_TOP_SCORER_MARKET.slices
      .filter((s) => s.playerId !== "__none__")
      .map((s) => ({
        playerId: s.playerId,
        teamId: s.teamId,
        name: s.name,
      })),
    viewer: viewer ?? {
      uid: "viewer",
      handle: "you",
      displayName: "You",
      photoURL: null,
      isPro: false,
    },
  });
}
