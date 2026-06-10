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

export function formatWcMatchGoalScorerLabel(
  fullName: string,
  minute?: number | null,
  ownGoal?: boolean
): string {
  const short = formatWcPlayerShortName(fullName);
  const withMin =
    minute != null && Number.isFinite(minute) ? `${short} ${minute}'` : short;
  return ownGoal ? `${withMin} OG` : withMin;
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
