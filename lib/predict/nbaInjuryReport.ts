/**
 * NBA Injury Report — 予想ツールタブ用。
 * フィールドは BallDontLie `player_injuries` に寄せる（同期後にそのまま写せる形）。
 */

export type NbaInjuryStatus =
  | "Out"
  | "Doubtful"
  | "Questionable"
  | "Probable"
  | "Available"
  | string;

export type NbaInjuryPlayer = {
  id: number | string;
  firstName: string;
  lastName: string;
  position?: string | null;
  jerseyNumber?: string | null;
};

export type NbaInjuryEntry = {
  player: NbaInjuryPlayer;
  status: NbaInjuryStatus;
  /** 例: "2 WEEKS" / "DAY-TO-DAY" — UI の EXPECTED 行 */
  returnDate?: string | null;
  /** UI 用 "FOOT / PLANTAR FASCIITIS"（無いときは description から推定） */
  injuryDetail?: string | null;
  /** BDL の長文ノート */
  description?: string | null;
  /** カードのチーム略称上書き（無いときは親チーム） */
  teamId?: string;
  teamName?: string;
};

export type NbaInjuryTeamReport = {
  teamId: string;
  teamName: string;
  side: "home" | "away";
  entries: NbaInjuryEntry[];
};

export type NbaInjuryReport = {
  home: NbaInjuryTeamReport;
  away: NbaInjuryTeamReport;
  asOfLabel?: string | null;
};

/** フラット化したカード行（HOME/AWAY を1リストに） */
export type NbaInjuryCardRow = NbaInjuryEntry & {
  teamId: string;
  teamName: string;
  side: "home" | "away";
};

const STATUS_RANK: Record<string, number> = {
  out: 0,
  doubtful: 1,
  questionable: 2,
  probable: 3,
  available: 4,
};

export function injuryStatusRank(status: string): number {
  const key = status.trim().toLowerCase();
  return STATUS_RANK[key] ?? 9;
}

export function sortInjuryEntries(
  entries: NbaInjuryEntry[]
): NbaInjuryEntry[] {
  return [...entries].sort((a, b) => {
    const byStatus = injuryStatusRank(a.status) - injuryStatusRank(b.status);
    if (byStatus !== 0) return byStatus;
    const an = `${a.player.lastName} ${a.player.firstName}`.toLowerCase();
    const bn = `${b.player.lastName} ${b.player.firstName}`.toLowerCase();
    return an.localeCompare(bn);
  });
}

export function flattenInjuryReport(report: NbaInjuryReport): NbaInjuryCardRow[] {
  const rows: NbaInjuryCardRow[] = [
    ...report.home.entries.map((e) => ({
      ...e,
      teamId: e.teamId ?? report.home.teamId,
      teamName: e.teamName ?? report.home.teamName,
      side: report.home.side,
    })),
    ...report.away.entries.map((e) => ({
      ...e,
      teamId: e.teamId ?? report.away.teamId,
      teamName: e.teamName ?? report.away.teamName,
      side: report.away.side,
    })),
  ];
  return sortInjuryEntries(rows) as NbaInjuryCardRow[];
}

export function playerInitials(player: NbaInjuryPlayer): string {
  const f = player.firstName?.trim().charAt(0) ?? "";
  const l = player.lastName?.trim().charAt(0) ?? "";
  return `${f}${l}`.toUpperCase() || "?";
}

/** カード見出し用（例: L.JAMES） */
export function playerCardName(player: NbaInjuryPlayer): string {
  const first = player.firstName?.trim() ?? "";
  const last = player.lastName?.trim() ?? "";
  if (first && last) {
    return `${first.charAt(0).toUpperCase()}.${last.toUpperCase()}`;
  }
  return (last || first || "—").toUpperCase();
}

/** description から "(shoulder)" 等の部位を拾う */
export function injuryBodyPart(description: string | null | undefined): string | null {
  if (!description) return null;
  const m = description.match(/\(([^)]+)\)/);
  if (!m?.[1]) return null;
  const part = m[1].trim();
  if (!part || part.length > 24) return null;
  return part;
}

