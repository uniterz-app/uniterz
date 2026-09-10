/**
 * NBA シーズンアワード予想 — 型・検索（本番は API 選手名簿接続後）
 *
 * 選手ピッカー仕様（確定）:
 * - 入力なし / フォーカス直後: 運営指定の候補を最大 5 人（`seasonAwardsCuratedPopular`）
 * - 入力あり: 前方一致サジェスト。名簿は team-rosters（全アクティブ選手）
 * - 採点: `seasonPredictScoring`（確定）
 */
import { L, type LocalizedLang } from "@/lib/i18n/localize";
import type { UiStrings } from "@/lib/i18n/ui";

export type NbaAwardId =
  | "mvp"
  | "dpoy"
  | "roy"
  | "mip"
  | "sixth"
  | "coy"
  | "coty";

export type NbaAwardDef = {
  id: NbaAwardId;
  /** MVP / DPOY … 言語非依存の略号 */
  labelEn: string;
  /** 賞の正式名（7言語） */
  name: UiStrings;
  /** coty はコーチ候補。それ以外は選手 */
  kind: "player" | "coach";
};

export const NBA_SEASON_AWARD_DEFS: readonly NbaAwardDef[] = [
  {
    id: "mvp",
    labelEn: "MVP",
    name: {
      ja: "最優秀選手",
      en: "Most Valuable Player",
      ko: "최우수 선수",
      zh: "最有价值球员",
      es: "Jugador Más Valioso",
      pt: "Jogador Mais Valioso",
      fr: "Meilleur Joueur",
    },
    kind: "player",
  },
  {
    id: "dpoy",
    labelEn: "DPOY",
    name: {
      ja: "最優秀守備選手",
      en: "Defensive Player of the Year",
      ko: "최우수 수비 선수",
      zh: "年度最佳防守球员",
      es: "Mejor Defensor del Año",
      pt: "Melhor Defensor do Ano",
      fr: "Meilleur Défenseur de l’Année",
    },
    kind: "player",
  },
  {
    id: "roy",
    labelEn: "ROY",
    name: {
      ja: "新人王",
      en: "Rookie of the Year",
      ko: "신인왕",
      zh: "年度最佳新秀",
      es: "Novato del Año",
      pt: "Novato do Ano",
      fr: "Meilleur Rookie de l’Année",
    },
    kind: "player",
  },
  {
    id: "mip",
    labelEn: "MIP",
    name: {
      ja: "最も成長した選手",
      en: "Most Improved Player",
      ko: "기량 발전상",
      zh: "年度进步最快球员",
      es: "Jugador Más Mejorado",
      pt: "Jogador Que Mais Evoluiu",
      fr: "Joueur Ayant le Plus Progressé",
    },
    kind: "player",
  },
  {
    id: "sixth",
    labelEn: "6MOTY",
    name: {
      ja: "最優秀シックスマン",
      en: "Sixth Man of the Year",
      ko: "최우수 식스맨",
      zh: "年度最佳第六人",
      es: "Mejor Sexto Hombre",
      pt: "Melhor Sexto Homem",
      fr: "Meilleur Sixième Homme",
    },
    kind: "player",
  },
  {
    id: "coy",
    labelEn: "COY",
    name: {
      ja: "クラッチタイムで最も活躍した選手",
      en: "Clutch Player of the Year",
      ko: "최우수 클러치 선수",
      zh: "年度最佳关键球员",
      es: "Mejor Jugador Clutch del Año",
      pt: "Melhor Jogador de Clutch",
      fr: "Meilleur Joueur en Clutch",
    },
    kind: "player",
  },
  {
    id: "coty",
    labelEn: "COTY",
    name: {
      ja: "最優秀コーチ",
      en: "Coach of the Year",
      ko: "최우수 감독",
      zh: "年度最佳教练",
      es: "Entrenador del Año",
      pt: "Treinador do Ano",
      fr: "Meilleur Entraîneur",
    },
    kind: "coach",
  },
] as const;

/** 賞の正式名を表示言語で返す */
export function awardName(
  lang: LocalizedLang,
  award: NbaAwardId | { name: UiStrings }
): string {
  if (typeof award !== "string") return L(lang, award.name);
  const def = NBA_SEASON_AWARD_DEFS.find((d) => d.id === award);
  return def ? L(lang, def.name) : "";
}

