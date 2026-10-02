/**
 * NBA Injury Report — 予想ツールタブ用。
 * フィールドは BallDontLie `player_injuries` に寄せる（同期後にそのまま写せる形）。
 */

import { L, resolveLocalizedLang, type LocalizedLang } from "@/lib/i18n/localize";
import type { UiStrings } from "@/lib/i18n/ui";

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

type InjuryLabelRow = { label: UiStrings; pattern: RegExp };

/** 部位・キーワード対応表（7言語） */
const INJURY_BODY_PARTS: InjuryLabelRow[] = [
  {
    pattern: /\bplantar\s+fasciitis\b/i,
    label: {
      ja: "足底腱膜炎",
      en: "Plantar Fasciitis",
      ko: "족저근막염",
      zh: "足底筋膜炎",
      es: "Fascitis plantar",
      pt: "Fascite plantar",
      fr: "Fasciite plantaire",
    },
  },
  {
    pattern: /\bachilles\b/i,
    label: {
      ja: "アキレス腱",
      en: "Achilles",
      ko: "아킬레스건",
      zh: "跟腱",
      es: "Aquiles",
      pt: "Aquiles",
      fr: "Achille",
    },
  },
  {
    pattern: /\bhamstring\b/i,
    label: {
      ja: "ハムストリング",
      en: "Hamstring",
      ko: "햄스트링",
      zh: "腘绳肌",
      es: "Isquiotibial",
      pt: "Isquiotibial",
      fr: "Ischio-jambier",
    },
  },
  {
    pattern: /\b(quadriceps|quad)\b/i,
    label: {
      ja: "大腿四頭筋",
      en: "Quadriceps",
      ko: "대퇴사두근",
      zh: "股四头肌",
      es: "Cuádriceps",
      pt: "Quadríceps",
      fr: "Quadriceps",
    },
  },
  {
    pattern: /\badductor\b/i,
    label: {
      ja: "内転筋",
      en: "Adductor",
      ko: "내전근",
      zh: "内收肌",
      es: "Aductor",
      pt: "Adutor",
      fr: "Adducteur",
    },
  },
  {
    pattern: /\b(abdominal|abdomen|oblique)\b/i,
    label: {
      ja: "腹部",
      en: "Abdomen",
      ko: "복부",
      zh: "腹部",
      es: "Abdomen",
      pt: "Abdômen",
      fr: "Abdomen",
    },
  },
  {
    pattern: /\b(lower\s+back|lumbar)\b/i,
    label: {
      ja: "腰",
      en: "Lower Back",
      ko: "허리",
      zh: "下背部",
      es: "Zona lumbar",
      pt: "Lombar",
      fr: "Bas du dos",
    },
  },
  {
    pattern: /\bback\b/i,
    label: {
      ja: "背中",
      en: "Back",
      ko: "등",
      zh: "背部",
      es: "Espalda",
      pt: "Costas",
      fr: "Dos",
    },
  },
  {
    pattern: /\bshoulder\b/i,
    label: {
      ja: "肩",
      en: "Shoulder",
      ko: "어깨",
      zh: "肩部",
      es: "Hombro",
      pt: "Ombro",
      fr: "Épaule",
    },
  },
  {
    pattern: /\bankle\b/i,
    label: {
      ja: "足首",
      en: "Ankle",
      ko: "발목",
      zh: "脚踝",
      es: "Tobillo",
      pt: "Tornozelo",
      fr: "Cheville",
    },
  },
  {
    pattern: /\b(foot|feet)\b/i,
    label: {
      ja: "足",
      en: "Foot",
      ko: "발",
      zh: "脚部",
      es: "Pie",
      pt: "Pé",
      fr: "Pied",
    },
  },
  {
    pattern: /\bknee\b/i,
    label: {
      ja: "膝",
      en: "Knee",
      ko: "무릎",
      zh: "膝盖",
      es: "Rodilla",
      pt: "Joelho",
      fr: "Genou",
    },
  },
  {
    pattern: /\bhip\b/i,
    label: {
      ja: "股関節",
      en: "Hip",
      ko: "고관절",
      zh: "髋部",
      es: "Cadera",
      pt: "Quadril",
      fr: "Hanche",
    },
  },
  {
    pattern: /\bgroin\b/i,
    label: {
      ja: "鼠径部",
      en: "Groin",
      ko: "사타구니",
      zh: "腹股沟",
      es: "Ingle",
      pt: "Virilha",
      fr: "Aine",
    },
  },
  {
    pattern: /\b(calf|calves|soleus)\b/i,
    label: {
      ja: "ふくらはぎ",
      en: "Calf",
      ko: "종아리",
      zh: "小腿",
      es: "Gemelo",
      pt: "Panturrilha",
      fr: "Mollet",
    },
  },
  {
    pattern: /\belbow\b/i,
    label: {
      ja: "肘",
      en: "Elbow",
      ko: "팔꿈치",
      zh: "肘部",
      es: "Codo",
      pt: "Cotovelo",
      fr: "Coude",
    },
  },
  {
    pattern: /\bwrist\b/i,
    label: {
      ja: "手首",
      en: "Wrist",
      ko: "손목",
      zh: "手腕",
      es: "Muñeca",
      pt: "Punho",
      fr: "Poignet",
    },
  },
  {
    pattern: /\bhand\b/i,
    label: {
      ja: "手",
      en: "Hand",
      ko: "손",
      zh: "手部",
      es: "Mano",
      pt: "Mão",
      fr: "Main",
    },
  },
  {
    pattern: /\bthumb\b/i,
    label: {
      ja: "親指",
      en: "Thumb",
      ko: "엄지",
      zh: "拇指",
      es: "Pulgar",
      pt: "Polegar",
      fr: "Pouce",
    },
  },
  {
    pattern: /\bfinger\b/i,
    label: {
      ja: "指",
      en: "Finger",
      ko: "손가락",
      zh: "手指",
      es: "Dedo",
      pt: "Dedo",
      fr: "Doigt",
    },
  },
  {
    pattern: /\bneck\b/i,
    label: {
      ja: "首",
      en: "Neck",
      ko: "목",
      zh: "颈部",
      es: "Cuello",
      pt: "Pescoço",
      fr: "Cou",
    },
  },
  {
    pattern: /\bhead\b/i,
    label: {
      ja: "頭",
      en: "Head",
      ko: "머리",
      zh: "头部",
      es: "Cabeza",
      pt: "Cabeça",
      fr: "Tête",
    },
  },
  {
    pattern: /\bconcussion\b/i,
    label: {
      ja: "脳震盪",
      en: "Concussion",
      ko: "뇌진탕",
      zh: "脑震荡",
      es: "Conmoción",
      pt: "Concussão",
      fr: "Commotion",
    },
  },
  {
    pattern: /\beye\b/i,
    label: {
      ja: "目",
      en: "Eye",
      ko: "눈",
      zh: "眼部",
      es: "Ojo",
      pt: "Olho",
      fr: "Œil",
    },
  },
  {
    pattern: /\bnose\b/i,
    label: {
      ja: "鼻",
      en: "Nose",
      ko: "코",
      zh: "鼻部",
      es: "Nariz",
      pt: "Nariz",
      fr: "Nez",
    },
  },
  {
    pattern: /\bribs?\b/i,
    label: {
      ja: "肋骨",
      en: "Rib",
      ko: "갈비뼈",
      zh: "肋骨",
      es: "Costilla",
      pt: "Costela",
      fr: "Côte",
    },
  },
  {
    pattern: /\bchest\b/i,
    label: {
      ja: "胸",
      en: "Chest",
      ko: "가슴",
      zh: "胸部",
      es: "Pecho",
      pt: "Peito",
      fr: "Poitrine",
    },
  },
  {
    pattern: /\bshin\b/i,
    label: {
      ja: "すね",
      en: "Shin",
      ko: "정강이",
      zh: "胫部",
      es: "Espinilla",
      pt: "Canela",
      fr: "Tibia",
    },
  },
  {
    pattern: /\btoes?\b/i,
    label: {
      ja: "つま先",
      en: "Toe",
      ko: "발가락",
      zh: "脚趾",
      es: "Dedo del pie",
      pt: "Dedo do pé",
      fr: "Orteil",
    },
  },
  {
    pattern: /\bheel\b/i,
    label: {
      ja: "かかと",
      en: "Heel",
      ko: "발뒤꿈치",
      zh: "脚跟",
      es: "Talón",
      pt: "Calcanhar",
      fr: "Talon",
    },
  },
];

