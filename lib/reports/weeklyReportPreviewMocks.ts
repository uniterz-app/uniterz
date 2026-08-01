// 週次レポート dev プレビュー用モック。builder 実装後は user_reports doc に差し替え。

import type { WeeklyReport } from "@/lib/reports/weeklyReportTypes";

const AVATAR = (seed: number) => `https://i.pravatar.cc/96?img=${seed}`;

/** 順位を上げた週（抜いた側） */
export function weeklyReportPreviewClimbed(): WeeklyReport {
  return {
    league: "nba",
    label: "2026-10-19",
    status: "final",
    range: { startKey: "2026-10-19", endKey: "2026-10-25" },

    participantCount: 340,
    rank: 12,
    prevRank: 18,
    rankDeltaPlaces: 6,
    topPercent: 3.5,
    totalPoints: 84.5,
    prevTotalPoints: 62.0,
    totalPosts: 18,
    totalWins: 11,

    divisions: [
      { key: "winRate", value: 61, prevValue: 57, rank: 31, postsToQualify: null },
      { key: "goalScorerHits", value: 6, prevValue: 4, rank: 8, postsToQualify: null },
      { key: "upset", value: 12.5, prevValue: 13.7, rank: 15, postsToQualify: null },
    ],

    overtaken: [
      { uid: "u1", displayName: "hoop_sniper", photoURL: AVATAR(12), rank: 13 },
      { uid: "u2", displayName: "TatumStan0", photoURL: AVATAR(33), rank: 14 },
      { uid: "u3", displayName: "예측왕", photoURL: AVATAR(56), rank: 16 },
      { uid: "u4", displayName: "BuzzerBeater", photoURL: null, rank: 19 },
      { uid: "u5", displayName: "sofia.mp4", photoURL: AVATAR(47), rank: 22 },
    ],
    overtakenCount: 5,
    overtakenBy: [
      { uid: "u6", displayName: "NightOwlPicks", photoURL: AVATAR(68), rank: 9 },
    ],
    overtakenByCount: 1,

    nextTarget: {
      rival: { uid: "u7", displayName: "CourtVision", photoURL: AVATAR(15), rank: 11 },
      pointsBehind: 3.2,
    },
    threat: {
      rival: { uid: "u1", displayName: "hoop_sniper", photoURL: AVATAR(12), rank: 13 },
      pointsGap: 1.5,
    },

    comment: {
      tone: "climbed",
      factor: { kind: "divisionUp", division: "goalScorerHits" },
    },
  };
}

/** 大量に抜いた週（「もっと見る」展開の確認用） */
export function weeklyReportPreviewBigClimb(): WeeklyReport {
  const base = weeklyReportPreviewClimbed();
  const names = [
    "hoop_sniper",
    "TatumStan0",
    "예측왕",
    "BuzzerBeater",
    "sofia.mp4",
    "NightOwlPicks",
    "CourtVision",
    "TripleDoubleTom",
    "rim_runner",
    "PickAndPop",
    "fadeaway_fan",
    "LobCityLuis",
    "swish_kid",
    "GlassCleaner",
    "point_god_77",
    "EuroStepEmi",
    "clutch.gene",
    "AndOneAnna",
    "paint_beast",
    "CatchNShoot",
    "posterizer",
    "SplashBro30",
    "iso_joe",
    "FastBreakFin",
    "boxout_boss",
    "midrange_mia",
    "chase_down",
    "buzzer_luck",
  ];
  return {
    ...base,
    rank: 24,
    prevRank: 52,
    rankDeltaPlaces: 28,
    topPercent: 7.1,
    overtaken: names.map((displayName, i) => ({
      uid: `bg${i}`,
      displayName,
      photoURL: i % 4 === 3 ? null : AVATAR((i * 7) % 70 + 1),
      rank: 25 + i,
    })),
    overtakenCount: 28,
    overtakenBy: [],
    overtakenByCount: 0,
    comment: {
      tone: "climbedBig",
      factor: { kind: "divisionUp", division: "goalScorerHits" },
    },
  };
}

