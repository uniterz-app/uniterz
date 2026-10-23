/**
 * NBA スタッツ質問チャット（サーバー専用）。
 * 費用を抑えるため: 軽量モデル・直近の会話だけ送る・回答は短く・道具の往復は最大 3 回。
 */
import type { Firestore } from "firebase-admin/firestore";
import { requireOpenAiApiKey } from "@/lib/openai/openaiEnv";
import { getTodayKeyInTimeZone } from "@/lib/time/zonedTime";
import {
  NBA_ASK_PRO_TOOL_DEFS,
  NBA_ASK_SCHEDULE_TOOL_NAMES,
  NBA_ASK_TOOL_DEFS,
  runNbaAskTool,
} from "./nbaAskTools";
import {
  NBA_ASK_APP_TOPICS,
  nbaAskAppGuide,
  nbaAskIsClarifyFollowUp,
  nbaAskIsScoringQuestion,
  nbaAskScoringFocus,
} from "./nbaAskAppGuide";
import { nbaAskDropPriorTurns, nbaAskSubject } from "./nbaAskSubject";
import { isNbaAskDestinationId, type NbaAskDestinationId } from "./nbaAskDestinations";
import { consumeNbaAskWebSearch, refundNbaAskWebSearch } from "./nbaAskQuota";
import { searchNbaAskWeb } from "./nbaAskWebSearch";
import {
  boardFromAskTool,
  gamesFromAskTool,
  nbaAskLooksLikeStats,
  type NbaAskBoard,
  type NbaAskGameCard,
} from "./nbaAskBoard";

const APP_GUIDE_TOOL = {
  type: "function",
  function: {
    name: "get_app_guide",
    description:
      "Official UNITERZ app guide from published copy. scoring focus: overview, upset, win, total. Also prediction_form, stats, ranking, unit_rewards, pro_plans, ask_chat, notifications, invite, squads, profile.",
    parameters: {
      type: "object",
      properties: {
        topic: { type: "string", enum: NBA_ASK_APP_TOPICS },
        focus: { type: "string", enum: ["overview", "upset", "win", "total"] },
      },
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
const MAX_APP_OUTPUT_TOKENS = 520;

/**
 * 試合一覧の日付と同じタイムゾーン。送られてこない古いアプリは、日本語なら日本時間・それ以外は米国東部
 */
export function resolveNbaAskTimeZone(raw: unknown, language: string): string {
  const tz = typeof raw === "string" ? raw.trim().slice(0, 64) : "";
  if (tz) {
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: tz });
      return tz;
    } catch {
      // 不正な値は既定へ
    }
  }
  return language === "ja" ? "Asia/Tokyo" : "America/New_York";
}

function nowInTimeZone(timeZone: string): string {
  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date());
  return `${getTodayKeyInTimeZone(timeZone)} ${time}`;
}

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
    return "This PRO user's daily stats limit is reached. Stats tools and PRO-only tools are NOT available. get_games_on_date still works for the schedule and PICK UP. App questions via get_app_guide still work. Say the daily limit was reached only when they asked for a stat lookup.";
  }
  return "NBA stats tools are NOT available: this free account has used its stats questions. get_games_on_date still works for the schedule and PICK UP. Public stats are unlimited with PRO. Looking up one game's Pro Insight, the live PRO LEAGUE board, or the web is PRO-only. Explaining what those features are, via get_app_guide, still works. Do not guess stats or a specific game's PRO read.";
}

