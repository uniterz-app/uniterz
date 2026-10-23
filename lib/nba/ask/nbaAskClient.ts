/** `/api/nba/ask` のクライアント（Web / Native 共通）。OpenAI キーはサーバーだけが持つ */
import {
  nbaAskCardTeamName,
  nbaAskGameCardId,
  parseNbaAskBoard,
  type NbaAskBoard,
  type NbaAskGameCard,
} from "./nbaAskBoard";
import { isNbaAskDestinationId, type NbaAskDestinationId } from "./nbaAskDestinations";

export type { NbaAskBoard };

export type NbaAskTurnClient = {
  role: "user" | "assistant";
  content: string;
  /** アシスタントの答えの下に出す「その画面を開く」 */
  opens?: NbaAskDestinationId[];
  /** スタッツの表。数字はサーバーの道具からだけ */
  board?: NbaAskBoard;
  /** 試合は一覧のカード */
  games?: NbaAskGameCard[];
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
  | {
      ok: true;
      answer: string;
      statsFreeRemaining: number | null;
      opens: NbaAskDestinationId[];
      board?: NbaAskBoard;
      games?: NbaAskGameCard[];
    }
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

function gamesOf(raw: unknown): NbaAskGameCard[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const games: NbaAskGameCard[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const away = String(row.away ?? "").trim();
    const home = String(row.home ?? "").trim();
    if (!away || !home) continue;
    const awayTeamId = String(row.awayTeamId ?? "");
    const homeTeamId = String(row.homeTeamId ?? "");
    games.push({
      id: nbaAskGameCardId(row.id),
      away,
      home,
      awayTeamId,
      homeTeamId,
      awayName: nbaAskCardTeamName(awayTeamId, away, String(row.awayName ?? "")),
      homeName: nbaAskCardTeamName(homeTeamId, home, String(row.homeName ?? "")),
      awayRecord: String(row.awayRecord ?? "").trim() || "(0-0)",
      homeRecord: String(row.homeRecord ?? "").trim() || "(0-0)",
      start: String(row.start ?? "").trim(),
      pickup: row.pickup === true,
      score: row.score == null || row.score === "" ? null : String(row.score),
      scoreHome: typeof row.scoreHome === "number" ? row.scoreHome : null,
      scoreAway: typeof row.scoreAway === "number" ? row.scoreAway : null,
      status: String(row.status ?? "scheduled"),
      round: String(row.round ?? "").trim(),
    });
  }
  return games.length > 0 ? games.slice(0, 8) : undefined;
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
  /** 試合一覧と同じ表示タイムゾーン。「今日」や試合日をこの暦日で答える */
  timeZone: string;
}): Promise<NbaAskReply> {
  try {
    const res = await fetch(url(input.apiBaseUrl), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${input.token}`,
      },
      body: JSON.stringify({
        messages: input.turns,
        language: input.language,
        timeZone: input.timeZone,
      }),
    });
    const json = (await res.json().catch(() => null)) as Record<string, unknown> | null;
    if (!json) return { ok: false, error: "unavailable" };
    if (res.ok && json.ok === true && typeof json.answer === "string" && json.answer) {
      return {
        ok: true,
        answer: json.answer,
        statsFreeRemaining: numOrNull(json.statsFreeRemaining),
        opens: opensOf(json.opens),
        board: parseNbaAskBoard(json.board),
        games: gamesOf(json.games),
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
