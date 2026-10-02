import type { DetailInsightChip, ScoredChipCandidate } from "@/lib/nba/detailInsights/detailInsightTypes";
import { enrichInsightChip } from "@/lib/nba/detailInsights/detailChipCopy";

export type SelectDetailChipsOptions = {
  maxDisplay: number;
  /** category → max chips */
  maxPerCategory?: Record<string, number>;
  /** always include if present (e.g. injury_risk) */
  reservedIds?: string[];
};

function byScore(a: ScoredChipCandidate, b: ScoredChipCandidate): number {
  if (b.score !== a.score) return b.score - a.score;
  return a.tieBreak - b.tieBreak;
}

/** 排他グループ · カテゴリ上限 · 表示数 */
export function selectDetailChips(
  candidates: ScoredChipCandidate[],
  options: SelectDetailChipsOptions
): DetailInsightChip[] {
  const eligible = candidates.filter((c) => c.score > 0);
  if (!eligible.length) return [];

  const reserved = new Set(options.reservedIds ?? []);
  const reservedPicks: ScoredChipCandidate[] = [];
  for (const id of reserved) {
    const hit = eligible.find((c) => c.id === id);
    if (hit) reservedPicks.push(hit);
  }

  const pool = eligible
    .filter((c) => !reserved.has(c.id))
    .sort(byScore);

  const usedGroups = new Set<string>();
  for (const r of reservedPicks) {
    if (r.exclusiveGroup) usedGroups.add(r.exclusiveGroup);
  }

  const categoryCount = new Map<string, number>();
  for (const r of reservedPicks) {
    categoryCount.set(r.category, (categoryCount.get(r.category) ?? 0) + 1);
  }

  const picked: ScoredChipCandidate[] = [...reservedPicks];

  for (const c of pool) {
    if (picked.length >= options.maxDisplay) break;
    if (c.exclusiveGroup && usedGroups.has(c.exclusiveGroup)) continue;

    const catMax = options.maxPerCategory?.[c.category];
    if (catMax != null) {
      const n = categoryCount.get(c.category) ?? 0;
      if (n >= catMax) continue;
    }

    picked.push(c);
    if (c.exclusiveGroup) usedGroups.add(c.exclusiveGroup);
    categoryCount.set(c.category, (categoryCount.get(c.category) ?? 0) + 1);
  }

  return picked
    .sort(byScore)
    .slice(0, options.maxDisplay)
    .map(({ id, label, category, score }) =>
      enrichInsightChip({ id, label, category, score })
    );
}
