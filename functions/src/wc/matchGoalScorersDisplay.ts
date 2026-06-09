/** Keep in sync with lib/wc/matchGoalScorers.ts */

import { resolveWcGameGoalScorers } from "./goalScorerResolve";
import { WC_SQUAD_NAME_INDEX, type WcSquadNameEntry } from "./squadNameIndex";

export type PostMatchGoalScorer = {
  side: "home" | "away";
  minute: number | null;
  label: string;
  ownGoal?: boolean;
};

function wcTeamIdToIso3(teamId: string): string | null {
  if (!teamId.startsWith("wc-")) return null;
  return teamId.slice(3).toLowerCase();
}

function getPlayerName(teamId: string, playerId: string): string {
  const iso3 = wcTeamIdToIso3(teamId);
  if (!iso3) return playerId;
  const squad: WcSquadNameEntry[] = WC_SQUAD_NAME_INDEX[iso3] ?? [];
  return squad.find((p) => p.id === playerId)?.name ?? playerId;
}

function formatWcPlayerShortName(fullName: string): string {
  const trimmed = fullName.trim();
  if (!trimmed) return "";
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0]!;
  const last = parts[parts.length - 1]!;
  const initial = parts[0]![0]?.toUpperCase() ?? "";
  if (!initial) return last;
  return `${initial}.${last}`;
}

function formatLabel(
  fullName: string,
  minute?: number | null,
  ownGoal?: boolean
): string {
  const short = formatWcPlayerShortName(fullName);
  const withMin =
    minute != null && Number.isFinite(minute) ? `${short} ${minute}'` : short;
  return ownGoal ? `${withMin} OG` : withMin;
}

function sortRows(rows: PostMatchGoalScorer[]): PostMatchGoalScorer[] {
  return [...rows].sort((a, b) => {
    const am = a.minute ?? 9999;
    const bm = b.minute ?? 9999;
    if (am !== bm) return am - bm;
    if (a.side !== b.side) return a.side === "home" ? -1 : 1;
    return a.label.localeCompare(b.label);
  });
}

export function buildPostMatchGoalScorersFromGame(
  raw: unknown,
  homeTeamId: string | null | undefined,
  awayTeamId: string | null | undefined
): PostMatchGoalScorer[] {
  const list = resolveWcGameGoalScorers(raw, {
    homeTeamId,
    awayTeamId,
  });
  const rows: PostMatchGoalScorer[] = [];

  for (const g of list) {
    let side: "home" | "away" | null = null;
    if (homeTeamId && g.teamId === homeTeamId) side = "home";
    else if (awayTeamId && g.teamId === awayTeamId) side = "away";
    if (!side) continue;

    const fullName = getPlayerName(g.teamId, g.playerId);
    rows.push({
      side,
      minute: g.minute ?? null,
      label: formatLabel(fullName, g.minute, g.ownGoal),
      ...(g.ownGoal ? { ownGoal: true } : {}),
    });
  }

  return sortRows(rows);
}
