/**
 * Pro Insight — LLM に渡す構造化ファクト（散文なし）。
 * UI 本数: MATCHUP2 / SCHEDULE2 / CONTEXT2 / INJURY IMPACT2。
 */
import type { ProInsightNarrativeKind } from "@/lib/predict/proInsightNarrativeTypes";
import { PRO_INSIGHT_NARRATIVE_ITEM_CAPS } from "@/lib/predict/proInsightNarrativeTypes";
import type { ProBriefPhase } from "@/lib/predict/predictProBrief";

export type ProInsightFactSection = ProInsightNarrativeKind;

export const PRO_INSIGHT_FACT_CAPS = PRO_INSIGHT_NARRATIVE_ITEM_CAPS;

export type ProInsightFactMetric = {
  key: string;
  /** 表示・監査用（例: "#3", "11-6", "−5.3"） */
  value: string;
  /** 順位なら 1=最良 */
  rank?: number | null;
  teamId?: string;
};

export type ProInsightFactPlayer = {
  playerId: string;
  playerName: string;
  status?: "out" | "doubtful" | "questionable" | string;
};

/**
 * 1 ファクト = LLM に 1 短文分の材料。
 * `label` は英語スラグ（人間向け見出しではない）。
 */
export type ProInsightFact = {
  id: string;
  section: ProInsightFactSection;
  /** 種別スラグ（clash_paint / rest_gap / ace_out …） */
  kind: string;
  /** 選定優先度（高いほど残す） */
  score: number;
  /** 主語チーム（片側 or 両側） */
  teamIds: string[];
  label: string;
  metrics: ProInsightFactMetric[];
  players: ProInsightFactPlayer[];
  /**
   * MATCHUP:
   * - strength = 型の強み衝突
   * - weakening = 攻め側型オーナー OUT で不確か
   * - amplify = 守り側型オーナー OUT で穴が増幅
   */
  mode?: "strength" | "weakening" | "amplify" | "neutral";
  /** 重複除去用（例: injury:237, travel:away） */
  dedupeKeys: string[];
  /** LLM 向け短い英語ヒント（数字は metrics を正とする） */
  hintEn: string;
};

export type ProInsightFactPack = {
  homeTeamId: string;
  awayTeamId: string;
  tipAtMs: number;
  phase: ProBriefPhase;
  /** 枠ごとに cap 済み・score 降順 */
  sections: Record<ProInsightFactSection, ProInsightFact[]>;
  /** 全候補（監査用・cap 前） */
  candidates: ProInsightFact[];
  /** facts 指紋（patch 判定） */
  fingerprint: string;
};

export { type ProBriefPhase };
