/**
 * 罰金・出場停止の理由（英語の手入力）→ アプリ 9 言語。サーバー専用。
 * 同じ文は `nbaDisciplineReasonI18n/{sha1}` にキャッシュして再翻訳しない。
 */
import { createHash } from "crypto";
import type { Firestore } from "firebase-admin/firestore";
import { ALL_LANGUAGES, type Language } from "@/lib/i18n/language";
import { getOpenAiApiKey } from "@/lib/openai/openaiEnv";

export const NBA_DISCIPLINE_REASON_I18N_COLLECTION = "nbaDisciplineReasonI18n";

export type NbaDisciplineReasonI18n = Partial<Record<Language, string>>;

const CHUNK = 30;

function reasonDocId(reason: string): string {
  return createHash("sha1").update(reason).digest("hex");
}

function parseI18n(raw: unknown): NbaDisciplineReasonI18n | null {
  if (!raw || typeof raw !== "object") return null;
  const out: NbaDisciplineReasonI18n = {};
  for (const lang of ALL_LANGUAGES) {
    const v = (raw as Record<string, unknown>)[lang];
    if (typeof v === "string" && v.trim()) out[lang] = v.trim();
  }
  return ALL_LANGUAGES.every((l) => out[l]) ? out : null;
}

async function translateChunk(
  apiKey: string,
  reasons: readonly string[]
): Promise<Map<string, NbaDisciplineReasonI18n>> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_DISCIPLINE_MODEL?.trim() || "gpt-4.1",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: [
            "You translate short NBA league-office discipline reasons (fines and suspensions) for a basketball app's fine log.",
            `Return JSON {"items":[{"i":<index>,${ALL_LANGUAGES.map((l) => `"${l}":"..."`).join(",")}}]}.`,
            "Write like a sports-news headline fragment in each language: terse, noun-phrase style, as short as the source.",
            "Use the established basketball/NBA terms of each language, not literal word-by-word translation.",
            "'official' / 'referee' = the game official (ja: 審判, zh: 裁判, ko: 심판), never 'public/official' in the bureaucratic sense.",
            "'altercation' = on-court scuffle (ja: 小競り合い/乱闘). 'Left bench' = left the bench area during an altercation (ja: ベンチから飛び出し).",
            "'Conduct detrimental (to the league)' = ja: リーグの名誉を傷つける行為. 'Withholding services' = ja: チームへの役務拒否.",
            "'Unsportsmanlike' = ja: アンスポーツマンライク. 'Obscene gesture' = ja: 卑猥なジェスチャー. 'Criticizing officials' = ja: 審判批判.",
            "Keep person names, team names/abbreviations and numbers. en = the source text unchanged except obvious typo fixes.",
            "Japanese: natural スポーツ紙 wording, no literal translationese, use 。-less fragments, separate multiple items with ・ or 、.",
          ].join(" "),
        },
        {
          role: "user",
          content: JSON.stringify(reasons.map((text, i) => ({ i, text }))),
        },
      ],
    }),
  });
  if (!res.ok) throw new Error(`openai ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const parsed = JSON.parse(data.choices?.[0]?.message?.content ?? "{}") as {
    items?: Array<Record<string, unknown>>;
  };
  const out = new Map<string, NbaDisciplineReasonI18n>();
  for (const item of parsed.items ?? []) {
    const i = Number(item.i);
    const source = reasons[i];
    const i18n = parseI18n(item);
    if (source != null && i18n) out.set(source, i18n);
  }
  return out;
}

/** 理由文 → 9 言語（キャッシュ優先。API キー無し・失敗した文は結果に入らない） */
export async function translateDisciplineReasons(
  db: Firestore,
  reasons: readonly string[],
  opts: { ignoreCache?: boolean } = {}
): Promise<Map<string, NbaDisciplineReasonI18n>> {
  const unique = [...new Set(reasons.map((r) => r.trim()).filter(Boolean))];
  const out = new Map<string, NbaDisciplineReasonI18n>();
  if (unique.length === 0) return out;

  const col = db.collection(NBA_DISCIPLINE_REASON_I18N_COLLECTION);
  const missing: string[] = [];
  if (opts.ignoreCache) {
    missing.push(...unique);
  } else {
    const cached = await db.getAll(...unique.map((r) => col.doc(reasonDocId(r))));
    unique.forEach((reason, i) => {
      const hit = parseI18n(cached[i]?.get("i18n"));
      if (hit) out.set(reason, hit);
      else missing.push(reason);
    });
  }

  const apiKey = getOpenAiApiKey();
  if (!apiKey || missing.length === 0) return out;
  for (let i = 0; i < missing.length; i += CHUNK) {
    const translated = await translateChunk(apiKey, missing.slice(i, i + CHUNK));
    for (const [reason, i18n] of translated) {
      out.set(reason, i18n);
      await col.doc(reasonDocId(reason)).set({ reason, i18n, createdAtMs: Date.now() });
    }
  }
  return out;
}
