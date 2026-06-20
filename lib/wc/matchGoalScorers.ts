/**
 * WC 試合の実得点者 — リザルトカード表示用
 */

import {
  normalizeWcGameGoalScorers,
  resolveWcGameGoalScorers,
  type WcGameGoalScorer,
} from "@/lib/wc/goalScorer";
import { getWcSquadPlayer } from "@/lib/wc/squads";

export type PostMatchGoalScorer = {
  side: "home" | "away";
  minute: number | null;
  /** 表示用（例: L.James 25'） */
  label: string;
  ownGoal?: boolean;
};

/** NBA 風短縮名: Cristiano Ronaldo → C.Ronaldo、James → James */
export function formatWcPlayerShortName(fullName: string): string {
  const trimmed = fullName.trim();
  if (!trimmed) return "";
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0]!;
  const last = parts[parts.length - 1]!;
  const initial = parts[0]![0]?.toUpperCase() ?? "";
  if (!initial) return last;
  return `${initial}.${last}`;
}

/** 90+5 などアディショナルタイム表記（保存値は 95 = 90+5） */
export function formatWcGoalMinuteDisplay(minute: number | null | undefined): string {
  if (minute == null || !Number.isFinite(Number(minute))) return "";
  const m = Math.floor(Number(minute));
  if (m > 90) return `90+${m - 90}'`;
  return `${m}'`;
}

export function formatWcMatchGoalScorerLabel(
  fullName: string,
  minute?: number | null,
  ownGoal?: boolean
): string {
  const name = fullName.trim();
  const withMin =
    minute != null && Number.isFinite(minute)
      ? `${name} ${formatWcGoalMinuteDisplay(minute)}`.trim()
      : name;
  return ownGoal ? `${withMin} (OG)` : withMin;
}

/** 得点者ブロック — 同一選手の複数ゴールをまとめた1行（例: Jonathan David 29', 45+3'） */
export function formatWcMatchGoalScorerGroupedLine(
  playerName: string,
  minutes: readonly number[],
  ownGoal?: boolean
): string {
  const mins = minutes
    .map((m) => formatWcGoalMinuteDisplay(m))
    .filter(Boolean)
    .join(", ");
  const core = mins ? `${playerName} ${mins}` : playerName.trim();
  return ownGoal ? `${core} (OG)` : core;
}

export type WcMatchGoalScorerGroupedLine = {
  side: "home" | "away";
  text: string;
  sortMinute: number;
};

