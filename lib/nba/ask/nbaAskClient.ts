/** `/api/nba/ask` のクライアント（Web / Native 共通）。OpenAI キーはサーバーだけが持つ */
import { isNbaAskDestinationId, type NbaAskDestinationId } from "./nbaAskDestinations";

export type NbaAskTurnClient = {
  role: "user" | "assistant";
  content: string;
  /** アシスタントの答えの下に出す「その画面を開く」 */
  opens?: NbaAskDestinationId[];
};

export type NbaAskStatus = {
  isPro: boolean;
  /** 無料のスタッツ質問の残り（Pro は null = 無制限） */
  statsFreeRemaining: number | null;
  /** サーバーに OpenAI キーが無い・API 未デプロイなら false（準備中） */
  available: boolean;
};

export type NbaAskError = "rate_limited" | "slow_down" | "auth" | "unavailable" | "failed";

export type NbaAskReply =
  | { ok: true; answer: string; statsFreeRemaining: number | null; opens: NbaAskDestinationId[] }
  | { ok: false; error: NbaAskError };

function opensOf(raw: unknown): NbaAskDestinationId[] {
  if (!Array.isArray(raw)) return [];
  const ids: NbaAskDestinationId[] = [];
  for (const item of raw) {
    if (isNbaAskDestinationId(item) && !ids.includes(item)) ids.push(item);
  }
  return ids.slice(0, 2);
}

function url(apiBaseUrl: string | null | undefined): string {
  return `${(apiBaseUrl ?? "").replace(/\/$/, "")}/api/nba/ask`;
}

function numOrNull(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

export async function fetchNbaAskStatus(input: {
  apiBaseUrl?: string | null;
  token: string;
}): Promise<NbaAskStatus | null> {
  try {
    const res = await fetch(url(input.apiBaseUrl), {
      headers: { Authorization: `Bearer ${input.token}` },
    });
    if (!res.ok) return null;
    const json = (await res.json().catch(() => null)) as Record<string, unknown> | null;
    // API が未デプロイのサーバーは HTML を 200 で返すことがある。JSON の ok が無ければ「準備中」
    if (!json || json.ok !== true) {
      return { isPro: false, statsFreeRemaining: 0, available: false };
    }
    return {
      isPro: json.isPro === true,
      statsFreeRemaining: numOrNull(json.statsFreeRemaining),
      available: json.available !== false,
    };
  } catch {
    return null;
  }
}

export async function postNbaAsk(input: {
  apiBaseUrl?: string | null;
  token: string;
  turns: NbaAskTurnClient[];
  language: string;
}): Promise<NbaAskReply> {
  try {
    const res = await fetch(url(input.apiBaseUrl), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${input.token}`,
      },
      body: JSON.stringify({ messages: input.turns, language: input.language }),
    });
    const json = (await res.json().catch(() => null)) as Record<string, unknown> | null;
    if (!json) return { ok: false, error: "unavailable" };
    if (res.ok && json.ok === true && typeof json.answer === "string" && json.answer) {
      return {
        ok: true,
        answer: json.answer,
        statsFreeRemaining: numOrNull(json.statsFreeRemaining),
        opens: opensOf(json.opens),
      };
    }
    const error: NbaAskError =
      res.status === 429
        ? json.error === "slow_down"
          ? "slow_down"
          : "rate_limited"
        : res.status === 401
          ? "auth"
          : res.status === 503
            ? "unavailable"
            : "failed";
    return { ok: false, error };
  } catch {
    return { ok: false, error: "failed" };
  }
}
