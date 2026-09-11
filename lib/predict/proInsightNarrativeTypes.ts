/**
 * 新 Pro Insight — LLM 文章表示用の構造（ファクト選定は別層）。
 * UI: 試合1本 · MATCHUP2 / SCHEDULE2 / CONTEXT2 / INJURY IMPACT2。
 */
import type { UiStrings } from "@/lib/i18n/ui";

export const PRO_INSIGHT_NARRATIVE_SECTION_KINDS = [
  "MATCHUP",
  "SCHEDULE",
  "CONTEXT",
  "INJURY IMPACT",
] as const;

export type ProInsightNarrativeKind =
  (typeof PRO_INSIGHT_NARRATIVE_SECTION_KINDS)[number];

/** 枠ごとの本数（試合全体・設計正） */
export const PRO_INSIGHT_NARRATIVE_ITEM_CAPS: Record<
  ProInsightNarrativeKind,
  number
> = {
  MATCHUP: 2,
  SCHEDULE: 2,
  CONTEXT: 2,
  "INJURY IMPACT": 2,
};

export type ProInsightNarrativeItem = {
  /** LLM 短文（ja/en 正。他言語は翻訳想定） */
  body: UiStrings;
  /** 根拠数字・ラベル（小さく表示） */
  evidence: UiStrings[];
};

export type ProInsightNarrativeSection = {
  kind: ProInsightNarrativeKind;
  items: ProInsightNarrativeItem[];
};

/** 試合単位の Insight（HOME/AWAY 分割なし） */
export type ProInsightNarrativeBrief = {
  homeTeamId: string;
  awayTeamId: string;
  sections: ProInsightNarrativeSection[];
  /** early 用など */
  sampleNote?: UiStrings | null;
};
