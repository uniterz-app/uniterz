/**
 * PREVIEW を組み立てる: ja / en はコードの本文、他言語は LLM 訳（数字が en と一致するときだけ。ずれたら en）。
 */
import type { UiStrings } from "@/lib/i18n/ui";
import type { ProInsightFactPack } from "@/lib/nba/insights/proInsightFacts/types";
import {
  buildPreviewTemplate,
  PREVIEW_PART_KEYS,
} from "@/lib/nba/insights/proInsightFacts/previewTemplate";
import { numbersIn } from "@/lib/nba/insights/proInsightLlm/numberGuard";
import type { ProInsightNarrativeBrief } from "@/lib/predict/proInsightNarrativeTypes";

const TRANSLATED_LANGS = ["ko", "zh", "es", "pt", "fr", "de", "ar"] as const;

/** en の数字（"4/3" はドイツ語などの "4.3." も許す） */
function allowedFrom(en: string): Set<string> {
  const allowed = new Set(numbersIn(en));
  for (const m of en.matchAll(/(\d{1,2})\/(\d{1,2})/g)) {
    allowed.add(String(Number(`${m[1]}.${m[2]}`)));
    allowed.add(String(Number(`${m[2]}.${m[1]}`)));
  }
  return allowed;
}

/** en の数字で訳に必ず残るべきもの（日付は月名に訳され得るので日だけ、"2025" は "25" でもよい） */
function requiredFrom(en: string): string[][] {
  const withoutDates = en.replace(/(\d{1,2})\/(\d{1,2})/g, " $2 ");
  return numbersIn(withoutDates).map((n) => {
    const v = Number(n);
    return v >= 2000 && v <= 2100 ? [n, String(v % 100)] : [n];
  });
}

function translationOk(text: string, allowed: Set<string>, required: string[][]): boolean {
  const got = numbersIn(text);
  if (!got.every((n) => allowed.has(n))) return false;
  const have = new Set(got);
  return required.every((alts) => alts.some((n) => have.has(n)));
}

export function withPreview(
  brief: ProInsightNarrativeBrief,
  pack: ProInsightFactPack
): ProInsightNarrativeBrief {
  const { previewParts, preview: _old, ...rest } = brief;
  const tpl = buildPreviewTemplate(pack.preview, pack.seasonKey ?? null);
  if (!tpl) return rest;

  const out: UiStrings = { ja: "", en: "" };
  const lines: Record<string, string[]> = { ja: [], en: [] };
  for (const key of PREVIEW_PART_KEYS) {
    const part = tpl[key];
    if (!part) continue;
    lines.ja.push(part.ja);
    lines.en.push(part.en);
    const allowed = allowedFrom(part.en);
    const required = requiredFrom(part.en);
    for (const lang of TRANSLATED_LANGS) {
      const tr = previewParts?.[key]?.[lang];
      const ok =
        typeof tr === "string" && tr.trim() !== "" && translationOk(tr, allowed, required);
      if (tr && !ok) {
        console.warn(`[pro-insight] preview ${key}.${lang} → en (number mismatch)`);
      }
      (lines[lang] ??= []).push(ok ? tr!.trim() : part.en);
    }
  }
  for (const [lang, parts] of Object.entries(lines)) {
    (out as Record<string, string>)[lang] = parts.join("\n");
  }
  return { ...rest, preview: out };
}
