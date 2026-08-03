// functions-local contract for user_reports weekly docs.
// Keep in sync with lib/reports/weeklyReportTypes.ts.

export const MAX_REPORT_RIVALS = 30;

export type WeeklyReportDivisionKey = "winRate" | "goalScorerHits" | "upset";

export type WeeklyReportRival = {
  uid: string;
  displayName: string;
  photoURL: string | null;
  rank: number;
  /** 生成時点の Pro 判定。古い doc は欠けることがある */
  plan?: "free" | "pro";
};

export type WeeklyReportDivision = {
  key: WeeklyReportDivisionKey;
  value: number;
  prevValue: number | null;
  rank: number | null;
  postsToQualify: number | null;
};

export type WeeklyReportCommentTone =
  | "climbedBig"
  | "climbed"
  | "held"
  | "dropped"
  | "firstWeek";

export type WeeklyReportCommentFactor =
  | { kind: "targetGap"; rank: number; displayName: string; pointsBehind: number }
  | { kind: "overtakenBy"; displayName: string }
  | { kind: "divisionUp"; division: WeeklyReportDivisionKey }
  | { kind: "divisionDown"; division: WeeklyReportDivisionKey }
  | { kind: "lowVolume"; posts: number }
  | { kind: "none" };

export type WeeklyReportComment = {
  tone: WeeklyReportCommentTone;
  factor: WeeklyReportCommentFactor;
};

export type WeeklyReport = {
  uid: string;
  type: "weekly";
  league: "nba";
  label: string;
  range: { startKey: string; endKey: string };
  status: "live" | "final"; // live = レガシー手動用。正は final（月曜確定のみ）
  participantCount: number;
  rank: number;
  prevRank: number | null;
  rankDeltaPlaces: number | null;
  topPercent: number | null;
  totalPoints: number;
  prevTotalPoints: number | null;
  totalPosts: number;
  totalWins: number;
  divisions: WeeklyReportDivision[];
  overtaken: WeeklyReportRival[];
  overtakenCount: number;
  overtakenBy: WeeklyReportRival[];
  overtakenByCount: number;
  nextTarget: { rival: WeeklyReportRival; pointsBehind: number } | null;
  threat: { rival: WeeklyReportRival; pointsGap: number } | null;
  comment: WeeklyReportComment;
};
