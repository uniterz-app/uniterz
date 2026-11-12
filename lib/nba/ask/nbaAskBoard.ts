/**
 * ASK の答えの表と試合カード。数字は Firestore から読んだ値だけ。
 */

import { compactNbaCardNickname, getNbaTeamFullNameById } from "@/lib/nba-team-names";

export type NbaAskBoard = {
  columns: string[];
  rows: { label: string; cells: string[] }[];
  /** 表に出しきれない所属・出場数。箇条書きにはしない */
  note?: string;
};

const GAME_DOC_ID = /^[a-zA-Z0-9_-]{1,128}$/;

/** 予想画面へ渡す試合 ID。形が違うものは捨てる */
export function nbaAskGameCardId(raw: unknown): string {
  const id = String(raw ?? "").trim();
  return GAME_DOC_ID.test(id) ? id : "";
}

/** 試合一覧と同じカードで見せる。数字の表にはしない */
export type NbaAskGameCard = {
  /** Firestore の試合 ID。予想画面を開く */
  id: string;
  away: string;
  home: string;
  awayTeamId: string;
  homeTeamId: string;
  /** 一覧カードのニックネーム（CAVALIERS など） */
  awayName: string;
  homeName: string;
  awayRecord: string;
  homeRecord: string;
  start: string;
  pickup: boolean;
  score: string | null;
  /** 終了・進行中だけ。ホームが左 */
  scoreHome: number | null;
  scoreAway: number | null;
  status: string;
  /** 上辺。REGULAR SEASON など */
  round: string;
};

/** 試合一覧と同じ短いチーム名。道具が略称だけでもチーム ID から戻す */
export function nbaAskCardTeamName(teamId: string, abbr: string, named?: string | null): string {
  const given = typeof named === "string" ? named.trim() : "";
  if (given && given !== "—") return given;
  const full = getNbaTeamFullNameById(teamId);
  const source = full && full !== teamId ? full : abbr;
  return compactNbaCardNickname(source, teamId).toLocaleUpperCase("en-US");
}

function cell(value: unknown): string {
  if (typeof value === "number" && Number.isFinite(value)) {
    if (Math.abs(value - Math.round(value)) < 0.05) return String(Math.round(value));
    return value.toFixed(1);
  }
  const text = String(value ?? "").trim();
  return text || "—";
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function rowsOf(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const row = asRecord(item);
    return row ? [row] : [];
  });
}

/** 1 日の NBA は最大 15 試合 */
export const NBA_ASK_MAX_GAME_CARDS = 15;

/** 試合日の結果はカードにする。表にはしない */
export function gamesFromAskTool(name: string, result: unknown): NbaAskGameCard[] | null {
  if (name !== "get_games_on_date") return null;
  const data = asRecord(result);
  if (!data || data.error || data.found === false) return null;
  const games = rowsOf(data.games).slice(0, NBA_ASK_MAX_GAME_CARDS);
  if (games.length === 0) return null;
  return games.map((game) => {
    const awayTeamId = String(game.awayTeamId ?? "");
    const homeTeamId = String(game.homeTeamId ?? "");
    const away = cell(game.away);
    const home = cell(game.home);
    const scoreHome = typeof game.scoreHome === "number" ? game.scoreHome : null;
    const scoreAway = typeof game.scoreAway === "number" ? game.scoreAway : null;
    return {
      id: nbaAskGameCardId(game.id),
      away,
      home,
      awayTeamId,
      homeTeamId,
      awayName: nbaAskCardTeamName(awayTeamId, away),
      homeName: nbaAskCardTeamName(homeTeamId, home),
      awayRecord: cell(game.awayRecord) === "—" ? "(0-0)" : cell(game.awayRecord),
      homeRecord: cell(game.homeRecord) === "—" ? "(0-0)" : cell(game.homeRecord),
      start: cell(game.start) === "—" ? "" : cell(game.start),
      pickup: game.pickup === true,
      score: game.score == null || game.score === "" ? null : cell(game.score),
      scoreHome,
      scoreAway,
      status: String(game.status ?? "scheduled"),
      round: cell(game.round) === "—" ? "" : cell(game.round),
    };
  });
}

export function parseNbaAskBoard(raw: unknown): NbaAskBoard | undefined {
  const data = asRecord(raw);
  if (!data || !Array.isArray(data.columns) || !Array.isArray(data.rows)) return undefined;
  const columns = data.columns.map((item) => String(item)).filter(Boolean).slice(0, 4);
  if (columns.length === 0) return undefined;
  const rows = data.rows.flatMap((item) => {
    const row = asRecord(item);
    if (!row || !Array.isArray(row.cells)) return [];
    return [
      {
        label: String(row.label ?? "").slice(0, 40),
        cells: row.cells.map((cell) => String(cell)).slice(0, columns.length),
      },
    ];
  });
  if (rows.length === 0) return undefined;
  const note = typeof data.note === "string" ? data.note.trim().slice(0, 120) : "";
  return note ? { columns, rows: rows.slice(0, 15), note } : { columns, rows: rows.slice(0, 15) };
}