function parseScorerNameFromLabel(label: string): string {
  let s = label.trim();
  if (s.endsWith(" (OG)")) s = s.slice(0, -5).trim();
  if (s.endsWith(" OG")) s = s.slice(0, -3).trim();
  const m = s.match(/^(.+?)\s+\d+(?:\+\d+)?'$/);
  return m ? m[1]!.trim() : s;
}

/** 投稿済み matchGoalScorers（短縮ラベル）からグループ行を組み立て */
export function groupPostMatchGoalScorersForDisplay(
  rows: readonly PostMatchGoalScorer[]
): WcMatchGoalScorerGroupedLine[] {
  type Acc = {
    side: "home" | "away";
    name: string;
    minutes: number[];
    ownGoal: boolean;
  };
  const map = new Map<string, Acc>();

  for (const row of rows) {
    const name = parseScorerNameFromLabel(row.label);
    const key = `${row.side}\0${name}\0${row.ownGoal ? 1 : 0}`;
    const prev = map.get(key);
    if (prev) {
      if (row.minute != null && Number.isFinite(row.minute)) {
        prev.minutes.push(row.minute);
      }
      continue;
    }
    map.set(key, {
      side: row.side,
      name,
      minutes:
        row.minute != null && Number.isFinite(row.minute) ? [row.minute] : [],
      ownGoal: Boolean(row.ownGoal),
    });
  }

  const lines: WcMatchGoalScorerGroupedLine[] = [];
  for (const g of map.values()) {
    g.minutes.sort((a, b) => a - b);
    lines.push({
      side: g.side,
      text: formatWcMatchGoalScorerGroupedLine(g.name, g.minutes, g.ownGoal),
      sortMinute: g.minutes[0] ?? 9999,
    });
  }

  return lines.sort((a, b) => {
    if (a.sortMinute !== b.sortMinute) return a.sortMinute - b.sortMinute;
    if (a.side !== b.side) return a.side === "home" ? -1 : 1;
    return a.text.localeCompare(b.text);
  });
}

export function buildWcMatchGoalScorerGroupedLines(
  goalScorers: WcGameGoalScorer[],
  homeTeamId: string | null | undefined,
  awayTeamId: string | null | undefined
): WcMatchGoalScorerGroupedLine[] {
  type Acc = {
    side: "home" | "away";
    name: string;
    minutes: number[];
    ownGoal: boolean;
  };
  const map = new Map<string, Acc>();

  for (const g of goalScorers) {
    const side = sideForTeamId(g.teamId, homeTeamId, awayTeamId);
    if (!side) continue;
    const fullName =
      getWcSquadPlayer(g.teamId, g.playerId)?.name ?? g.playerId;
    const key = `${side}\0${g.playerId}\0${g.ownGoal ? 1 : 0}`;
    const prev = map.get(key);
    if (prev) {
      if (g.minute != null && Number.isFinite(g.minute)) {
        prev.minutes.push(g.minute);
      }
      continue;
    }
    map.set(key, {
      side,
      name: fullName,
      minutes:
        g.minute != null && Number.isFinite(g.minute) ? [g.minute] : [],
      ownGoal: Boolean(g.ownGoal),
    });
  }

  const lines: WcMatchGoalScorerGroupedLine[] = [];
  for (const g of map.values()) {
    g.minutes.sort((a, b) => a - b);
    lines.push({
      side: g.side,
      text: formatWcMatchGoalScorerGroupedLine(g.name, g.minutes, g.ownGoal),
      sortMinute: g.minutes[0] ?? 9999,
    });
  }

  return lines.sort((a, b) => {
    if (a.sortMinute !== b.sortMinute) return a.sortMinute - b.sortMinute;
    if (a.side !== b.side) return a.side === "home" ? -1 : 1;
    return a.text.localeCompare(b.text);
  });
}

export function buildWcMatchGoalScorerGroupedLinesFromRaw(
  raw: unknown,
  homeTeamId: string | null | undefined,
  awayTeamId: string | null | undefined
): WcMatchGoalScorerGroupedLine[] {
  const resolved = resolveWcGameGoalScorers(raw, { homeTeamId, awayTeamId });
  const list = resolved.ok ? resolved.scorers : normalizeWcGameGoalScorers(raw);
  return buildWcMatchGoalScorerGroupedLines(list, homeTeamId, awayTeamId);
}

/** リザルトカード — 得点者ブロック（フルネーム・同一選手は分数をカンマ連結） */
export function resolveWcMatchGoalScorerGroupedLines(opts: {
  league: string;
  isFinal: boolean;
  matchGoalScorersRaw?: unknown;
  goalScorersRaw?: unknown;
  homeTeamId?: string | null;
  awayTeamId?: string | null;
}): WcMatchGoalScorerGroupedLine[] {
  if (opts.league !== "wc" || !opts.isFinal) return [];

  const fromPost = readPostMatchGoalScorers(opts.matchGoalScorersRaw);
  if (fromPost.length > 0) return groupPostMatchGoalScorersForDisplay(fromPost);

  if (opts.goalScorersRaw != null) {
    return buildWcMatchGoalScorerGroupedLinesFromRaw(
      opts.goalScorersRaw,
      opts.homeTeamId,
      opts.awayTeamId
    );
  }

  return [];
}

function sideForTeamId(
  teamId: string,
  homeTeamId: string | null | undefined,
  awayTeamId: string | null | undefined
): "home" | "away" | null {
  if (homeTeamId && teamId === homeTeamId) return "home";
  if (awayTeamId && teamId === awayTeamId) return "away";
  return null;
}

export function buildPostMatchGoalScorers(
  goalScorers: WcGameGoalScorer[],
  homeTeamId: string | null | undefined,
  awayTeamId: string | null | undefined
): PostMatchGoalScorer[] {
  const rows: PostMatchGoalScorer[] = [];

  for (const g of goalScorers) {
    const side = sideForTeamId(g.teamId, homeTeamId, awayTeamId);
    if (!side) continue;
    const fullName =
      getWcSquadPlayer(g.teamId, g.playerId)?.name ?? g.playerId;
    rows.push({
      side,
      minute: g.minute ?? null,
      label: formatWcMatchGoalScorerLabel(fullName, g.minute, g.ownGoal),
      ...(g.ownGoal ? { ownGoal: true } : {}),
    });
  }

  return sortPostMatchGoalScorers(rows);
}

export function sortPostMatchGoalScorers(
  rows: PostMatchGoalScorer[]
): PostMatchGoalScorer[] {
  return [...rows].sort((a, b) => {
    const am = a.minute ?? 9999;
    const bm = b.minute ?? 9999;
    if (am !== bm) return am - bm;
    if (a.side !== b.side) return a.side === "home" ? -1 : 1;
    return a.label.localeCompare(b.label);
  });
}

/** games.goalScorers（簡易形式含む）から投稿用配列を組み立て */
export function buildPostMatchGoalScorersFromRaw(
  raw: unknown,
  homeTeamId: string | null | undefined,
  awayTeamId: string | null | undefined
): PostMatchGoalScorer[] {
  const resolved = resolveWcGameGoalScorers(raw, { homeTeamId, awayTeamId });
  const list = resolved.ok ? resolved.scorers : normalizeWcGameGoalScorers(raw);
  return buildPostMatchGoalScorers(list, homeTeamId, awayTeamId);
}

function groupedLinesToPostMatchGoalScorers(
  lines: WcMatchGoalScorerGroupedLine[]
): PostMatchGoalScorer[] {
  return lines.map((g) => ({
    side: g.side,
    minute: g.sortMinute,
    label: g.text,
    ownGoal: g.text.includes("(OG)"),
  }));
}

/** 試合カード／リザルト：投稿の matchGoalScorers 優先、なければ games.goalScorers から組み立て（同一選手は分数をカンマ連結） */
export function resolveWcMatchGoalScorersForDisplay(opts: {
  league: string;
  isFinal: boolean;
  matchGoalScorersRaw?: unknown;
  goalScorersRaw?: unknown;
  homeTeamId?: string | null;
  awayTeamId?: string | null;
}): PostMatchGoalScorer[] {
  return groupedLinesToPostMatchGoalScorers(
    resolveWcMatchGoalScorerGroupedLines(opts)
  );
}

export function readPostMatchGoalScorers(
  raw: unknown
): PostMatchGoalScorer[] {
  if (!Array.isArray(raw)) return [];
  const rows: PostMatchGoalScorer[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const side = (item as PostMatchGoalScorer).side;
    const label = String((item as PostMatchGoalScorer).label ?? "").trim();
    if ((side !== "home" && side !== "away") || !label) continue;
    const minuteRaw = (item as { minute?: unknown }).minute;
    const minute =
      minuteRaw == null ||
      minuteRaw === "" ||
      (typeof minuteRaw === "string" && minuteRaw.trim() === "")
        ? null
        : Number.isFinite(Number(minuteRaw))
          ? Number(minuteRaw)
          : null;
    rows.push({
      side,
      minute,
      label,
      ownGoal: Boolean((item as PostMatchGoalScorer).ownGoal),
    });
  }
  return sortPostMatchGoalScorers(rows);
}
