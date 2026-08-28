/**
 * Pro Prediction Brief — HOME / AWAY カード
 * EDGE（Matchup）· SCHEDULE（日程/疲労）· CONTEXT（対戦相手の強さ）
 * 推奨スコア / KEY / 共有Risk は出さない。
 */

export type ProBriefEdgeItem = {
  /** 英語ラベル必須（UI は常に英語） */
  label: string;
  /** 任意の裏付け（言語切替） */
  detailJa?: string;
  detailEn?: string;
};

export type ProBriefLineItem = {
  textJa: string;
  textEn: string;
};

export type ProBriefTeamCard = {
  edges: ProBriefEdgeItem[];
  /** 日程・疲労（目安 2） */
  schedule: ProBriefLineItem[];
  /** 直近対戦相手の強さなど */
  context: ProBriefLineItem[];
};

/** シーズン進行に応じた生成モード（設計: docs/pro-insight-design.md） */
export type ProBriefPhase = "opening" | "early" | "full";

export type PredictProBrief = {
  home: ProBriefTeamCard;
  away: ProBriefTeamCard;
  /** opening / early / full */
  phase?: ProBriefPhase;
  /** early のみ。カード全体に 1 回出すサンプル注記 */
  sampleNoteJa?: string;
  sampleNoteEn?: string;
  /** 消化済み試合数（early の N） */
  gamesPlayed?: number;
  generatedAtMs?: number;
  patchedAtMs?: number;
};

export function briefEdgeDetail(
  edge: ProBriefEdgeItem,
  language: "ja" | "en"
): string | undefined {
  return language === "ja" ? edge.detailJa : edge.detailEn;
}

export function briefLineText(
  item: ProBriefLineItem,
  language: "ja" | "en"
): string {
  return language === "ja" ? item.textJa : item.textEn;
}

/** 「開幕戦 · 休養十分」→ 見出し + 本文。区切りが無ければ本文のみ */
export function splitBriefLineLead(text: string): {
  label: string | null;
  body: string;
} {
  for (const sep of [" · ", "・"] as const) {
    const i = text.indexOf(sep);
    if (i <= 0) continue;
    const label = text.slice(0, i).trim();
    const body = text.slice(i + sep.length).trim();
    if (label && body) return { label, body };
  }
  return { label: null, body: text };
}