function systemPrompt(
  language: string,
  timeZone: string,
  allowStats: boolean,
  isPro: boolean
): string {
  return [
    "You are the assistant in the UNITERZ app (NBA score prediction app).",
    "You answer (1) questions about using the UNITERZ app via get_app_guide, and (2) NBA stats questions.",
    "Questions about what PRO features are (Pro Insight, PRO LEAGUE, alerts, plans, this chat) are fine for everyone. Answer those from get_app_guide topic pro_plans or ask_chat. Do not invent details the guide does not have.",
    "Never answer questions about permissions, roles, admin access, or how many people use the app or subscribe to PRO. Say you cannot answer that. Do not estimate, search the web, or call any tool for it.",
    "When the user asks about an app feature, call get_app_guide. If the result includes open, the app puts a button under your answer that opens that screen. Tell them to tap the button. Do not invent a path.",
    `Now is ${nowInTimeZone(timeZone)} in the user's time zone (${timeZone}). The app's games list shows each game on the date it starts in this time zone. "Today", "tomorrow", "yesterday", and dates in your answer all use this time zone. Do not convert to US dates.`,
    "For which games are on, or which are PICK UP (ピックアップ, pick up), call get_games_on_date. Use date tomorrow for 明日, today for 今日, yesterday for 昨日, and pickup_only true for PICK UP. If it returns no game, say that day has none. Do not tell the user to look it up in the app.",
    "Upset (アップセット, あっぷせっと, 番狂わせ), win streaks, points, and win rate are UNITERZ scoring. Call get_app_guide topic scoring with focus upset, win, total, or overview. Answer in a few spoken sentences. Finer formulas than the guide are not public: say the help text is the limit.",
    "Notifications, invites, squads, profile, and Unit rewards use get_app_guide topics notifications, invite, squads, profile, unit_rewards.",
    "Shot zones, contracts, career averages, discipline (tech, flagrant, ejection, fines), team strengths and weaknesses, and today's stat leaders have their own tools. Read those. Do not use search_web to fill them, and do not use Spotrac.",
    "Answer ONLY from tool results. Never guess numbers or app rules. If the guide or data doesn't cover it, say you don't know.",
    "Earlier messages are this same conversation. 'その選手', 'じゃあ', '昨日のは', 'そっち' keep the same player, team, and game. A new question with a different subject is not a follow-up. Do not answer it with the previous topic's guide.",
    "売上, うりあげ, revenue, and costs are not scoring. Do not call a tool for them. Say you cannot answer that.",
    "When the tools return stats, the app draws the table. Do not repeat those numbers as bullets or a second list. At most one short sentence for something the table does not show.",
    "For a league leader or team stat, say the leader and the asked team's rank. Do not list every team.",
    "Call search_web only after a stats tool returns found:false without webOk:false, or liveNews:false (season roster IN/OUT is not a same-day wire). Never replace an app number, contract, or the IN/OUT list with the web. If a tool says the app has no number yet, say that. Include the source URL when a number is from the web.",
    "The messages above are the only conversation. Do not continue a topic that is not in them.",
    dataAccessLine(allowStats, isPro),
    "The app shows your text as-is. Plain sentences only. No markdown, no asterisks, no bold, no headings.",
    "If the user says the previous answer was hard to understand, explain the same facts again in 2 or 3 short everyday sentences. Do not repeat the previous wording or its numbered list. Do not tell them to read the in-app guide.",
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

/** 直前の助手の文は渡さない。「わかりにくい」のあと、同じ文をコピーさせない */
function dropLastAssistantTurn(turns: NbaAskTurn[]): NbaAskTurn[] {
  const next = [...turns];
  for (let i = next.length - 1; i >= 0; i--) {
    if (next[i]?.role === "assistant") {
      next.splice(i, 1);
      break;
    }
  }
  return next;
}

/** 画面はプレーンテキスト。** や見出し記号がそのまま出るのを落とす */
function plainAskAnswer(raw: string): string {
  return raw
    .replace(/\*\*([\s\S]+?)\*\*/g, "$1")
    .replace(/\*\*/g, "")
    .replace(/^#{1,6}\s+/gm, "")
    .split("\n")
    .filter((line) => !/ガイドを参照/.test(line))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

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
  /** ユーザーの表示タイムゾーン（`resolveNbaAskTimeZone` 済み） */
  timeZone: string;
  /** false のとき公開スタッツの道具を渡さない（無料枠を使い切った人、または Pro の 1 日上限） */
  allowStats: boolean;
  /** Pro Insight / PRO LEAGUE / 外部検索は Pro だけ。無料には道具自体を渡さない */
  isPro: boolean;
  uid: string;
}): Promise<{
  answer: string;
  /** スタッツの道具を 1 回でも使った（＝スタッツの質問として数える） */
  usedStats: boolean;
  /** 機能の説明で開く画面（答えの下のボタン） */
  opens: NbaAskDestinationId[];
  /** スタッツは表で見せる。道具の数字があるときだけ */
  board: NbaAskBoard | null;
  /** 試合は一覧と同じカード。表にはしない */
  games: NbaAskGameCard[] | null;
  promptTokens: number;
  completionTokens: number;
}> {
  const apiKey = requireOpenAiApiKey();
  const allowPro = input.isPro && input.allowStats;
  const tools = [
    APP_GUIDE_TOOL,
    ...NBA_ASK_TOOL_DEFS.filter(
      (tool) => input.allowStats || NBA_ASK_SCHEDULE_TOOL_NAMES.has(tool.function.name)
    ),
    ...(allowPro ? NBA_ASK_PRO_TOOL_DEFS : []),
  ];
  let usedStats = false;
  let usedWeb = false;
  let statsMiss = false;
  let board: NbaAskBoard | null = null;
  let games: NbaAskGameCard[] | null = null;
  const opens: NbaAskDestinationId[] = [];
  const latestUser = [...input.turns].reverse().find((t) => t.role === "user")?.content ?? "";
  const clarify = nbaAskIsClarifyFollowUp(latestUser);
  const talkedScoring = input.turns.some(
    (t) => t.role === "user" && nbaAskIsScoringQuestion(t.content)
  );
  const turnsForModel = nbaAskDropPriorTurns(input.turns)
    ? input.turns.filter((t) => t.role === "user").slice(-1)
    : clarify
      ? dropLastAssistantTurn(input.turns)
      : input.turns;
  const messages: ChatMessage[] = [
    {
      role: "system",
      content: systemPrompt(input.language, input.timeZone, input.allowStats, input.isPro),
    },
    ...turnsForModel.map((t) => ({ role: t.role, content: t.content }) as ChatMessage),
  ];
  if (nbaAskIsScoringQuestion(latestUser) || (clarify && talkedScoring)) {
    const guide = {
      ...(nbaAskAppGuide(
        "scoring",
        input.language,
        nbaAskScoringFocus(latestUser)
      ) as Record<string, unknown>),
    };
    delete guide.open;
    messages.push({
      role: "system",
      content: [
        clarify
          ? "The user said the previous explanation was hard to understand. Explain the same scoring facts again in 2 or 3 short spoken sentences. Do not reuse the previous list or wording."
          : "The latest question is about UNITERZ scoring. あっぷせっと means アップセット (upset).",
        "Answer only what they asked, in plain sentences. No markdown, no asterisks, no numbered dump of the whole guide.",
        "Do not say to check the in-app guide. For when a pick counts as an upset, use the 45% minority rule in the guide.",
        JSON.stringify(guide),
      ].join("\n"),
    });
  } else if (clarify) {
    messages.push({
      role: "system",
      content:
        "The user said the previous explanation was hard to understand. Explain the same facts again in 2 or 3 short spoken sentences. Do not reuse the previous wording or its list. No markdown.",
    });
  }
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
        max_tokens: nbaAskLooksLikeStats(latestUser) ? MAX_OUTPUT_TOKENS : MAX_APP_OUTPUT_TOKENS,
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
        answer: plainAskAnswer(msg?.content ?? ""),
        usedStats,
        opens,
        board: games ? null : board,
        games,
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
          const asked = nbaAskSubject(latestUser);
          let topic = String(args.topic ?? "");
          let focus = String(args.focus ?? "");
          if (asked.kind === "nba") {
            result = { error: "This is an NBA question. Use a stats tool." };
          } else {
            if (asked.kind === "app") {
              topic = asked.topic;
              if (asked.topic === "scoring") focus = nbaAskScoringFocus(latestUser);
            }
            result = nbaAskAppGuide(topic, input.language, focus);
          }
          const open = (result as { open?: unknown }).open;
          if (isNbaAskDestinationId(open) && !opens.includes(open) && opens.length < 2) {
            opens.push(open);
          }
        } else if (
          NBA_ASK_SCHEDULE_TOOL_NAMES.has(name) ||
          (input.allowStats && PUBLIC_STATS_TOOL_NAMES.has(name))
        ) {
          if (!NBA_ASK_SCHEDULE_TOOL_NAMES.has(name)) usedStats = true;
          result = await runNbaAskTool(input.db, name, args, input.language, input.timeZone);
        } else if (allowPro && name === "search_web") {
          if (!statsMiss) {
            result = {
              error: "search_web only after an app tool returns found:false or liveNews:false",
            };
          } else result = await runWebSearch(
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
          result = await runNbaAskTool(input.db, name, args, input.language, input.timeZone);
        } else {
          result = { error: "tool not available" };
        }
      } catch (e) {
        console.error("[runNbaAsk] tool", call.function.name, e);
        result = { error: "data unavailable" };
      }
      if (result && typeof result === "object") {
        const row = result as { found?: unknown; liveNews?: unknown; webOk?: unknown };
        if (row.liveNews === false || (row.found === false && row.webOk !== false)) {
          statsMiss = true;
        }
      }
      const nextGames = gamesFromAskTool(name, result);
      if (nextGames) games = nextGames;
      else {
        const nextBoard = boardFromAskTool(name, result);
        if (nextBoard) board = nextBoard;
      }
      messages.push({
        role: "tool",
        tool_call_id: call.id,
        content: JSON.stringify(result),
      });
    }
  }

  return { answer: "", usedStats, opens, board: games ? null : board, games, promptTokens, completionTokens };
}
