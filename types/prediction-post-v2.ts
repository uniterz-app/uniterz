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

  /** PK 戦の本数（finalizePost で games.pkScore からコピー） */
  pkScore?: { home: number; away: number } | null;

  /* ------------------------
     Market Meta（finalizePostで保存）
  ------------------------ */
  marketMeta?: {
    majoritySide: "home" | "away" | "draw";
    majorityRatio: number;
    /** 0–100。settle 時埋め込み（カード一覧が games を読まないため） */
    homePct?: number | null;
    awayPct?: number | null;
    drawPct?: number | null;
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
    pkScore?: { home: number; away: number };
  } | null;

  /* ------------------------
     Prediction
  ------------------------ */
  prediction: {
    winner: "home" | "away" | "draw";
    score: { home: number; away: number };
    /** UI 用（任意）。旧データは null の場合あり */
    confidence?: number | null;
    /** WC: ゴール得点者 / NBA: 試合最多得点者（任意・的中 +2） */
    goalScorer?: { playerId: string; teamId: string; name?: string | null } | null;
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
    /**
     * カード相対ラベル（settle 時埋め込み）。
     * 一覧が games を読まずに #1 / TOP 5% / TOP 10% を出す。
     */
    scoreRel?: "max" | "top5" | "top10" | "none" | null;
    pointsV3Detail?: {
      winnerCorrect: boolean;
      winPoints: number;
      diffPoints: number;
      totalPoints: number;
      goalDiffPoints?: number;
      /** 基本点（win + diff + total）。ボーナス前 */
      basePoints?: number;
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