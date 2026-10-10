/**
 * 規律系スタッツ（テクニカル / フラグラント / 退場 / 罰金）。
 * TECH・FLAG・EJECT は BDL play-by-play 由来。罰金はテクニカル・退場の規定額（自動計算）
 * + 出場停止で失った年俸（NBA 発表分を管理画面で試合数入力）+ 手入力の個別罰金。
 * コーチ・チーム（ベンチ）テクニカルは数えない。
 */

export type NbaDisciplineEventKind = "tech" | "flag" | "eject";

export type NbaDisciplineSeasonType = "regular" | "playoffs";

export type NbaDisciplineCounts = {
  tech: number;
  flag: number;
  eject: number;
  /** 出場停止の試合数（NBA 発表分の手入力） */
  susp: number;
  /** 罰金合計（USD） */
  fines: number;
};

export const EMPTY_NBA_DISCIPLINE_COUNTS: NbaDisciplineCounts = {
  tech: 0,
  flag: 0,
  eject: 0,
  susp: 0,
  fines: 0,
};

/** Firestore `nbaGameDiscipline/{bdlGameId}` の 1 イベント */
export type NbaGameDisciplineEvent = {
  /** BDL player id */
  p: string;
  /** app team id */
  t: string;
  k: NbaDisciplineEventKind;
};

export type NbaGameDisciplineDoc = {
  seasonKey: string;
  seasonType: NbaDisciplineSeasonType;
  date: string;
  events: NbaGameDisciplineEvent[];
  /** 選手に解決できなかった行（コーチ・チーム T 含む）。監査用 */
  unresolved: string[];
  /** 選手名（表示用。playerId → "First Last"） */
  names: Record<string, string>;
  builtAtMs: number;
};

/** rescind = リーグが後から取り消した TECH / FLAG / EJECT（その日の該当イベントを 1 件差し引く） */
export type NbaDisciplineFineKind = "fine" | "suspension" | "rescind";

/** Firestore `nbaDisciplineFines/{autoId}` */
export type NbaDisciplineFineDoc = {
  seasonKey: string;
  seasonType: NbaDisciplineSeasonType;
  /** 未設定は fine（後方互換） */
  kind?: NbaDisciplineFineKind;
  /** 出場停止の試合数（kind=suspension） */
  games?: number;
  /** コート上の行為による出場停止か（シーズン最初の 1 試合停止は日割り年俸） */
  onCourt?: boolean;
  /** 取り消し対象（kind=rescind）。`date` は試合日（米国日付） */
  rescindKind?: NbaDisciplineEventKind;
  playerId: string;
  playerName: string;
  teamId: string;
  /** suspension は集計時に年俸から計算して上書き */
  amountUsd: number;
  /** YYYY-MM-DD */
  date: string;
  reason: string;
  createdAtMs: number;
};

export type NbaDisciplineFineEntry = NbaDisciplineFineDoc & { id: string };

export type NbaDisciplinePlayerEntry = {
  name: string;
  /** 最後に記録があったチーム */
  teamId: string;
  /** レギュラーシーズン出場数（`nbaPlayerSeasonMetrics` から。無ければ 0） */
  gamesPlayed: number;
  regular: NbaDisciplineCounts;
  playoffs: NbaDisciplineCounts;
};

export type NbaDisciplineTeamEntry = {
  regular: NbaDisciplineCounts;
  playoffs: NbaDisciplineCounts;
};

/** Firestore `nbaDiscipline/{seasonKey}` */
export type NbaDisciplineSnapshot = {
  seasonKey: string;
  gameCount: number;
  players: Record<string, NbaDisciplinePlayerEntry>;
  teams: Record<string, NbaDisciplineTeamEntry>;
  builtAtMs: number;
};

/** チーム詳細 / 選手詳細に載せる切片 */
export type NbaDisciplineDetailSlice = {
  season: string;
  regular: NbaDisciplineCounts;
  playoffs: NbaDisciplineCounts;
  /** 罰金の内訳（新しい順） */
  fines: Array<{
    playerId: string;
    playerName: string;
    amountUsd: number;
    date: string;
    reason: string;
    seasonType: NbaDisciplineSeasonType;
    kind?: Exclude<NbaDisciplineFineKind, "rescind">;
    games?: number;
  }>;
};
