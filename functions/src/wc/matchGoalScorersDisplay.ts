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

function formatWcGoalMinuteDisplay(minute: number | null | undefined): string {
  if (minute == null || !Number.isFinite(Number(minute))) return "";
  const m = Math.floor(Number(minute));
  if (m > 90) return `90+${m - 90}'`;
  return `${m}'`;
}

function formatGroupedLine(
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

function sideForTeamId(
  teamId: string,
  homeTeamId: string | null | undefined,
  awayTeamId: string | null | undefined
): "home" | "away" | null {
  if (homeTeamId && teamId === homeTeamId) return "home";
  if (awayTeamId && teamId === awayTeamId) return "away";
  return null;
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

  type Acc = {
    side: "home" | "away";
    name: string;
    minutes: number[];
    ownGoal: boolean;
  };
  const map = new Map<string, Acc>();

  for (const g of list) {
    const side = sideForTeamId(g.teamId, homeTeamId, awayTeamId);
    if (!side) continue;

    const fullName = getPlayerName(g.teamId, g.playerId);
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

  const rows: PostMatchGoalScorer[] = [];
  for (const g of map.values()) {
    g.minutes.sort((a, b) => a - b);
    rows.push({
      side: g.side,
      minute: g.minutes[0] ?? null,
      label: formatGroupedLine(g.name, g.minutes, g.ownGoal),
      ...(g.ownGoal ? { ownGoal: true } : {}),
    });
  }

  return sortRows(rows);
}