/** 部位・キーワード対応表（英語 → 日本語） */
const INJURY_BODY_PARTS: Array<{ en: string; ja: string; pattern: RegExp }> = [
  { en: "Plantar Fasciitis", ja: "足底腱膜炎", pattern: /\bplantar\s+fasciitis\b/i },
  { en: "Achilles", ja: "アキレス腱", pattern: /\bachilles\b/i },
  { en: "Hamstring", ja: "ハムストリング", pattern: /\bhamstring\b/i },
  { en: "Quadriceps", ja: "大腿四頭筋", pattern: /\b(quadriceps|quad)\b/i },
  { en: "Adductor", ja: "内転筋", pattern: /\badductor\b/i },
  { en: "Abdomen", ja: "腹部", pattern: /\b(abdominal|abdomen|oblique)\b/i },
  { en: "Lower Back", ja: "腰", pattern: /\b(lower\s+back|lumbar)\b/i },
  { en: "Back", ja: "背中", pattern: /\bback\b/i },
  { en: "Shoulder", ja: "肩", pattern: /\bshoulder\b/i },
  { en: "Ankle", ja: "足首", pattern: /\bankle\b/i },
  { en: "Foot", ja: "足", pattern: /\b(foot|feet)\b/i },
  { en: "Knee", ja: "膝", pattern: /\bknee\b/i },
  { en: "Hip", ja: "股関節", pattern: /\bhip\b/i },
  { en: "Groin", ja: "鼠径部", pattern: /\bgroin\b/i },
  { en: "Calf", ja: "ふくらはぎ", pattern: /\b(calf|calves|soleus)\b/i },
  { en: "Elbow", ja: "肘", pattern: /\belbow\b/i },
  { en: "Wrist", ja: "手首", pattern: /\bwrist\b/i },
  { en: "Hand", ja: "手", pattern: /\bhand\b/i },
  { en: "Thumb", ja: "親指", pattern: /\bthumb\b/i },
  { en: "Finger", ja: "指", pattern: /\bfinger\b/i },
  { en: "Neck", ja: "首", pattern: /\bneck\b/i },
  { en: "Head", ja: "頭", pattern: /\bhead\b/i },
  { en: "Concussion", ja: "脳震盪", pattern: /\bconcussion\b/i },
  { en: "Eye", ja: "目", pattern: /\beye\b/i },
  { en: "Nose", ja: "鼻", pattern: /\bnose\b/i },
  { en: "Rib", ja: "肋骨", pattern: /\bribs?\b/i },
  { en: "Chest", ja: "胸", pattern: /\bchest\b/i },
  { en: "Shin", ja: "すね", pattern: /\bshin\b/i },
  { en: "Toe", ja: "つま先", pattern: /\btoes?\b/i },
  { en: "Heel", ja: "かかと", pattern: /\bheel\b/i },
];

/** 症状・状態対応表（英語 → 日本語） */
const INJURY_CONDITIONS: Array<{ en: string; ja: string; pattern: RegExp }> = [
  { en: "Undisclosed", ja: "非公開", pattern: /\b(undisclosed|unspecified)\b/i },
  { en: "Sprain", ja: "捻挫", pattern: /\bsprain\b/i },
  { en: "Strain", ja: "肉離れ", pattern: /\bstrain\b/i },
  { en: "Fracture", ja: "骨折", pattern: /\bfracture\b/i },
  { en: "Contusion", ja: "打撲", pattern: /\b(contusion|bruise)\b/i },
  { en: "Soreness", ja: "張り", pattern: /\b(soreness|pain)\b/i },
  { en: "Surgery", ja: "手術", pattern: /\bsurgery\b/i },
  { en: "Recovery", ja: "回復中", pattern: /\b(rehab|recovery)\b/i },
  { en: "Inflammation", ja: "炎症", pattern: /\binflammation\b/i },
  { en: "Tendinitis", ja: "腱炎", pattern: /\b(tendinitis|tendonitis)\b/i },
  { en: "Dislocation", ja: "脱臼", pattern: /\bdislocation\b/i },
  { en: "Tear", ja: "断裂", pattern: /\btear\b/i },
  { en: "Illness", ja: "体調不良", pattern: /\b(illness|sick|flu)\b/i },
  { en: "Personal", ja: "私事", pattern: /\bpersonal\b/i },
  { en: "Rest", ja: "休養", pattern: /\b(rest|load\s+management)\b/i },
  { en: "Conditioning", ja: "コンディション調整", pattern: /\b(conditioning|maintenance)\b/i },
];

/** 日本語が直接入っている場合の逆引き用（例: "膝" → "Knee"） */
const JA_TO_EN_BODY_PARTS: Record<string, string> = {
  "足底腱膜炎": "Plantar Fasciitis",
  "アキレス腱": "Achilles",
  "ハムストリング": "Hamstring",
  "大腿四頭筋": "Quadriceps",
  "内転筋": "Adductor",
  "腹部": "Abdomen",
  "腰": "Lower Back",
  "背中": "Back",
  "肩": "Shoulder",
  "足首": "Ankle",
  "足": "Foot",
  "膝": "Knee",
  "股関節": "Hip",
  "鼠径部": "Groin",
  "ふくらはぎ": "Calf",
  "ヒラメ筋": "Soleus",
  "肘": "Elbow",
  "手首": "Wrist",
  "手": "Hand",
  "親指": "Thumb",
  "指": "Finger",
  "首": "Neck",
  "頭": "Head",
  "脳震盪": "Concussion",
  "目": "Eye",
  "鼻": "鼻",
  "肋骨": "Rib",
  "胸": "Chest",
  "すね": "Shin",
  "つま先": "Toe",
  "かかと": "Heel",
  "非公開": "Undisclosed",
  "捻挫": "Sprain",
  "肉離れ": "Strain",
  "骨折": "Fracture",
  "打撲": "Contusion",
  "張り": "Soreness",
  "体調不良": "Illness",
  "休養": "Rest",
  "コンディション調整": "Conditioning",
};

