/**
 * Free 向け PREVIEW のチラ見せ（第 1 段落だけ）。
 * 続きの段落はサーバーから出さない（クライアントで隠すだけにしない）。
 */
import type { UiStrings } from "@/lib/i18n/ui";
import type { ProInsightNarrativeBrief } from "@/lib/predict/proInsightNarrativeTypes";

export type ProInsightPreviewTeaser = {
  homeTeamId: string;
  awayTeamId: string;
  /** 第 1 段落のみ */
  preview: UiStrings;
};

function firstParagraph(text: unknown): string | null {
  if (typeof text !== "string") return null;
  const para = text
    .split(/\n+/)
    .map((p) => p.trim())
    .find(Boolean);
  return para ?? null;
}

export function buildProInsightPreviewTeaser(
  narrative: ProInsightNarrativeBrief | null | undefined
): ProInsightPreviewTeaser | null {
  if (!narrative?.preview) return null;
  const out: Partial<UiStrings> = {};
  for (const [lang, text] of Object.entries(narrative.preview)) {
    const para = firstParagraph(text);
    if (para) out[lang as keyof UiStrings] = para;
  }
  const ja = out.ja ?? out.en;
  const en = out.en ?? out.ja;
  if (!ja || !en) return null;
  return {
    homeTeamId: narrative.homeTeamId,
    awayTeamId: narrative.awayTeamId,
    preview: { ...out, ja, en },
  };
}

export function sanitizeProInsightPreviewTeaser(
  raw: unknown
): ProInsightPreviewTeaser | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.homeTeamId !== "string" || typeof r.awayTeamId !== "string") {
    return null;
  }
  if (!r.preview || typeof r.preview !== "object") return null;
  const preview: Partial<UiStrings> = {};
  for (const [lang, text] of Object.entries(r.preview as Record<string, unknown>)) {
    const para = firstParagraph(text);
    if (para) preview[lang as keyof UiStrings] = para;
  }
  if (!preview.ja || !preview.en) return null;
  return {
    homeTeamId: r.homeTeamId,
    awayTeamId: r.awayTeamId,
    preview: preview as UiStrings,
  };
}
