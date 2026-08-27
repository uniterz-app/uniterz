export type NbaDraftPickKind =
  | "own"
  | "incoming"
  | "outgoing"
  | "swap_favorable"
  | "swap_unfavorable"
  | "conditional";

export type NbaDraftPickBadgeType =
  | "own"          // 自前 (OWN)
  | "from"         // 取得 (FROM <TEAM>)
  | "swap"         // スワップ (SWAP)
  | "prot"         // プロテクトあり (TOP5 PROT 等)
  | "conditional"  // 条件付き (COND)
  | "outgoing";    // 放出済み (OUT)

export type NbaDraftPickEntry = {
  id: string;
  year: number;
  round: 1 | 2;
  kind: NbaDraftPickKind;
  badgeType?: NbaDraftPickBadgeType;
  /** 確定 (guaranteed) か 条件付き (conditional) か 放出 (outgoing) か スワップ (swap) */
  isConditional?: boolean;
  isOutgoing?: boolean;
  isSwap?: boolean;
  /** 獲得元チーム略称 (LAC, PHX, DEN 等) */
  fromTeamId?: string;
  /** 放出先チーム略称 (OKC, HOU, SAS 等) */
  toTeamId?: string;
  /** スワップ対象チーム略称 */
  swapWithTeamId?: string;
  /** プロテクション文字列 (例: "Top 5 Protected", "Lottery Protected (1-14)", "Unprotected") */
  protection?: string;
  /** 短縮プロテクトバッジ用 (例: "TOP 5 PROT", "LOTTERY") */
  protectionTag?: string;
  /** 短縮表示用ラベル（チップ用: 例 "DEN", "自前", "SAS", "ATL / MIA 低い方"） */
  shortLabelJa?: string;
  shortLabelEn?: string;
  /** 詳細条件リスト (日本語) */
  conditionsJa?: string[];
  /** 詳細条件リスト (英語) */
  conditionsEn?: string[];
  /** 補足説明 (日) */
  detailsJa?: string;
  /** 補足説明 (英) */
  detailsEn?: string;
};

export type NbaDraftYearPicks = {
  year: number;
  firstRound: NbaDraftPickEntry[];
  secondRound: NbaDraftPickEntry[];
  firstRoundCount: number;
  secondRoundCount: number;
};

export type NbaDraftAssetsSummary = {
  /** 1巡目 確定本数 */
  guaranteed1st: number;
  /** 1巡目 条件付き本数 */
  conditional1st: number;
  /** 1巡目 合計保有本数 */
  total1st: number;
  /** 2巡目 確定本数 */
  guaranteed2nd: number;
  /** 2巡目 条件付き本数 */
  conditional2nd: number;
  /** 2巡目 合計保有本数 */
  total2nd: number;
  /** スワップ権 件数 */
  swapRights: number;
  /** 放出済み指名権 本数 */
  outgoingPicks: number;
  /** 柔軟性スコア / ラベル */
  flexibility: "VERY HIGH" | "HIGH" | "MEDIUM" | "LOW" | "VERY LOW";
  flexibilityJa: "極めて高い" | "高い" | "普通" | "低い" | "極めて低い";
};

export type NbaTeamDraftCapital = {
  teamId: string;
  teamAbbr: string;
  /** 今後 7 年間 (2027-2033) の 1 巡目保有総数 */
  totalFirstRound: number;
  /** 今後 7 年間 (2027-2033) の 2 巡目保有総数 */
  totalSecondRound: number;
  /** 基準 (各年 1 本 = 7 本) に対する純増減 */
  netFirstRoundDiff: number;
  netSecondRoundDiff: number;
  /** サマリー指標 (確定/条件付き/スワップ/放出/柔軟性) */
  summary: NbaDraftAssetsSummary;
  /** 年別詳細 (2027〜2033) */
  years: NbaDraftYearPicks[];
};
