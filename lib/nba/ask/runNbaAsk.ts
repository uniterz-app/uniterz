/**
 * NBA スタッツ質問チャット（サーバー専用）。
 * 費用を抑えるため: 軽量モデル・直近の会話だけ送る・回答は短く・道具の往復は最大 3 回。
 */
import type { Firestore } from "firebase-admin/firestore";
import { requireOpenAiApiKey } from "@/lib/openai/openaiEnv";
import { getTodayKeyInTimeZone } from "@/lib/time/zonedTime";
import {
  NBA_ASK_PRO_TOOL_DEFS,
  NBA_ASK_TIME_ZONE,
  NBA_ASK_TOOL_DEFS,
  runNbaAskTool,
} from "./nbaAskTools";
import { NBA_ASK_APP_TOPICS, nbaAskAppGuide } from "./nbaAskAppGuide";
import { consumeNbaAskWebSearch, refundNbaAskWebSearch } from "./nbaAskQuota";
import { searchNbaAskWeb } from "./nbaAskWebSearch";

const APP_GUIDE_TOOL = {
  type: "function",
  function: {
    name: "get_app_guide",
    description: "Official guide for the UNITERZ app (predictions, scoring, ranking, PRO plans, this chat).",
    parameters: {
      type: "object",
      properties: { topic: { type: "string", enum: NBA_ASK_APP_TOPICS } },
      required: ["topic"],
    },
  },
} as const;

const PUBLIC_STATS_TOOL_NAMES: ReadonlySet<string> = new Set(
  NBA_ASK_TOOL_DEFS.map((t) => t.function.name)
);
const PRO_TOOL_NAMES: ReadonlySet<string> = new Set(
  NBA_ASK_PRO_TOOL_DEFS.map((t) => t.function.name)
);

export type NbaAskTurn = { role: "user" | "assistant"; content: string };

/** 送る会話の上限（古いものから捨てる） */
export const NBA_ASK_MAX_TURNS = 6;
export const NBA_ASK_MAX_CHARS = 400;
const MAX_TOOL_ROUNDS = 3;
const MAX_OUTPUT_TOKENS = 350;

function model(): string {
  return process.env.OPENAI_NBA_ASK_MODEL?.trim() || "gpt-4o-mini";
}

function dataAccessLine(allowStats: boolean, isPro: boolean): string {
  if (allowStats && isPro) {
    return "This user is PRO. Public stats tools and PRO-only tools are available. Use app data tools before search_web. search_web is one public-web lookup for news the app does not store (reported trades, news). Include at least one source URL from search_web in the answer. get_team_moves is this season's roster IN/OUT, not a same-day wire. Translate names to English before search.";
  }
  if (allowStats) {
    return "This user is not PRO. Public stats tools are available, including injuries, standings, and season roster moves. Looking up one game's Pro Insight, the live PRO LEAGUE board, or the web is NOT available — explain the feature from the guide, and say the actual lookup is PRO. Do not invent that game's read or the board. get_team_moves is this season's roster IN/OUT, not a same-day wire. Translate names to English before search.";
  }
  if (isPro) {
    return "This PRO user's daily stats limit is reached. Stats tools and PRO-only tools are NOT available. App questions via get_app_guide still work. Say the daily limit was reached.";
  }
  return "NBA stats tools are NOT available: this free account has used its stats questions. Public stats are unlimited with PRO. Looking up one game's Pro Insight, the live PRO LEAGUE board, or the web is PRO-only. Explaining what those features are, via get_app_guide, still works. Do not guess stats or a specific game's PRO read.";
}

function systemPrompt(language: string, allowStats: boolean, isPro: boolean): string {
  const today = getTodayKeyInTimeZone(NBA_ASK_TIME_ZONE);
  return [
    "You are the assistant in the UNITERZ app (NBA score prediction app).",
    "You answer (1) questions about using the UNITERZ app via get_app_guide, and (2) NBA stats questions.",
    "Questions about what PRO features are (Pro Insight, PRO LEAGUE, alerts, plans, this chat) are fine for everyone. Answer those from get_app_guide topic pro_plans or ask_chat. Do not invent details the guide does not have.",
    `Today is ${today} (US Eastern). NBA game dates are US Eastern dates.`,
    "Answer ONLY from tool results. Never guess numbers or app rules. If the guide or data doesn't cover it, say you don't know.",
    dataAccessLine(allowStats, isPro),
    "Keep answers short (2-5 lines). Politely decline topics other than UNITERZ and NBA.",
    `Reply in ${language === "ja" ? "Japanese" : "the user's language"}.`,
  ].join(" ");
}

type ChatMessage =
  | { role: "system" | "user"; content: string }
  | {
      role: "assistant";
      content: string | null;
      tool_calls?: Array<{
        id: string;
        type: "function";
        function: { name: string; arguments: string };
      }>;
    }
  | { role: "tool"; tool_call_id: string; content: string };

type ChatResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
      tool_calls?: Array<{
        id: string;
        type: "function";
        function: { name: string; arguments: string };
      }>;
    };
  }>;
  usage?: { prompt_tokens?: number; completion_tokens?: number };
  error?: { message?: string };
};

