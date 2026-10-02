/**
 * Firestore `nbaTeamShapeRecords/{seasonKey}`
 * 条件付き（得意形／苦手形）W–L。公開 API はここだけ読む。
 */
import type { WlRecord } from "@/lib/nba/insights/priorSeasonRecordTypes";
import type { TeamShapeId } from "@/lib/nba/teamShapes/shapeDefs";

export const NBA_TEAM_SHAPE_RECORDS_COLLECTION = "nbaTeamShapeRecords";

export type NbaTeamShapeSplit = {
  shapeId: TeamShapeId;
  when: WlRecord;
  games: number;
  winPct: number;
  baselineWinPct: number;
  /** winPct - baselineWinPct（割合ポイント、例 0.22 = +22pp） */
  deltaWinPct: number;
};

export type NbaTeamShapeRecord = {
  teamId: string;
  overall: WlRecord;
  shapes: Partial<Record<TeamShapeId, NbaTeamShapeSplit>>;
};

export type NbaTeamShapeRecordsBundle = {
  seasonKey: string;
  teams: Record<string, NbaTeamShapeRecord>;
  gameCount: number;
  /** liveStats.box があり shape 評価できた試合数 */
  gamesWithBox: number;
  builtAtMs: number;
  source: string;
};
