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

/** 部位（API 英語 → 表示用） */
const INJURY_BODY_PART_JA: Record<string, string> = {
  foot: "足",
  ankle: "足首",
  knee: "膝",
  hip: "股関節",
  groin: "鼠径部",
  hamstring: "ハムストリング",
  quad: "大腿四頭筋",
  quadriceps: "大腿四頭筋",
  calf: "ふくらはぎ",
  soleus: "ヒラメ筋",
  achilles: "アキレス腱",
  elbow: "肘",
  wrist: "手首",
  hand: "手",
  finger: "指",
  thumb: "親指",
  shoulder: "肩",
  back: "背中",
  lower: "腰",
  "lower back": "腰",
  lumbar: "腰",
  neck: "首",
  head: "頭",
  concussion: "脳震盪",
  illness: "体調不良",
  personal: "私事",
  rest: "休養",
  unspecified: "部位不明",
};

/** 症状・診断（API 英語 → 表示用） */
const INJURY_CONDITION_JA: Record<string, string> = {
  "plantar fasciitis": "足底腱膜炎",
  soreness: "張り",
  sprain: "捻挫",
  strain: "肉離れ",
  contusion: "打撲",
  bruise: "あざ",
  fracture: "骨折",
  surgery: "手術",
  recovery: "回復中",
  inflammation: "炎症",
  tendinitis: "腱炎",
  tendonitis: "腱炎",
  bursitis: "滑液包炎",
  dislocation: "脱臼",
  tear: "断裂",
  "acl tear": "ACL断裂",
  "mcl sprain": "MCL捻挫",
  "meniscus tear": "半月板損傷",
  rest: "休養",
  illness: "体調不良",
  maintenance: "コンディション調整",
  load: "負荷管理",
  management: "管理中",
  soleus: "ヒラメ筋",
};

function normalizeInjuryToken(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, " ");
}

function translateInjuryTokenJa(raw: string): string {
  const key = normalizeInjuryToken(raw);
  if (!key) return raw.trim();
  return (
    INJURY_BODY_PART_JA[key] ??
    INJURY_CONDITION_JA[key] ??
    raw.trim()
  );
}

/** "Foot / Plantar Fasciitis" → ja: "足 / 足底腱膜炎" */
export function formatInjuryDetailLabel(
  detail: string,
  language: "ja" | "en" = "en"
): string {
  const trimmed = detail.trim();
  if (!trimmed) return "—";
  if (language !== "ja") return trimmed.toUpperCase();
  return trimmed
    .split("/")
    .map((part) => translateInjuryTokenJa(part))
    .join(" / ");
}

export function injuryDetailLabel(
  entry: NbaInjuryEntry,
  language: "ja" | "en" = "en"
): string {
  if (entry.injuryDetail?.trim()) {
    return formatInjuryDetailLabel(entry.injuryDetail, language);
  }
  const part = injuryBodyPart(entry.description);
  if (part) return formatInjuryDetailLabel(part, language);
  return "—";
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