export function sanitizeNbaAskTurns(raw: unknown): NbaAskTurn[] {
  if (!Array.isArray(raw)) return [];
  const turns: NbaAskTurn[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const role = (item as { role?: unknown }).role;
    const content = String((item as { content?: unknown }).content ?? "").trim();
    if ((role !== "user" && role !== "assistant") || !content) continue;
    turns.push({ role, content: content.slice(0, NBA_ASK_MAX_CHARS) });
  }
  return turns.slice(-NBA_ASK_MAX_TURNS);
}

async function runWebSearch(
  db: Firestore,
  uid: string,
  args: Record<string, unknown>,
  onSpent: (usage: { promptTokens: number; completionTokens: number }) => void,
  alreadyUsed: boolean
): Promise<unknown> {
  if (alreadyUsed) return { error: "one web search per question" };
  const query = String(args.query ?? "").trim();
  if (!query) return { error: "query required" };
  const gate = await consumeNbaAskWebSearch(db, uid);
  if (!gate.ok) {
    return { error: "web search daily limit reached", note: "PRO web lookup is capped per day" };
  }
  try {
    const found = await searchNbaAskWeb(query);
    onSpent({ promptTokens: found.promptTokens, completionTokens: found.completionTokens });
    if (!found.text) return { found: false, note: "No web result" };
    return { text: found.text, sources: found.sources };
  } catch (e) {
    await refundNbaAskWebSearch(db, uid);
    throw e;
  }
}

export async function runNbaAsk(input: {
  db: Firestore;
  turns: NbaAskTurn[];
  language: string;
  /** false のとき公開スタッツの道具を渡さない（無料枠を使い切った人、または Pro の 1 日上限） */
  allowStats: boolean;
  /** Pro Insight / PRO LEAGUE / 外部検索は Pro だけ。無料には道具自体を渡さない */
  isPro: boolean;
  uid: string;
}): Promise<{
  answer: string;
  /** スタッツの道具を 1 回でも使った（＝スタッツの質問として数える） */
  usedStats: boolean;
  promptTokens: number;
  completionTokens: number;
}> {
  const apiKey = requireOpenAiApiKey();
  const allowPro = input.isPro && input.allowStats;
  const tools = [
    APP_GUIDE_TOOL,
    ...(input.allowStats ? NBA_ASK_TOOL_DEFS : []),
    ...(allowPro ? NBA_ASK_PRO_TOOL_DEFS : []),
  ];
  let usedStats = false;
  let usedWeb = false;
  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt(input.language, input.allowStats, input.isPro) },
    ...input.turns.map((t) => ({ role: t.role, content: t.content }) as ChatMessage),
  ];
  let promptTokens = 0;
  let completionTokens = 0;

  for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
    const lastRound = round === MAX_TOOL_ROUNDS;
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model(),
        temperature: 0.2,
        max_tokens: MAX_OUTPUT_TOKENS,
        messages,
        // 最終ラウンドは道具を渡さず、手元のデータで必ず答えさせる
        ...(lastRound ? {} : { tools }),
      }),
    });
    const json = (await res.json().catch(() => ({}))) as ChatResponse;
    if (!res.ok) {
      throw new Error(`openai ${res.status}: ${json.error?.message ?? ""}`);
    }
    promptTokens += json.usage?.prompt_tokens ?? 0;
    completionTokens += json.usage?.completion_tokens ?? 0;

    const msg = json.choices?.[0]?.message;
    const calls = msg?.tool_calls ?? [];
    if (calls.length === 0 || lastRound) {
      return {
        answer: (msg?.content ?? "").trim(),
        usedStats,
        promptTokens,
        completionTokens,
      };
    }

    messages.push({ role: "assistant", content: msg?.content ?? null, tool_calls: calls });
    for (const call of calls) {
      let args: Record<string, unknown> = {};
      try {
        args = JSON.parse(call.function.arguments || "{}") as Record<string, unknown>;
      } catch {
        args = {};
      }
      let result: unknown;
      const name = call.function.name;
      try {
        if (name === "get_app_guide") {
          result = nbaAskAppGuide(String(args.topic ?? ""), input.language);
        } else if (input.allowStats && PUBLIC_STATS_TOOL_NAMES.has(name)) {
          usedStats = true;
          result = await runNbaAskTool(input.db, name, args, input.language);
        } else if (allowPro && name === "search_web") {
          result = await runWebSearch(
            input.db,
            input.uid,
            args,
            (usage) => {
              usedStats = true;
              usedWeb = true;
              promptTokens += usage.promptTokens;
              completionTokens += usage.completionTokens;
            },
            usedWeb
          );
        } else if (allowPro && PRO_TOOL_NAMES.has(name)) {
          usedStats = true;
          result = await runNbaAskTool(input.db, name, args, input.language);
        } else {
          result = { error: "tool not available" };
        }
      } catch (e) {
        console.error("[runNbaAsk] tool", call.function.name, e);
        result = { error: "data unavailable" };
      }
      messages.push({
        role: "tool",
        tool_call_id: call.id,
        content: JSON.stringify(result),
      });
    }
  }

  return { answer: "", usedStats, promptTokens, completionTokens };
}
