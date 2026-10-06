/**
 * LLM 本文（SCHEDULE / CONTEXT / INJURY IMPACT）の数字がその枠のファクトに無ければ項目ごと落とす。
 * gpt-4o-mini はファクトに無い W–L・試合数・順位を書くことがあるため。
 */
import type {
  ProInsightFact,
  ProInsightFactPack,
} from "@/lib/nba/insights/proInsightFacts/types";
import { proInsightTeamAbbr } from "@/lib/nba/insights/proInsightFacts/teamAbbr";
import { INJURY_DIFFICULTY_FACT_KIND } from "@/lib/nba/matchupDifficulty/injuryDifficultyNarrative";
import type {
  ProInsightNarrativeBrief,
  ProInsightNarrativeItem,
  ProInsightNarrativeKind,
} from "@/lib/predict/proInsightNarrativeTypes";

const GUARDED: ProInsightNarrativeKind[] = ["SCHEDULE", "CONTEXT", "INJURY IMPACT"];

/** 数字を含むが数量ではない語（B2B・3P など） */
const NON_QUANTITY_RE =
  /B2B|\b3PT?%?|\b3P\b|3ポイント|3点シュート|3P成功|3분|3점|三分|\b3s\b|de 3 pontos|à 3 points|de 3 puntos|3-Punkte?|3 points? (?:shooting|percentage)/gi;

const NUMBER_RE = /\d+(?:\.\d+)?/g;

function toHalfWidth(text: string): string {
  return text
    .replace(/[０-９．]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    // 桁区切り 1,988 / 1.988 / 1 988（先頭 0 の .500 などは除く）
    .replace(/(^|[^\d.,])([1-9]\d{0,2})[,.\s\u00a0\u202f](?=\d{3}(?!\d))/g, "$1$2")
    // 小数点カンマ 0,5
    .replace(/(\d),(\d{1,2})(?!\d)/g, "$1.$2");
}

function canonical(raw: string): string {
  const n = Number(raw);
  return Number.isFinite(n) ? String(n) : raw;
}

export function numbersIn(text: string): string[] {
  const cleaned = toHalfWidth(text).replace(NON_QUANTITY_RE, " ");
  return (cleaned.match(NUMBER_RE) ?? []).map(canonical);
}

function addNumber(allowed: Set<string>, raw: string): void {
  const n = Number(raw);
  if (!Number.isFinite(n)) return;
  allowed.add(String(n));
  if (!Number.isInteger(n)) {
    allowed.add(String(Math.round(n)));
    allowed.add(String(Math.trunc(n)));
    allowed.add(String(Math.round(n * 10) / 10));
  }
  if (n > 0 && n < 1) {
    // 勝率 .647 → 64.7% / 65%
    allowed.add(String(Math.round(n * 1000) / 10));
    allowed.add(String(Math.round(n * 100)));
  }
  if (Number.isInteger(n) && n >= 2000 && n <= 2100) {
    allowed.add(String(n % 100));
  }
}

const NUMBER_WORDS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
};

function allowedFromText(allowed: Set<string>, text: string): void {
  const plain = toHalfWidth(text);
  for (const w of plain.toLowerCase().match(/\b(?:one|two|three|four|five|six|seven|eight|nine|ten)\b/g) ?? []) {
    addNumber(allowed, String(NUMBER_WORDS[w]));
  }
  for (const raw of plain.match(NUMBER_RE) ?? []) addNumber(allowed, raw);
  // "11-6" → 試合数 17 も許す
  for (const m of plain.matchAll(/(\d{1,2})\s*[-–]\s*(\d{1,2})(?!\d)/g)) {
    allowed.add(String(Number(m[1]) + Number(m[2])));
  }
  // "2025-26" → 25 / 26
  for (const m of plain.matchAll(/(?:19|20)(\d{2})\s*[-–]\s*(\d{2})/g)) {
    allowed.add(String(Number(m[1])));
    allowed.add(String(Number(m[2])));
  }
}

function allowedNumbers(
  facts: ProInsightFact[],
  pack: ProInsightFactPack
): Set<string> {
  const allowed = new Set<string>();
  for (const f of facts) {
    allowedFromText(allowed, f.hintEn);
    allowedFromText(allowed, f.label);
    for (const m of f.metrics) {
      allowedFromText(allowed, String(m.value));
      if (m.rank != null) addNumber(allowed, String(m.rank));
    }
  }
  for (const teamId of [pack.homeTeamId, pack.awayTeamId]) {
    allowedFromText(allowed, proInsightTeamAbbr(teamId));
  }
  if (pack.gamesPlayed != null) addNumber(allowed, String(pack.gamesPlayed));
  return allowed;
}

/** 本文の中でファクトに無い数字（どの言語か問わず） */
export function unverifiedNumbers(
  item: ProInsightNarrativeItem,
  allowed: ReadonlySet<string>
): string[] {
  const bad = new Set<string>();
  for (const text of Object.values(item.body)) {
    if (typeof text !== "string") continue;
    for (const n of numbersIn(text)) {
      if (!allowed.has(n)) bad.add(n);
    }
  }
  return [...bad];
}

export function withNumberGuard(
  brief: ProInsightNarrativeBrief,
  pack: ProInsightFactPack
): ProInsightNarrativeBrief {
  const sections = brief.sections
    .map((s) => {
      if (!GUARDED.includes(s.kind)) return s;
      const facts = (pack.sections[s.kind] ?? []).filter(
        (f) => f.kind !== INJURY_DIFFICULTY_FACT_KIND
      );
      const allowed = allowedNumbers(facts, pack);
      const items = s.items.filter(
        (item) => item.template != null || unverifiedNumbers(item, allowed).length === 0
      );
      return { ...s, items };
    })
    .filter((s) => s.items.length > 0);
  return { ...brief, sections };
}
