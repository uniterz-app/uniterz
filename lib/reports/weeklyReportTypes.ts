// 週次レポート（Pro）— UI とレポート doc の共有型。
// docs/pro-subscription-plan.md §Layer C「週次 / 月次レポート 要件定義」参照。
// builder（functions 側）はこの形の doc を user_reports に書く。

/** 抜いた / 抜かれた リストを doc へ保存する最大人数（doc 肥大化のガード。残りは Count のみ） */
export const MAX_REPORT_RIVALS = 30;

/** UI の初期表示人数（以降は「もっと見る」で展開） */
export const INITIAL_REPORT_RIVALS = 5;

/** 抜いた / 抜かれた / ターゲット / 脅威 に出てくる相手（生成時に users から非正規化） */
export type WeeklyReportRival = {
  uid: string;
  displayName: string;
  photoURL: string | null;
  /** 今週の週間最終順位 */
  rank: number;
};

export type WeeklyReportDivisionKey = "winRate" | "goalScorerHits" | "upset";

/** 部門グリッドの 1 セル（値 + 前週比 + 部門順位） */
export type WeeklyReportDivision = {
  key: WeeklyReportDivisionKey;
  /** winRate は 0-100 の % 値 */
  value: number;
  /** 前週の値。前週データなしは null */
  prevValue: number | null;
  /** 部門順位。参加条件未達などで圏外は null */
  rank: number | null;
};

export type WeeklyReport = {
  league: "nba";
  /** 週ラベル（週の月曜 dateKey。例 2026-10-19） */
  label: string;
  range: { startKey: string; endKey: string };
  /**
   * live = 進行中（毎日上書き） / final = 月曜確定版。
   * 比較値（prevRank / prevValue / prevTotalPoints）のセマンティクス:
   * - final: 先週の確定値との比較（前週比）
   * - live: 前日 doc との比較（前日比）。走りかけの週 vs 確定した先週は不公平な比較になるため
   */
  status: "live" | "final";

  /** 今週の結果（ヒーロー） */
  participantCount: number;
  rank: number;
  /** 先週の週間最終順位。先週不参加は null */
  prevRank: number | null;
  /** prevRank - rank（+ = 上昇）。先週不参加は null */
  rankDeltaPlaces: number | null;
  /** 上位何 % か（0-100）。参加者が少ないときは null */
  topPercent: number | null;
  totalPoints: number;
  prevTotalPoints: number | null;
  totalPosts: number;
  totalWins: number;

  /** 部門グリッド（WIN% / SCORER / UPSET） */
  divisions: WeeklyReportDivision[];

  /**
   * 先週上にいて今週下になった相手。
   * builder が現在順位の昇順で最大 MAX_REPORT_RIVALS 人に切り詰めて保存。
   * 実際の人数は overtakenCount（リストより多いことがある）
   */
  overtaken: WeeklyReportRival[];
  overtakenCount: number;
  /** 逆方向 */
  overtakenBy: WeeklyReportRival[];
  overtakenByCount: number;

  /** すぐ上のユーザーとの差。自分が 1 位なら null */
  nextTarget: { rival: WeeklyReportRival; pointsBehind: number } | null;
  /** すぐ下のユーザーとの差。最下位なら null */
  threat: { rival: WeeklyReportRival; pointsGap: number } | null;

  /** 来週への一言 = 「総括（tone）」+「一番効いた要因 or 次の一手（factor）」 */
  comment: WeeklyReportComment;
};

/**
 * 一言の 2 段構造。builder がルールベースで組み立てる。
 * 1文目 = tone（順位変動ベースの総括）、2文目 = factor（データから 1 つだけ選ぶ補足）。
 * 深掘り分析（月次の役割）・複数要因の列挙・ヒーロー数字の言い直しはやらない。
 */
export type WeeklyReportComment = {
  tone: WeeklyReportCommentTone;
  factor: WeeklyReportCommentFactor;
};

/** 総括トーン（順位変動から builder が決める） */
export type WeeklyReportCommentTone =
  | "climbedBig" // 大きく順位を上げた
  | "climbed" // 順位を上げた
  | "held" // 維持
  | "dropped" // 順位を下げた
  | "firstWeek"; // 今週から参加

/**
 * 補足の選択ルール（優先順位・最初に該当した 1 つだけ）:
 * 1. targetGap    — ターゲットとの差が僅差（2pt 以内）
 * 2. overtakenBy  — 抜かれた相手がいる下降週（名前入りの挑発）
 * 3. divisionUp / divisionDown — 部門の前週比で変化が最大のもの
 * 4. lowVolume    — 投稿数が前週から大きく減った
 * 5. none         — 該当なし（tone のみの 1 文で終わる）
 */
export type WeeklyReportCommentFactor =
  | { kind: "targetGap"; rank: number; displayName: string; pointsBehind: number }
  | { kind: "overtakenBy"; displayName: string }
  | { kind: "divisionUp"; division: WeeklyReportDivisionKey }
  | { kind: "divisionDown"; division: WeeklyReportDivisionKey }
  | { kind: "lowVolume"; posts: number }
  | { kind: "none" };
