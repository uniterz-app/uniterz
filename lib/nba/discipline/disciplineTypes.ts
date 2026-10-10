/**
 * 規律系スタッツ（テクニカル / フラグラント / 退場 / 罰金）。
 * TECH・FLAG・EJECT は BDL play-by-play 由来、罰金は管理画面の手入力。
 * コーチ・チーム（ベンチ）テクニカルは数えない。
 */

export type NbaDisciplineEventKind = "tech" | "flag" | "eject";

export type NbaDisciplineSeasonType = "regular" | "playoffs";

export type NbaDisciplineCounts = {
  tech: number;
  flag: number;
  eject: number;
  /** 罰金合計（USD） */
  fines: number;
};

export const EMPTY_NBA_DISCIPLINE_COUNTS: NbaDisciplineCounts = {
  tech: 0,
  flag: 0,
  eject: 0,
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

/** Firestore `nbaDisciplineFines/{autoId}` */
export type NbaDisciplineFineDoc = {
  seasonKey: string;
  seasonType: NbaDisciplineSeasonType;
  playerId: string;
  playerName: string;
  teamId: string;
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
  }>;
};
