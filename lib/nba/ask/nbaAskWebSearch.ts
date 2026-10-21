/**
 * Pro だけの外部検索。OpenAI の web_search（context は low）を 1 回だけ使う。
 * アプリのサーバーからは任意の URL を取りにいかない。Spotrac は規約上除外する。
 */
import { requireOpenAiApiKey } from "@/lib/openai/openaiEnv";

const SNIPPET_MAX = 700;
const SOURCE_MAX = 4;

type Citation = { title: string; url: string };

type SearchResponse = {
  output?: Array<{
    type?: string;
    content?: Array<{
      type?: string;
      text?: string;
      annotations?: Array<{ type?: string; url?: string; title?: string }>;
    }>;
  }>;
  usage?: { input_tokens?: number; output_tokens?: number };
  error?: { message?: string };
};

function model(): string {
  return process.env.OPENAI_NBA_ASK_MODEL?.trim() || "gpt-4o-mini";
}

function hostBlocked(url: string): boolean {
  try {
    return new URL(url).hostname.toLowerCase().endsWith("spotrac.com");
  } catch {
    return true;
  }
}

export async function searchNbaAskWeb(query: string): Promise<{
  text: string;
  sources: Citation[];
  promptTokens: number;
  completionTokens: number;
}> {
  const apiKey = requireOpenAiApiKey();
  const q = query.trim().slice(0, 200);
  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: model(),
      max_output_tokens: 280,
      tool_choice: "required",
      tools: [
        {
          type: "web_search",
          search_context_size: "low",
          filters: { blocked_domains: ["spotrac.com"] },
        },
      ],
      input: [
        "Search the public web for this NBA question.",
        "Reply in at most 4 short factual lines. Put a source URL on each line you use.",
        "If the search does not cover it, say not found. Do not invent numbers.",
        `Question: ${q}`,
      ].join("\n"),
    }),
  });
  const json = (await res.json().catch(() => ({}))) as SearchResponse;
  if (!res.ok) {
    throw new Error(`web search ${res.status}: ${json.error?.message ?? ""}`);
  }

  const sources: Citation[] = [];
  const seen = new Set<string>();
  let text = "";
  for (const item of json.output ?? []) {
    if (item.type !== "message") continue;
    for (const part of item.content ?? []) {
      if (part.type !== "output_text" || !part.text) continue;
      if (!text) text = part.text.trim();
      for (const note of part.annotations ?? []) {
        if (note.type !== "url_citation" || !note.url || seen.has(note.url)) continue;
        if (hostBlocked(note.url)) continue;
        seen.add(note.url);
        sources.push({ title: (note.title ?? "").trim(), url: note.url });
      }
    }
  }

  return {
    text: text.slice(0, SNIPPET_MAX),
    sources: sources.slice(0, SOURCE_MAX),
    promptTokens: json.usage?.input_tokens ?? 0,
    completionTokens: json.usage?.output_tokens ?? 0,
  };
}
