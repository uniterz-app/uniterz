/**
 * NBA シーズンアワード予想 — 型・検索（本番は API 選手名簿接続後）
 *
 * 選手ピッカー仕様（確定）:
 * - 入力なし / フォーカス直後: 他ユーザーが多く選んでいる候補を最大 5 人（人気ピック）
 * - 入力あり: 前方一致サジェスト（N → NI → NIK …）。選手名簿は API 契約後に取得
 * - 採点は未定（ゲート D）
 */

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
  labelEn: string;
  labelJa: string;
  /** coty はコーチ候補。それ以外は選手 */
  kind: "player" | "coach";
};

export const NBA_SEASON_AWARD_DEFS: readonly NbaAwardDef[] = [
  { id: "mvp", labelEn: "MVP", labelJa: "最優秀選手", kind: "player" },
  {
    id: "dpoy",
    labelEn: "DPOY",
    labelJa: "最優秀守備選手",
    kind: "player",
  },
  { id: "roy", labelEn: "ROY", labelJa: "新人王", kind: "player" },
  {
    id: "mip",
    labelEn: "MIP",
    labelJa: "最も成長した選手",
    kind: "player",
  },
  {
    id: "sixth",
    labelEn: "6MOTY",
    labelJa: "最優秀シックスマン",
    kind: "player",
  },
  {
    id: "coy",
    labelEn: "COY",
    labelJa: "クラッチタイムで最も活躍した選手",
    kind: "player",
  },
  { id: "coty", labelEn: "COTY", labelJa: "最優秀コーチ", kind: "coach" },
] as const;

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
  limit = 12
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

/** 入力なし時: 人気ピック最大 5（他ユーザー選択集計。本番は API） */
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

/** プレビュー用仮採点（ゲート D で確定） */
export const SEASON_AWARDS_SCORE_PREVIEW = {
  exact: 25,
  maxTotal: 25 * NBA_SEASON_AWARD_DEFS.length,
} as const;
