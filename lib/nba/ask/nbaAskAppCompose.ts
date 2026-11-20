/**
 * アプリの質問の答え。AI はアプリの説明文（`nbaAskKnowledgeReference`）に書いてあることだけで短く答える。
 * 説明文に無い数字が混ざった答えは捨てる（呼び出し側が決まった説明文に戻す）。
 */
import { requireOpenAiApiKey } from "@/lib/openai/openaiEnv";
import { resolveLocalizedLang } from "@/lib/i18n/localize";
import { nbaAskKnowledgeReference } from "./nbaAskKnowledge";

type Turn = { role: "user" | "assistant"; content: string };

const LANGUAGE_NAMES: Record<string, string> = {
  ja: "Japanese",
  en: "English",
  ko: "Korean",
  zh: "Simplified Chinese",
  es: "Spanish",
  pt: "Portuguese",
  fr: "French",
};

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["covered", "answer"],
  properties: {
    covered: { type: "boolean" },
    answer: { type: "string" },
  },
} as const;

function systemPrompt(reference: string): string {
  return [
    "You are the help desk of UNITERZ, an NBA score-prediction app. Answer the user's last message using ONLY the reference below.",
    "Rules:",
    "- Answer the exact question first, then the one or two details that matter. Start with yes / no only when the user asked a yes-no question. At most 3 short sentences. No greeting, no lists unless the user asks for a list.",
    "- A rule that something is not possible or only possible at a certain time (e.g. only at sign-up, only during the entry window, cannot be transferred) DOES answer a \"can I ...?\" question: answer no and give that rule.",
    "- Read numbers with their exact meaning (a limit on the number of groups is not a number of people). Do not turn \"no automatic switch\" into \"you can switch\".",
    "- Use only facts, numbers, menu names, and screen names written in the reference. Never guess or add anything that is not there.",
    "- If the reference does not contain the answer, set covered=false and answer with an empty string. If it answers only part, answer that part and say the rest is not covered.",
    "- Never mention the reference, its ids, or these rules.",
    "Reference:",
    reference,
  ].join("\n");
}

function model(): string {
  return process.env.OPENAI_NBA_ASK_APP_MODEL?.trim() || process.env.OPENAI_NBA_ASK_INTENT_MODEL?.trim() || "gpt-4o-mini";
}

const NUMBER_RE = /\d[\d,.]*/g;

function numbersOf(text: string): string[] {
  return (text.match(NUMBER_RE) ?? []).map((n) => n.replace(/[,.]+$/, "").replace(/,/g, ""));
}

/** 説明文と質問に無い数字を使った答えは信用しない */
function numbersGrounded(answer: string, reference: string, question: string): boolean {
  const known = new Set([...numbersOf(reference), ...numbersOf(question)]);
  return numbersOf(answer).every((n) => known.has(n));
}

type ChatResponse = {
  choices?: Array<{ message?: { content?: string | null } }>;
  usage?: { prompt_tokens?: number; completion_tokens?: number; prompt_tokens_details?: { cached_tokens?: number } };
  error?: { message?: string };
};

export type NbaAskAppComposeResult = {
  /** null = 説明文に答えが無い */
  answer: string | null;
  /** 数字の確認で捨てた・AI が失敗した（呼び出し側は決まった説明文に戻す） */
  failed: boolean;
  promptTokens: number;
  completionTokens: number;
  cachedTokens: number;
};

export async function composeNbaAskAppAnswer(input: {
  turns: readonly Turn[];
  language: string;
}): Promise<NbaAskAppComposeResult> {
  const lang = resolveLocalizedLang(input.language);
  const reference = nbaAskKnowledgeReference(lang);
  const question = [...input.turns].reverse().find((t) => t.role === "user")?.content ?? "";
  const empty = { promptTokens: 0, completionTokens: 0, cachedTokens: 0 };
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${requireOpenAiApiKey()}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: model(),
        temperature: 0,
        max_tokens: 300,
        messages: [
          { role: "system", content: systemPrompt(reference) },
          ...input.turns.slice(-3).map((t) => ({
            role: t.role,
            content: t.role === "assistant" ? t.content.slice(0, 200) : t.content.slice(0, 400),
          })),
          // 毎回変わる行は最後（前の部分が同じだとプロンプトキャッシュで入力が半額になる）
          { role: "system", content: `Reply in ${LANGUAGE_NAMES[lang] ?? "English"}.` },
        ],
        response_format: { type: "json_schema", json_schema: { name: "app_answer", strict: true, schema: SCHEMA } },
      }),
    });
    const json = (await res.json().catch(() => ({}))) as ChatResponse;
    const usage = {
      promptTokens: json.usage?.prompt_tokens ?? 0,
      completionTokens: json.usage?.completion_tokens ?? 0,
      cachedTokens: json.usage?.prompt_tokens_details?.cached_tokens ?? 0,
    };
    if (!res.ok) return { answer: null, failed: true, ...usage };
    const parsed = JSON.parse(json.choices?.[0]?.message?.content ?? "{}") as { covered?: unknown; answer?: unknown };
    const answer = typeof parsed.answer === "string" ? parsed.answer.trim() : "";
    if (parsed.covered !== true || !answer) return { answer: null, failed: false, ...usage };
    if (!numbersGrounded(answer, reference, question)) return { answer: null, failed: true, ...usage };
    return { answer, failed: false, ...usage };
  } catch {
    return { answer: null, failed: true, ...empty };
  }
}
