/**
 * ナラティブ Pro Insight の表示前チェック。
 * Web / Native 同じ関数。禁止語が混ざっていたら出さない。
 */
import type { UiStrings } from "@/lib/i18n/ui";
import type {
  ProInsightNarrativeBrief,
  ProInsightNarrativeItem,
  ProInsightNarrativeKind,
  ProInsightNarrativeSection,
} from "@/lib/predict/proInsightNarrativeTypes";
import {
  PRO_INSIGHT_NARRATIVE_ITEM_CAPS,
  PRO_INSIGHT_NARRATIVE_SECTION_KINDS,
} from "@/lib/predict/proInsightNarrativeTypes";

const LANGS = ["ja", "en", "ko", "zh", "es", "pt", "fr"] as const;

const BANNED: readonly RegExp[] = [
  /勝て[るなよ]/,
  /勝利する/,
  /will win/i,
  /推奨スコア/,
  /鉄板/,
  /絶対に/,
  /guaranteed/i,
  /lock (it|this) in/i,
  /recommended (score|pick)/i,
  /pick (the )?(home|away|winner)/i,
];

function asUiStrings(raw: unknown): UiStrings | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const out: Partial<UiStrings> = {};
  let any = false;
  for (const lang of LANGS) {
    const v = o[lang];
    if (typeof v === "string" && v.trim()) {
      out[lang] = v.trim();
      any = true;
    }
  }
  if (!any) return null;
  // 欠けた言語は en → ja → 先頭ありの順で埋める
  const fill =
    (typeof out.en === "string" && out.en) ||
    (typeof out.ja === "string" && out.ja) ||
    Object.values(out).find((x) => typeof x === "string" && x) ||
    "";
  for (const lang of LANGS) {
    if (!out[lang]) out[lang] = fill;
  }
  return out as UiStrings;
}

function blobOf(brief: ProInsightNarrativeBrief): string {
  const parts: string[] = [];
  for (const sec of brief.sections) {
    for (const item of sec.items) {
      for (const lang of LANGS) {
        parts.push(item.body[lang] ?? "");
        for (const ev of item.evidence) parts.push(ev[lang] ?? "");
      }
    }
  }
  if (brief.sampleNote) {
    for (const lang of LANGS) parts.push(brief.sampleNote[lang] ?? "");
  }
  return parts.join("\n");
}

function normalizeStatusWords(text: string): string {
  return text
    .replace(/は疑わしいため/g, " is questionable のため")
    .replace(/が疑わしいため/g, " is questionable のため")
    .replace(/は疑わしいです。?/g, " is questionable。")
    .replace(/が疑わしいです。?/g, " is questionable。")
    .replace(/疑わしい/g, "questionable")
    .replace(/不確定/g, "questionable")
    .replace(/不确定/g, "questionable")
    .replace(/의심스러/g, "questionable")
    .replace(/\bDoubtful\b/g, "doubtful")
    .replace(/\bQuestionable\b/g, "questionable")
    .replace(/\bOut\b/g, "OUT")
    .replace(/。{2,}/g, "。")
    .replace(/\.{2,}/g, ".");
}

function mapUiStrings(
  u: UiStrings,
  fn: (s: string) => string
): UiStrings {
  const out: Partial<UiStrings> = {};
  for (const lang of LANGS) {
    const v = u[lang];
    out[lang] = typeof v === "string" ? fn(v) : v;
  }
  return out as UiStrings;
}

function sanitizeItem(raw: unknown): ProInsightNarrativeItem | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const body = asUiStrings(o.body);
  if (!body) return null;
  const evidenceRaw = Array.isArray(o.evidence) ? o.evidence : [];
  const evidence: UiStrings[] = [];
  for (const ev of evidenceRaw) {
    const u = asUiStrings(ev);
    if (u) evidence.push(mapUiStrings(u, normalizeStatusWords));
  }
  return {
    body: mapUiStrings(body, normalizeStatusWords),
    evidence,
  };
}

function sanitizeSection(raw: unknown): ProInsightNarrativeSection | null {
  if (!raw || typeof raw !== "object") return null;
  const kind = String((raw as { kind?: unknown }).kind ?? "").trim();
  if (
    !PRO_INSIGHT_NARRATIVE_SECTION_KINDS.includes(
      kind as ProInsightNarrativeKind
    )
  ) {
    return null;
  }
  const itemsRaw = (raw as { items?: unknown }).items;
  if (!Array.isArray(itemsRaw)) return null;
  const cap = PRO_INSIGHT_NARRATIVE_ITEM_CAPS[kind as ProInsightNarrativeKind];
  const items: ProInsightNarrativeItem[] = [];
  for (const it of itemsRaw) {
    if (items.length >= cap) break;
    const item = sanitizeItem(it);
    if (item) items.push(item);
  }
  if (items.length === 0) return null;
  return { kind: kind as ProInsightNarrativeKind, items };
}

export type ProInsightNarrativeApiMeta = {
  source?: string | null;
  model?: string | null;
  generatedAtMs?: number | null;
  factsFingerprint?: string | null;
  injuryFingerprint?: string | null;
  pendingBatch?: boolean;
};

/** 表示してよい narrative。壊れている / 禁止表現なら null。 */
export function sanitizeProInsightNarrativeForDisplay(
  raw: unknown
): ProInsightNarrativeBrief | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const homeTeamId = String(o.homeTeamId ?? "").trim();
  const awayTeamId = String(o.awayTeamId ?? "").trim();
  if (!homeTeamId || !awayTeamId) return null;

  const sectionsRaw = Array.isArray(o.sections) ? o.sections : [];
  const byKind = new Map<ProInsightNarrativeKind, ProInsightNarrativeSection>();
  for (const sec of sectionsRaw) {
    const s = sanitizeSection(sec);
    if (s) byKind.set(s.kind, s);
  }
  const sections = PRO_INSIGHT_NARRATIVE_SECTION_KINDS.map(
    (k) => byKind.get(k)
  ).filter((s): s is ProInsightNarrativeSection => Boolean(s));
  if (sections.length === 0) return null;

  const brief: ProInsightNarrativeBrief = {
    homeTeamId,
    awayTeamId,
    sections,
    sampleNote: asUiStrings(o.sampleNote),
  };
  if (BANNED.some((re) => re.test(blobOf(brief)))) return null;
  return brief;
}

export function readProInsightNarrativeMeta(
  raw: unknown,
  facts: unknown
): ProInsightNarrativeApiMeta {
  const n =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const f =
    facts && typeof facts === "object"
      ? (facts as Record<string, unknown>)
      : {};
  return {
    source: typeof n.source === "string" ? n.source : null,
    model: typeof n.model === "string" ? n.model : null,
    generatedAtMs:
      typeof n.generatedAtMs === "number" ? n.generatedAtMs : null,
    factsFingerprint:
      typeof n.factsFingerprint === "string"
        ? n.factsFingerprint
        : typeof f.fingerprint === "string"
          ? f.fingerprint
          : null,
    injuryFingerprint:
      typeof n.injuryFingerprint === "string"
        ? n.injuryFingerprint
        : typeof f.injuryFingerprint === "string"
          ? f.injuryFingerprint
          : null,
    pendingBatch: f.pendingBatch === true,
  };
}

export type ProInsightNarrativeStatus = "ready" | "pending" | "empty";

export function resolveProInsightNarrativeStatus(input: {
  narrative: ProInsightNarrativeBrief | null;
  pendingBatch: boolean;
}): ProInsightNarrativeStatus {
  if (input.narrative) return "ready";
  if (input.pendingBatch) return "pending";
  return "empty";
}