export type NbaAwardCandidate = {
  id: string;
  firstName: string;
  lastName: string;
  teamAbbr?: string;
};

/** awardId → candidate id（本番は BDL player/coach id） */
export type NbaSeasonAwardsPicks = Partial<Record<NbaAwardId, string | null>>;

export type NbaSeasonAwardsPrediction = {
  season: string;
  picks: NbaSeasonAwardsPicks;
};

export function emptySeasonAwardsPrediction(
  season: string
): NbaSeasonAwardsPrediction {
  return { season, picks: {} };
}

export const NBA_SEASON_AWARD_IDS: readonly NbaAwardId[] =
  NBA_SEASON_AWARD_DEFS.map((d) => d.id);

export function filledSeasonAwardsCount(picks: NbaSeasonAwardsPicks): number {
  let n = 0;
  for (const id of NBA_SEASON_AWARD_IDS) {
    const v = picks[id];
    if (typeof v === "string" && v.trim()) n += 1;
  }
  return n;
}

export function isSeasonAwardsComplete(pred: NbaSeasonAwardsPrediction): boolean {
  return filledSeasonAwardsCount(pred.picks) === NBA_SEASON_AWARD_IDS.length;
}

/** API / Firestore から来た picks を正規化（未知キー無視・空文字は null） */
export function parseSeasonAwardsPicks(raw: unknown): NbaSeasonAwardsPicks {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const src = raw as Record<string, unknown>;
  const out: NbaSeasonAwardsPicks = {};
  for (const id of NBA_SEASON_AWARD_IDS) {
    const v = src[id];
    if (v == null) {
      out[id] = null;
      continue;
    }
    if (typeof v !== "string") continue;
    const trimmed = v.trim();
    out[id] = trimmed.length > 0 ? trimmed : null;
  }
  return out;
}

export function parseSeasonAwardsPrediction(
  season: string,
  picksRaw: unknown
): NbaSeasonAwardsPrediction {
  return {
    season: season.trim(),
    picks: parseSeasonAwardsPicks(picksRaw),
  };
}

export function awardCandidateLabel(c: NbaAwardCandidate): string {
  return `${c.firstName} ${c.lastName}`.trim();
}

export function normalizeAwardQuery(q: string): string {
  return q
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .trim()
    .toLowerCase();
}

/**
 * 前方一致: first / last / "first last" / "last" が query で始まるもの。
 * "n" → nikola… / "ni" → nikola… / "jok" → jokic
 */
export function filterAwardCandidatesByPrefix(
  candidates: readonly NbaAwardCandidate[],
  query: string,
  limit = 500
): NbaAwardCandidate[] {
  const q = normalizeAwardQuery(query);
  if (!q) return [];

  const scored: { c: NbaAwardCandidate; score: number }[] = [];
  for (const c of candidates) {
    const first = normalizeAwardQuery(c.firstName);
    const last = normalizeAwardQuery(c.lastName);
    const full = `${first} ${last}`.trim();
    let score = -1;
    if (last.startsWith(q)) score = 0;
    else if (first.startsWith(q)) score = 1;
    else if (full.startsWith(q)) score = 2;
    else if (`${last} ${first}`.startsWith(q)) score = 3;
    if (score >= 0) scored.push({ c, score });
  }
  scored.sort((a, b) => {
    if (a.score !== b.score) return a.score - b.score;
    return awardCandidateLabel(a.c).localeCompare(awardCandidateLabel(b.c), "en");
  });
  return scored.slice(0, limit).map((x) => x.c);
}

/** 入力なし時: 運営指定の候補最大 5 */
export const AWARD_POPULAR_PICK_LIMIT = 5;

export function popularAwardPicks(
  popularIds: readonly string[],
  catalog: readonly NbaAwardCandidate[],
  limit = AWARD_POPULAR_PICK_LIMIT
): NbaAwardCandidate[] {
  const byId = new Map(catalog.map((c) => [c.id, c]));
  const out: NbaAwardCandidate[] = [];
  for (const id of popularIds) {
    const c = byId.get(id);
    if (c) out.push(c);
    if (out.length >= limit) break;
  }
  return out;
}

export {
  SEASON_AWARDS_SCORE,
  SEASON_AWARDS_SCORE_PREVIEW,
} from "@/lib/predict/seasonPredictScoring";
