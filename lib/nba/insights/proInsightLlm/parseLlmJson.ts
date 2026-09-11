/**
 * OpenAI JSON → ProInsightNarrativeBrief。壊れていたら null。
 */
import type { UiStrings } from "@/lib/i18n/ui";
import type {
  ProInsightNarrativeBrief,
  ProInsightNarrativeItem,
  ProInsightNarrativeKind,
  ProInsightNarrativeSection,
} from "@/lib/predict/proInsightNarrativeTypes";
import { PRO_INSIGHT_NARRATIVE_SECTION_KINDS } from "@/lib/predict/proInsightNarrativeTypes";

const LANGS = ["ja", "en", "ko", "zh", "es", "pt", "fr"] as const;

function normalizeStatusWords(text: string): string {
  return text
    .replace(/は疑わしいため/g, " is questionable のため")
    .replace(/が疑わしいため/g, " is questionable のため")
    .replace(/は疑わしいです。?/g, " is questionable。")
    .replace(/が疑わしいです。?/g, " is questionable。")
    .replace(/疑わしい/g, "questionable")
    .replace(/不確定/g, "questionable")
    .replace(/不确定/g, "questionable")
    .replace(/\bDoubtful\b/g, "doubtful")
    .replace(/\bQuestionable\b/g, "questionable")
    .replace(/\bOut\b/g, "OUT")
    .replace(/。{2,}/g, "。")
    .replace(/\.{2,}/g, ".");
}

function asUiStrings(raw: unknown): UiStrings | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const out: Partial<UiStrings> = {};
  for (const lang of LANGS) {
    const v = o[lang];
    if (typeof v !== "string" || !v.trim()) return null;
    out[lang] = normalizeStatusWords(v.trim());
  }
  return out as UiStrings;
}

function parseItem(raw: unknown): ProInsightNarrativeItem | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const body = asUiStrings(o.body);
  if (!body) return null;
  const evidenceRaw = Array.isArray(o.evidence) ? o.evidence : [];
  const evidence: UiStrings[] = [];
  for (const ev of evidenceRaw) {
    const u = asUiStrings(ev);
    if (u) evidence.push(u);
    else if (typeof ev === "string" && ev.trim()) {
      const t = ev.trim();
      evidence.push({
        ja: t,
        en: t,
        ko: t,
        zh: t,
        es: t,
        pt: t,
        fr: t,
      });
    }
  }
  return { body, evidence };
}

export function parseProInsightLlmJson(
  content: string,
  meta: { homeTeamId: string; awayTeamId: string }
): ProInsightNarrativeBrief | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object") return null;
  const sectionsRaw = (parsed as { sections?: unknown }).sections;
  if (!Array.isArray(sectionsRaw)) return null;

  const byKind = new Map<ProInsightNarrativeKind, ProInsightNarrativeItem[]>();
  for (const sec of sectionsRaw) {
    if (!sec || typeof sec !== "object") continue;
    const kind = String((sec as { kind?: unknown }).kind ?? "").trim();
    if (
      !PRO_INSIGHT_NARRATIVE_SECTION_KINDS.includes(
        kind as ProInsightNarrativeKind
      )
    ) {
      continue;
    }
    const itemsRaw = (sec as { items?: unknown }).items;
    if (!Array.isArray(itemsRaw)) continue;
    const items: ProInsightNarrativeItem[] = [];
    for (const it of itemsRaw) {
      const parsedItem = parseItem(it);
      if (parsedItem) items.push(parsedItem);
    }
    if (items.length) byKind.set(kind as ProInsightNarrativeKind, items);
  }

  const sections: ProInsightNarrativeSection[] = [];
  for (const kind of PRO_INSIGHT_NARRATIVE_SECTION_KINDS) {
    const items = byKind.get(kind);
    if (items?.length) sections.push({ kind, items });
  }
  if (sections.length === 0) return null;

  return {
    homeTeamId: meta.homeTeamId,
    awayTeamId: meta.awayTeamId,
    sections,
    sampleNote: null,
  };
}
