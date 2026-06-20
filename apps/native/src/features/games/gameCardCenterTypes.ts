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
  /** ライブ中：LIVE のみ（Native — スコアは非表示） */
  | { variant: "liveMark"; subLine?: string | null }
  | { variant: "time"; time: string };
