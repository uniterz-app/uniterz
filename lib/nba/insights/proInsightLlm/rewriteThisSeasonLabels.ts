import type { ProInsightFactPack } from "@/lib/nba/insights/proInsightFacts/types";
import type { ProInsightNarrativeBrief } from "@/lib/predict/proInsightNarrativeTypes";
import {
  nbaSeasonKeyFromDateJST,
  nbaSeasonShortLabel,
} from "@/lib/rankings/nbaSeason";

const SEASON_METRIC_KEYS = new Set([
  "statsSeason",
  "seasonSource",
  "seasonB2bSource",
]);

const THIS_SEASON_BY_LANG: Record<string, RegExp> = {
  ja: /今季|今シーズン/g,
  en: /\bthis season\b/gi,
  zh: /本赛季|本季/g,
  "zh-TW": /本賽季|本季/g,
  ko: /이번 시즌/g,
  es: /\besta temporada\b/gi,
  pt: /\bnesta temporada\b|\besta temporada\b/gi,
  fr: /\bcette saison\b/gi,
};

/**
 * CONTEXT の数字が試合の季と違う（開幕前＝前季データ）とき、
 * LLM が書いた「今季」を明示シーズンに置換する。
 */
export function rewriteThisSeasonLabels(
  brief: ProInsightNarrativeBrief,
  pack: ProInsightFactPack
): ProInsightNarrativeBrief {
  const seasons = new Set<string>();
  for (const f of pack.sections.CONTEXT ?? []) {
    for (const m of f.metrics) {
      if (SEASON_METRIC_KEYS.has(m.key) && typeof m.value === "string" && m.value) {
        seasons.add(m.value);
      }
    }
  }
  if (seasons.size !== 1) return brief;
  const [dataSeason] = [...seasons];
  if (dataSeason === nbaSeasonKeyFromDateJST(new Date(pack.tipAtMs))) return brief;

  const short = nbaSeasonShortLabel(dataSeason);
  const replacement = (lang: string) =>
    lang === "ja" ? `${short}シーズン` : lang.startsWith("zh") ? `${short}赛季` : dataSeason;

  return {
    ...brief,
    sections: brief.sections.map((s) =>
      s.kind !== "CONTEXT"
        ? s
        : {
            ...s,
            items: s.items.map((it) => {
              const body = { ...it.body } as Record<string, string>;
              for (const [lang, text] of Object.entries(body)) {
                const re = THIS_SEASON_BY_LANG[lang];
                if (re && typeof text === "string") {
                  body[lang] = text.replace(re, replacement(lang));
                }
              }
              return { ...it, body: body as typeof it.body };
            }),
          }
    ),
  };
}
