/**
 * 試合カード中央欄：スコア or キックオフ時刻＋サブ行（日付は日付ストリップで表示）
 */
export type GameCardCenterBlock =
  | {
      variant: "score";
      home: number;
      away: number;
      subLine: string | null;
    }
  /** ライブ中：LIVE ＋ スコア（Web 一覧と同様） */
  | {
      variant: "liveScore";
      home: number;
      away: number;
      subLine: string | null;
    }
  | { variant: "liveMark" }
  | { variant: "time"; time: string };
