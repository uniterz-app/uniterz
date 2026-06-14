import type { League } from "@/lib/leagues";

export type PredictionPostV2 = {
  id: string;

  /* ------------------------
     Author Info
  ------------------------ */
  authorUid?: string | null;
  authorHandle?: string | null;
  author?: {
    name: string;
    handle?: string | null;
    avatarUrl?: string;
  } | null;

  /* ------------------------
     Timestamps
  ------------------------ */
  createdAtText: string;
  createdAtMillis?: number | null;
  startAtMillis?: number | null;

  /* ------------------------
     Game Core Info
  ------------------------ */
  gameId: string;
  league: League;
  status: "scheduled" | "live" | "final";

  /* ------------------------
     Team Info
  ------------------------ */
  home: {
    name: string;
    teamId: string;
    number?: number;
    record?: { w: number; l?: number; d?: number };
  };

  away: {
    name: string;
    teamId: string;
    number?: number;
    record?: { w: number; l?: number; d?: number };
  };

  /* ------------------------
     Final Score
  ------------------------ */
  result?: {
    home: number;
    away: number;
  } | null;

  /** WC のみ：試合の実得点者（finalizePost で games.goalScorers からコピー） */
  matchGoalScorers?: Array<{
    side: "home" | "away";
    minute: number | null;
    label: string;
    ownGoal?: boolean;
  }> | null;

  /* ------------------------
     Market Meta（finalizePostで保存）
  ------------------------ */
  marketMeta?: {
    majoritySide: "home" | "away" | "draw";
    majorityRatio: number;
  } | null;

  /* ------------------------
     Legacy Game Block (optional)
  ------------------------ */
  game?: {
    league: League;
    home: string;
    away: string;
    status: "scheduled" | "live" | "final";
    finalScore?: { home: number; away: number };
  } | null;

  /* ------------------------
     Prediction
  ------------------------ */
  prediction: {
    winner: "home" | "away" | "draw";
    score: { home: number; away: number };
    /** UI 用（任意）。旧データは null の場合あり */
    confidence?: number | null;
    /** WC のみ：ゴール得点者予想 */
    goalScorer?: { playerId: string; teamId: string } | null;
  };

  note?: string;

  /** 一覧用キャッシュ（サブコレ likes/saves と同期しない場合あり） */
  likeCount?: number;
  saveCount?: number;

  /* ------------------------
     Stats (V2 – finalizePost準拠)
  ------------------------ */
  stats?: {
    isWin: boolean | null;
    hadUpsetGame?: boolean;

    scoreError?: number | null;
    scorePrecision?: number | null;
    /** WC: 予想スコアが採点ラインと完全一致（finalizePost） */
    exactMatch?: boolean | null;
    scorePrecisionDetail?: {
      homePt: number;
      awayPt: number;
      diffPt: number;
    } | null;

    marketCount?: number | null;
    marketMajority?: "home" | "away" | "draw" | null;
    isMajorityPick?: boolean;
    marketBias?: number | null;

    upsetHit?: boolean;
    upsetPoints?: number | null;

    pointsV3?: number | null;
    pointsV3Detail?: {
      winnerCorrect: boolean;
      winPoints: number;
      diffPoints: number;
      totalPoints: number;
      upsetBonus: number;
      streakBonus?: number;
      goalScorerBonus?: number;
      diffError: number | null;
      totalError: number | null;
      /** WC: 予想スコアが採点ラインと完全一致 */
      exactMatch?: boolean;
      /** 当時点の連勝数（finalizePost / UI バッジと同期） */
      activeWinStreak?: number;
    } | null;

    rankingReady?: boolean;
    rankingFactor?: 0 | 1;
  } | null;
};