const CONDITIONING_LABEL: UiStrings = {
  ja: "コンディション調整",
  en: "Conditioning",
  ko: "컨디셔닝",
  zh: "状态调整",
  es: "Puesta a punto",
  pt: "Condicionamento",
  fr: "Remise en forme",
};

/** 症状・状態対応表（7言語） */
const INJURY_CONDITIONS: InjuryLabelRow[] = [
  {
    pattern: /\b(undisclosed|unspecified)\b/i,
    label: {
      ja: "非公開",
      en: "Undisclosed",
      ko: "비공개",
      zh: "未公开",
      es: "No revelado",
      pt: "Não divulgado",
      fr: "Non communiqué",
    },
  },
  {
    pattern: /\bsprain\b/i,
    label: {
      ja: "捻挫",
      en: "Sprain",
      ko: "염좌",
      zh: "扭伤",
      es: "Esguince",
      pt: "Entorse",
      fr: "Entorse",
    },
  },
  {
    pattern: /\bstrain\b/i,
    label: {
      ja: "肉離れ",
      en: "Strain",
      ko: "근육 파열",
      zh: "拉伤",
      es: "Distensión",
      pt: "Estiramento",
      fr: "Élongation",
    },
  },
  {
    pattern: /\bfracture\b/i,
    label: {
      ja: "骨折",
      en: "Fracture",
      ko: "골절",
      zh: "骨折",
      es: "Fractura",
      pt: "Fratura",
      fr: "Fracture",
    },
  },
  {
    pattern: /\b(contusion|bruise)\b/i,
    label: {
      ja: "打撲",
      en: "Contusion",
      ko: "타박상",
      zh: "挫伤",
      es: "Contusión",
      pt: "Contusão",
      fr: "Contusion",
    },
  },
  {
    pattern: /\b(soreness|pain)\b/i,
    label: {
      ja: "張り",
      en: "Soreness",
      ko: "통증",
      zh: "酸痛",
      es: "Molestias",
      pt: "Dores",
      fr: "Douleurs",
    },
  },
  {
    pattern: /\bsurgery\b/i,
    label: {
      ja: "手術",
      en: "Surgery",
      ko: "수술",
      zh: "手术",
      es: "Cirugía",
      pt: "Cirurgia",
      fr: "Chirurgie",
    },
  },
  {
    pattern: /\b(rehab|recovery)\b/i,
    label: {
      ja: "回復中",
      en: "Recovery",
      ko: "회복 중",
      zh: "恢复中",
      es: "Recuperación",
      pt: "Recuperação",
      fr: "Récupération",
    },
  },
  {
    pattern: /\binflammation\b/i,
    label: {
      ja: "炎症",
      en: "Inflammation",
      ko: "염증",
      zh: "炎症",
      es: "Inflamación",
      pt: "Inflamação",
      fr: "Inflammation",
    },
  },
  {
    pattern: /\b(tendinitis|tendonitis)\b/i,
    label: {
      ja: "腱炎",
      en: "Tendinitis",
      ko: "건염",
      zh: "肌腱炎",
      es: "Tendinitis",
      pt: "Tendinite",
      fr: "Tendinite",
    },
  },
  {
    pattern: /\bdislocation\b/i,
    label: {
      ja: "脱臼",
      en: "Dislocation",
      ko: "탈구",
      zh: "脱臼",
      es: "Luxación",
      pt: "Luxação",
      fr: "Luxation",
    },
  },
  {
    pattern: /\btear\b/i,
    label: {
      ja: "断裂",
      en: "Tear",
      ko: "파열",
      zh: "撕裂",
      es: "Rotura",
      pt: "Ruptura",
      fr: "Déchirure",
    },
  },
  {
    pattern: /\b(illness|sick|flu)\b/i,
    label: {
      ja: "体調不良",
      en: "Illness",
      ko: "컨디션 난조",
      zh: "身体不适",
      es: "Enfermedad",
      pt: "Doença",
      fr: "Maladie",
    },
  },
  {
    pattern: /\bpersonal\b/i,
    label: {
      ja: "私事",
      en: "Personal",
      ko: "개인 사유",
      zh: "个人原因",
      es: "Motivos personales",
      pt: "Motivos pessoais",
      fr: "Raisons personnelles",
    },
  },
  {
    pattern: /\b(rest|load\s+management)\b/i,
    label: {
      ja: "休養",
      en: "Rest",
      ko: "휴식",
      zh: "轮休",
      es: "Descanso",
      pt: "Descanso",
      fr: "Repos",
    },
  },
  {
    pattern: /\b(conditioning|maintenance)\b/i,
    label: CONDITIONING_LABEL,
  },
];

