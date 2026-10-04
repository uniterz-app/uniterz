/**
 * 試合カード中央欄：スコア or キックオフ時刻＋サブ行（日付は日付ストリップで表示）
 */
import type { PkScore } from "../../../../../lib/games/pkScore";

export type GameCardCenterBlock =
  | {
      variant: "score";
      home: number;
      away: number;
      subLine: string | null;
      /** 試合終了ラベルの下（PK 戦の本数） */
      pkScore?: PkScore | null;
    }
  /** ライブ中：LIVE ＋ スコア（取得済みのとき・Web と同様）＋ピリオド */
  | {
      variant: "liveMark";
      subLine?: string | null;
      score?: { home: number; away: number } | null;
    }
  | { variant: "time"; time: string };
