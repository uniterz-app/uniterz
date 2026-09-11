/**
 * LLM 失敗時: fact.hintEn + metrics から短い UiStrings を組み立てる（空にしない）。
 */
import type { ProInsightFactPack } from "@/lib/nba/insights/proInsightFacts/types";
import { proInsightTeamAbbr } from "@/lib/nba/insights/proInsightFacts/teamAbbr";
import type {
  ProInsightNarrativeBrief,
  ProInsightNarrativeKind,
} from "@/lib/predict/proInsightNarrativeTypes";
import { PRO_INSIGHT_NARRATIVE_SECTION_KINDS } from "@/lib/predict/proInsightNarrativeTypes";
import type { UiStrings } from "@/lib/i18n/ui";

function allLang(text: string): UiStrings {
  return {
    ja: text,
    en: text,
    ko: text,
    zh: text,
    es: text,
    pt: text,
    fr: text,
  };
}

function evidenceLine(metrics: ProInsightFactPack["sections"]["MATCHUP"][number]["metrics"]): UiStrings {
  const parts = metrics.map((m) => {
    const team = m.teamId ? `${proInsightTeamAbbr(m.teamId)} ` : "";
    return `${team}${m.key} ${m.value}`.trim();
  });
  return allLang(parts.join(" · ") || "—");
}

export function fallbackNarrativeFromFactPack(
  pack: ProInsightFactPack
): ProInsightNarrativeBrief {
  const sections = PRO_INSIGHT_NARRATIVE_SECTION_KINDS.map((kind) => {
    const facts = pack.sections[kind as ProInsightNarrativeKind] ?? [];
    return {
      kind: kind as ProInsightNarrativeKind,
      items: facts.map((f) => ({
        body: allLang(f.hintEn),
        evidence: [evidenceLine(f.metrics)],
      })),
    };
  }).filter((s) => s.items.length > 0);

  return {
    homeTeamId: pack.homeTeamId,
    awayTeamId: pack.awayTeamId,
    sections,
    sampleNote: null,
  };
}