/** 日本語がそのまま入っている保存データの逆引き（例: "膝" → 7言語） */
const JA_LABEL_LOOKUP: Record<string, UiStrings> = (() => {
  const map: Record<string, UiStrings> = {};
  for (const row of [...INJURY_BODY_PARTS, ...INJURY_CONDITIONS]) {
    map[row.label.ja] = row.label;
  }
  map["ヒラメ筋"] = {
    ja: "ヒラメ筋",
    en: "Soleus",
    ko: "가자미근",
    zh: "比目鱼肌",
    es: "Sóleo",
    pt: "Sóleo",
    fr: "Soléaire",
  };
  return map;
})();

/** 部位ラベルは ja 以外は大文字（カード見出しのトーン） */
function injuryLabelText(label: UiStrings, lang: LocalizedLang): string {
  const value = L(lang, label);
  return lang === "ja" ? value : value.toUpperCase();
}

/**
 * 任意のテキスト（長文ニュース文や短い部位文字列）から
 * 最優先で「部位」を抽出し、なければ「症状・状態」、いずれもなければ「コンディション調整」を返す。
 */
export function extractInjuryConciseLabel(
  rawText: string | null | undefined,
  language: string | null | undefined = "en"
): string {
  const lang = resolveLocalizedLang(language);
  const conditioning = injuryLabelText(CONDITIONING_LABEL, lang);
  if (!rawText) return conditioning;

  const trimmed = rawText.trim();
  if (!trimmed) return conditioning;

  // すでに登録された日本語文字列の場合
  const jaHit = JA_LABEL_LOOKUP[trimmed];
  if (jaHit) return injuryLabelText(jaHit, lang);

  // 1. カッコ内 (hip) 等があれば最優先で抽出
  const parenMatch = trimmed.match(/\(([^)]+)\)/);
  const targetToScan = parenMatch?.[1] ? `${parenMatch[1]} ${trimmed}` : trimmed;

  // 2. 部位を最優先で検索
  for (const part of INJURY_BODY_PARTS) {
    if (part.pattern.test(targetToScan)) {
      return injuryLabelText(part.label, lang);
    }
  }

  // 3. 症状・状態（非公開・捻挫・体調不良など）を検索
  for (const cond of INJURY_CONDITIONS) {
    if (cond.pattern.test(targetToScan)) {
      return injuryLabelText(cond.label, lang);
    }
  }

  // 4. スラッシュ区切りで短い単語がある場合（"Foot / Plantar Fasciitis" 等）
  if (trimmed.length <= 30 && !trimmed.includes(".")) {
    return lang === "ja" ? trimmed : trimmed.toUpperCase();
  }

  // 5. 部位・症状が見つからない長文ニュースなどの場合は「コンディション調整」
  return conditioning;
}

/** "Foot / Plantar Fasciitis" → ja: "足 / 足底腱膜炎" */
export function formatInjuryDetailLabel(
  detail: string,
  language: string | null | undefined = "en"
): string {
  return extractInjuryConciseLabel(detail, language);
}

export function injuryDetailLabel(
  entry: NbaInjuryEntry,
  language: string | null | undefined = "en"
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