/**
 * 任意のテキスト（長文ニュース文や短い部位文字列）から
 * 最優先で「部位」を抽出し、なければ「症状・状態」、いずれもなければ「コンディション調整」を返す。
 */
export function extractInjuryConciseLabel(
  rawText: string | null | undefined,
  language: "ja" | "en" = "en"
): string {
  if (!rawText) {
    return language === "ja" ? "コンディション調整" : "CONDITIONING";
  }

  const trimmed = rawText.trim();
  if (!trimmed) {
    return language === "ja" ? "コンディション調整" : "CONDITIONING";
  }

  // すでに登録された日本語文字列の場合
  if (JA_TO_EN_BODY_PARTS[trimmed]) {
    return language === "ja"
      ? trimmed
      : (JA_TO_EN_BODY_PARTS[trimmed] ?? trimmed).toUpperCase();
  }

  // 1. カッコ内 (hip) 等があれば最優先で抽出
  const parenMatch = trimmed.match(/\(([^)]+)\)/);
  const targetToScan = parenMatch?.[1] ? `${parenMatch[1]} ${trimmed}` : trimmed;

  // 2. 部位を最優先で検索
  for (const part of INJURY_BODY_PARTS) {
    if (part.pattern.test(targetToScan)) {
      return language === "ja" ? part.ja : part.en.toUpperCase();
    }
  }

  // 3. 症状・状態（非公開・捻挫・体調不良など）を検索
  for (const cond of INJURY_CONDITIONS) {
    if (cond.pattern.test(targetToScan)) {
      return language === "ja" ? cond.ja : cond.en.toUpperCase();
    }
  }

  // 4. スラッシュ区切りで短い単語がある場合（"Foot / Plantar Fasciitis" 等）
  if (trimmed.length <= 30 && !trimmed.includes(".")) {
    return language === "ja" ? trimmed : trimmed.toUpperCase();
  }

  // 5. 部位・症状が見つからない長文ニュースなどの場合は「コンディション調整」
  return language === "ja" ? "コンディション調整" : "CONDITIONING";
}

/** "Foot / Plantar Fasciitis" → ja: "足 / 足底腱膜炎" */
export function formatInjuryDetailLabel(
  detail: string,
  language: "ja" | "en" = "en"
): string {
  return extractInjuryConciseLabel(detail, language);
}

export function injuryDetailLabel(
  entry: NbaInjuryEntry,
  language: "ja" | "en" = "en"
): string {
  const raw = entry.injuryDetail?.trim() || entry.description?.trim();
  return extractInjuryConciseLabel(raw, language);
}

export type InjuryStatusTone =
  | "out"
  | "doubt"
  | "question"
  | "probable"
  | "available"
  | "neutral";

/**
 * Injury Report → playerId のステータス map（Roster 行ハイライト用）
 * Available はノイズなので含めない。
 */
export function injuryStatusByPlayerId(
  report: NbaInjuryReport
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const entry of [...report.home.entries, ...report.away.entries]) {
    const key = String(entry.status).trim().toLowerCase();
    if (key === "available") continue;
    out[String(entry.player.id)] = entry.status;
  }
  return out;
}

export function injuryStatusTone(status: string): InjuryStatusTone {
  const key = status.trim().toLowerCase();
  if (key === "out") return "out";
  if (key === "doubtful") return "doubt";
  if (key === "questionable") return "question";
  if (key === "probable") return "probable";
  if (key === "available") return "available";
  return "neutral";
}

export function injuryStatusLabel(status: string): string {
  const key = status.trim().toLowerCase();
  if (key === "out") return "OUT";
  if (key === "doubtful") return "DOUBTFUL";
  if (key === "questionable") return "QUESTIONABLE";
  if (key === "probable") return "PROBABLE";
  if (key === "available") return "AVAILABLE";
  return status.trim().toUpperCase() || "—";
}

/** 狭いカード用。フル表記は `injuryStatusLabel` */
export function injuryStatusShortLabel(status: string): string {
  const key = status.trim().toLowerCase();
  if (key === "out") return "OUT";
  if (key === "doubtful") return "DOUBT";
  if (key === "questionable") return "QUES";
  if (key === "probable") return "PROB";
  if (key === "available") return "AVAIL";
  const full = injuryStatusLabel(status);
  return full.length > 5 ? full.slice(0, 5) : full;
}
