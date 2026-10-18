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

/** MATCHUP 表の最大行数 */
export const PRO_INSIGHT_MATCHUP_TABLE_MAX_ROWS = 5;

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

/** 根拠行を出す枠（SCHEDULE / CONTEXT は本文とほぼ同文になるため出さない） */
export function proInsightShowsEvidence(kind: ProInsightNarrativeKind): boolean {
  return kind === "MATCHUP" || kind === "INJURY IMPACT";
}

export type ProInsightNarrativeItem = {
  /** LLM 短文（ja/en 正。他言語は翻訳想定） */
  body: UiStrings;
  /** 根拠数字・ラベル（小さく表示） */
  evidence: UiStrings[];
  /** テンプレ生成の項目。"difficulty" なら SCHEDULE 見出しに説明の ? を出す。"fact" = 事実ごとのコード文 */
  template?: "difficulty" | "injury_difficulty" | "fact";
};

export type ProInsightMatchupStatSide = {
  teamId: string;
  /** 指標名（攻め側は OREB%、守り側は 被OREB% など） */
  metric: UiStrings;
  /** 表示用の値（33.6% / 44.3） */
  value: string;
  /** リーグ内順位（1 = その指標で最良） */
  rank: number;
};

/** MATCHUP 表の 1 行（攻め × 相手の守り。差が大きい順） */
export type ProInsightMatchupStatRow = {
  /** clash kind（paint / glass …） */
  kind: string;
  /** どこの争いか（ペイント / ボード …） */
  label: UiStrings;
  /** 有利な側（攻め側） */
  edgeTeamId: string;
  away: ProInsightMatchupStatSide;
  home: ProInsightMatchupStatSide;
  /** その指標を担う選手の欠場（OUT / questionable） */
  notes?: UiStrings[];
};

export type ProInsightMatchupStatTable = {
  rows: ProInsightMatchupStatRow[];
  /** 数字の出典シーズン（序盤は前季） */
  seasonKey: string | null;
  /** 順位の母数 */
  teamCount: number;
};

export type ProInsightNarrativeSection = {
  kind: ProInsightNarrativeKind;
  /** MATCHUP は table がある版から table を表示。items は旧クライアント向けの 1 行要約 */
  items: ProInsightNarrativeItem[];
  table?: ProInsightMatchupStatTable;
};

/** 試合単位の Insight（HOME/AWAY 分割なし） */
export type ProInsightNarrativeBrief = {
  homeTeamId: string;
  awayTeamId: string;
  sections: ProInsightNarrativeSection[];
  /** early 用など */
  sampleNote?: UiStrings | null;
  /** LLM 出力の中間値（INJURY IMPACT 先頭の厳しさの読み）。保存前に項目へ組み込んで消す */
  injuryDifficultyRead?: UiStrings;
};
