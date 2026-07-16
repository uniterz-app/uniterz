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

export type PredictProBrief = {
  home: ProBriefTeamCard;
  away: ProBriefTeamCard;
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
