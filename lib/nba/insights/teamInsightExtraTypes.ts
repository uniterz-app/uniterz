/**
 * Pro Insight 用・チーム負荷／帯スプリット。
 * Firestore `nbaTeamInsightExtras/{seasonKey}`
 *
 * レギュラー確定試合のみ。B2B・休養・過密・対帯・クラッチ・高地。
 * H2H 複数年は同ドキュメントの `h2hMultiYear`（lookback 合算）。
 */
import type { WlRecord } from "@/lib/nba/insights/priorSeasonRecordTypes";
import type { NbaH2HSeasonPair } from "@/lib/nba/insights/priorSeasonRecordTypes";

export const NBA_TEAM_INSIGHT_EXTRAS_COLLECTION = "nbaTeamInsightExtras";

export type NbaTeamInsightExtraSplit = {
  teamId: string;
  /** restDays === 0（連戦2日目） */
  b2b: WlRecord;
  b2bHome: WlRecord;
  b2bAway: WlRecord;
  /** 休養 0 / 1 / 2+ 日（初戦は除外） */
  rest0: WlRecord;
  rest1: WlRecord;
  rest2Plus: WlRecord;
  /** 当該試合が「4夜で3試合目以降」 */
  dense3in4: WlRecord;
  /** 当該試合が「5夜で4試合目以降」 */
  dense4in5: WlRecord;
  vsEast: WlRecord;
  vsWest: WlRecord;
  vsDivision: WlRecord;
  /** |点差| ≤ 5 */
  clutchClose5: WlRecord;
  /**
   * デンバー本拠（高地）での試合。
   * 他チーム = アウェイ@DEN。Nuggets = ホーム。
   */
  atAltitude: WlRecord;
  /** 集計に使った試合数（overall 相当） */
  gamesCounted: number;
  /** rest 分類できた試合数（初戦除外後） */
  gamesWithRest: number;
};

export type NbaTeamInsightExtrasBundle = {
  seasonKey: string;
  /** h2h 合算に含めたシーズン（新しい順） */
  h2hSeasonKeys: string[];
  teams: Record<string, NbaTeamInsightExtraSplit>;
  /** 複数年 H2H（ペアキー teamA|teamB） */
  h2hMultiYear: Record<string, NbaH2HSeasonPair>;
  gameCount: number;
  builtAtMs: number;
  source: string;
};