/** 順位を落とした週（抜かれた側・挑発トーン） */
export function weeklyReportPreviewDropped(): WeeklyReport {
  return {
    league: "nba",
    label: "2026-10-26",
    range: { startKey: "2026-10-26", endKey: "2026-11-01" },
    status: "final",

    participantCount: 352,
    rank: 21,
    prevRank: 12,
    rankDeltaPlaces: -9,
    topPercent: 6.0,
    totalPoints: 55.0,
    prevTotalPoints: 84.5,
    totalPosts: 12,
    totalWins: 6,

    divisions: [
      { key: "winRate", value: 50, prevValue: 61, rank: 74, postsToQualify: null },
      { key: "goalScorerHits", value: 2, prevValue: 6, rank: 41, postsToQualify: null },
      { key: "upset", value: 4.0, prevValue: 12.5, rank: 63, postsToQualify: null },
    ],

    overtaken: [],
    overtakenCount: 0,
    overtakenBy: [
      { uid: "u7", displayName: "CourtVision", photoURL: AVATAR(15), rank: 14 },
      { uid: "u1", displayName: "hoop_sniper", photoURL: AVATAR(12), rank: 17 },
      { uid: "u5", displayName: "sofia.mp4", photoURL: AVATAR(47), rank: 19 },
    ],
    overtakenByCount: 3,

    nextTarget: {
      rival: { uid: "u5", displayName: "sofia.mp4", photoURL: AVATAR(47), rank: 20 },
      pointsBehind: 0.8,
    },
    threat: {
      rival: { uid: "u8", displayName: "TripleDoubleTom", photoURL: AVATAR(22), rank: 22 },
      pointsGap: 2.1,
    },

    comment: {
      tone: "dropped",
      factor: { kind: "overtakenBy", displayName: "CourtVision" },
    },
  };
}

/**
 * 進行中の週（今週ビュー。毎日 cron が上書きする live doc）。
 * live の prev 系は前日比（確定した先週との比較は不公平なため）。
 * 抜いた/抜かれたは final と同じく先週最終 vs 現在。
 */
export function weeklyReportPreviewLive(): WeeklyReport {
  const base = weeklyReportPreviewClimbed();
  return {
    ...base,
    label: "2026-10-26",
    status: "live",
    range: { startKey: "2026-10-26", endKey: "2026-11-01" },
    rank: 14,
    prevRank: 17,
    rankDeltaPlaces: 3,
    topPercent: 4.1,
    totalPoints: 31.0,
    prevTotalPoints: 24.5,
    totalPosts: 7,
    totalWins: 4,
    divisions: [
      { key: "winRate", value: 57, prevValue: 50, rank: 45, postsToQualify: null },
      // 進行中で SCORER 最低参加未達 → 参考記録
      { key: "goalScorerHits", value: 1, prevValue: null, rank: null, postsToQualify: 2 },
      { key: "upset", value: 5.5, prevValue: 5.5, rank: 22, postsToQualify: null },
    ],
    overtaken: [
      { uid: "u2", displayName: "TatumStan0", photoURL: AVATAR(33), rank: 15 },
      { uid: "u3", displayName: "예측왕", photoURL: AVATAR(56), rank: 18 },
    ],
    overtakenCount: 2,
    overtakenBy: base.overtakenBy,
    overtakenByCount: 1,
    nextTarget: {
      rival: { uid: "u1", displayName: "hoop_sniper", photoURL: AVATAR(12), rank: 13 },
      pointsBehind: 1.5,
    },
    threat: {
      rival: { uid: "u2", displayName: "TatumStan0", photoURL: AVATAR(33), rank: 15 },
      pointsGap: 0.8,
    },
    comment: {
      tone: "held",
      factor: {
        kind: "targetGap",
        rank: 13,
        displayName: "hoop_sniper",
        pointsBehind: 1.5,
      },
    },
  };
}

/** 今週から参加（前週データなし・変動非表示の確認用） */
export function weeklyReportPreviewFirstWeek(): WeeklyReport {
  return {
    league: "nba",
    label: "2026-10-19",
    status: "final",
    range: { startKey: "2026-10-19", endKey: "2026-10-25" },

    participantCount: 340,
    rank: 96,
    prevRank: null,
    rankDeltaPlaces: null,
    topPercent: 28.2,
    totalPoints: 21.5,
    prevTotalPoints: null,
    totalPosts: 6,
    totalWins: 3,

    divisions: [
      // WIN% 最低参加未達 → 参考記録
      { key: "winRate", value: 50, prevValue: null, rank: null, postsToQualify: 2 },
      { key: "goalScorerHits", value: 1, prevValue: null, rank: 88, postsToQualify: null },
      { key: "upset", value: 2.5, prevValue: null, rank: 92, postsToQualify: null },
    ],

    overtaken: [],
    overtakenCount: 0,
    overtakenBy: [],
    overtakenByCount: 0,

    nextTarget: {
      rival: { uid: "u9", displayName: "rim_runner", photoURL: AVATAR(5), rank: 95 },
      pointsBehind: 0.5,
    },
    threat: null,

    comment: { tone: "firstWeek", factor: { kind: "none" } },
  };
}
