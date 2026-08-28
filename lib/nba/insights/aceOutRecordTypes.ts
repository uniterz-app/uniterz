/**
 * チームエース／キー選手欠場時の成績。
 * Firestore `nbaTeamAceOutRecords/{seasonKey}`
 *
 * 保持するのは W–L + 平均得点 + 平均失点のみ。
 */
import type { WlRecord } from "@/lib/nba/insights/priorSeasonRecordTypes";

/** 1 選手分の欠場時成績 */
export type NbaAceOutPlayerSplit = {
  playerId: string;
  playerName: string;
  ppg: number;
  gp: number;
  source: "auto" | "curated";
  whenOut: WlRecord;
  whenOutHome: WlRecord;
  whenOutAway: WlRecord;
  gamesOut: number;
  /** 欠場試合のチーム平均得点 */
  whenOutPtsFor: number;
  /** 欠場試合のチーム平均失点 */
  whenOutPtsAgainst: number;
};

export type NbaTeamAceOutRecord = {
  teamId: string;
  /** 主エース（表示・並び用）。Insight は `players` 全員を突合 */
  acePlayerId: string;
  acePlayerName: string;
  acePpg: number;
  aceGp: number;
  /** 主エースの欠場時（後方互換） */
  whenOut: WlRecord;
  whenOutHome: WlRecord;
  whenOutAway: WlRecord;
  teamOverall: WlRecord;
  gamesOut: number;
  whenOutPtsFor: number;
  whenOutPtsAgainst: number;
  /** チーム通算の平均得点 / 失点（比較・DEV 用） */
  teamPtsFor: number;
  teamPtsAgainst: number;
  /** 主エース + curated 追加選手 */
  players: NbaAceOutPlayerSplit[];
};

export type NbaTeamAceOutRecordsBundle = {
  seasonKey: string;
  teams: Record<string, NbaTeamAceOutRecord>;
  gameCount: number;
  builtAtMs: number;
  source: string;
};

export const NBA_TEAM_ACE_OUT_RECORDS_COLLECTION = "nbaTeamAceOutRecords";
