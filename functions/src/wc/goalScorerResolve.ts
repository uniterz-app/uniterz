/** Keep resolve logic in sync with lib/wc/goalScorer.ts */

import { WC_SQUAD_NAME_INDEX, type WcSquadNameEntry } from "./squadNameIndex";

export type WcGameGoalScorer = {
  playerId: string;
  teamId: string;
  minute?: number | null;
  ownGoal?: boolean;
};

type ResolveContext = {
  homeTeamId?: string | null;
  awayTeamId?: string | null;
};

function wcTeamIdToIso3(teamId: string): string | null {
  if (!teamId.startsWith("wc-")) return null;
  return teamId.slice(3).toLowerCase();
}

function getSquad(teamId: string): WcSquadNameEntry[] | null {
  const iso3 = wcTeamIdToIso3(teamId);
  if (!iso3) return null;
  return WC_SQUAD_NAME_INDEX[iso3] ?? null;
}

function normalizePlayerNameForMatch(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

function findSquadPlayerByName(
  squad: WcSquadNameEntry[],
  name: string
): WcSquadNameEntry | undefined {
  const q = normalizePlayerNameForMatch(name);
  if (!q) return undefined;

  const exact = squad.filter((p) => normalizePlayerNameForMatch(p.name) === q);
  if (exact.length === 1) return exact[0];
  if (exact.length > 1) return undefined;

  const partial = squad.filter((p) => {
    const pn = normalizePlayerNameForMatch(p.name);
    if (pn === q) return true;
    if (pn.includes(q) || q.includes(pn)) return true;
    const parts = pn.split(" ");
    return parts.some((part) => part.length >= 2 && part === q);
  });
  if (partial.length === 1) return partial[0];
  return undefined;
}

function parseMinute(raw: unknown): number | null {
  if (raw == null || raw === "") return null;
  return Number.isFinite(Number(raw)) ? Number(raw) : null;
}

function normalizePick(raw: unknown): { playerId: string; teamId: string } | null {
  if (!raw || typeof raw !== "object") return null;
  const playerId = String((raw as WcGameGoalScorer).playerId ?? "").trim();
  const teamId = String((raw as WcGameGoalScorer).teamId ?? "").trim();
  if (!playerId || !teamId) return null;
  return { playerId, teamId };
}

export function resolveWcGameGoalScorers(
  raw: unknown,
  ctx: ResolveContext
): WcGameGoalScorer[] {
  if (!Array.isArray(raw)) return [];

  const out: WcGameGoalScorer[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;

    const minute = parseMinute((item as WcGameGoalScorer).minute);
    const ownGoal = Boolean((item as WcGameGoalScorer).ownGoal);
    const pick = normalizePick(item);
    if (pick) {
      out.push({ ...pick, minute, ownGoal });
      continue;
    }

    const name = String(
      (item as { name?: string; playerName?: string }).name ??
        (item as { playerName?: string }).playerName ??
        ""
    ).trim();
    if (!name) continue;

    const sideRaw = String(
      (item as { side?: string; team?: string }).side ??
        (item as { team?: string }).team ??
        ""
    )
      .trim()
      .toLowerCase();

    let teamId = String((item as WcGameGoalScorer).teamId ?? "").trim();
    if (!teamId) {
      if (sideRaw === "home" || sideRaw === "h") {
        teamId = String(ctx.homeTeamId ?? "").trim();
      } else if (sideRaw === "away" || sideRaw === "a") {
        teamId = String(ctx.awayTeamId ?? "").trim();
      }
    }

    let player: WcSquadNameEntry | undefined;
    if (teamId) {
      const squad = getSquad(teamId);
      player = squad ? findSquadPlayerByName(squad, name) : undefined;
    } else {
      const homeSquad = ctx.homeTeamId ? getSquad(ctx.homeTeamId) : null;
      const awaySquad = ctx.awayTeamId ? getSquad(ctx.awayTeamId) : null;
      const homeHit = homeSquad
        ? findSquadPlayerByName(homeSquad, name)
        : undefined;
      const awayHit = awaySquad
        ? findSquadPlayerByName(awaySquad, name)
        : undefined;
      if (homeHit && awayHit) continue;
      player = homeHit ?? awayHit;
      teamId = homeHit
        ? String(ctx.homeTeamId)
        : awayHit
          ? String(ctx.awayTeamId)
          : "";
    }

    if (!player || !teamId) continue;
    out.push({
      playerId: player.id,
      teamId,
      minute,
      ownGoal,
    });
  }

  return out;
}
